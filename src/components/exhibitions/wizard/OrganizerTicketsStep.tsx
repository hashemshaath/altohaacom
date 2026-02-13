import { useLanguage } from "@/i18n/LanguageContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Ticket, Tag } from "lucide-react";
import type { ExhibitionFormData } from "./types";

interface Props {
  data: ExhibitionFormData;
  onChange: (updates: Partial<ExhibitionFormData>) => void;
}

export function ExhibitionOrganizerTicketsStep({ data, onChange }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            {isAr ? "معلومات المنظم" : "Organizer Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>{isAr ? "اسم المنظم (إنجليزي)" : "Organizer Name (EN)"}</Label>
              <Input
                value={data.organizerName}
                onChange={(e) => onChange({ organizerName: e.target.value })}
              />
            </div>
            <div>
              <Label>{isAr ? "اسم المنظم (عربي)" : "Organizer Name (AR)"}</Label>
              <Input
                value={data.organizerNameAr}
                onChange={(e) => onChange({ organizerNameAr: e.target.value })}
                dir="rtl"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>{isAr ? "البريد الإلكتروني" : "Email"}</Label>
              <Input
                type="email"
                value={data.organizerEmail}
                onChange={(e) => onChange({ organizerEmail: e.target.value })}
              />
            </div>
            <div>
              <Label>{isAr ? "الهاتف" : "Phone"}</Label>
              <Input
                value={data.organizerPhone}
                onChange={(e) => onChange({ organizerPhone: e.target.value })}
              />
            </div>
            <div>
              <Label>{isAr ? "الموقع الإلكتروني" : "Website"}</Label>
              <Input
                value={data.organizerWebsite}
                onChange={(e) => onChange({ organizerWebsite: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            {isAr ? "التذاكر والتسجيل" : "Tickets & Registration"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch
              checked={data.isFree}
              onCheckedChange={(v) => onChange({ isFree: v })}
            />
            <Label>{isAr ? "دخول مجاني" : "Free Entry"}</Label>
          </div>

          {!data.isFree && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>{isAr ? "سعر التذكرة (إنجليزي)" : "Ticket Price (EN)"}</Label>
                <Input
                  value={data.ticketPrice}
                  onChange={(e) => onChange({ ticketPrice: e.target.value })}
                  placeholder="﷼ 50"
                />
              </div>
              <div>
                <Label>{isAr ? "سعر التذكرة (عربي)" : "Ticket Price (AR)"}</Label>
                <Input
                  value={data.ticketPriceAr}
                  onChange={(e) => onChange({ ticketPriceAr: e.target.value })}
                  dir="rtl"
                  placeholder="٥٠ دولار"
                />
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>{isAr ? "الحد الأقصى للحضور" : "Max Attendees"}</Label>
              <Input
                type="number"
                value={data.maxAttendees}
                onChange={(e) => onChange({ maxAttendees: e.target.value })}
              />
            </div>
            <div>
              <Label>{isAr ? "رابط التسجيل" : "Registration URL"}</Label>
              <Input
                value={data.registrationUrl}
                onChange={(e) => onChange({ registrationUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>
          </div>

          <div>
            <Label>{isAr ? "رابط الموقع" : "Website URL"}</Label>
            <Input
              value={data.websiteUrl}
              onChange={(e) => onChange({ websiteUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            {isAr ? "الوسوم والجمهور" : "Tags & Audience"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>{isAr ? "الوسوم (مفصولة بفاصلة)" : "Tags (comma-separated)"}</Label>
            <Input
              value={data.tags}
              onChange={(e) => onChange({ tags: e.target.value })}
              placeholder="food, beverages, cooking"
            />
          </div>
          <div>
            <Label>{isAr ? "الجمهور المستهدف (مفصول بفاصلة)" : "Target Audience (comma-separated)"}</Label>
            <Input
              value={data.targetAudience}
              onChange={(e) => onChange({ targetAudience: e.target.value })}
              placeholder="Chefs, Restaurant Owners, Students"
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={data.isFeatured}
              onCheckedChange={(v) => onChange({ isFeatured: v })}
            />
            <Label>{isAr ? "فعالية مميزة" : "Featured Event"}</Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
