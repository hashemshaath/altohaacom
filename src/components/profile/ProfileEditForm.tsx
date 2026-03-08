import { useState, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Save, Loader2, CheckCircle2 } from "lucide-react";
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

export const ProfileEditForm = memo(function ProfileEditForm({ profile, userId, onSaved }: ProfileEditFormProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const { isFan } = useAccountType();
  const isAr = language === "ar";
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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

  const update = (k: string, v: any) => {
    setForm((p) => ({ ...p, [k]: v }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload: Record<string, any> = {
      full_name: form.full_name || null,
      full_name_ar: form.full_name_ar || null,
      display_name: form.display_name || null,
      display_name_ar: form.display_name_ar || null,
      bio: form.bio || null,
      bio_ar: form.bio_ar || null,
      job_title: form.job_title || null,
      job_title_ar: form.job_title_ar || null,
      specialization: form.specialization || null,
      specialization_ar: form.specialization_ar || null,
      experience_level: form.experience_level || null,
      years_of_experience: form.years_of_experience ? Number(form.years_of_experience) : null,
      location: form.location || null,
      city: form.city || null,
      country_code: form.country_code || null,
      nationality: form.nationality || null,
      second_nationality: form.second_nationality || null,
      show_nationality: form.show_nationality,
      phone: form.phone || null,
      website: form.website || null,
      instagram: form.instagram || null,
      twitter: form.twitter || null,
      facebook: form.facebook || null,
      linkedin: form.linkedin || null,
      youtube: form.youtube || null,
      tiktok: form.tiktok || null,
      snapchat: form.snapchat || null,
      date_of_birth: form.date_of_birth || null,
      gender: form.gender || null,
      preferred_language: form.preferred_language || "ar",
      profile_completed: true,
    };
    const { error } = await supabase.from("profiles").update(payload).eq("user_id", userId);
    setSaving(false);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      setSaved(true);
      toast({ title: isAr ? "تم حفظ الملف الشخصي" : "Profile saved" });
      onSaved();
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <AccountTypeCard />
      <PersonalInfoSection form={form} update={update} isAr={isAr} />
      {!isFan && <ProfessionalInfoSection form={form} update={update} isAr={isAr} />}
      <LocationSection form={form} update={update} isAr={isAr} />
      <SocialMediaSection form={form} update={update} isAr={isAr} />

      <div className="sticky bottom-4 z-20 flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={saving} 
          size="lg"
          className="rounded-2xl shadow-lg shadow-primary/15 hover:shadow-xl hover:shadow-primary/20 transition-all active:scale-95 min-w-[200px] h-12 text-sm font-bold"
        >
          {saving ? (
            <Loader2 className="me-2 h-4 w-4 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="me-2 h-4 w-4" />
          ) : (
            <Save className="me-2 h-4 w-4" />
          )}
          {saving ? (isAr ? "جاري الحفظ..." : "Saving...") : saved ? (isAr ? "تم الحفظ ✓" : "Saved ✓") : (isAr ? "حفظ التغييرات" : "Save Changes")}
        </Button>
      </div>
    </div>
  );
}
