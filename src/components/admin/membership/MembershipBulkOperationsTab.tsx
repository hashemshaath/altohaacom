import { useState, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Search, Mail, ArrowUpCircle, ArrowDownCircle, Bell,
  RefreshCw, Send, Loader2, CheckCircle2, AlertTriangle, Clock,
  Zap, Filter, UserCheck, Shield,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type MembershipTier = Database["public"]["Enums"]["membership_tier"];

interface BulkMember {
  user_id: string;
  full_name: string | null;
  full_name_ar: string | null;
  username: string | null;
  avatar_url: string | null;
  email: string | null;
  membership_tier: MembershipTier | null;
  membership_status: string | null;
  membership_expires_at: string | null;
}

const MembershipBulkOperationsTab = memo(function MembershipBulkOperationsTab() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [tierFilter, setTierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expiryFilter, setExpiryFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Bulk action dialogs
  const [bulkAction, setBulkAction] = useState<string | null>(null);
  const [bulkTier, setBulkTier] = useState<MembershipTier>("professional");
  const [bulkReason, setBulkReason] = useState("");
  const [bulkExtendDays, setBulkExtendDays] = useState(30);
  const [bulkEmailSubject, setBulkEmailSubject] = useState("");
  const [bulkEmailBody, setBulkEmailBody] = useState("");
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: members, isLoading } = useQuery({
    queryKey: ["bulk-ops-members", tierFilter, statusFilter, expiryFilter, search],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("user_id, full_name, full_name_ar, username, avatar_url, email, membership_tier, membership_status, membership_expires_at")
        .order("created_at", { ascending: false })
        .limit(200);

      if (search) query = query.or(`full_name.ilike.%${search}%,username.ilike.%${search}%,email.ilike.%${search}%`);
      if (tierFilter !== "all") query = query.eq("membership_tier", tierFilter as MembershipTier);
      if (statusFilter !== "all") query = query.eq("membership_status", statusFilter);

      const { data } = await query;
      let filtered = (data || []) as BulkMember[];

      if (expiryFilter === "expiring_7") {
        filtered = filtered.filter(m => {
          if (!m.membership_expires_at) return false;
          const days = differenceInDays(new Date(m.membership_expires_at), new Date());
          return days >= 0 && days <= 7;
        });
      } else if (expiryFilter === "expiring_30") {
        filtered = filtered.filter(m => {
          if (!m.membership_expires_at) return false;
          const days = differenceInDays(new Date(m.membership_expires_at), new Date());
          return days >= 0 && days <= 30;
        });
      } else if (expiryFilter === "expired") {
        filtered = filtered.filter(m => {
          if (!m.membership_expires_at) return false;
          return new Date(m.membership_expires_at) < new Date();
        });
      }

      return filtered;
    },
  });

  const toggleAll = () => {
    if (!members) return;
    setSelectedIds(prev => prev.size === members.length ? new Set() : new Set(members.map(m => m.user_id)));
  };

  const toggle = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const executeBulkAction = async () => {
    if (!user || selectedIds.size === 0) return;
    setIsProcessing(true);
    setProgress(0);
    const ids = Array.from(selectedIds);
    let processed = 0;

    try {
      for (const userId of ids) {
        const member = members?.find(m => m.user_id === userId);
        if (!member) continue;

        if (bulkAction === "change_tier") {
          await supabase.from("profiles").update({
            membership_tier: bulkTier,
            membership_status: "active",
            membership_expires_at: bulkTier === "basic" ? null : new Date(Date.now() + 365 * 86400000).toISOString(),
            membership_started_at: bulkTier === "basic" ? null : new Date().toISOString(),
          }).eq("user_id", userId);

          await supabase.from("membership_history").insert({
            user_id: userId,
            previous_tier: (member.membership_tier || "basic") as MembershipTier,
            new_tier: bulkTier,
            changed_by: user.id,
            reason: bulkReason || "Bulk tier change",
          });
        } else if (bulkAction === "extend") {
          const current = member.membership_expires_at ? new Date(member.membership_expires_at) : new Date();
          const base = current > new Date() ? current : new Date();
          const newExpiry = new Date(base.getTime() + bulkExtendDays * 86400000);

          await supabase.from("profiles").update({
            membership_expires_at: newExpiry.toISOString(),
            membership_status: "active",
          }).eq("user_id", userId);

          await supabase.from("membership_history").insert({
            user_id: userId,
            previous_tier: (member.membership_tier || "basic") as MembershipTier,
            new_tier: (member.membership_tier || "basic") as MembershipTier,
            changed_by: user.id,
            reason: `Extended +${bulkExtendDays} days (bulk)`,
          });
        } else if (bulkAction === "send_reminder") {
          await supabase.from("notifications").insert({
            user_id: userId,
            title: "Your membership is expiring soon!",
            title_ar: "عضويتك تنتهي قريباً!",
            body: "Renew now to keep enjoying premium benefits.",
            body_ar: "جدد الآن للاستمرار في الاستمتاع بالمميزات الحصرية.",
            type: "membership",
            link: "/profile?tab=membership",
          });
        } else if (bulkAction === "send_email") {
          await supabase.from("notifications").insert({
            user_id: userId,
            title: bulkEmailSubject || "Membership Update",
            title_ar: bulkEmailSubject || "تحديث العضوية",
            body: bulkEmailBody || "Important update about your membership.",
            body_ar: bulkEmailBody || "تحديث مهم بخصوص عضويتك.",
            type: "membership",
            link: "/profile?tab=membership",
          });
        } else if (bulkAction === "suspend") {
          await supabase.from("profiles").update({
            membership_status: "suspended",
          }).eq("user_id", userId);
        } else if (bulkAction === "reactivate") {
          await supabase.from("profiles").update({
            membership_status: "active",
          }).eq("user_id", userId);
        }

        processed++;
        setProgress(Math.round((processed / ids.length) * 100));
      }

      await supabase.from("admin_actions").insert({
        admin_id: user.id,
        action_type: `bulk_${bulkAction}`,
        details: { count: ids.length, tier: bulkTier, reason: bulkReason },
      });

      toast({
        title: isAr ? `تم تنفيذ العملية على ${ids.length} عضو` : `Operation completed for ${ids.length} members`,
      });

      queryClient.invalidateQueries({ queryKey: ["bulk-ops-members"] });
      queryClient.invalidateQueries({ queryKey: ["admin-membership-members"] });
      queryClient.invalidateQueries({ queryKey: ["membership-overview-stats"] });
      setSelectedIds(new Set());
      setBulkAction(null);
      setBulkReason("");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const quickFilters = [
    { key: "expiring_7", icon: AlertTriangle, label: isAr ? "ينتهي خلال 7 أيام" : "Expiring in 7 days", color: "text-destructive" },
    { key: "expiring_30", icon: Clock, label: isAr ? "ينتهي خلال 30 يوم" : "Expiring in 30 days", color: "text-chart-4" },
    { key: "expired", icon: Shield, label: isAr ? "منتهية الصلاحية" : "Already expired", color: "text-destructive" },
  ];

  const bulkActions = [
    { key: "change_tier", icon: ArrowUpCircle, label: isAr ? "تغيير المستوى" : "Change Tier", color: "bg-primary/10 text-primary" },
    { key: "extend", icon: RefreshCw, label: isAr ? "تمديد العضوية" : "Extend Membership", color: "bg-chart-2/10 text-chart-2" },
    { key: "send_reminder", icon: Bell, label: isAr ? "إرسال تذكير تجديد" : "Send Renewal Reminder", color: "bg-chart-4/10 text-chart-4" },
    { key: "send_email", icon: Mail, label: isAr ? "إرسال رسالة مخصصة" : "Send Custom Message", color: "bg-chart-3/10 text-chart-3" },
    { key: "suspend", icon: AlertTriangle, label: isAr ? "إيقاف مؤقت" : "Suspend", color: "bg-destructive/10 text-destructive" },
    { key: "reactivate", icon: CheckCircle2, label: isAr ? "إعادة تفعيل" : "Reactivate", color: "bg-chart-2/10 text-chart-2" },
  ];

  const getTierBadge = (tier: string | null) => {
    const t = tier || "basic";
    const styles: Record<string, string> = {
      basic: "bg-muted text-muted-foreground",
      professional: "bg-primary/20 text-primary",
      enterprise: "bg-chart-2/20 text-chart-2",
    };
    const labels: Record<string, string> = {
      basic: isAr ? "أساسي" : "Basic",
      professional: isAr ? "احترافي" : "Professional",
      enterprise: isAr ? "مؤسسي" : "Enterprise",
    };
    return <Badge className={`text-xs ${styles[t] || ""}`}>{labels[t] || t}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Quick Filters */}
      <div className="grid gap-3 sm:grid-cols-3">
        {quickFilters.map(f => (
          <Card
            key={f.key}
            className={`cursor-pointer transition-all hover:shadow-md ${expiryFilter === f.key ? "ring-2 ring-primary border-primary" : ""}`}
            onClick={() => setExpiryFilter(prev => prev === f.key ? "all" : f.key)}
          >
            <CardContent className="flex items-center gap-3 py-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted`}>
                <f.icon className={`h-5 w-5 ${f.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium">{f.label}</p>
                <p className="text-xs text-muted-foreground">
                  {isAr ? "اضغط للتصفية" : "Click to filter"}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bulk Actions Grid */}
      {selectedIds.size > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              {isAr ? `${selectedIds.size} عضو محدد — اختر العملية` : `${selectedIds.size} selected — Choose action`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {bulkActions.map(action => (
                <Button
                  key={action.key}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 justify-start h-auto py-2.5"
                  onClick={() => setBulkAction(action.key)}
                >
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${action.color}`}>
                    <action.icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs">{action.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              {isAr ? "الأعضاء" : "Members"}
              {members?.length ? (
                <Badge variant="secondary" className="text-xs">{members.length}</Badge>
              ) : null}
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-52">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={isAr ? "بحث..." : "Search..."}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="ps-9 h-8 text-xs"
                />
              </div>
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                  <SelectItem value="basic">{isAr ? "أساسي" : "Basic"}</SelectItem>
                  <SelectItem value="professional">{isAr ? "احترافي" : "Pro"}</SelectItem>
                  <SelectItem value="enterprise">{isAr ? "مؤسسي" : "Enterprise"}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "الكل" : "All"}</SelectItem>
                  <SelectItem value="active">{isAr ? "نشط" : "Active"}</SelectItem>
                  <SelectItem value="suspended">{isAr ? "موقوف" : "Suspended"}</SelectItem>
                  <SelectItem value="expired">{isAr ? "منتهي" : "Expired"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-10">
                      <Checkbox
                        checked={members?.length ? selectedIds.size === members.length : false}
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead className="text-xs">{isAr ? "العضو" : "Member"}</TableHead>
                    <TableHead className="text-xs">{isAr ? "المستوى" : "Tier"}</TableHead>
                    <TableHead className="text-xs">{isAr ? "الحالة" : "Status"}</TableHead>
                    <TableHead className="text-xs">{isAr ? "الانتهاء" : "Expires"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members?.map(m => {
                    const days = m.membership_expires_at
                      ? differenceInDays(new Date(m.membership_expires_at), new Date())
                      : null;
                    return (
                      <TableRow key={m.user_id} className={selectedIds.has(m.user_id) ? "bg-primary/5" : ""}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(m.user_id)}
                            onCheckedChange={() => toggle(m.user_id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={m.avatar_url || undefined} />
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {(m.full_name || "U")[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {isAr ? (m.full_name_ar || m.full_name) : m.full_name || "—"}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getTierBadge(m.membership_tier)}</TableCell>
                        <TableCell>
                          <Badge variant={m.membership_status === "active" ? "default" : m.membership_status === "suspended" ? "destructive" : "secondary"} className="text-xs">
                            {m.membership_status === "active" ? (isAr ? "نشط" : "Active") :
                             m.membership_status === "suspended" ? (isAr ? "موقوف" : "Suspended") :
                             (isAr ? "منتهي" : "Expired")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {m.membership_expires_at ? (
                            <span className={days !== null && days < 0 ? "text-destructive" : days !== null && days <= 14 ? "text-chart-4" : ""}>
                              {format(new Date(m.membership_expires_at), "MMM d, yyyy")}
                              {days !== null && days >= 0 && (
                                <span className="ms-1">({days}d)</span>
                              )}
                            </span>
                          ) : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!members?.length && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {isAr ? "لا توجد نتائج" : "No members found"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Action Dialog */}
      <Dialog open={!!bulkAction} onOpenChange={() => { if (!isProcessing) { setBulkAction(null); setBulkReason(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {bulkAction === "change_tier" && (isAr ? "تغيير المستوى الجماعي" : "Bulk Tier Change")}
              {bulkAction === "extend" && (isAr ? "تمديد جماعي" : "Bulk Extend")}
              {bulkAction === "send_reminder" && (isAr ? "إرسال تذكير جماعي" : "Bulk Renewal Reminder")}
              {bulkAction === "send_email" && (isAr ? "إرسال رسالة مخصصة" : "Bulk Custom Message")}
              {bulkAction === "suspend" && (isAr ? "إيقاف جماعي" : "Bulk Suspend")}
              {bulkAction === "reactivate" && (isAr ? "إعادة تفعيل جماعي" : "Bulk Reactivate")}
            </DialogTitle>
            <DialogDescription>
              {isAr ? `سيتم تطبيق العملية على ${selectedIds.size} عضو` : `This will apply to ${selectedIds.size} members`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {bulkAction === "change_tier" && (
              <Select value={bulkTier} onValueChange={v => setBulkTier(v as MembershipTier)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">{isAr ? "أساسي" : "Basic"}</SelectItem>
                  <SelectItem value="professional">{isAr ? "احترافي" : "Professional"}</SelectItem>
                  <SelectItem value="enterprise">{isAr ? "مؤسسي" : "Enterprise"}</SelectItem>
                </SelectContent>
              </Select>
            )}

            {bulkAction === "extend" && (
              <Select value={String(bulkExtendDays)} onValueChange={v => setBulkExtendDays(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">{isAr ? "شهر واحد" : "1 Month"}</SelectItem>
                  <SelectItem value="90">{isAr ? "3 أشهر" : "3 Months"}</SelectItem>
                  <SelectItem value="180">{isAr ? "6 أشهر" : "6 Months"}</SelectItem>
                  <SelectItem value="365">{isAr ? "سنة" : "1 Year"}</SelectItem>
                </SelectContent>
              </Select>
            )}

            {bulkAction === "send_email" && (
              <>
                <Input
                  placeholder={isAr ? "الموضوع" : "Subject"}
                  value={bulkEmailSubject}
                  onChange={e => setBulkEmailSubject(e.target.value)}
                />
                <Textarea
                  placeholder={isAr ? "محتوى الرسالة..." : "Message body..."}
                  value={bulkEmailBody}
                  onChange={e => setBulkEmailBody(e.target.value)}
                  rows={4}
                />
              </>
            )}

            {["change_tier", "extend", "suspend"].includes(bulkAction || "") && (
              <Textarea
                placeholder={isAr ? "سبب العملية (اختياري)" : "Reason (optional)"}
                value={bulkReason}
                onChange={e => setBulkReason(e.target.value)}
                rows={2}
              />
            )}

            {isProcessing && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">{progress}%</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkAction(null)} disabled={isProcessing}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={executeBulkAction} disabled={isProcessing} className="gap-1.5">
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {isAr ? "تنفيذ" : "Execute"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

export default MembershipBulkOperationsTab;
