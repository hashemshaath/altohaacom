import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  User, Shield, Mail, Phone, Calendar, Globe, Award, Clock,
  CreditCard, Trophy, FileText, Ban, CheckCircle2, Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Props {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminUserDetailsDrawer({ userId, open, onOpenChange }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["admin-user-detail", userId],
    queryFn: async () => {
      if (!userId) return null;
      const [profileRes, rolesRes, walletRes, actionsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).single(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase.from("user_wallets").select("balance, points_balance, wallet_number").eq("user_id", userId).maybeSingle(),
        supabase.from("admin_actions").select("action_type, details, created_at").eq("target_user_id", userId).order("created_at", { ascending: false }).limit(10),
      ]);
      return {
        profile: profileRes.data,
        roles: (rolesRes.data || []).map((r: any) => r.role),
        wallet: walletRes.data,
        actions: actionsRes.data || [],
      };
    },
    enabled: !!userId && open,
  });

  const roleMutation = useMutation({
    mutationFn: async ({ role, action }: { role: string; action: "add" | "remove" }) => {
      if (action === "add") {
        await supabase.from("user_roles").insert({ user_id: userId!, role: role as any });
      } else {
        await supabase.from("user_roles").delete().eq("user_id", userId!).eq("role", role as any);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-detail", userId] });
      toast.success(isAr ? "تم تحديث الدور" : "Role updated");
    },
    onError: () => toast.error(isAr ? "فشل التحديث" : "Update failed"),
  });

  const profile = user?.profile;
  const initials = profile?.full_name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) || "?";

  const infoItems = profile ? [
    { icon: Mail, label: isAr ? "البريد" : "Email", value: profile.email },
    { icon: Phone, label: isAr ? "الهاتف" : "Phone", value: profile.phone || "—" },
    { icon: Globe, label: isAr ? "البلد" : "Country", value: profile.country_code || "—" },
    { icon: Calendar, label: isAr ? "تاريخ الانضمام" : "Joined", value: profile.created_at ? format(new Date(profile.created_at), "yyyy-MM-dd") : "—" },
    { icon: Clock, label: isAr ? "آخر دخول" : "Last Login", value: profile.last_login_at ? format(new Date(profile.last_login_at), "yyyy-MM-dd HH:mm") : "—" },
    { icon: Award, label: isAr ? "النقاط" : "Points", value: user?.wallet?.points_balance ?? profile.loyalty_points ?? 0 },
    { icon: CreditCard, label: isAr ? "الرصيد" : "Balance", value: `${user?.wallet?.balance ?? 0} SAR` },
  ] : [];

  const allRoles = ["supervisor", "organizer", "judge", "chef", "viewer"];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md p-0">
        <SheetHeader className="p-4 pb-0">
          <SheetTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {isAr ? "تفاصيل المستخدم" : "User Details"}
          </SheetTitle>
          <SheetDescription>{isAr ? "عرض وإدارة بيانات المستخدم" : "View and manage user data"}</SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !profile ? (
          <p className="text-center text-muted-foreground text-sm py-12">{isAr ? "لم يتم العثور على المستخدم" : "User not found"}</p>
        ) : (
          <ScrollArea className="h-[calc(100vh-80px)]">
            <div className="p-4 space-y-4">
              {/* Profile header */}
              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback className="text-sm font-bold">{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{profile.full_name || profile.username || "—"}</h3>
                  <p className="text-xs text-muted-foreground">@{profile.username || "—"}</p>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {user.roles.map((role: string) => (
                      <Badge key={role} variant="outline" className="text-[9px]">{role}</Badge>
                    ))}
                    {profile.account_status === "suspended" && <Badge variant="destructive" className="text-[9px]">{isAr ? "محظور" : "Suspended"}</Badge>}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-2">
                {infoItems.map((item) => (
                  <Card key={item.label} className="border-border/40">
                    <CardContent className="p-2.5">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <item.icon className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[9px] text-muted-foreground">{item.label}</span>
                      </div>
                      <p className="text-xs font-medium truncate">{String(item.value)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Separator />

              {/* Role management */}
              <div>
                <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  {isAr ? "إدارة الأدوار" : "Role Management"}
                </p>
                <div className="space-y-1.5">
                  {allRoles.map((role) => {
                    const hasRole = user.roles.includes(role);
                    return (
                      <div key={role} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <span className="text-xs font-medium capitalize">{role}</span>
                        <Button
                          variant={hasRole ? "destructive" : "default"}
                          size="sm"
                          className="h-6 text-[10px] px-2"
                          disabled={roleMutation.isPending}
                          onClick={() => roleMutation.mutate({ role, action: hasRole ? "remove" : "add" })}
                        >
                          {hasRole ? (isAr ? "إزالة" : "Remove") : (isAr ? "إضافة" : "Add")}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* Activity timeline */}
              <div>
                <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-chart-4" />
                  {isAr ? "سجل الإجراءات" : "Action History"}
                </p>
                {user.actions.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground text-center py-4">{isAr ? "لا يوجد سجل" : "No history"}</p>
                ) : (
                  <div className="space-y-1.5">
                    {user.actions.map((action: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-muted/20 text-xs">
                        <div className="h-5 w-5 rounded-full bg-muted/60 flex items-center justify-center shrink-0 mt-0.5">
                          <FileText className="h-2.5 w-2.5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{action.action_type}</p>
                          <p className="text-[9px] text-muted-foreground">
                            {format(new Date(action.created_at), "yyyy-MM-dd HH:mm")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}
