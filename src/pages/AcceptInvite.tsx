import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Building2, CheckCircle, XCircle, Mail, Shield, Users, Clock, Loader2,
} from "lucide-react";

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const isAr = language === "ar";

  const { data: invite, isLoading } = useQuery({
    queryKey: ["employeeInvite", token],
    queryFn: async () => {
      if (!token) return null;
      const { data, error } = await supabase
        .from("company_employee_invites")
        .select("*, companies:company_id(id, name, name_ar, logo_url, type)")
        .eq("token", token)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!token,
  });

  const acceptMutation = useMutation({
    mutationFn: async () => {
      if (!invite || !user) throw new Error("Missing data");
      const { error: updateError } = await supabase
        .from("company_employee_invites")
        .update({ status: "accepted", accepted_at: new Date().toISOString(), accepted_by: user.id })
        .eq("id", invite.id);
      if (updateError) throw updateError;

      const { error: contactError } = await supabase
        .from("company_contacts")
        .insert({
          company_id: invite.company_id, user_id: user.id,
          name: user.user_metadata?.full_name || user.email || "Member",
          email: user.email || invite.email, role: invite.role || "viewer",
          department: invite.department || null, title: invite.title || null,
          is_primary: false, can_login: true,
        });
      if (contactError) throw contactError;
    },
    onSuccess: () => { toast({ title: isAr ? "تم قبول الدعوة بنجاح!" : "Invitation accepted successfully!" }); navigate("/company"); },
    onError: (err: any) => { toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message }); },
  });

  const declineMutation = useMutation({
    mutationFn: async () => {
      if (!invite) throw new Error("No invite");
      const { error } = await supabase.from("company_employee_invites").update({ status: "declined" }).eq("id", invite.id);
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: isAr ? "تم رفض الدعوة" : "Invitation declined" }); navigate("/dashboard"); },
  });

  const isExpired = invite?.expires_at && new Date(invite.expires_at) < new Date();
  const isAlreadyHandled = invite?.status !== "pending";

  if (isLoading || authLoading) {
    return (
      <PageShell title={isAr ? "قبول دعوة" : "Accept Invitation"} className="max-w-lg mx-auto">
        <Skeleton className="h-64 rounded-2xl" />
      </PageShell>
    );
  }

  if (!token || !invite) {
    return (
      <PageShell title={isAr ? "رابط غير صالح" : "Invalid Link"} className="max-w-lg mx-auto text-center" padding="lg">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <XCircle className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold">{isAr ? "رابط غير صالح" : "Invalid Link"}</h1>
        <p className="mt-2 text-muted-foreground">
          {isAr ? "هذا الرابط غير صالح أو منتهي الصلاحية" : "This invitation link is invalid or has expired"}
        </p>
        <Button className="mt-6" onClick={() => navigate("/")}>{isAr ? "الرئيسية" : "Home"}</Button>
      </PageShell>
    );
  }

  const company = invite.companies as any;
  const companyName = isAr && company?.name_ar ? company.name_ar : company?.name;
  const roleLabels: Record<string, { en: string; ar: string }> = {
    owner: { en: "Owner", ar: "مالك" }, admin: { en: "Admin", ar: "مدير" },
    manager: { en: "Manager", ar: "مشرف" }, editor: { en: "Editor", ar: "محرر" },
    viewer: { en: "Viewer", ar: "مشاهد" },
  };
  const roleName = roleLabels[invite.role || "viewer"] || roleLabels.viewer;

  return (
    <PageShell title={isAr ? "قبول دعوة" : "Accept Invitation"} description="Company employee invitation" className="max-w-lg mx-auto" padding="lg">
      <Card className="overflow-hidden rounded-2xl border-border/40 shadow-xl">
        <div className="bg-gradient-to-br from-primary/10 via-background to-accent/10 p-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-xl">
            {company?.logo_url ? (
              <img src={company.logo_url} className="h-14 w-14 object-contain" alt={companyName} />
            ) : (
              <Building2 className="h-10 w-10" />
            )}
          </div>
          <h1 className="text-xl font-bold">{companyName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAr ? "يدعوك للانضمام إلى فريق العمل" : "invites you to join their team"}
          </p>
        </div>

        <CardContent className="space-y-6 p-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{isAr ? "البريد" : "Email"}</p>
                <p className="text-sm font-medium">{invite.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{isAr ? "الصلاحية" : "Role"}</p>
                <p className="text-sm font-medium">{isAr ? roleName.ar : roleName.en}</p>
              </div>
            </div>
            {invite.department && (
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{isAr ? "القسم" : "Department"}</p>
                  <p className="text-sm font-medium">{invite.department}</p>
                </div>
              </div>
            )}
            {invite.title && (
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{isAr ? "المسمى" : "Title"}</p>
                  <p className="text-sm font-medium">{invite.title}</p>
                </div>
              </div>
            )}
          </div>

          {invite.message && (
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">{isAr ? "رسالة شخصية" : "Personal Message"}</p>
              <p className="text-sm italic">{invite.message}</p>
            </div>
          )}

          {isExpired ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center">
              <Clock className="mx-auto mb-2 h-6 w-6 text-destructive" />
              <p className="font-medium text-destructive">{isAr ? "انتهت صلاحية الدعوة" : "Invitation Expired"}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {isAr ? "يرجى التواصل مع الشركة لإعادة إرسال الدعوة" : "Please contact the company to resend the invitation"}
              </p>
            </div>
          ) : isAlreadyHandled ? (
            <div className="rounded-lg border border-chart-5/30 bg-chart-5/5 p-4 text-center">
              <CheckCircle className="mx-auto mb-2 h-6 w-6 text-chart-5" />
              <p className="font-medium">
                {invite.status === "accepted"
                  ? (isAr ? "تم قبول الدعوة مسبقاً" : "Already Accepted")
                  : (isAr ? "تم رفض الدعوة" : "Already Declined")}
              </p>
            </div>
          ) : !user ? (
            <div className="space-y-3 text-center">
              <p className="text-sm text-muted-foreground">
                {isAr ? "يرجى تسجيل الدخول أولاً لقبول الدعوة" : "Please sign in first to accept this invitation"}
              </p>
              <Button className="w-full" onClick={() => navigate(`/login?redirect=/accept-invite?token=${token}`)}>
                {isAr ? "تسجيل الدخول" : "Sign In"}
              </Button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Button className="flex-1 gap-2" onClick={() => acceptMutation.mutate()} disabled={acceptMutation.isPending}>
                {acceptMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                {isAr ? "قبول الدعوة" : "Accept Invitation"}
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => declineMutation.mutate()} disabled={declineMutation.isPending}>
                <XCircle className="h-4 w-4" />
                {isAr ? "رفض" : "Decline"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
