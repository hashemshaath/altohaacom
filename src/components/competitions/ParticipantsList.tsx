import { useState, memo } from "react";
import { ParticipantBadgeCard } from "./ParticipantBadgeCard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Trophy,
  ChefHat,
  Star,
  Filter,
  Send,
  Plus,
  X,
  Link2,
  Building2,
  Mail,
  Copy,
  MessageCircle,
  Bell,
  Phone,
  QrCode,
} from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ParticipantsListProps {
  competitionId: string;
  isOrganizer?: boolean;
}

interface CategoryData {
  id: string;
  name: string;
  name_ar: string | null;
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; className: string; label: string; labelAr: string }> = {
  approved: { icon: CheckCircle2, className: "bg-primary/15 text-primary", label: "Approved", labelAr: "مقبول" },
  pending: { icon: Clock, className: "bg-chart-4/15 text-chart-4", label: "Pending", labelAr: "معلق" },
  rejected: { icon: XCircle, className: "bg-destructive/15 text-destructive", label: "Rejected", labelAr: "مرفوض" },
  withdrawn: { icon: XCircle, className: "bg-muted text-muted-foreground", label: "Withdrawn", labelAr: "منسحب" },
};

const ORG_TYPES = [
  { value: "hotel", label: "Hotel", labelAr: "فندق" },
  { value: "restaurant", label: "Restaurant", labelAr: "مطعم" },
  { value: "institution", label: "Institution", labelAr: "مؤسسة" },
  { value: "university", label: "University", labelAr: "جامعة" },
  { value: "other", label: "Other", labelAr: "أخرى" },
];

const CHANNELS = [
  { value: "email", label: "Email", labelAr: "بريد إلكتروني", icon: Mail },
  { value: "whatsapp", label: "WhatsApp", labelAr: "واتساب", icon: MessageCircle },
  { value: "notification", label: "Notification", labelAr: "إشعار", icon: Bell },
  { value: "sms", label: "SMS", labelAr: "رسالة نصية", icon: Phone },
];

