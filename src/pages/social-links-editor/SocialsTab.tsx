import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Globe, Phone, Save, Loader2 } from "lucide-react";
import { SOCIAL_PLATFORMS, CONTACT_FIELDS, normalizeSocialUrl } from "./constants";
import { normalizePhoneInput } from "@/lib/arabicNumerals";
import { countryFlag } from "@/lib/countryFlag";

/**
 * TYPOGRAPHY POLICY — ALTOHA DESIGN SYSTEM
 * Minimum font size: 11px (0.6875rem) desktop / 13px (0.8125rem) mobile.
 * Do NOT use `text-xs` on body text — only on badges & labels.
 * Scale: display(48) h1(36) h2(28) h3(22) h4(18) body-lg(18) body(16) body-sm(14) caption(13) label(12) overline(11).
 * IBM Plex Arabic required on all text.
 * See src/styles/typography.css for the complete policy.
 */

interface Props {
  socials: Record<string, string>;
  setSocials: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  contacts: Record<string, string>;
  setContacts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  contactCountryCodes: Record<string, string>;
  setContactCountryCodes: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  countries: any[] | undefined;
  handleSaveSocials: () => void;
  savingSocials: boolean;
  isAr: boolean;
}

export const SocialsTab = memo(function SocialsTab({
  socials, setSocials, contacts, setContacts,
  contactCountryCodes, setContactCountryCodes,
  countries, handleSaveSocials, savingSocials, isAr,
}: Props) {
  const activeSocials = SOCIAL_PLATFORMS.filter(p => socials[p.key]);
  const activeContacts = CONTACT_FIELDS.filter(c => contacts[c.key]);

  return (
    <div className="space-y-4 mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Active Channels Summary */}
      {(activeSocials.length > 0 || activeContacts.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {activeSocials.map(p => {
            const Icon = p.icon;
            return (
              <Badge key={p.key} variant="secondary" className="gap-1 py-0.5 px-2 text-xs">
                <Icon className="h-2.5 w-2.5" />
                {isAr ? p.labelAr : p.label}
                <Check className="h-2.5 w-2.5 text-chart-1" />
              </Badge>
            );
          })}
          {activeContacts.map(c => {
            const Icon = c.icon;
            return (
              <Badge key={c.key} variant="secondary" className="gap-1 py-0.5 px-2 text-xs">
                <Icon className="h-2.5 w-2.5" />
                {isAr ? c.labelAr : c.label}
                <Check className="h-2.5 w-2.5 text-chart-1" />
              </Badge>
            );
          })}
        </div>
      )}

      {/* Social Media Accounts */}
      <Card className="overflow-hidden border-border/40">
        <CardHeader className="pb-3 bg-muted/30">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center">
              <Globe className="h-3.5 w-3.5 text-primary" />
            </div>
            {isAr ? "حسابات التواصل الاجتماعي" : "Social Media Accounts"}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {isAr ? "أدخل اسم المستخدم فقط — سيتم إنشاء الرابط تلقائياً" : "Just enter your username — links auto-complete on blur"}
          </p>
        </CardHeader>
        <CardContent className="pt-4 pb-5 px-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {SOCIAL_PLATFORMS.map(platform => {
              const Icon = platform.icon;
              const rawValue = socials[platform.key] || "";
              const isActive = !!rawValue;
              return (
                <div key={platform.key} className={`group relative rounded-xl border-2 transition-all duration-200 ${isActive ? "border-primary/30 bg-primary/[0.03] shadow-sm" : "border-border/30 hover:border-border/60"}`}>
                  <div className="flex items-center gap-3 p-3">
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${isActive ? "bg-gradient-to-br " + platform.color + " text-primary-foreground shadow-md" : "bg-muted/80"}`}>
                      <Icon className={`h-4 w-4 ${isActive ? "" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Label className="text-xs font-semibold mb-1 block">{isAr ? platform.labelAr : platform.label}</Label>
                      {platform.prefix ? (
                        <div className="flex items-center gap-0">
                          <span className="text-xs text-muted-foreground/60 font-mono bg-muted/40 px-1.5 py-1 rounded-s-lg border border-e-0 border-border/30 h-8 flex items-center shrink-0 select-none" dir="ltr">
                            {platform.prefix.replace("https://", "")}
                          </span>
                          <Input
                            value={rawValue.startsWith(platform.prefix) ? rawValue.slice(platform.prefix.length).replace(/\/$/, "") : rawValue}
                            onChange={e => setSocials(s => ({ ...s, [platform.key]: e.target.value }))}
                            onBlur={e => {
                              const normalized = normalizeSocialUrl(e.target.value, platform);
                              if (normalized !== socials[platform.key]) {
                                setSocials(s => ({ ...s, [platform.key]: normalized }));
                              }
                            }}
                            placeholder={platform.placeholder}
                            className="h-8 text-xs rounded-s-none rounded-e-lg border-border/30 bg-muted/20 focus:bg-background placeholder:text-muted-foreground/40"
                            dir="ltr"
                          />
                        </div>
                      ) : (
                        <Input
                          value={rawValue}
                          onChange={e => setSocials(s => ({ ...s, [platform.key]: e.target.value }))}
                          onBlur={e => {
                            const normalized = normalizeSocialUrl(e.target.value, platform);
                            if (normalized !== socials[platform.key]) {
                              setSocials(s => ({ ...s, [platform.key]: normalized }));
                            }
                          }}
                          placeholder={platform.placeholder}
                          className="h-8 text-xs rounded-lg border-border/30 bg-muted/20 focus:bg-background placeholder:text-muted-foreground/40"
                          dir="ltr"
                        />
                      )}
                      {isActive && platform.prefix && rawValue.startsWith("http") && (
                        <p className="text-xs text-muted-foreground/50 mt-0.5 font-mono truncate" dir="ltr">{rawValue}</p>
                      )}
                    </div>
                    {isActive && (
                      <div className="h-6 w-6 rounded-full bg-chart-1/15 flex items-center justify-center shrink-0">
                        <Check className="h-3.5 w-3.5 text-chart-1" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Contact Numbers */}
      <Card className="overflow-hidden border-border/40">
        <CardHeader className="pb-3 bg-muted/30">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center">
              <Phone className="h-3.5 w-3.5 text-primary" />
            </div>
            {isAr ? "أرقام الاتصال" : "Contact Numbers"}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {isAr ? "واتساب + رقمين هاتف — اختر رمز الدولة ثم أدخل الرقم" : "WhatsApp + up to 2 phone numbers — select country code then enter number"}
          </p>
        </CardHeader>
        <CardContent className="pt-4 pb-5 px-5">
          <div className="grid gap-3">
            {CONTACT_FIELDS.map(field => {
              const Icon = field.icon;
              const value = contacts[field.key] || "";
              const isActive = !!value;
              const cc = contactCountryCodes[field.key] || "SA";
              const selectedCountry = countries?.find(c => c.code === cc);
              return (
                <div key={field.key} className={`group relative rounded-xl border-2 transition-all duration-200 ${isActive ? "border-primary/30 bg-primary/[0.03] shadow-sm" : "border-border/30 hover:border-border/60"}`}>
                  <div className="flex items-center gap-3 p-3">
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 ${isActive ? "bg-gradient-to-br " + field.color + " text-primary-foreground shadow-md" : "bg-muted/80"}`}>
                      <Icon className={`h-4 w-4 ${isActive ? "" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Label className="text-xs font-semibold mb-1.5 block">{isAr ? field.labelAr : field.label}</Label>
                      <div className="flex items-center gap-0" dir="ltr">
                        <select
                          value={cc}
                          onChange={e => setContactCountryCodes(prev => ({ ...prev, [field.key]: e.target.value }))}
                          className="h-8 text-xs font-mono rounded-s-lg border border-e-0 border-border/30 bg-muted/30 px-1.5 focus:outline-none focus:ring-1 focus:ring-primary/30 appearance-none cursor-pointer min-w-[90px] text-muted-foreground"
                          dir="ltr"
                        >
                          {(countries || []).map(c => (
                            <option key={c.code} value={c.code}>
                              {countryFlag(c.code)} {c.phone_code}
                            </option>
                          ))}
                        </select>
                        <Input
                          type="tel"
                          value={value}
                          onChange={e => setContacts(c => ({ ...c, [field.key]: normalizePhoneInput(e.target.value) }))}
                          placeholder={field.placeholder}
                          className="h-8 text-xs rounded-s-none rounded-e-lg border-border/30 bg-muted/20 focus:bg-background placeholder:text-muted-foreground/40"
                          dir="ltr"
                        />
                      </div>
                    </div>
                    {isActive && (
                      <div className="h-6 w-6 rounded-full bg-chart-1/15 flex items-center justify-center shrink-0">
                        <Check className="h-3.5 w-3.5 text-chart-1" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSaveSocials} disabled={savingSocials} className="w-full gap-1.5">
        {savingSocials ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {savingSocials ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ الحسابات والاتصال" : "Save Accounts & Contact")}
      </Button>
    </div>
  );
});
