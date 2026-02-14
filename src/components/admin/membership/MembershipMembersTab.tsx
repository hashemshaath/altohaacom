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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, ArrowUpCircle, Mail, RefreshCw, UserCheck, AlertTriangle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
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
  created_at: string;
}

export default function MembershipMembersTab() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";

  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [changeUser, setChangeUser] = useState<MemberProfile | null>(null);
  const [newTier, setNewTier] = useState<MembershipTier>("professional");
  const [changeReason, setChangeReason] = useState("");

  const { data: members, isLoading } = useQuery({
    queryKey: ["admin-membership-members", searchQuery, tierFilter, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("id, user_id, full_name, full_name_ar, username, avatar_url, email, membership_tier, membership_status, membership_expires_at, created_at")
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
  });

  const changeTierMutation = useMutation({
    mutationFn: async ({ userId, tier, reason }: { userId: string; tier: MembershipTier; reason: string }) => {
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("membership_tier")
        .eq("user_id", userId)
        .single();

      const { error } = await supabase
        .from("profiles")
        .update({
          membership_tier: tier,
          membership_status: "active",
          membership_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq("user_id", userId);
      if (error) throw error;

      await supabase.from("membership_history").insert({
        user_id: userId,
        previous_tier: currentProfile?.membership_tier,
        new_tier: tier,
        changed_by: user!.id,
        reason: reason || "Admin change",
      });

      await supabase.from("admin_actions").insert({
        admin_id: user!.id,
        target_user_id: userId,
        action_type: "change_membership",
        details: { previous: currentProfile?.membership_tier, new: tier, reason },
      });

      // Send notification
      await supabase.from("notifications").insert({
        user_id: userId,
        title: `Your membership has been updated to ${tier}`,
        title_ar: `تم تحديث عضويتك إلى ${tier === "professional" ? "احترافي" : tier === "enterprise" ? "مؤسسي" : "أساسي"}`,
        body: `Your membership tier has been changed. Enjoy your new benefits!`,
        body_ar: `تم تغيير مستوى عضويتك. استمتع بمميزاتك الجديدة!`,
        type: "membership",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-membership-members"] });
      queryClient.invalidateQueries({ queryKey: ["membership-overview-stats"] });
      toast({ title: isAr ? "تم تغيير العضوية بنجاح" : "Membership updated successfully" });
      setChangeUser(null);
      setChangeReason("");
    },
    onError: (error) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
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

  const getStatusBadge = (status: string | null, expiresAt: string | null) => {
    const days = expiresAt ? differenceInDays(new Date(expiresAt), new Date()) : null;
    if (days !== null && days < 0) return <Badge variant="destructive">{isAr ? "منتهي" : "Expired"}</Badge>;
    if (days !== null && days <= 14) return <Badge variant="outline" className="border-destructive text-destructive">{isAr ? `ينتهي خلال ${days} يوم` : `Expires in ${days}d`}</Badge>;
    if (status === "active") return <Badge variant="default">{isAr ? "نشط" : "Active"}</Badge>;
    if (status === "suspended") return <Badge variant="destructive">{isAr ? "موقوف" : "Suspended"}</Badge>;
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{isAr ? "إدارة الأعضاء" : "Manage Members"}</CardTitle>
          <CardDescription>{isAr ? "ترقية وإدارة عضويات المستخدمين" : "Upgrade and manage user memberships"}</CardDescription>
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
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
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
                    return (
                      <TableRow key={member.id} className={daysLeft !== null && daysLeft <= 14 && daysLeft >= 0 ? "bg-destructive/5" : ""}>
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
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm" onClick={() => {
                              setChangeUser(member);
                              setNewTier(member.membership_tier === "enterprise" ? "professional" : "enterprise");
                            }}>
                              <ArrowUpCircle className="h-3.5 w-3.5" />
                            </Button>
                            {daysLeft !== null && daysLeft <= 14 && daysLeft >= 0 && (
                              <Button variant="outline" size="sm"
                                onClick={() => sendRenewalReminder.mutate(member.user_id)}
                                disabled={sendRenewalReminder.isPending}
                              >
                                <Mail className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
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

      {/* Change Tier Dialog */}
      <Dialog open={!!changeUser} onOpenChange={() => setChangeUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isAr ? "تغيير مستوى العضوية" : "Change Membership Tier"}</DialogTitle>
            <DialogDescription>
              {isAr
                ? `تغيير مستوى العضوية لـ ${changeUser?.full_name_ar || changeUser?.full_name}`
                : `Change membership tier for ${changeUser?.full_name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{isAr ? "الحالي" : "Current"}</p>
                {getTierBadge(changeUser?.membership_tier || null)}
              </div>
              <span className="text-xl text-muted-foreground">→</span>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{isAr ? "الجديد" : "New"}</p>
                <Select value={newTier} onValueChange={(v) => setNewTier(v as MembershipTier)}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">{isAr ? "أساسي" : "Basic"}</SelectItem>
                    <SelectItem value="professional">{isAr ? "احترافي" : "Professional"}</SelectItem>
                    <SelectItem value="enterprise">{isAr ? "مؤسسي" : "Enterprise"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">{isAr ? "سبب التغيير" : "Reason for change"}</label>
              <Textarea
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                placeholder={isAr ? "أدخل سبب التغيير..." : "Enter reason for change..."}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeUser(null)}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={() => changeUser && changeTierMutation.mutate({ userId: changeUser.user_id, tier: newTier, reason: changeReason })}
              disabled={changeTierMutation.isPending}
            >
              {isAr ? "تأكيد التغيير" : "Confirm Change"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
