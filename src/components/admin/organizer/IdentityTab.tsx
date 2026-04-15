import { memo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Calendar, Hash, AlertCircle, RefreshCw } from "lucide-react";
import { SectionHeader, BilingualField, FieldGroup, generateSlug } from "./OrganizerFormHelpers";
import type { OrganizerForm } from "./useOrganizerEditForm";

interface Props {
  form: OrganizerForm;
  setForm: React.Dispatch<React.SetStateAction<OrganizerForm>>;
  formErrors: Record<string, string>;
  setFormErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  isAr: boolean;
  organizerId?: string | null;
  orgData: any;
  translateField: (field: string, value: string, targetLang: string) => Promise<string>;
  translateCtx: string;
}

export const IdentityTab = memo(function IdentityTab({
  form, setForm, formErrors, setFormErrors, isAr, organizerId, orgData, translateField, translateCtx,
}: Props) {
  return (
    <div className="space-y-6">
      <SectionHeader icon={Building2} title={isAr ? "معلومات المنظم" : "Organizer Information"} desc={isAr ? "الاسم والوصف والرابط المختصر" : "Name, description & URL slug"} />

      {organizerId && orgData && (
        <Card className="rounded-2xl bg-gradient-to-r from-primary/5 to-transparent border-primary/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {form.logo_url ? (
                <img loading="lazy" decoding="async" src={form.logo_url} alt={form.name || "Organizer logo"} className="h-14 w-14 rounded-2xl object-cover border shadow-sm" />
              ) : (
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-base truncate">{isAr ? (form.name_ar || form.name) : (form.name || form.name_ar)}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {orgData.organizer_number && <span className="text-xs text-muted-foreground font-mono"><Hash className="h-3 w-3 inline" /> {orgData.organizer_number}</span>}
                  {form.city && <span className="text-xs text-muted-foreground"><MapPin className="h-3 w-3 inline" /> {isAr ? (form.city_ar || form.city) : form.city}</span>}
                  {form.founded_year && <span className="text-xs text-muted-foreground"><Calendar className="h-3 w-3 inline" /> {form.founded_year}</span>}
                </div>
              </div>
              <div className="hidden sm:flex gap-2">
                {[
                  { v: orgData.total_exhibitions || 0, l: isAr ? "معارض" : "Events" },
                  { v: (orgData.total_views || 0).toLocaleString(), l: isAr ? "مشاهدات" : "Views" },
                  { v: orgData.follower_count || 0, l: isAr ? "متابعون" : "Followers" },
                ].map(s => (
                  <div key={s.l} className="text-center px-3">
                    <p className="text-sm font-bold">{s.v}</p>
                    <p className="text-xs text-muted-foreground">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <BilingualField
        labelAr="الاسم بالعربية *" labelEn="Name (EN)"
        valueAr={form.name_ar} valueEn={form.name}
        onChangeAr={v => setForm(f => ({ ...f, name_ar: v }))}
        onChangeEn={v => { setForm(f => ({ ...f, name: v })); setFormErrors(e => ({ ...e, name: "" })); }}
        translateField={translateField} context={translateCtx}
        placeholder_ar="اسم المنظم بالعربية" placeholder_en="Organizer name in English"
      />
      {formErrors.name && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{formErrors.name}</p>}

      <FieldGroup label="Slug" hint={form.slug ? `${window.location.origin}/organizers/${form.slug}` : undefined}>
        <div className="flex gap-2">
          <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder={isAr ? "يُولَّد تلقائياً" : "auto-generated"} className="font-mono text-xs flex-1" dir="ltr" />
          {(form.name || form.name_ar) && (
            <Button type="button" variant="ghost" size="icon" className="h-10 w-10 shrink-0 rounded-xl" onClick={() => setForm(f => ({ ...f, slug: generateSlug(f.name || f.name_ar) }))}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </FieldGroup>

      <BilingualField
        labelAr="الوصف بالعربية" labelEn="Description (EN)"
        valueAr={form.description_ar} valueEn={form.description}
        onChangeAr={v => setForm(f => ({ ...f, description_ar: v }))}
        onChangeEn={v => setForm(f => ({ ...f, description: v }))}
        translateField={translateField} context={translateCtx}
        multiline rows={5}
        placeholder_ar="وصف المنظم بالعربية..." placeholder_en="Describe the organizer..."
      />

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{form.description_ar.length} {isAr ? "حرف (عربي)" : "chars (AR)"}</span>
        <span>{form.description.length} {isAr ? "حرف (إنجليزي)" : "chars (EN)"}</span>
      </div>
    </div>
  );
});
