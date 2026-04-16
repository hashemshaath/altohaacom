import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard } from "lucide-react";

/**
 * TYPOGRAPHY POLICY — ALTOHA DESIGN SYSTEM
 * Minimum font size: 11px (0.6875rem) desktop / 13px (0.8125rem) mobile.
 * Do NOT use `text-xs` on body text — only on badges & labels.
 * Scale: display(48) h1(36) h2(28) h3(22) h4(18) body-lg(18) body(16) body-sm(14) caption(13) label(12) overline(11).
 * IBM Plex Arabic required on all text.
 * See src/styles/typography.css for the complete policy.
 */

const CURRENCIES = [
  { value: "SAR", label: "SAR - ريال سعودي" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "AED", label: "AED - UAE Dirham" },
  { value: "KWD", label: "KWD - Kuwaiti Dinar" },
  { value: "BHD", label: "BHD - Bahraini Dinar" },
  { value: "QAR", label: "QAR - Qatari Riyal" },
  { value: "OMR", label: "OMR - Omani Rial" },
  { value: "TND", label: "TND - Tunisian Dinar" },
];

interface Props {
  form: Record<string, any>;
  setForm: (f: Record<string, any>) => void;
  isAr: boolean;
}

export function FinancialSettingsCard({ form, setForm, isAr }: Props) {
  return (
    <Card className="rounded-2xl border-border/20 bg-card/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-3 px-6 pt-5">
        <CardTitle className="flex items-center gap-2.5 text-base">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-chart-1/10">
            <CreditCard className="h-4 w-4 text-chart-1" />
          </div>
          {isAr ? "الإعدادات المالية" : "Financial Settings"}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground/70 ms-[46px]">
          {isAr ? "إدارة العملة وشروط الدفع والحد الائتماني" : "Manage currency, payment terms, and credit limits"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-6 pb-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">{isAr ? "العملة" : "Currency"}</Label>
            <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
              <SelectTrigger className="rounded-xl border-border/20 bg-muted/5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {CURRENCIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold">{isAr ? "شروط الدفع (أيام)" : "Payment Terms (days)"}</Label>
            <Input
              className="rounded-xl border-border/20 bg-muted/5"
              type="number" min="0" max="365"
              value={form.payment_terms}
              onChange={(e) => setForm({ ...form, payment_terms: parseInt(e.target.value) || 0 })}
              dir="ltr"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold">{isAr ? "الحد الائتماني" : "Credit Limit"}</Label>
            <Input
              className="rounded-xl border-border/20 bg-muted/5"
              type="number" min="0"
              value={form.credit_limit}
              onChange={(e) => setForm({ ...form, credit_limit: parseFloat(e.target.value) || 0 })}
              dir="ltr"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
