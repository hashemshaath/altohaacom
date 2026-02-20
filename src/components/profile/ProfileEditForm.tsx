import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { CountrySelector } from "@/components/auth/CountrySelector";
import { Save, User, Briefcase, Globe, Heart } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type ExperienceLevel = Database["public"]["Enums"]["experience_level"];

interface ProfileEditFormProps {
  profile: any;
  userId: string;
  onSaved: () => void;
}

export function ProfileEditForm({ profile, userId, onSaved }: ProfileEditFormProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const isAr = language === "ar";
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    full_name: profile?.full_name || "",
    full_name_ar: profile?.full_name_ar || "",
    display_name: profile?.display_name || "",
    display_name_ar: profile?.display_name_ar || "",
    bio: profile?.bio || "",
    bio_ar: profile?.bio_ar || "",
    job_title: profile?.job_title || "",
    job_title_ar: profile?.job_title_ar || "",
    specialization: profile?.specialization || "",
    specialization_ar: profile?.specialization_ar || "",
    experience_level: (profile?.experience_level || "beginner") as ExperienceLevel,
    years_of_experience: profile?.years_of_experience || "",
    location: profile?.location || "",
    city: profile?.city || "",
    country_code: profile?.country_code || "",
    nationality: profile?.nationality || "",
    second_nationality: profile?.second_nationality || "",
    show_nationality: profile?.show_nationality !== false,
    phone: profile?.phone || "",
    website: profile?.website || "",
    instagram: profile?.instagram || "",
    twitter: profile?.twitter || "",
    facebook: profile?.facebook || "",
    linkedin: profile?.linkedin || "",
    youtube: profile?.youtube || "",
    tiktok: profile?.tiktok || "",
    snapchat: profile?.snapchat || "",
    date_of_birth: profile?.date_of_birth || "",
    gender: profile?.gender || "",
    preferred_language: profile?.preferred_language || "ar",
  });

  const update = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      ...form,
      years_of_experience: form.years_of_experience ? Number(form.years_of_experience) : null,
      profile_completed: true,
    }).eq("user_id", userId);
    setSaving(false);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: isAr ? "تم حفظ الملف الشخصي" : "Profile saved" });
      onSaved();
    }
  };

  const GENDERS = [
    { value: "male", en: "Male", ar: "ذكر" },
    { value: "female", en: "Female", ar: "أنثى" },
    { value: "prefer_not_to_say", en: "Prefer not to say", ar: "أفضل عدم التحديد" },
  ];

  return (
    <div className="space-y-6">
      {/* Personal Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4 text-primary" />
            {isAr ? "المعلومات الشخصية" : "Personal Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "الاسم الكامل (إنجليزي)" : "Full Name (English)"}</Label>
              <Input value={form.full_name} onChange={(e) => update("full_name", e.target.value)} dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "الاسم الكامل (عربي)" : "Full Name (Arabic)"}</Label>
              <Input value={form.full_name_ar} onChange={(e) => update("full_name_ar", e.target.value)} dir="rtl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "الاسم المعروض (إنجليزي)" : "Display Name (English)"}</Label>
              <Input value={form.display_name} onChange={(e) => update("display_name", e.target.value)} dir="ltr" placeholder="Chef John" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "الاسم المعروض (عربي)" : "Display Name (Arabic)"}</Label>
              <Input value={form.display_name_ar} onChange={(e) => update("display_name_ar", e.target.value)} dir="rtl" placeholder="الشيف جون" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "تاريخ الميلاد" : "Date of Birth"}</Label>
              <Input type="date" value={form.date_of_birth} onChange={(e) => update("date_of_birth", e.target.value)} dir="ltr" max={new Date().toISOString().split("T")[0]} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "الجنس" : "Gender"}</Label>
              <Select value={form.gender} onValueChange={(v) => update("gender", v)} dir={isAr ? "rtl" : "ltr"}>
                <SelectTrigger><SelectValue placeholder={isAr ? "اختر" : "Select"} /></SelectTrigger>
                <SelectContent>
                  {GENDERS.map((g) => <SelectItem key={g.value} value={g.value}>{isAr ? g.ar : g.en}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "اللغة المفضلة" : "Preferred Language"}</Label>
              <Select value={form.preferred_language} onValueChange={(v) => update("preferred_language", v)} dir={isAr ? "rtl" : "ltr"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">{isAr ? "العربية" : "Arabic"}</SelectItem>
                  <SelectItem value="en">{isAr ? "الإنجليزية" : "English"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "النبذة (إنجليزي)" : "Bio (English)"}</Label>
              <Textarea value={form.bio} onChange={(e) => update("bio", e.target.value)} rows={3} dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "النبذة (عربي)" : "Bio (Arabic)"}</Label>
              <Textarea value={form.bio_ar} onChange={(e) => update("bio_ar", e.target.value)} rows={3} dir="rtl" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Briefcase className="h-4 w-4 text-chart-3" />
            {isAr ? "المعلومات المهنية" : "Professional Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "المسمى الوظيفي (إنجليزي)" : "Job Title (English)"}</Label>
              <Input value={form.job_title} onChange={(e) => update("job_title", e.target.value)} dir="ltr" placeholder="Executive Chef" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "المسمى الوظيفي (عربي)" : "Job Title (Arabic)"}</Label>
              <Input value={form.job_title_ar} onChange={(e) => update("job_title_ar", e.target.value)} dir="rtl" placeholder="الشيف التنفيذي" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "التخصص (إنجليزي)" : "Specialization (English)"}</Label>
              <Input value={form.specialization} onChange={(e) => update("specialization", e.target.value)} dir="ltr" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "التخصص (عربي)" : "Specialization (Arabic)"}</Label>
              <Input value={form.specialization_ar} onChange={(e) => update("specialization_ar", e.target.value)} dir="rtl" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "مستوى الخبرة" : "Experience Level"}</Label>
              <Select value={form.experience_level} onValueChange={(v) => update("experience_level", v)} dir={isAr ? "rtl" : "ltr"}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">{isAr ? "مبتدئ" : "Beginner"}</SelectItem>
                  <SelectItem value="amateur">{isAr ? "هاوي" : "Amateur"}</SelectItem>
                  <SelectItem value="professional">{isAr ? "محترف" : "Professional"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "سنوات الخبرة" : "Years of Experience"}</Label>
              <Input type="number" min="0" max="60" value={form.years_of_experience} onChange={(e) => update("years_of_experience", e.target.value)} dir="ltr" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4 text-chart-5" />
            {isAr ? "الموقع" : "Location"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <CountrySelector value={form.country_code} onChange={(c) => update("country_code", c)} label={isAr ? "بلد الإقامة" : "Country of Residence"} />
            <CountrySelector value={form.nationality} onChange={(c) => update("nationality", c)} label={isAr ? "الجنسية" : "Nationality"} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <CountrySelector value={form.second_nationality} onChange={(c) => update("second_nationality", c)} label={isAr ? "الجنسية الثانية" : "Second Nationality"} />
            <div className="flex items-center gap-3 pt-6">
              <Switch checked={form.show_nationality} onCheckedChange={(v) => update("show_nationality", v)} id="show-nationality" />
              <Label htmlFor="show-nationality" className="text-xs cursor-pointer">
                {isAr ? "إظهار الجنسية في الملف الشخصي" : "Show nationality on profile"}
              </Label>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "المدينة" : "City"}</Label>
              <Input value={form.city} onChange={(e) => update("city", e.target.value)} dir={isAr ? "rtl" : "ltr"} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "العنوان" : "Location"}</Label>
              <Input value={form.location} onChange={(e) => update("location", e.target.value)} dir={isAr ? "rtl" : "ltr"} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{isAr ? "الهاتف" : "Phone"}</Label>
            <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} dir="ltr" />
          </div>
        </CardContent>
      </Card>

      {/* Social Media */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Heart className="h-4 w-4 text-chart-1" />
            {isAr ? "وسائل التواصل الاجتماعي" : "Social Media"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Instagram" value={form.instagram} onChange={(e) => update("instagram", e.target.value)} dir="ltr" />
            <Input placeholder="Twitter / X" value={form.twitter} onChange={(e) => update("twitter", e.target.value)} dir="ltr" />
            <Input placeholder="Facebook" value={form.facebook} onChange={(e) => update("facebook", e.target.value)} dir="ltr" />
            <Input placeholder="LinkedIn" value={form.linkedin} onChange={(e) => update("linkedin", e.target.value)} dir="ltr" />
            <Input placeholder="YouTube" value={form.youtube} onChange={(e) => update("youtube", e.target.value)} dir="ltr" />
            <Input placeholder="TikTok" value={form.tiktok} onChange={(e) => update("tiktok", e.target.value)} dir="ltr" />
            <Input placeholder="Snapchat" value={form.snapchat} onChange={(e) => update("snapchat", e.target.value)} dir="ltr" />
            <Input placeholder={isAr ? "الموقع الإلكتروني" : "Website"} value={form.website} onChange={(e) => update("website", e.target.value)} dir="ltr" />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        <Save className="me-1.5 h-4 w-4" />
        {saving ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ التغييرات" : "Save Changes")}
      </Button>
    </div>
  );
}
