import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useCSVExport } from "@/hooks/useCSVExport";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import {
  Search, ArrowUpCircle, Mail, MoreHorizontal, CalendarPlus,
  Ban, ShieldOff, ShieldCheck, Download, Clock,
} from "lucide-react";
import { format, differenceInDays, addDays, addMonths, addYears } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type MembershipTier = Database["public"]["Enums"]["membership_tier"];

interface MemberProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  full_name_ar: string | null;
  username: string | null;
  avatar_url: string | null;
  email: string | null;
  membership_tier: MembershipTier | null;
  membership_status: string | null;
  membership_expires_at: string | null;
  membership_started_at: string | null;
  created_at: string;
}

type AdminAction = "change_tier" | "extend" | "suspend" | "revoke" | "reactivate";

const EXTEND_OPTIONS = [
  { days: 30, labelEn: "1 Month", labelAr: "شهر واحد" },
  { days: 90, labelEn: "3 Months", labelAr: "3 أشهر" },
  { days: 180, labelEn: "6 Months", labelAr: "6 أشهر" },
  { days: 365, labelEn: "1 Year", labelAr: "سنة واحدة" },
];

export default function MembershipMembersTab() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

  const { exportCSV } = useCSVExport({
    columns: [
      { header: isAr ? "الاسم" : "Name", accessor: (r: MemberProfile) => isAr ? r.full_name_ar || r.full_name : r.full_name || "" },
      { header: isAr ? "المعرف" : "Username", accessor: (r: MemberProfile) => r.username || "" },
      { header: isAr ? "البريد" : "Email", accessor: (r: MemberProfile) => r.email || "" },
      { header: isAr ? "المستوى" : "Tier", accessor: (r: MemberProfile) => r.membership_tier || "basic" },
      { header: isAr ? "الحالة" : "Status", accessor: (r: MemberProfile) => r.membership_status || "N/A" },
      { header: isAr ? "الانتهاء" : "Expires", accessor: (r: MemberProfile) => r.membership_expires_at ? format(new Date(r.membership_expires_at), "yyyy-MM-dd") : "" },
    ],
    filename: "membership-members",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Dialog state
  const [dialogAction, setDialogAction] = useState<AdminAction | null>(null);
  const [targetUser, setTargetUser] = useState<MemberProfile | null>(null);
  const [newTier, setNewTier] = useState<MembershipTier>("professional");
  const [actionReason, setActionReason] = useState("");
  const [extendDays, setExtendDays] = useState(30);
  const [customDate, setCustomDate] = useState("");

  // Bulk dialog
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkTier, setBulkTier] = useState<MembershipTier>("professional");
  const [bulkReason, setBulkReason] = useState("");

  const { data: members, isLoading } = useQuery({
    queryKey: ["admin-membership-members", searchQuery, tierFilter, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("id, user_id, full_name, full_name_ar, username, avatar_url, email, membership_tier, membership_status, membership_expires_at, membership_started_at, created_at")
        .order("created_at", { ascending: false })
        .limit(100);

      if (searchQuery) {
        query = query.or(`full_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }
      if (tierFilter !== "all") query = query.eq("membership_tier", tierFilter as MembershipTier);
      if (statusFilter !== "all") query = query.eq("membership_status", statusFilter as any);

      const { data, error } = await query;
      if (error) throw error;
      return data as MemberProfile[];
    },
    staleTime: 1000 * 60 * 2,
  });

  const openDialog = (action: AdminAction, member: MemberProfile) => {
    setDialogAction(action);
    setTargetUser(member);
    setActionReason("");
    if (action === "change_tier") {
      setNewTier(member.membership_tier === "enterprise" ? "professional" : "enterprise");
    }
    if (action === "extend") {
      setExtendDays(30);
      setCustomDate("");
    }
  };

  const closeDialog = () => {
    setDialogAction(null);
    setTargetUser(null);
    setActionReason("");
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-membership-members"] });
    queryClient.invalidateQueries({ queryKey: ["membership-overview-stats"] });
  };

  const logAction = async (userId: string, actionType: string, details: Record<string, any>) => {
    await supabase.from("admin_actions").insert({
      admin_id: user!.id,
      target_user_id: userId,
      action_type: actionType,
      details,
    });
  };

  const logHistory = async (userId: string, prevTier: string | null, newTierVal: string, reason: string) => {
    await supabase.from("membership_history").insert({
      user_id: userId,
      previous_tier: (prevTier || "basic") as MembershipTier,
      new_tier: newTierVal as MembershipTier,
      changed_by: user!.id,
      reason,
    });
  };

  const notify = async (userId: string, title: string, titleAr: string, body: string, bodyAr: string) => {
    await supabase.from("notifications").insert({
      user_id: userId,
      title, title_ar: titleAr,
      body, body_ar: bodyAr,
      type: "membership",
      link: "/profile?tab=membership",
    });
  };

  // ── Change Tier ──
  const changeTierMutation = useMutation({
    mutationFn: async () => {
      if (!targetUser) return;
      const userId = targetUser.user_id;
      const prevTier = targetUser.membership_tier;

      const updateData: Record<string, any> = {
        membership_tier: newTier,
        membership_status: "active",
      };
      if (newTier === "basic") {
        updateData.membership_expires_at = null;
        updateData.membership_started_at = null;
      } else {
        updateData.membership_expires_at = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
        updateData.membership_started_at = new Date().toISOString();
      }

      const { error } = await supabase.from("profiles").update(updateData).eq("user_id", userId);
      if (error) throw error;

      await logHistory(userId, prevTier, newTier, actionReason || "Admin change");
      await logAction(userId, "change_membership", { previous: prevTier, new: newTier, reason: actionReason });

      const tierLabel = newTier === "professional" ? "احترافي" : newTier === "enterprise" ? "مؤسسي" : "أساسي";
      await notify(userId,
        `Your membership has been updated to ${newTier}`,
        `تم تحديث عضويتك إلى ${tierLabel}`,
        "Your membership tier has been changed by an administrator.",
        "تم تغيير مستوى عضويتك بواسطة المسؤول."
      );
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: isAr ? "تم تغيير العضوية بنجاح" : "Membership updated successfully" });
      closeDialog();
    },
    onError: (error) => toast({ variant: "destructive", title: "Error", description: error.message }),
  });

  // ── Extend ──
  const extendMutation = useMutation({
    mutationFn: async () => {
      if (!targetUser) return;
      const userId = targetUser.user_id;
      const currentExpiry = targetUser.membership_expires_at
        ? new Date(targetUser.membership_expires_at)
        : new Date();
      const base = currentExpiry > new Date() ? currentExpiry : new Date();

      let newExpiry: Date;
      if (customDate) {
        newExpiry = new Date(customDate);
      } else {
        newExpiry = addDays(base, extendDays);
      }

      const { error } = await supabase.from("profiles").update({
        membership_expires_at: newExpiry.toISOString(),
        membership_status: "active",
      }).eq("user_id", userId);
      if (error) throw error;

      await logAction(userId, "extend_membership", {
        previous_expiry: targetUser.membership_expires_at,
        new_expiry: newExpiry.toISOString(),
        days_added: customDate ? "custom" : extendDays,
        reason: actionReason,
      });
      await logHistory(userId, targetUser.membership_tier, targetUser.membership_tier || "basic",
        `Extended: ${actionReason || `+${extendDays} days`}`);
      await notify(userId,
        "Your membership has been extended!",
        "تم تمديد عضويتك!",
        `Your membership now expires on ${format(newExpiry, "MMM d, yyyy")}.`,
        `عضويتك تنتهي الآن في ${format(newExpiry, "yyyy/MM/dd")}.`
      );
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: isAr ? "تم تمديد العضوية" : "Membership extended" });
      closeDialog();
    },
    onError: (error) => toast({ variant: "destructive", title: "Error", description: error.message }),
  });

  // ── Suspend ──
  const suspendMutation = useMutation({
    mutationFn: async () => {
      if (!targetUser) return;
      const userId = targetUser.user_id;

      const { error } = await supabase.from("profiles").update({
        membership_status: "suspended",
      }).eq("user_id", userId);
      if (error) throw error;

      await logAction(userId, "suspend_membership", { reason: actionReason, tier: targetUser.membership_tier });
      await logHistory(userId, targetUser.membership_tier, targetUser.membership_tier || "basic",
        `Suspended: ${actionReason || "Admin action"}`);
      await notify(userId,
        "Your membership has been suspended",
        "تم إيقاف عضويتك",
        actionReason || "Your membership has been suspended by an administrator.",
        actionReason || "تم إيقاف عضويتك بواسطة المسؤول."
      );
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: isAr ? "تم إيقاف العضوية" : "Membership suspended" });
      closeDialog();
    },
    onError: (error) => toast({ variant: "destructive", title: "Error", description: error.message }),
  });

  // ── Revoke (downgrade to basic) ──
  const revokeMutation = useMutation({
    mutationFn: async () => {
      if (!targetUser) return;
      const userId = targetUser.user_id;
      const prevTier = targetUser.membership_tier;

      const { error } = await supabase.from("profiles").update({
        membership_tier: "basic" as any,
        membership_status: "active",
        membership_expires_at: null,
        membership_started_at: null,
      }).eq("user_id", userId);
      if (error) throw error;

      // Deactivate membership card
      await supabase.from("membership_cards").update({ card_status: "suspended" }).eq("user_id", userId);

      await logAction(userId, "revoke_membership", { previous_tier: prevTier, reason: actionReason });
      await logHistory(userId, prevTier, "basic", `Revoked: ${actionReason || "Admin action"}`);
      await notify(userId,
        "Your membership has been revoked",
        "تم إلغاء عضويتك",
        actionReason || "Your premium membership has been revoked by an administrator.",
        actionReason || "تم إلغاء عضويتك المميزة بواسطة المسؤول."
      );
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: isAr ? "تم إلغاء العضوية" : "Membership revoked" });
      closeDialog();
    },
    onError: (error) => toast({ variant: "destructive", title: "Error", description: error.message }),
  });

  // ── Reactivate ──
  const reactivateMutation = useMutation({
    mutationFn: async () => {
      if (!targetUser) return;
      const userId = targetUser.user_id;

      const { error } = await supabase.from("profiles").update({
        membership_status: "active",
      }).eq("user_id", userId);
      if (error) throw error;

      await logAction(userId, "reactivate_membership", { reason: actionReason, tier: targetUser.membership_tier });
      await notify(userId,
        "Your membership has been reactivated!",
        "تم إعادة تفعيل عضويتك!",
        "Your membership is now active again.",
        "عضويتك نشطة مرة أخرى."
      );
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: isAr ? "تم إعادة التفعيل" : "Membership reactivated" });
      closeDialog();
    },
    onError: (error) => toast({ variant: "destructive", title: "Error", description: error.message }),
  });

  const sendRenewalReminder = useMutation({
    mutationFn: async (userId: string) => {
      await supabase.from("notifications").insert({
        user_id: userId,
        title: "Your membership is expiring soon!",
        title_ar: "عضويتك تنتهي قريباً!",
        body: "Renew now to keep enjoying premium benefits and exclusive access.",
        body_ar: "جدد الآن للاستمرار في الاستمتاع بالمميزات الحصرية والوصول المتميز.",
        type: "membership",
        link: "/profile?tab=membership",
      });
    },
    onSuccess: () => {
      toast({ title: isAr ? "تم إرسال التذكير" : "Reminder sent" });
    },
  });

  // ── Bulk ──
  const bulkChangeTierMutation = useMutation({
    mutationFn: async ({ userIds, tier, reason }: { userIds: string[]; tier: MembershipTier; reason: string }) => {
      for (const userId of userIds) {
        const { data: currentProfile } = await supabase
          .from("profiles").select("membership_tier").eq("user_id", userId).single();

        await supabase.from("profiles").update({
          membership_tier: tier,
          membership_status: "active",
          membership_expires_at: tier === "basic" ? null : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          membership_started_at: tier === "basic" ? null : new Date().toISOString(),
        }).eq("user_id", userId);

        await logHistory(userId, currentProfile?.membership_tier, tier, reason || "Bulk admin change");
        await logAction(userId, "bulk_change_membership", { previous: currentProfile?.membership_tier, new: tier, reason });
      }
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: isAr ? `تم تحديث ${selectedIds.size} عضو بنجاح` : `${selectedIds.size} members updated successfully` });
      setSelectedIds(new Set());
      setBulkDialogOpen(false);
      setBulkReason("");
    },
    onError: (error) => toast({ variant: "destructive", title: "Error", description: error.message }),
  });

  const toggleSelectAll = () => {
    if (!members) return;
    setSelectedIds(prev => prev.size === members.length ? new Set() : new Set(members.map(m => m.user_id)));
  };

  const toggleSelect = (userId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(userId) ? next.delete(userId) : next.add(userId);
      return next;
    });
  };

  const getStatusBadge = (status: string | null, expiresAt: string | null) => {
    const days = expiresAt ? differenceInDays(new Date(expiresAt), new Date()) : null;
    if (status === "suspended") return <Badge variant="destructive">{isAr ? "موقوف" : "Suspended"}</Badge>;
    if (days !== null && days < 0) return <Badge variant="destructive">{isAr ? "منتهي" : "Expired"}</Badge>;
    if (days !== null && days <= 14) return <Badge variant="outline" className="border-destructive text-destructive">{isAr ? `ينتهي خلال ${days} يوم` : `Expires in ${days}d`}</Badge>;
    if (status === "active") return <Badge variant="default">{isAr ? "نشط" : "Active"}</Badge>;
    return <Badge variant="secondary">{status || (isAr ? "غير محدد" : "N/A")}</Badge>;
  };

  const getTierBadge = (tier: MembershipTier | null) => {
    const config: Record<string, string> = {
      basic: "bg-muted text-muted-foreground",
      professional: "bg-primary/20 text-primary",
      enterprise: "bg-chart-2/20 text-chart-2",
    };
    const labels: Record<string, string> = {
      basic: isAr ? "أساسي" : "Basic",
      professional: isAr ? "احترافي" : "Professional",
      enterprise: isAr ? "مؤسسي" : "Enterprise",
    };
    return <Badge className={config[tier || "basic"]}>{labels[tier || "basic"]}</Badge>;
  };

  const isActionLoading = changeTierMutation.isPending || extendMutation.isPending
    || suspendMutation.isPending || revokeMutation.isPending || reactivateMutation.isPending;

  const handleConfirmAction = () => {
    switch (dialogAction) {
      case "change_tier": changeTierMutation.mutate(); break;
      case "extend": extendMutation.mutate(); break;
      case "suspend": suspendMutation.mutate(); break;
      case "revoke": revokeMutation.mutate(); break;
      case "reactivate": reactivateMutation.mutate(); break;
    }
  };

  const getDialogTitle = () => {
    const titles: Record<AdminAction, { en: string; ar: string }> = {
      change_tier: { en: "Change Membership Tier", ar: "تغيير مستوى العضوية" },
      extend: { en: "Extend Membership", ar: "تمديد العضوية" },
      suspend: { en: "Suspend Membership", ar: "إيقاف العضوية" },
      revoke: { en: "Revoke Membership", ar: "إلغاء العضوية" },
      reactivate: { en: "Reactivate Membership", ar: "إعادة تفعيل العضوية" },
    };
    return dialogAction ? (isAr ? titles[dialogAction].ar : titles[dialogAction].en) : "";
  };

  const TableSkeleton = () => (
    <div className="space-y-3 py-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-2">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <BulkActionBar
        count={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        onExport={() => {
          const selectedMembers = members?.filter(m => selectedIds.has(m.user_id)) || [];
          exportCSV(selectedMembers);
        }}
        onStatusChange={() => setBulkDialogOpen(true)}
      />

      <Card>
        <CardHeader>
          <CardTitle>{isAr ? "إدارة الأعضاء" : "Manage Members"}</CardTitle>
          <CardDescription>{isAr ? "ترقية وتمديد وإيقاف وإلغاء عضويات المستخدمين" : "Upgrade, extend, suspend & revoke user memberships"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={isAr ? "بحث بالاسم أو البريد..." : "Search by name or email..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-10"
              />
            </div>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "كل المستويات" : "All Tiers"}</SelectItem>
                <SelectItem value="basic">{isAr ? "أساسي" : "Basic"}</SelectItem>
                <SelectItem value="professional">{isAr ? "احترافي" : "Professional"}</SelectItem>
                <SelectItem value="enterprise">{isAr ? "مؤسسي" : "Enterprise"}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "كل الحالات" : "All Status"}</SelectItem>
                <SelectItem value="active">{isAr ? "نشط" : "Active"}</SelectItem>
                <SelectItem value="expired">{isAr ? "منتهي" : "Expired"}</SelectItem>
                <SelectItem value="suspended">{isAr ? "موقوف" : "Suspended"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <TableSkeleton />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={members?.length ? selectedIds.size === members.length : false}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>{isAr ? "العضو" : "Member"}</TableHead>
                    <TableHead>{isAr ? "المستوى" : "Tier"}</TableHead>
                    <TableHead>{isAr ? "الحالة" : "Status"}</TableHead>
                    <TableHead>{isAr ? "الانتهاء" : "Expires"}</TableHead>
                    <TableHead>{isAr ? "الإجراءات" : "Actions"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members?.map((member) => {
                    const daysLeft = member.membership_expires_at
                      ? differenceInDays(new Date(member.membership_expires_at), new Date())
                      : null;
                    const isSuspended = member.membership_status === "suspended";
                    const isBasic = !member.membership_tier || member.membership_tier === "basic";
                    return (
                      <TableRow key={member.id} className={`transition-colors ${daysLeft !== null && daysLeft <= 14 && daysLeft >= 0 ? "bg-destructive/5" : ""} ${isSuspended ? "bg-destructive/5" : ""} ${selectedIds.has(member.user_id) ? "bg-primary/5" : ""}`}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(member.user_id)}
                            onCheckedChange={() => toggleSelect(member.user_id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.avatar_url || undefined} />
                              <AvatarFallback>{(member.full_name || "U")[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{isAr ? member.full_name_ar || member.full_name : member.full_name || "Unknown"}</p>
                              <p className="text-xs text-muted-foreground">@{member.username}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getTierBadge(member.membership_tier)}</TableCell>
                        <TableCell>{getStatusBadge(member.membership_status, member.membership_expires_at)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {member.membership_expires_at
                            ? format(new Date(member.membership_expires_at), "MMM d, yyyy")
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openDialog("change_tier", member)}>
                                <ArrowUpCircle className="me-2 h-4 w-4" />
                                {isAr ? "تغيير المستوى" : "Change Tier"}
                              </DropdownMenuItem>
                              {!isBasic && (
                                <DropdownMenuItem onClick={() => openDialog("extend", member)}>
                                  <CalendarPlus className="me-2 h-4 w-4" />
                                  {isAr ? "تمديد العضوية" : "Extend"}
                                </DropdownMenuItem>
                              )}
                              {daysLeft !== null && daysLeft <= 14 && daysLeft >= 0 && (
                                <DropdownMenuItem onClick={() => sendRenewalReminder.mutate(member.user_id)}>
                                  <Mail className="me-2 h-4 w-4" />
                                  {isAr ? "إرسال تذكير" : "Send Reminder"}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              {isSuspended ? (
                                <DropdownMenuItem onClick={() => openDialog("reactivate", member)}>
                                  <ShieldCheck className="me-2 h-4 w-4 text-chart-2" />
                                  <span className="text-chart-2">{isAr ? "إعادة تفعيل" : "Reactivate"}</span>
                                </DropdownMenuItem>
                              ) : !isBasic && (
                                <DropdownMenuItem onClick={() => openDialog("suspend", member)}>
                                  <Ban className="me-2 h-4 w-4 text-destructive" />
                                  <span className="text-destructive">{isAr ? "إيقاف" : "Suspend"}</span>
                                </DropdownMenuItem>
                              )}
                              {!isBasic && (
                                <DropdownMenuItem onClick={() => openDialog("revoke", member)}>
                                  <ShieldOff className="me-2 h-4 w-4 text-destructive" />
                                  <span className="text-destructive">{isAr ? "إلغاء العضوية" : "Revoke"}</span>
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Action Dialog */}
      <Dialog open={!!dialogAction} onOpenChange={() => closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
            <DialogDescription>
              {isAr
                ? `${targetUser?.full_name_ar || targetUser?.full_name} (@${targetUser?.username})`
                : `${targetUser?.full_name} (@${targetUser?.username})`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Change Tier UI */}
            {dialogAction === "change_tier" && (
              <div className="flex items-center justify-between rounded-xl border p-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{isAr ? "الحالي" : "Current"}</p>
                  {getTierBadge(targetUser?.membership_tier || null)}
                </div>
                <span className="text-xl text-muted-foreground">→</span>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">{isAr ? "الجديد" : "New"}</p>
                  <Select value={newTier} onValueChange={(v) => setNewTier(v as MembershipTier)}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">{isAr ? "أساسي" : "Basic"}</SelectItem>
                      <SelectItem value="professional">{isAr ? "احترافي" : "Professional"}</SelectItem>
                      <SelectItem value="enterprise">{isAr ? "مؤسسي" : "Enterprise"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Extend UI */}
            {dialogAction === "extend" && (
              <div className="space-y-3">
                <div className="rounded-xl border p-3">
                  <p className="text-xs text-muted-foreground mb-1">{isAr ? "الانتهاء الحالي" : "Current expiry"}</p>
                  <p className="text-sm font-medium">
                    {targetUser?.membership_expires_at
                      ? format(new Date(targetUser.membership_expires_at), "MMM d, yyyy")
                      : (isAr ? "غير محدد" : "Not set")}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">{isAr ? "مدة التمديد" : "Extension period"}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {EXTEND_OPTIONS.map((opt) => (
                      <Button
                        key={opt.days}
                        type="button"
                        variant={extendDays === opt.days && !customDate ? "default" : "outline"}
                        size="sm"
                        onClick={() => { setExtendDays(opt.days); setCustomDate(""); }}
                      >
                        <Clock className="me-1.5 h-3.5 w-3.5" />
                        {isAr ? opt.labelAr : opt.labelEn}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">{isAr ? "أو اختر تاريخ محدد" : "Or pick a custom date"}</label>
                  <Input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    min={format(new Date(), "yyyy-MM-dd")}
                  />
                </div>
              </div>
            )}

            {/* Suspend warning */}
            {dialogAction === "suspend" && (
              <div className="flex items-start gap-3 rounded-xl bg-destructive/10 p-3">
                <Ban className="h-5 w-5 text-destructive mt-0.5" />
                <p className="text-sm text-destructive">
                  {isAr
                    ? "سيتم إيقاف وصول العضو إلى جميع مميزات العضوية المدفوعة. يمكنك إعادة التفعيل في أي وقت."
                    : "The member will lose access to all paid membership features. You can reactivate anytime."}
                </p>
              </div>
            )}

            {/* Revoke warning */}
            {dialogAction === "revoke" && (
              <div className="flex items-start gap-3 rounded-xl bg-destructive/10 p-3">
                <ShieldOff className="h-5 w-5 text-destructive mt-0.5" />
                <p className="text-sm text-destructive">
                  {isAr
                    ? "سيتم تخفيض العضو إلى المستوى الأساسي وإلغاء بطاقة العضوية. هذا الإجراء لا يمكن التراجع عنه بسهولة."
                    : "The member will be downgraded to Basic tier and their membership card will be deactivated. This is not easily reversible."}
                </p>
              </div>
            )}

            {/* Reactivate info */}
            {dialogAction === "reactivate" && (
              <div className="flex items-start gap-3 rounded-xl bg-chart-2/10 p-3">
                <ShieldCheck className="h-5 w-5 text-chart-2 mt-0.5" />
                <p className="text-sm">
                  {isAr
                    ? "سيتم إعادة تفعيل عضوية هذا المستخدم واستعادة وصوله إلى جميع المميزات."
                    : "This will reactivate the member's subscription and restore access to all features."}
                </p>
              </div>
            )}

            {/* Reason (always shown) */}
            <div>
              <label className="text-sm font-medium">{isAr ? "السبب (اختياري)" : "Reason (optional)"}</label>
              <Textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder={isAr ? "أدخل سبب الإجراء..." : "Enter reason for this action..."}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button
              variant={dialogAction === "suspend" || dialogAction === "revoke" ? "destructive" : "default"}
              onClick={handleConfirmAction}
              disabled={isActionLoading}
            >
              {isActionLoading
                ? (isAr ? "جاري التنفيذ..." : "Processing...")
                : (isAr ? "تأكيد" : "Confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Change Tier Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isAr ? "تغيير مستوى جماعي" : "Bulk Tier Change"}</DialogTitle>
            <DialogDescription>
              {isAr ? `تغيير المستوى لـ ${selectedIds.size} عضو` : `Change tier for ${selectedIds.size} member(s)`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1 block">{isAr ? "المستوى الجديد" : "New Tier"}</label>
              <Select value={bulkTier} onValueChange={(v) => setBulkTier(v as MembershipTier)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">{isAr ? "أساسي" : "Basic"}</SelectItem>
                  <SelectItem value="professional">{isAr ? "احترافي" : "Professional"}</SelectItem>
                  <SelectItem value="enterprise">{isAr ? "مؤسسي" : "Enterprise"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">{isAr ? "سبب التغيير" : "Reason"}</label>
              <Textarea
                value={bulkReason}
                onChange={(e) => setBulkReason(e.target.value)}
                placeholder={isAr ? "أدخل سبب التغيير الجماعي..." : "Enter reason for bulk change..."}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
            <Button
              onClick={() => bulkChangeTierMutation.mutate({ userIds: Array.from(selectedIds), tier: bulkTier, reason: bulkReason })}
              disabled={bulkChangeTierMutation.isPending}
            >
              {bulkChangeTierMutation.isPending
                ? (isAr ? "جاري التحديث..." : "Updating...")
                : (isAr ? `تحديث ${selectedIds.size} عضو` : `Update ${selectedIds.size} Members`)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
