import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { PersonalInfoSection } from "./edit/PersonalInfoSection";
import { ProfessionalInfoSection } from "./edit/ProfessionalInfoSection";
import { LocationSection } from "./edit/LocationSection";
import { SocialMediaSection } from "./edit/SocialMediaSection";
import { useAccountType } from "@/hooks/useAccountType";
import { AccountTypeCard } from "./AccountTypeCard";

type ExperienceLevel = Database["public"]["Enums"]["experience_level"];

interface ProfileEditFormProps {
  profile: any;
  userId: string;
  onSaved: () => void;
}

export function ProfileEditForm({ profile, userId, onSaved }: ProfileEditFormProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const { isFan } = useAccountType();
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
    // Clean empty strings to null for nullable DB fields to avoid type errors
    const cleanedForm = { ...form };
    const nullableFields = [
      "date_of_birth", "gender", "country_code", "nationality", "second_nationality",
      "city", "location", "phone", "website", "instagram", "twitter", "facebook",
      "linkedin", "youtube", "tiktok", "snapchat", "bio", "bio_ar",
      "job_title", "job_title_ar", "specialization", "specialization_ar",
    ];
    for (const key of nullableFields) {
      if (cleanedForm[key] === "") cleanedForm[key] = null;
    }
    const { error } = await supabase.from("profiles").update({
      ...cleanedForm,
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

  return (
    <div className="space-y-6">
      <AccountTypeCard />
      <PersonalInfoSection form={form} update={update} isAr={isAr} />
      {!isFan && <ProfessionalInfoSection form={form} update={update} isAr={isAr} />}
      <LocationSection form={form} update={update} isAr={isAr} />
      <SocialMediaSection form={form} update={update} isAr={isAr} />

      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        <Save className="me-1.5 h-4 w-4" />
        {saving ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ التغييرات" : "Save Changes")}
      </Button>
    </div>
  );
}
