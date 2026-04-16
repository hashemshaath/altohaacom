import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scale } from "lucide-react";

/**
 * TYPOGRAPHY POLICY — ALTOHA DESIGN SYSTEM
 * Minimum font size: 11px (0.6875rem) desktop / 13px (0.8125rem) mobile.
 * Do NOT use `text-xs` on body text — only on badges & labels.
 * Scale: display(48) h1(36) h2(28) h3(22) h4(18) body-lg(18) body(16) body-sm(14) caption(13) label(12) overline(11).
 * IBM Plex Arabic required on all text.
 * See src/styles/typography.css for the complete policy.
 */

interface Props {
  form: Record<string, any>;
  setForm: (f: Record<string, any>) => void;
  isAr: boolean;
}

export function LegalInfoCard({ form, setForm, isAr }: Props) {
  return (
    <Card className="rounded-2xl border-border/20 bg-card/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-3 px-6 pt-5">
        <CardTitle className="flex items-center gap-2.5 text-base">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-chart-2/10">
            <Scale className="h-4 w-4 text-chart-2" />
          </div>
          {isAr ? "المعلومات القانونية" : "Legal Information"}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground/70 ms-[46px]">
          {isAr ? "الرقم الضريبي وبيانات السجل التجاري" : "Tax number and commercial registration details"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-6 pb-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">{isAr ? "الرقم الضريبي" : "Tax Number"}</Label>
            <Input
              className="rounded-xl border-border/20 bg-muted/5"
              value={form.tax_number}
              onChange={(e) => setForm({ ...form, tax_number: e.target.value })}
              placeholder={isAr ? "أدخل الرقم الضريبي" : "Enter tax number"}
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold">{isAr ? "رقم السجل التجاري" : "Registration Number"}</Label>
            <Input
              className="rounded-xl border-border/20 bg-muted/5"
              value={form.registration_number}
              onChange={(e) => setForm({ ...form, registration_number: e.target.value })}
              placeholder={isAr ? "أدخل رقم السجل" : "Enter registration number"}
              dir="ltr"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