export const ParticipantsList = memo(function ParticipantsList({ competitionId, isOrganizer = false }: ParticipantsListProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [activeSubTab, setActiveSubTab] = useState("list");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteFilter, setInviteFilter] = useState("all");

  const [inviteForm, setInviteForm] = useState({
    invitee_name: "",
    invitee_name_ar: "",
    invitee_email: "",
    organization_name: "",
    organization_name_ar: "",
    organization_type: "other",
    message: "",
    message_ar: "",
    category_id: "",
    invitation_channel: "email",
  });

  const { data: categories } = useQuery({
    queryKey: ["participant-categories", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competition_categories")
        .select("id, name, name_ar")
        .eq("competition_id", competitionId)
        .order("sort_order");
      if (error) throw error;
      return data as CategoryData[];
    },
    enabled: !!competitionId,
  });

   const { data: participants, isLoading } = useQuery({
     queryKey: ["competition-all-participants", competitionId],
     queryFn: async () => {
       const { data: registrations, error } = await supabase
         .from("competition_registrations")
         .select("id, participant_id, status, dish_name, dish_image_url, dish_description, category_id, registered_at, registration_number, entry_type, team_name, team_name_ar, organization_name, organization_name_ar, organization_type")
         .eq("competition_id", competitionId)
         .order("registered_at", { ascending: true });

       if (error) throw error;
       if (!registrations || registrations.length === 0) return [];

       // Fetch team members if needed
       const teamRegIds = registrations.filter(r => r.entry_type === 'team').map(r => r.id);
       let teamMembersMap = new Map<string, any[]>();
       if (teamRegIds.length > 0) {
         const { data: teamMembers } = await supabase
           .from("registration_team_members")
           .select("registration_id, user_id, member_name, member_name_ar, job_title, job_title_ar, is_captain, avatar_url")
           .in("registration_id", teamRegIds);
         teamMembers?.forEach(tm => {
           const members = teamMembersMap.get(tm.registration_id) || [];
           members.push(tm);
           teamMembersMap.set(tm.registration_id, members);
         });
       }

       const userIds = registrations.map((r) => r.participant_id);
       const { data: profiles } = await supabase
         .from("profiles")
         .select("user_id, username, full_name, avatar_url, specialization, is_verified, location, company_id")
         .in("user_id", userIds);

      const companyIds = profiles?.map(p => p.company_id).filter(Boolean) as string[];
      let companyMap = new Map<string, { name: string; name_ar: string | null }>();
      if (companyIds.length > 0) {
        const { data: companies } = await supabase
          .from("companies")
          .select("id, name, name_ar")
          .in("id", companyIds);
        companies?.forEach(c => companyMap.set(c.id, { name: c.name, name_ar: c.name_ar }));
      }

      const approvedRegIds = registrations.filter((r) => r.status === "approved").map((r) => r.id);
      let scoresMap = new Map<string, { total: number; count: number }>();
      if (approvedRegIds.length > 0) {
        const { data: scores } = await supabase
          .from("competition_scores")
          .select("registration_id, score")
          .in("registration_id", approvedRegIds);
        scores?.forEach((s) => {
          const existing = scoresMap.get(s.registration_id) || { total: 0, count: 0 };
          existing.total += Number(s.score);
          existing.count += 1;
          scoresMap.set(s.registration_id, existing);
        });
      }

      const categoryIds = registrations.map((r) => r.category_id).filter(Boolean) as string[];
      const { data: cats } = categoryIds.length > 0
        ? await supabase.from("competition_categories").select("id, name, name_ar").in("id", categoryIds)
        : { data: [] as CategoryData[] };

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
      const categoryMap = new Map<string, CategoryData>((cats || []).map((c) => [c.id, c]));

       return registrations.map((reg) => {
         const profile = profileMap.get(reg.participant_id);
         const company = profile?.company_id ? companyMap.get(profile.company_id) : null;
         return {
           ...reg,
           profile,
           category: reg.category_id ? categoryMap.get(reg.category_id) : null,
           scores: scoresMap.get(reg.id) || null,
           company,
           teamMembers: teamMembersMap.get(reg.id) || [],
         };
       });
    },
    enabled: !!competitionId,
  });

  const { data: invitations = [] } = useQuery({
    queryKey: ["competition-invitations", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competition_invitations")
        .select("id, competition_id, invited_by, invitee_name, invitee_name_ar, invitee_email, invitee_phone, invitee_role, status, organization_name, organization_name_ar, organization_type, invitation_channel, message, sent_at, responded_at, created_at")
        .eq("competition_id", competitionId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!competitionId && isOrganizer,
  });

  const sendInviteMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("competition_invitations").insert({
        competition_id: competitionId,
        invited_by: user.id,
        invitee_name: inviteForm.invitee_name.trim() || null,
        invitee_name_ar: inviteForm.invitee_name_ar.trim() || null,
        invitee_email: inviteForm.invitee_email.trim() || null,
        organization_name: inviteForm.organization_name.trim() || null,
        organization_name_ar: inviteForm.organization_name_ar.trim() || null,
        organization_type: inviteForm.organization_type,
        message: inviteForm.message.trim() || null,
        message_ar: inviteForm.message_ar.trim() || null,
        category_id: inviteForm.category_id || null,
        invitation_channel: inviteForm.invitation_channel,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competition-invitations", competitionId] });
      setInviteForm({
        invitee_name: "", invitee_name_ar: "", invitee_email: "", organization_name: "",
        organization_name_ar: "", organization_type: "other", message: "", message_ar: "",
        category_id: "", invitation_channel: "email",
      });
      setShowInviteForm(false);
      toast({ title: isAr ? "تم إرسال الدعوة" : "Invitation sent" });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: isAr ? "فشل الإرسال" : "Failed", description: err.message });
    },
  });

  const copyRegistrationLink = () => {
    const url = `${window.location.origin}/competitions/${competitionId}`;
    navigator.clipboard.writeText(url);
    toast({ title: isAr ? "تم نسخ رابط التسجيل!" : "Registration link copied!" });
  };

  const organizations = Array.from(
    new Set(participants?.map(p => {
      const compName = isAr && p.company?.name_ar ? p.company.name_ar : p.company?.name;
      return compName;
    }).filter(Boolean) as string[])
  );

  const [orgFilter, setOrgFilter] = useState("all");

  const filtered = participants?.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (categoryFilter !== "all" && p.category_id !== categoryFilter) return false;
    if (orgFilter !== "all") {
      const compName = isAr && p.company?.name_ar ? p.company.name_ar : p.company?.name;
      if (compName !== orgFilter) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (p.profile?.full_name || "").toLowerCase();
      const dish = (p.dish_name || "").toLowerCase();
      const org = (p.company?.name || "").toLowerCase();
      if (!name.includes(q) && !dish.includes(q) && !org.includes(q)) return false;
    }
    return true;
  });

  const statusCounts = participants?.reduce(
    (acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      acc.total += 1;
      return acc;
    },
    { total: 0 } as Record<string, number>
  ) || { total: 0 };

  const filteredInvitations = inviteFilter === "all" ? invitations : invitations.filter((i: any) => i.status === inviteFilter);
  const inviteCounts = invitations.reduce((acc: Record<string, number>, i: any) => {
    acc[i.status] = (acc[i.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="overflow-hidden">
        <div className="border-b bg-muted/30 px-4 py-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold text-sm">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10">
              <Users className="h-4 w-4 text-primary" />
            </div>
            {isAr ? "المشاركين والدعوات" : "Participants & Invitations"}
            <Badge variant="secondary" className="ms-1">{statusCounts.total || 0}</Badge>
          </h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={copyRegistrationLink}>
              <Link2 className="h-3 w-3" />
              {isAr ? "رابط التسجيل" : "Share Link"}
            </Button>
          </div>
        </div>
        <CardContent className="p-3">
          {isOrganizer && (
            <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="mb-3">
              <TabsList className="h-9">
                <TabsTrigger value="list" className="text-xs gap-1">
                  <Users className="h-3 w-3" />
                  {isAr ? "القائمة" : "List"}
                  <Badge variant="secondary" className="text-[9px] h-4 px-1">{statusCounts.total}</Badge>
                </TabsTrigger>
                <TabsTrigger value="badges" className="text-xs gap-1">
                  <QrCode className="h-3 w-3" />
                  {isAr ? "البطاقات" : "Badges"}
                </TabsTrigger>
                <TabsTrigger value="invitations" className="text-xs gap-1">
                  <Send className="h-3 w-3" />
                  {isAr ? "الدعوات" : "Invitations"}
                  {invitations.length > 0 && (
                    <Badge variant="secondary" className="text-[9px] h-4 px-1">{invitations.length}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {activeSubTab === "list" && (
            <>
              <div className="flex flex-wrap gap-2 mb-3">
                {[
                  { key: "all", label: isAr ? "الكل" : "All", count: statusCounts.total },
                  { key: "approved", label: isAr ? "مقبول" : "Approved", count: statusCounts.approved || 0 },
                  { key: "pending", label: isAr ? "معلق" : "Pending", count: statusCounts.pending || 0 },
                  { key: "rejected", label: isAr ? "مرفوض" : "Rejected", count: statusCounts.rejected || 0 },
                ].map((f) => (
                  <Button
                    key={f.key}
                    variant={statusFilter === f.key ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => setStatusFilter(f.key)}
                  >
                    {f.label}
                    <Badge variant="secondary" className="text-[10px] h-4 px-1">{f.count}</Badge>
                  </Button>
                ))}
              </div>

              <div className="flex gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[150px]">
                  <Search className="absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={isAr ? "بحث بالاسم أو الطبق أو المنظمة..." : "Search name, dish, or organization..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 ps-9 text-xs"
                  />
                </div>
                {categories && categories.length > 0 && (
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-8 w-36 text-xs">
                      <Filter className="h-3 w-3 me-1" />
                      <SelectValue placeholder={isAr ? "الفئة" : "Category"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{isAr ? "جميع الفئات" : "All Categories"}</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {isAr && cat.name_ar ? cat.name_ar : cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {organizations.length > 0 && (
                  <Select value={orgFilter} onValueChange={setOrgFilter}>
                    <SelectTrigger className="h-8 w-40 text-xs">
                      <Building2 className="h-3 w-3 me-1" />
                      <SelectValue placeholder={isAr ? "المنظمة" : "Organization"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{isAr ? "جميع المنظمات" : "All Organizations"}</SelectItem>
                      {organizations.map((org) => (
                        <SelectItem key={org} value={org}>{org}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Invitations Tab */}
      {activeSubTab === "invitations" && isOrganizer && (
        <div className="space-y-4">
          {!showInviteForm ? (
            <Button onClick={() => setShowInviteForm(true)} className="w-full" variant="outline">
              <Plus className="h-4 w-4 me-2" />
              {isAr ? "إرسال دعوة جديدة" : "Send New Invitation"}
            </Button>
          ) : (
            <Card className="overflow-hidden">
              <div className="border-b bg-muted/30 px-4 py-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold">{isAr ? "دعوة جديدة" : "New Invitation"}</h4>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowInviteForm(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isAr ? "اسم المدعو" : "Invitee Name"}</Label>
                    <Input
                      value={inviteForm.invitee_name}
                      onChange={(e) => setInviteForm(f => ({ ...f, invitee_name: e.target.value }))}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isAr ? "الاسم (عربي)" : "Name (Arabic)"}</Label>
                    <Input
                      value={inviteForm.invitee_name_ar}
                      onChange={(e) => setInviteForm(f => ({ ...f, invitee_name_ar: e.target.value }))}
                      className="h-9 text-sm" dir="rtl"
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isAr ? "البريد الإلكتروني" : "Email"}</Label>
                    <Input
                      type="email"
                      value={inviteForm.invitee_email}
                      onChange={(e) => setInviteForm(f => ({ ...f, invitee_email: e.target.value }))}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isAr ? "طريقة الإرسال" : "Channel"}</Label>
                    <Select value={inviteForm.invitation_channel} onValueChange={(v) => setInviteForm(f => ({ ...f, invitation_channel: v }))}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CHANNELS.map((ch) => (
                          <SelectItem key={ch.value} value={ch.value}>
                            <span className="flex items-center gap-2">
                              <ch.icon className="h-3.5 w-3.5" />
                              {isAr ? ch.labelAr : ch.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isAr ? "اسم المنظمة" : "Organization"}</Label>
                    <Input
                      value={inviteForm.organization_name}
                      onChange={(e) => setInviteForm(f => ({ ...f, organization_name: e.target.value }))}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isAr ? "نوع المنظمة" : "Type"}</Label>
                    <Select value={inviteForm.organization_type} onValueChange={(v) => setInviteForm(f => ({ ...f, organization_type: v }))}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ORG_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{isAr ? t.labelAr : t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isAr ? "الفئة المستهدفة" : "Target Category"}</Label>
                    <Select value={inviteForm.category_id} onValueChange={(v) => setInviteForm(f => ({ ...f, category_id: v }))}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder={isAr ? "جميع الفئات" : "All categories"} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">{isAr ? "جميع الفئات" : "All Categories"}</SelectItem>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{isAr && cat.name_ar ? cat.name_ar : cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{isAr ? "رسالة الدعوة" : "Message"}</Label>
                  <Textarea
                    value={inviteForm.message}
                    onChange={(e) => setInviteForm(f => ({ ...f, message: e.target.value }))}
                    rows={2}
                    className="text-sm"
                  />
                </div>
                <Button
                  className="w-full"
                  size="sm"
                  disabled={(!inviteForm.invitee_name.trim() && !inviteForm.organization_name.trim()) || sendInviteMutation.isPending}
                  onClick={() => sendInviteMutation.mutate()}
                >
                  <Send className="h-3.5 w-3.5 me-1.5" />
                  {isAr ? "إرسال الدعوة" : "Send Invitation"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Registration link card */}
          <Card className="overflow-hidden">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">{isAr ? "رابط التسجيل المباشر" : "Direct Registration Link"}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {window.location.origin}/competitions/{competitionId}
                </p>
              </div>
              <Button variant="outline" size="sm" className="shrink-0 h-7 text-xs" onClick={copyRegistrationLink}>
                <Copy className="h-3 w-3 me-1" />
                {isAr ? "نسخ" : "Copy"}
              </Button>
            </CardContent>
          </Card>

          {/* Invitation status filters */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: isAr ? "الكل" : "All", count: invitations.length },
              { key: "pending", label: isAr ? "معلق" : "Pending", count: inviteCounts.pending || 0 },
              { key: "accepted", label: isAr ? "مقبول" : "Accepted", count: inviteCounts.accepted || 0 },
              { key: "declined", label: isAr ? "مرفوض" : "Declined", count: inviteCounts.declined || 0 },
            ].map((f) => (
              <Button
                key={f.key}
                variant={inviteFilter === f.key ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setInviteFilter(f.key)}
              >
                {f.label}
                <Badge variant="secondary" className="text-[10px] h-4 px-1">{f.count}</Badge>
              </Button>
            ))}
          </div>

          {/* Invitations list */}
          {filteredInvitations.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredInvitations.map((inv: any) => {
                const channel = CHANNELS.find(c => c.value === inv.invitation_channel);
                const ChannelIcon = channel?.icon || Mail;
                const cat = categories?.find(c => c.id === inv.category_id);
                return (
                  <Card key={inv.id} className="overflow-hidden hover:shadow-sm transition-shadow">
                    <CardContent className="p-0">
                      <div className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {(inv.invitee_name || inv.invitee_name_ar) && (
                                <p className="text-sm font-semibold truncate">
                                  {isAr && inv.invitee_name_ar ? inv.invitee_name_ar : inv.invitee_name}
                                </p>
                              )}
                              <Badge variant={inv.status === "accepted" ? "default" : inv.status === "declined" ? "destructive" : "secondary"} className="text-[9px] h-5">
                                {inv.status === "accepted" ? (isAr ? "مقبول" : "Accepted") :
                                 inv.status === "declined" ? (isAr ? "مرفوض" : "Declined") :
                                 (isAr ? "معلق" : "Pending")}
                              </Badge>
                            </div>
                            {(inv.organization_name || inv.organization_name_ar) && (
                              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                                <Building2 className="h-3 w-3 shrink-0" />
                                {isAr && inv.organization_name_ar ? inv.organization_name_ar : inv.organization_name}
                                {inv.organization_type && inv.organization_type !== "other" && (
                                  <Badge variant="outline" className="text-[9px] h-4 px-1 ms-1">
                                    {ORG_TYPES.find(t => t.value === inv.organization_type)?.[isAr ? "labelAr" : "label"]}
                                  </Badge>
                                )}
                              </p>
                            )}
                            {inv.invitee_email && (
                              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Mail className="h-2.5 w-2.5" />
                                {inv.invitee_email}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="border-t bg-muted/20 px-4 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[9px] h-5 gap-0.5">
                            <ChannelIcon className="h-2.5 w-2.5" />
                            {isAr ? channel?.labelAr : channel?.label}
                          </Badge>
                          {cat && (
                            <Badge variant="outline" className="text-[9px] h-5">
                              <Trophy className="h-2.5 w-2.5 me-0.5" />
                              {isAr && cat.name_ar ? cat.name_ar : cat.name}
                            </Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {format(new Date(inv.created_at), "MMM d, yyyy")}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted/60">
                <Send className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">
                {isAr ? "لا توجد دعوات بعد" : "No invitations yet"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Badges Tab */}
      {activeSubTab === "badges" && isOrganizer && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {isAr
              ? "بطاقات QR فريدة لكل مشارك للتسجيل والحضور والتحقق"
              : "Unique QR badges for each participant for registration, attendance, and verification"}
          </p>
          {filtered && filtered.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.filter(p => p.status === "approved").map((participant) => (
                <ParticipantBadgeCard
                  key={participant.id}
                  role="participant"
                  entityId={participant.id}
                  personName={participant.profile?.full_name || "Unknown"}
                  personPhoto={participant.profile?.avatar_url}
                  competitionTitle={competitionId}
                  categoryName={
                    participant.category
                      ? (isAr && participant.category.name_ar ? participant.category.name_ar : participant.category.name)
                      : null
                  }
                  organizationName={
                    participant.company
                      ? (isAr && participant.company.name_ar ? participant.company.name_ar : participant.company.name)
                      : null
                  }
                  registrationNumber={participant.registration_number}
                  status={participant.status}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted/60">
                <QrCode className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">
                {isAr ? "لا يوجد مشاركين مؤكدين بعد" : "No confirmed participants yet"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Participants Grid */}
      {activeSubTab === "list" && (
        <>
          {filtered && filtered.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {filtered.map((participant) => {
                const status = STATUS_CONFIG[participant.status] || STATUS_CONFIG.pending;
                const StatusIcon = status.icon;

                return (
                  <Card key={participant.id} className="overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5">
                    <CardContent className="p-0">
                      <div className="flex gap-3 p-4">
                        <div className="relative shrink-0">
                          {participant.dish_image_url ? (
                            <img
                              src={participant.dish_image_url}
                              alt={participant.dish_name || "Dish"}
                              className="h-16 w-16 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-muted">
                              <ChefHat className="h-6 w-6 text-muted-foreground/40" />
                            </div>
                          )}
                          {participant.scores && participant.scores.count > 0 && (
                            <div className="absolute -top-1 -end-1 flex h-5 items-center gap-0.5 rounded-full bg-primary px-1.5">
                              <Star className="h-2.5 w-2.5 text-primary-foreground fill-primary-foreground" />
                              <span className="text-[9px] font-bold text-primary-foreground">
                                {(participant.scores.total / participant.scores.count).toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-start justify-between gap-1">
                            <Link
                              to={`/${participant.profile?.username || participant.participant_id}`}
                              className="hover:underline"
                            >
                              <div className="flex items-center gap-1.5">
                                <Avatar className="h-5 w-5">
                                  <AvatarImage src={participant.profile?.avatar_url || undefined} />
                                  <AvatarFallback className="text-[8px]">
                                    {(participant.profile?.full_name || "U")[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm font-semibold truncate">
                                  {participant.profile?.full_name || "Unknown"}
                                </span>
                                {participant.profile?.is_verified && (
                                  <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                                )}
                              </div>
                            </Link>
                            <Badge className={`${status.className} text-[9px] h-5 shrink-0`}>
                              <StatusIcon className="h-2.5 w-2.5 me-0.5" />
                              {isAr ? status.labelAr : status.label}
                            </Badge>
                          </div>

                          {participant.dish_name && (
                            <p className="text-xs text-muted-foreground truncate">
                              <ChefHat className="inline h-3 w-3 me-0.5" />
                              {participant.dish_name}
                            </p>
                          )}

                          <div className="flex items-center gap-2 flex-wrap">
                            {participant.category && (
                              <Badge variant="outline" className="text-[9px] h-4 px-1">
                                {isAr && participant.category.name_ar
                                  ? participant.category.name_ar
                                  : participant.category.name}
                              </Badge>
                            )}
                            {participant.company && (
                              <Badge variant="outline" className="text-[9px] h-4 px-1 gap-0.5">
                                <Building2 className="h-2 w-2" />
                                {isAr && participant.company.name_ar ? participant.company.name_ar : participant.company.name}
                              </Badge>
                            )}
                            {participant.registration_number && (
                              <span className="text-[10px] text-muted-foreground font-mono">
                                #{participant.registration_number}
                              </span>
                            )}
                          </div>

                          {participant.scores && participant.scores.count > 0 && (
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <Trophy className="h-2.5 w-2.5" />
                              <span>
                                {isAr ? `${participant.scores.count} تقييم` : `${participant.scores.count} scores`}
                                {" · "}
                                {isAr ? "المعدل" : "Avg"}: {(participant.scores.total / participant.scores.count).toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="border-t bg-muted/20 px-4 py-1.5">
                        <span className="text-[10px] text-muted-foreground">
                          {isAr ? "تاريخ التسجيل:" : "Registered:"}{" "}
                          {format(new Date(participant.registered_at), "MMM d, yyyy")}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-muted/60 text-muted-foreground/50">
                <Users className="h-6 w-6" />
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                {searchQuery || statusFilter !== "all" || categoryFilter !== "all" || orgFilter !== "all"
                  ? (isAr ? "لا توجد نتائج مطابقة" : "No matching participants found")
                  : (isAr ? "لا يوجد مشاركين حتى الآن" : "No participants yet")}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
