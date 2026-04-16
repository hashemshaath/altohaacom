import { useIsAr } from "@/hooks/useIsAr";
import { useAuth } from "@/contexts/AuthContext";
import { PageShell } from "@/components/PageShell";
import { VerificationRequestForm } from "@/components/verification/VerificationRequestForm";
import { useVerificationStatus } from "@/hooks/useVerification";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VerifiedBadge } from "@/components/verification/VerifiedBadge";
import { ShieldCheck, CheckCircle, Info } from "lucide-react";

/**
 * TYPOGRAPHY POLICY — ALTOHA DESIGN SYSTEM
 * Minimum font size: 11px (0.6875rem) desktop / 13px (0.8125rem) mobile.
 * Do NOT use `text-xs` on body text — only on badges & labels.
 * Scale: display(48) h1(36) h2(28) h3(22) h4(18) body-lg(18) body(16) body-sm(14) caption(13) label(12) overline(11).
 * IBM Plex Arabic required on all text.
 * See src/styles/typography.css for the complete policy.
 */

export default function Verification() {
  const { user } = useAuth();
  const isAr = useIsAr();
  const { data: status } = useVerificationStatus();

  return (
    <PageShell
      title={isAr ? "التوثيق" : "Verification"}
      description={isAr ? "وثّق حسابك واحصل على شارة التوثيق" : "Verify your account and get your verified badge"}
      seoProps={{ noIndex: true }}
    >
      <div className="mx-auto max-w-2xl space-y-6 py-6" dir={isAr ? "rtl" : "ltr"}>
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">{isAr ? "مركز التوثيق" : "Verification Center"}</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {isAr
              ? "احصل على شارة التوثيق لتعزيز مصداقيتك وبناء الثقة مع المجتمع"
              : "Get your verified badge to boost credibility and build trust with the community"}
          </p>
        </div>

        {/* Current Status */}
        {status?.is_verified && (
          <Card className="border-primary/30 bg-primary/5 rounded-2xl">
            <CardContent className="flex items-center gap-4 p-5">
              <CheckCircle className="h-8 w-8 text-primary shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold">{isAr ? "حسابك موثّق" : "Your Account is Verified"}</p>
                  <VerifiedBadge level={status.verification_level || "basic"} size="sm" />
                </div>
                <p className="text-xs text-muted-foreground">
                  {isAr ? "تم التوثيق في" : "Verified on"}{" "}
                  {status.verified_at ? new Date(status.verified_at).toLocaleDateString(isAr ? "ar" : "en") : "—"}
                </p>
              </div>
              <Badge variant="default" className="shrink-0">{status.verification_level || "basic"}</Badge>
            </CardContent>
          </Card>
        )}

        {/* How it works */}
        <Card className="rounded-2xl border-border/40">
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              {isAr ? "كيف يعمل التوثيق؟" : "How Verification Works"}
            </h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { step: "1", en: "Submit your request with supporting documents", ar: "قدّم طلبك مع المستندات الداعمة" },
                { step: "2", en: "AI + admin team reviews your submission", ar: "فريق AI والإدارة يراجعون طلبك" },
                { step: "3", en: "Get your verified badge on approval", ar: "احصل على شارة التوثيق عند الموافقة" },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-3 rounded-xl border border-border/40 p-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                    {item.step}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{isAr ? item.ar : item.en}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Verification Form */}
        <VerificationRequestForm />
      </div>
    </PageShell>
  );
}
