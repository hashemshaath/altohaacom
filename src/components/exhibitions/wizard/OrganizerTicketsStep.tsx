import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, Ticket, Tag, Mail, Phone, Globe, Users, Star, Link, CheckCircle2 } from "lucide-react";
import type { ExhibitionFormData } from "./types";

interface Props {
  data: ExhibitionFormData;
  onChange: (updates: Partial<ExhibitionFormData>) => void;
}

export const ExhibitionOrganizerTicketsStep = memo(function ExhibitionOrganizerTicketsStep({ data, onChange }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: organizers } = useQuery({
    queryKey: ["organizers-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizers")
        .select("id, name, name_ar, email, phone, website, is_verified")
        .eq("status", "active")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const handleOrganizerSelect = (orgId: string) => {
    if (orgId === "manual") {
      onChange({ organizerId: "", organizerName: "", organizerNameAr: "", organizerEmail: "", organizerPhone: "", organizerWebsite: "" });
      return;
    }
    const org = organizers?.find(o => o.id === orgId);
    if (org) {
      onChange({
        organizerId: org.id,
        organizerName: org.name || "",
        organizerNameAr: org.name_ar || "",
        organizerEmail: org.email || "",
        organizerPhone: org.phone || "",
        organizerWebsite: org.website || "",
      });
    }
  };

  const tagList = data.tags ? data.tags.split(",").map(t => t.trim()).filter(Boolean) : [];

  return (
    <div className="space-y-6">
      {/* Organizer */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
              <Building className="h-4 w-4 text-primary" />
            </div>
            {isAr ? "معلومات المنظم" : "Organizer Information"}
          </CardTitle>
          <CardDescription>
            {isAr ? "اختر منظمًا مسجلاً أو أضف البيانات يدوياً" : "Select a registered organizer or enter details manually"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Organizer Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {isAr ? "اختر منظماً مسجلاً" : "Select Registered Organizer"}
            </Label>
            <Select value={data.organizerId || "manual"} onValueChange={handleOrganizerSelect}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder={isAr ? "إدخال يدوي" : "Manual Entry"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">{isAr ? "إدخال يدوي" : "Manual Entry"}</SelectItem>
                {(organizers || []).map(org => (
                  <SelectItem key={org.id} value={org.id}>
                    <span className="flex items-center gap-1.5">
                      {org.name}
                      {org.is_verified && <CheckCircle2 className="h-3 w-3 text-primary" />}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {isAr ? "اسم المنظم (إنجليزي)" : "Organizer Name (EN)"}
              </Label>
              <Input
                value={data.organizerName}
                onChange={(e) => onChange({ organizerName: e.target.value })}
                className="h-11"
                disabled={!!data.organizerId}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {isAr ? "اسم المنظم (عربي)" : "Organizer Name (AR)"}
              </Label>
              <Input
                value={data.organizerNameAr}
                onChange={(e) => onChange({ organizerNameAr: e.target.value })}
                dir="rtl"
                className="h-11"
                disabled={!!data.organizerId}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Mail className="h-3.5 w-3.5" /> {isAr ? "البريد" : "Email"}
              </Label>
              <Input
                type="email"
                value={data.organizerEmail}
                onChange={(e) => onChange({ organizerEmail: e.target.value })}
                className="h-11"
                disabled={!!data.organizerId}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Phone className="h-3.5 w-3.5" /> {isAr ? "الهاتف" : "Phone"}
              </Label>
              <Input
                value={data.organizerPhone}
                onChange={(e) => onChange({ organizerPhone: e.target.value })}
                className="h-11"
                disabled={!!data.organizerId}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Globe className="h-3.5 w-3.5" /> {isAr ? "الموقع" : "Website"}
              </Label>
              <Input
                value={data.organizerWebsite}
                onChange={(e) => onChange({ organizerWebsite: e.target.value })}
                placeholder="https://..."
                className="h-11"
                disabled={!!data.organizerId}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
              <Ticket className="h-4 w-4 text-primary" />
            </div>
            {isAr ? "التذاكر والتسجيل" : "Tickets & Registration"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border p-3">
            <Switch
              checked={data.isFree}
              onCheckedChange={(v) => onChange({ isFree: v })}
            />
            <div>
              <Label className="text-sm font-medium">{isAr ? "دخول مجاني" : "Free Entry"}</Label>
              <p className="text-xs text-muted-foreground">
                {isAr ? "لن يُطلب من الحضور دفع رسوم" : "Attendees won't be charged a fee"}
              </p>
            </div>
          </div>

          {!data.isFree && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {isAr ? "سعر التذكرة (إنجليزي)" : "Ticket Price (EN)"}
                </Label>
                <Input value={data.ticketPrice} onChange={(e) => onChange({ ticketPrice: e.target.value })} placeholder="SAR 50" className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {isAr ? "سعر التذكرة (عربي)" : "Ticket Price (AR)"}
                </Label>
                <Input value={data.ticketPriceAr} onChange={(e) => onChange({ ticketPriceAr: e.target.value })} dir="rtl" placeholder="٥٠ ريال" className="h-11" />
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Users className="h-3.5 w-3.5" /> {isAr ? "الحد الأقصى للحضور" : "Max Attendees"}
              </Label>
              <Input type="number" value={data.maxAttendees} onChange={(e) => onChange({ maxAttendees: e.target.value })} className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Link className="h-3.5 w-3.5" /> {isAr ? "رابط التسجيل" : "Registration URL"}
              </Label>
              <Input value={data.registrationUrl} onChange={(e) => onChange({ registrationUrl: e.target.value })} placeholder="https://..." className="h-11" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {isAr ? "رابط الموقع" : "Website URL"}
            </Label>
            <Input value={data.websiteUrl} onChange={(e) => onChange({ websiteUrl: e.target.value })} placeholder="https://..." className="h-11" />
          </div>
        </CardContent>
      </Card>

      {/* Tags & Audience */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
              <Tag className="h-4 w-4 text-primary" />
            </div>
            {isAr ? "الوسوم والجمهور" : "Tags & Audience"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {isAr ? "الوسوم (مفصولة بفاصلة)" : "Tags (comma-separated)"}
            </Label>
            <Input value={data.tags} onChange={(e) => onChange({ tags: e.target.value })} placeholder="food, beverages, cooking" className="h-11" />
            {tagList.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tagList.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {isAr ? "الجمهور المستهدف" : "Target Audience (comma-separated)"}
            </Label>
            <Input value={data.targetAudience} onChange={(e) => onChange({ targetAudience: e.target.value })} placeholder="Chefs, Restaurant Owners, Students" className="h-11" />
          </div>
          <div className="flex items-center gap-3 rounded-xl border p-3">
            <Switch checked={data.isFeatured} onCheckedChange={(v) => onChange({ isFeatured: v })} />
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-primary" />
              <div>
                <Label className="text-sm font-medium">{isAr ? "فعالية مميزة" : "Featured Event"}</Label>
                <p className="text-xs text-muted-foreground">
                  {isAr ? "ستظهر في أعلى القائمة" : "Will appear at the top of the listing"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
