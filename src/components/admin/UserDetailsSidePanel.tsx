import { memo, useState, forwardRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { InlineConfirm } from "@/components/ui/InlineConfirm";
import {
  User, Shield, Mail, Phone, Calendar, Globe, Award, Clock,
  CreditCard, FileText, Loader2, X, Copy, ExternalLink,
  CheckCircle2, Ban, ShieldCheck, ShieldOff, UserCheck, UserX,
  Activity, BarChart3, TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AppRole = Database["public"]["Enums"]["app_role"];

const ALL_ROLES: AppRole[] = ["chef", "judge", "student", "organizer", "content_writer", "volunteer", "sponsor", "assistant", "supervisor"];

interface UserDetailsSidePanelProps {
  userId: string | null;
  onClose: () => void;
  onEdit: (userId: string) => void;
}

/** Calculate profile completeness percentage */
function calcCompleteness(profile: any): { score: number; missing: string[] } {
  const fields = [
    { key: "full_name", label: "Full Name / الاسم" },
    { key: "username", label: "Username / اسم المستخدم" },
    { key: "email", label: "Email / البريد" },
    { key: "phone", label: "Phone / الهاتف" },
    { key: "avatar_url", label: "Avatar / الصورة" },
    { key: "country_code", label: "Country / الدولة" },
    { key: "city", label: "City / المدينة" },
    { key: "bio", label: "Bio / النبذة" },
    { key: "specialization", label: "Specialization / التخصص" },
    { key: "date_of_birth", label: "Date of Birth / تاريخ الميلاد" },
  ];
  const missing: string[] = [];
  let filled = 0;
  for (const f of fields) {
    if (profile[f.key]) filled++;
    else missing.push(f.label);
  }
  return { score: Math.round((filled / fields.length) * 100), missing };
}

export const UserDetailsSidePanel = memo(function UserDetailsSidePanel({ userId, onClose, onEdit }: UserDetailsSidePanelProps) {
  const { t, language } = useLanguage();
  const { user: admin } = useAuth();
  const isAr = language === "ar";
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [confirmAction, setConfirmAction] = useState<{ type: "suspend" | "ban" | "activate"; userId: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-user-detail", userId],
    queryFn: async () => {
      if (!userId) return null;
      const [profileRes, rolesRes, walletRes, actionsRes, certsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).single(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase.from("user_wallets").select("balance, points_balance, wallet_number").eq("user_id", userId).maybeSingle(),
        supabase.from("admin_actions").select("action_type, details, created_at, admin_id").eq("target_user_id", userId).order("created_at", { ascending: false }).limit(15),
        supabase.from("certificates").select("id", { count: "exact", head: true }).eq("recipient_id", userId),
      ]);
      return {
        profile: profileRes.data,
        roles: (rolesRes.data || []).map((r) => r.role) as AppRole[],
        wallet: walletRes.data,
        actions: actionsRes.data || [],
        certificateCount: certsRes.count || 0,
      };
    },
    enabled: !!userId,
  });

  const statusMutation = useMutation({
    mutationFn: async ({ status }: { status: Database["public"]["Enums"]["account_status"] }) => {
      const { error } = await supabase.from("profiles").update({
        account_status: status,
        suspended_reason: status === "suspended" || status === "banned" ? "Admin action" : null,
        suspended_at: status === "suspended" || status === "banned" ? new Date().toISOString() : null,
      }).eq("user_id", userId!);
      if (error) throw error;
      await supabase.from("admin_actions").insert([{
        admin_id: admin!.id,
        target_user_id: userId!,
        action_type: `${status}_user`,
        details: {} as any,
      }]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-detail", userId] });
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast.success(isAr ? "تم تحديث الحالة" : "Status updated");
      setConfirmAction(null);
    },
    onError: () => toast.error(isAr ? "فشل التحديث" : "Update failed"),
  });

  const roleMutation = useMutation({
    mutationFn: async ({ role, action }: { role: string; action: "add" | "remove" }) => {
      if (action === "add") {
        await supabase.from("user_roles").insert({ user_id: userId!, role: role as any });
      } else {
        await supabase.from("user_roles").delete().eq("user_id", userId!).eq("role", role as any);
      }
      await supabase.from("admin_actions").insert([{
        admin_id: admin!.id,
        target_user_id: userId!,
        action_type: action === "add" ? "add_role" : "remove_role",
        details: { role } as any,
      }]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-detail", userId] });
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast.success(isAr ? "تم تحديث الدور" : "Role updated");
    },
    onError: () => toast.error(isAr ? "فشل التحديث" : "Update failed"),
  });

  if (!userId) return null;

  const profile = data?.profile;
  const initials = profile?.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "?";

  const statusConfig: Record<string, { cls: string; icon: typeof CheckCircle2; label: string }> = {
    active: { cls: "bg-chart-3/15 text-chart-3 border-chart-3/30", icon: CheckCircle2, label: isAr ? "نشط" : "Active" },
    pending: { cls: "bg-chart-4/15 text-chart-4 border-chart-4/30", icon: Clock, label: isAr ? "معلق" : "Pending" },
    suspended: { cls: "bg-destructive/15 text-destructive border-destructive/30", icon: UserX, label: isAr ? "موقوف" : "Suspended" },
    banned: { cls: "bg-destructive/15 text-destructive border-destructive/30", icon: Ban, label: isAr ? "محظور" : "Banned" },
  };

  const currentStatus = statusConfig[profile?.account_status || "pending"];
  const completeness = profile ? calcCompleteness(profile) : { score: 0, missing: [] };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(isAr ? "تم النسخ" : "Copied");
  };

  return (
    <Card className="border-primary/20 shadow-lg rounded-2xl animate-in slide-in-from-end-4 duration-300 h-fit sticky top-4" dir={isAr ? "rtl" : "ltr"}>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            {isAr ? "تفاصيل المستخدم" : "User Details"}
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !profile ? (
          <p className="text-center text-muted-foreground text-sm py-12">{isAr ? "لم يتم العثور على المستخدم" : "User not found"}</p>
        ) : (
          <ScrollArea className="max-h-[calc(100vh-200px)]">
            <div className="space-y-4 pe-2">
              {/* ── Profile Header ── */}
              <div className="flex items-start gap-3">
                <Avatar className="h-14 w-14 border-2 border-primary/20 ring-2 ring-primary/10 ring-offset-2 ring-offset-background shrink-0">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback className="text-sm font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm truncate">{isAr ? (profile.full_name_ar || profile.full_name) : profile.full_name || "—"}</h3>
                    {profile.is_verified && (
                      <Badge variant="outline" className="text-[9px] border-primary/30 text-primary gap-0.5">
                        <CheckCircle2 className="h-2.5 w-2.5" />{isAr ? "موثق" : "Verified"}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5" dir="ltr">@{profile.username || "—"}</p>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    <Badge variant="outline" className={cn("text-[9px] gap-1", currentStatus.cls)}>
                      <currentStatus.icon className="h-2.5 w-2.5" />
                      {currentStatus.label}
                    </Badge>
                    {data.roles.slice(0, 3).map((role) => (
                      <Badge key={role} variant="outline" className="text-[9px]">{t(role as any)}</Badge>
                    ))}
                    {data.roles.length > 3 && <Badge variant="outline" className="text-[9px]">+{data.roles.length - 3}</Badge>}
                  </div>
                </div>
              </div>

              {/* ── Profile Completeness ── */}
              <div className="rounded-xl border border-border/40 bg-muted/10 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium flex items-center gap-1.5">
                    <Activity className="h-3 w-3 text-primary" />
                    {isAr ? "اكتمال الملف الشخصي" : "Profile Completeness"}
                  </span>
                  <span className={cn(
                    "text-[11px] font-bold tabular-nums",
                    completeness.score >= 80 ? "text-chart-3" : completeness.score >= 50 ? "text-chart-4" : "text-destructive"
                  )}>
                    {completeness.score}%
                  </span>
                </div>
                <Progress value={completeness.score} className="h-1.5" />
                {completeness.missing.length > 0 && completeness.score < 100 && (
                  <p className="text-[10px] text-muted-foreground">
                    {isAr ? "ينقص:" : "Missing:"} {completeness.missing.slice(0, 3).join(", ")}
                    {completeness.missing.length > 3 && ` +${completeness.missing.length - 3}`}
                  </p>
                )}
              </div>

              {/* ── Quick Actions ── */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <Button size="sm" className="rounded-xl gap-1.5 h-8 text-xs flex-1" onClick={() => onEdit(profile.user_id)}>
                  <ExternalLink className="h-3 w-3" />{isAr ? "تعديل الملف" : "Edit Profile"}
                </Button>
                {profile.account_status !== "active" && (
                  <Button size="sm" variant="outline" className="rounded-xl gap-1.5 h-8 text-xs text-chart-3 border-chart-3/30 hover:bg-chart-3/10" onClick={() => setConfirmAction({ type: "activate", userId: profile.user_id })}>
                    <UserCheck className="h-3 w-3" />{isAr ? "تفعيل" : "Activate"}
                  </Button>
                )}
                {profile.account_status === "active" && (
                  <Button size="sm" variant="outline" className="rounded-xl gap-1.5 h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setConfirmAction({ type: "suspend", userId: profile.user_id })}>
                    <ShieldOff className="h-3 w-3" />{isAr ? "إيقاف" : "Suspend"}
                  </Button>
                )}
              </div>

              {/* Confirm action */}
              <InlineConfirm
                open={!!confirmAction}
                onCancel={() => setConfirmAction(null)}
                onConfirm={() => {
                  if (!confirmAction) return;
                  const statusMap: Record<string, Database["public"]["Enums"]["account_status"]> = { activate: "active", suspend: "suspended", ban: "banned" };
                  statusMutation.mutate({ status: statusMap[confirmAction.type] });
                }}
                title={confirmAction?.type === "activate" ? (isAr ? "تأكيد التفعيل" : "Confirm Activation") : (isAr ? "تأكيد الإيقاف" : "Confirm Suspension")}
                description={confirmAction?.type === "activate" ? (isAr ? "سيتم تفعيل هذا الحساب" : "This account will be activated") : (isAr ? "سيتم إيقاف هذا الحساب ولن يتمكن المستخدم من الدخول" : "This account will be suspended")}
                confirmLabel={confirmAction?.type === "activate" ? (isAr ? "تفعيل" : "Activate") : (isAr ? "إيقاف" : "Suspend")}
                variant={confirmAction?.type === "activate" ? "default" : "destructive"}
                loading={statusMutation.isPending}
              />

              <Separator />

              {/* ── Tabs ── */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full rounded-xl bg-muted/40 p-1 h-auto">
                  <TabsTrigger value="overview" className="text-[11px] flex-1 rounded-lg gap-1">
                    <BarChart3 className="h-3 w-3" />{isAr ? "نظرة عامة" : "Overview"}
                  </TabsTrigger>
                  <TabsTrigger value="roles" className="text-[11px] flex-1 rounded-lg gap-1">
                    <Shield className="h-3 w-3" />{isAr ? "الأدوار" : "Roles"}
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="text-[11px] flex-1 rounded-lg gap-1">
                    <Clock className="h-3 w-3" />{isAr ? "السجل" : "Activity"}
                  </TabsTrigger>
                </TabsList>

                {/* ── Overview ── */}
                <TabsContent value="overview" className="mt-3 space-y-3">
                  <SectionLabel icon={Mail} text={isAr ? "معلومات التواصل" : "Contact Info"} />
                  <div className="space-y-1">
                    <InfoRow icon={Mail} label={isAr ? "البريد الإلكتروني" : "Email"} value={profile.email} dir="ltr" onCopy={() => copyToClipboard(profile.email || "")} isAr={isAr} />
                    <InfoRow icon={Phone} label={isAr ? "رقم الهاتف" : "Phone"} value={profile.phone || "—"} dir="ltr" isAr={isAr} />
                    <InfoRow icon={Globe} label={isAr ? "الدولة" : "Country"} value={profile.country_code || "—"} isAr={isAr} />
                    {profile.city && <InfoRow icon={Globe} label={isAr ? "المدينة" : "City"} value={profile.city} isAr={isAr} />}
                  </div>

                  <Separator className="my-2" />
                  <SectionLabel icon={CreditCard} text={isAr ? "بيانات الحساب" : "Account Info"} />
                  <div className="space-y-1">
                    <InfoRow icon={CreditCard} label={isAr ? "رقم الحساب" : "Account #"} value={profile.account_number || "—"} dir="ltr" onCopy={() => copyToClipboard(profile.account_number || "")} isAr={isAr} />
                    <InfoRow icon={Calendar} label={isAr ? "تاريخ الانضمام" : "Joined"} value={profile.created_at ? format(new Date(profile.created_at), "yyyy-MM-dd") : "—"} isAr={isAr} />
                    <InfoRow icon={Clock} label={isAr ? "آخر تسجيل دخول" : "Last Login"} value={profile.last_login_at ? format(new Date(profile.last_login_at), "yyyy-MM-dd HH:mm") : "—"} isAr={isAr} />
                    <InfoRow icon={TrendingUp} label={isAr ? "نوع الحساب" : "Account Type"} value={profile.account_type === "professional" ? (isAr ? "محترف" : "Professional") : (isAr ? "مستخدم عادي" : "Regular User")} isAr={isAr} />
                    <InfoRow icon={Award} label={isAr ? "العضوية" : "Membership"} value={profile.membership_tier === "enterprise" ? (isAr ? "مؤسسي" : "Enterprise") : profile.membership_tier === "professional" ? (isAr ? "محترف" : "Pro") : (isAr ? "أساسي" : "Basic")} isAr={isAr} />
                  </div>

                  <Separator className="my-2" />
                  <SectionLabel icon={Award} text={isAr ? "الرصيد والنقاط" : "Balance & Points"} />
                  <div className="grid grid-cols-2 gap-2">
                    <MiniStatCard icon={Award} label={isAr ? "النقاط" : "Points"} value={String(data.wallet?.points_balance ?? profile.loyalty_points ?? 0)} color="text-chart-4" />
                    <MiniStatCard icon={CreditCard} label={isAr ? "الرصيد" : "Balance"} value={`${data.wallet?.balance ?? 0} SAR`} color="text-chart-2" />
                  </div>
                  {data.certificateCount > 0 && (
                    <MiniStatCard icon={FileText} label={isAr ? "الشهادات" : "Certificates"} value={String(data.certificateCount)} color="text-primary" />
                  )}
                </TabsContent>

                {/* ── Roles ── */}
                <TabsContent value="roles" className="mt-3 space-y-2">
                  <SectionLabel icon={Shield} text={isAr ? "إدارة الأدوار" : "Role Management"} />
                  {ALL_ROLES.map((role) => {
                    const hasRole = data.roles.includes(role);
                    return (
                      <div key={role} className={cn(
                        "flex items-center justify-between p-2.5 rounded-xl border transition-all",
                        hasRole ? "border-primary/30 bg-primary/5" : "border-border/50 bg-muted/20"
                      )}>
                        <div className="flex items-center gap-2">
                          {hasRole ? <ShieldCheck className="h-3.5 w-3.5 text-primary" /> : <ShieldOff className="h-3.5 w-3.5 text-muted-foreground" />}
                          <span className="text-xs font-medium">{t(role as any)}</span>
                        </div>
                        <Button
                          variant={hasRole ? "outline" : "default"}
                          size="sm"
                          className={cn("h-6 text-[10px] px-2 rounded-lg", hasRole && "text-destructive border-destructive/30 hover:bg-destructive/10")}
                          disabled={roleMutation.isPending}
                          onClick={() => roleMutation.mutate({ role, action: hasRole ? "remove" : "add" })}
                        >
                          {roleMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : hasRole ? (isAr ? "إزالة" : "Remove") : (isAr ? "إضافة" : "Add")}
                        </Button>
                      </div>
                    );
                  })}
                </TabsContent>

                {/* ── Activity ── */}
                <TabsContent value="activity" className="mt-3">
                  <SectionLabel icon={Clock} text={isAr ? "سجل الإجراءات الإدارية" : "Admin Action History"} />
                  {data.actions.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">{isAr ? "لا يوجد سجل إجراءات بعد" : "No activity yet"}</p>
                  ) : (
                    <div className="space-y-1.5 mt-2">
                      {data.actions.map((action, i) => (
                        <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/20 border border-border/30">
                          <div className="h-6 w-6 rounded-full bg-muted/60 flex items-center justify-center shrink-0 mt-0.5">
                            <FileText className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium">{action.action_type.replace(/_/g, " ")}</p>
                            <p className="text-[10px] text-muted-foreground tabular-nums mt-0.5" dir="ltr">
                              {format(new Date(action.created_at), "yyyy-MM-dd HH:mm")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
});

// ── Helper Components ──

function SectionLabel({ icon: Icon, text }: { icon: typeof Mail; text: string }) {
  return (
    <p className="text-[11px] font-semibold text-foreground/80 flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 text-primary/70" />
      {text}
    </p>
  );
}

function InfoRow({ icon: Icon, label, value, dir, onCopy, isAr }: { icon: typeof Mail; label: string; value: string | null; dir?: string; onCopy?: () => void; isAr?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 px-1 rounded-lg hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-2 text-muted-foreground min-w-0 shrink-0">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="text-[11px] whitespace-nowrap">{label}</span>
      </div>
      <div className="flex items-center gap-1 min-w-0">
        <span className="text-xs font-medium truncate max-w-[160px]" dir={dir}>{value || "—"}</span>
        {onCopy && value && value !== "—" && (
          <Button variant="ghost" size="icon" className="h-5 w-5 rounded-md shrink-0 opacity-50 hover:opacity-100" onClick={onCopy} title={isAr ? "نسخ" : "Copy"}>
            <Copy className="h-2.5 w-2.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

const MiniStatCard = forwardRef<HTMLDivElement, { icon: typeof Award; label: string; value: string; color: string }>(
  function MiniStatCard({ icon: Icon, label, value, color }, ref) {
    return (
      <div ref={ref} className="rounded-xl border border-border/40 bg-muted/20 p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <Icon className={cn("h-3 w-3", color)} />
          <span className="text-[10px] text-muted-foreground">{label}</span>
        </div>
        <p className="text-sm font-semibold tabular-nums">{value}</p>
      </div>
    );
  }
);
