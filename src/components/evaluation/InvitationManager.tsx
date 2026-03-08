import { useState, useMemo, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { sendNotification } from "@/lib/notifications";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Send, Search, UserCheck, Clock, X, Check, Mail,
  ChefHat, MapPin, Calendar, DollarSign, Timer, Eye,
  Printer, Users,
} from "lucide-react";
import { format } from "date-fns";

interface Invitation {
  id: string;
  session_id: string | null;
  domain_slug: string;
  chef_id: string;
  invited_by: string | null;
  status: string;
  product_name: string | null;
  product_name_ar: string | null;
  product_description: string | null;
  evaluation_date: string | null;
  evaluation_location: string | null;
  expected_duration_minutes: number;
  offered_amount: number | null;
  currency: string;
  response_deadline: string | null;
  decline_reason: string | null;
  notes: string | null;
  responded_at: string | null;
  created_at: string;
}

interface ChefCandidate {
  user_id: string;
  full_name: string | null;
  specialization: string | null;
  specialization_ar: string | null;
  avatar_url: string | null;
  country_code: string | null;
  account_number: string | null;
  judge_category?: string;
  judge_level?: string;
}

function useEvaluationInvitations() {
  return useQuery({
    queryKey: ["evaluation-invitations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("evaluation_invitations" as any)
        .select("id, session_id, domain_slug, chef_id, invited_by, status, product_name, product_name_ar, product_description, evaluation_date, evaluation_location, expected_duration_minutes, offered_amount, currency, response_deadline, decline_reason, notes, responded_at, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Invitation[];
    },
  });
}

function useChefCandidates() {
  return useQuery({
    queryKey: ["chef-candidates-for-evaluation"],
    queryFn: async () => {
      // Get users with judge or chef roles
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["judge", "chef"]);
      if (!roles?.length) return [];

      const userIds = [...new Set(roles.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, specialization, specialization_ar, avatar_url, country_code, account_number")
        .in("user_id", userIds);

      // Get judge profiles for classification
      const { data: judgeProfiles } = await supabase
        .from("judge_profiles")
        .select("user_id, judge_category, judge_level")
        .in("user_id", userIds);

      return (profiles || []).map(p => {
        const jp = judgeProfiles?.find(j => j.user_id === p.user_id);
        return {
          ...p,
          judge_category: jp?.judge_category,
          judge_level: jp?.judge_level,
          roles: roles.filter(r => r.user_id === p.user_id).map(r => r.role),
        } as ChefCandidate & { roles: string[] };
      });
    },
  });
}

export const InvitationManager = memo(function InvitationManager() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const queryClient = useQueryClient();
  const { data: invitations, isLoading } = useEvaluationInvitations();
  const { data: candidates } = useChefCandidates();

  const [showSendForm, setShowSendForm] = useState(false);
  const [selectedChefs, setSelectedChefs] = useState<string[]>([]);
  const [chefSearch, setChefSearch] = useState("");
  const [expandedInvitation, setExpandedInvitation] = useState<string | null>(null);
  const [form, setForm] = useState({
    product_name: "",
    product_name_ar: "",
    product_description: "",
    evaluation_date: "",
    evaluation_location: "",
    expected_duration_minutes: 60,
    offered_amount: "",
    currency: "SAR",
    response_deadline: "",
    notes: "",
  });

  const filteredCandidates = useMemo(() => {
    if (!candidates) return [];
    const q = chefSearch.toLowerCase();
    return candidates.filter(c =>
      (c.full_name || "").toLowerCase().includes(q) ||
      (c.specialization || "").toLowerCase().includes(q) ||
      (c.account_number || "").toLowerCase().includes(q)
    );
  }, [candidates, chefSearch]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const invites = selectedChefs.map(chefId => ({
        chef_id: chefId,
        invited_by: user?.id,
        domain_slug: "chefs_table",
        product_name: form.product_name || null,
        product_name_ar: form.product_name_ar || null,
        product_description: form.product_description || null,
        evaluation_date: form.evaluation_date || null,
        evaluation_location: form.evaluation_location || null,
        expected_duration_minutes: form.expected_duration_minutes,
        offered_amount: form.offered_amount ? parseFloat(form.offered_amount) : null,
        currency: form.currency,
        response_deadline: form.response_deadline || null,
        notes: form.notes || null,
        status: "pending",
      }));
      const { error } = await supabase
        .from("evaluation_invitations" as any)
        .insert(invites as any);
      if (error) throw error;

      // Send notifications to each chef
      for (const chefId of selectedChefs) {
        await sendNotification({
          userId: chefId,
          title: "New Evaluation Invitation",
          titleAr: "دعوة تقييم جديدة",
          body: `You've been invited to evaluate: ${form.product_name}`,
          bodyAr: `تمت دعوتك لتقييم: ${form.product_name_ar || form.product_name}`,
          type: "info",
          link: "/my-evaluations",
          channels: ["in_app", "email"],
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluation-invitations"] });
      toast.success(isAr ? `تم إرسال ${selectedChefs.length} دعوة` : `${selectedChefs.length} invitation(s) sent`);
      setShowSendForm(false);
      setSelectedChefs([]);
      setForm({ product_name: "", product_name_ar: "", product_description: "", evaluation_date: "", evaluation_location: "", expected_duration_minutes: 60, offered_amount: "", currency: "SAR", response_deadline: "", notes: "" });
    },
    onError: () => toast.error(isAr ? "حدث خطأ" : "Failed to send"),
  });

  const statusIcon = (s: string) => {
    switch (s) {
      case "accepted": return <Check className="h-3.5 w-3.5 text-chart-5" />;
      case "declined": return <X className="h-3.5 w-3.5 text-destructive" />;
      default: return <Clock className="h-3.5 w-3.5 text-chart-4" />;
    }
  };

  const statusBadge = (s: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      accepted: "default", declined: "destructive", pending: "secondary", expired: "secondary",
    };
    return <Badge variant={variants[s] || "secondary"} className="text-[10px] uppercase gap-1">{statusIcon(s)}{s}</Badge>;
  };
  const stats = useMemo(() => ({
    total: invitations?.length || 0,
    pending: invitations?.filter(i => i.status === "pending").length || 0,
    accepted: invitations?.filter(i => i.status === "accepted").length || 0,
    declined: invitations?.filter(i => i.status === "declined").length || 0,
  }), [invitations]);

  // Send invitation form
  if (showSendForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">{isAr ? "إرسال دعوات تقييم" : "Send Evaluation Invitations"}</h3>
          <Button variant="ghost" size="sm" onClick={() => setShowSendForm(false)}>
            {isAr ? "إلغاء" : "Cancel"}
          </Button>
        </div>

        {/* Product Details */}
        <Card className="border-border/40">
          <CardContent className="p-5 space-y-4">
            <h4 className="font-bold text-sm">{isAr ? "تفاصيل المنتج" : "Product Details"}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>{isAr ? "اسم المنتج (EN)" : "Product Name (EN)"}</Label>
                <Input value={form.product_name} onChange={e => setForm(p => ({ ...p, product_name: e.target.value }))} />
              </div>
              <div>
                <Label>{isAr ? "اسم المنتج (AR)" : "Product Name (AR)"}</Label>
                <Input value={form.product_name_ar} onChange={e => setForm(p => ({ ...p, product_name_ar: e.target.value }))} dir="rtl" />
              </div>
            </div>
            <div>
              <Label>{isAr ? "وصف المنتج" : "Product Description"}</Label>
              <Textarea value={form.product_description} onChange={e => setForm(p => ({ ...p, product_description: e.target.value }))} rows={2} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label>{isAr ? "تاريخ التقييم" : "Evaluation Date"}</Label>
                <Input type="datetime-local" value={form.evaluation_date} onChange={e => setForm(p => ({ ...p, evaluation_date: e.target.value }))} />
              </div>
              <div>
                <Label>{isAr ? "الموقع" : "Location"}</Label>
                <Input value={form.evaluation_location} onChange={e => setForm(p => ({ ...p, evaluation_location: e.target.value }))} />
              </div>
              <div>
                <Label>{isAr ? "المدة (دقيقة)" : "Duration (min)"}</Label>
                <Input type="number" value={form.expected_duration_minutes} onChange={e => setForm(p => ({ ...p, expected_duration_minutes: +e.target.value }))} />
              </div>
              <div>
                <Label>{isAr ? "المبلغ المتوقع" : "Offered Amount"}</Label>
                <Input type="number" value={form.offered_amount} onChange={e => setForm(p => ({ ...p, offered_amount: e.target.value }))} placeholder="SAR" />
              </div>
            </div>
            <div>
              <Label>{isAr ? "آخر موعد للرد" : "Response Deadline"}</Label>
              <Input type="datetime-local" value={form.response_deadline} onChange={e => setForm(p => ({ ...p, response_deadline: e.target.value }))} className="max-w-xs" />
            </div>
          </CardContent>
        </Card>

        {/* Chef Selection */}
        <Card className="border-border/40">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                {isAr ? "اختيار الطهاة" : "Select Chefs"} ({selectedChefs.length} {isAr ? "محدد" : "selected"})
              </h4>
              <div className="relative w-64">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder={isAr ? "بحث..." : "Search..."} value={chefSearch} onChange={e => setChefSearch(e.target.value)} className="ps-9 h-8 text-xs" />
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto border rounded-xl">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead className="text-xs">{isAr ? "الشيف" : "Chef"}</TableHead>
                    <TableHead className="text-xs">{isAr ? "التخصص" : "Specialty"}</TableHead>
                    <TableHead className="text-xs">{isAr ? "المستوى" : "Level"}</TableHead>
                    <TableHead className="text-xs">{isAr ? "البلد" : "Country"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCandidates.map(c => (
                    <TableRow
                      key={c.user_id}
                      className={`cursor-pointer ${selectedChefs.includes(c.user_id) ? "bg-primary/5" : ""}`}
                      onClick={() => setSelectedChefs(prev =>
                        prev.includes(c.user_id) ? prev.filter(id => id !== c.user_id) : [...prev, c.user_id]
                      )}
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedChefs.includes(c.user_id)}
                          onChange={() => {}}
                          className="rounded border-border"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <ChefHat className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{c.full_name || "—"}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{c.account_number}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {isAr && c.specialization_ar ? c.specialization_ar : c.specialization || "—"}
                      </TableCell>
                      <TableCell>
                        {c.judge_level ? (
                          <Badge variant={c.judge_level === "international" ? "default" : "secondary"} className="text-[9px]">
                            {c.judge_level}
                          </Badge>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-sm">{c.country_code || "—"}</TableCell>
                    </TableRow>
                  ))}
                  {!filteredCandidates.length && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">
                        {isAr ? "لا يوجد طهاة" : "No chefs found"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowSendForm(false)}>
            {isAr ? "إلغاء" : "Cancel"}
          </Button>
          <Button onClick={() => sendMutation.mutate()} disabled={!selectedChefs.length || !form.product_name} className="gap-1.5">
            <Send className="h-4 w-4" />
            {isAr ? `إرسال ${selectedChefs.length} دعوة` : `Send ${selectedChefs.length} Invitation(s)`}
          </Button>
        </div>
      </div>
    );
  }

  // Invitations list

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: isAr ? "إجمالي الدعوات" : "Total", count: stats.total, icon: Mail },
          { label: isAr ? "في الانتظار" : "Pending", count: stats.pending, icon: Clock },
          { label: isAr ? "مقبولة" : "Accepted", count: stats.accepted, icon: UserCheck },
          { label: isAr ? "مرفوضة" : "Declined", count: stats.declined, icon: X },
        ].map((s, i) => (
          <Card key={i} className="border-border/40">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                <s.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-black">{s.count}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <h3 className="font-bold">{isAr ? "سجل الدعوات" : "Invitation Log"}</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" />
            {isAr ? "طباعة" : "Print"}
          </Button>
          <Button size="sm" onClick={() => setShowSendForm(true)} className="gap-1.5">
            <Send className="h-3.5 w-3.5" />
            {isAr ? "إرسال دعوات" : "Send Invitations"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : !invitations?.length ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="mx-auto h-10 w-10 text-muted-foreground/30" />
            <p className="mt-3 font-medium">{isAr ? "لا توجد دعوات" : "No invitations yet"}</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/40">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">{isAr ? "الشيف" : "Chef"}</TableHead>
                <TableHead className="text-xs">{isAr ? "المنتج" : "Product"}</TableHead>
                <TableHead className="text-xs">{isAr ? "التاريخ" : "Date"}</TableHead>
                <TableHead className="text-xs">{isAr ? "المبلغ" : "Amount"}</TableHead>
                <TableHead className="text-xs">{isAr ? "الحالة" : "Status"}</TableHead>
                <TableHead className="text-xs">{isAr ? "أُرسلت" : "Sent"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map(inv => (
                <TableRow
                  key={inv.id}
                  className="cursor-pointer"
                  onClick={() => setExpandedInvitation(expandedInvitation === inv.id ? null : inv.id)}
                >
                  <TableCell className="font-medium text-sm">{inv.chef_id.slice(0, 8)}...</TableCell>
                  <TableCell className="text-sm">{isAr && inv.product_name_ar ? inv.product_name_ar : inv.product_name || "—"}</TableCell>
                  <TableCell className="text-sm">{inv.evaluation_date ? format(new Date(inv.evaluation_date), "MMM d, yyyy") : "—"}</TableCell>
                  <TableCell className="text-sm font-bold">{inv.offered_amount ? `${inv.offered_amount} ${inv.currency}` : "—"}</TableCell>
                  <TableCell>{statusBadge(inv.status)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{format(new Date(inv.created_at), "MMM d")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
