import { useIsAr } from "@/hooks/useIsAr";
import { useState, memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CountrySelector } from "@/components/auth/CountrySelector";
import { useToast } from "@/hooks/use-toast";
import { StepProgress } from "@/components/ui/step-progress";
import { SuccessCelebration } from "@/components/ui/success-celebration";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ChefHat, User, Trophy, ArrowRight, ArrowLeft,
  CheckCircle2, Loader2, Heart, Camera, Sparkles,
  UtensilsCrossed, Award, Landmark, GraduationCap, Globe,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type ExperienceLevel = Database["public"]["Enums"]["experience_level"];

interface OnboardingWizardProps {
  onComplete?: () => void;
}

const INTERESTS = [
  { key: "competitions", iconEn: "🏆", labelEn: "Competitions", labelAr: "المسابقات" },
  { key: "exhibitions", iconEn: "🏛️", labelEn: "Exhibitions", labelAr: "المعارض" },
  { key: "recipes", iconEn: "🍽️", labelEn: "Recipes", labelAr: "الوصفات" },
  { key: "masterclasses", iconEn: "🎓", labelEn: "Masterclasses", labelAr: "الدورات التدريبية" },
  { key: "mentorship", iconEn: "🤝", labelEn: "Mentorship", labelAr: "الإرشاد المهني" },
  { key: "community", iconEn: "👥", labelEn: "Community", labelAr: "المجتمع" },
  { key: "jobs", iconEn: "💼", labelEn: "Job Opportunities", labelAr: "فرص العمل" },
  { key: "shop", iconEn: "🛍️", labelEn: "Shop & Products", labelAr: "المتجر والمنتجات" },
  { key: "news", iconEn: "📰", labelEn: "Industry News", labelAr: "أخبار المجال" },
  { key: "chefs_table", iconEn: "⭐", labelEn: "Chef's Table", labelAr: "طاولة الشيف" },
];

export const OnboardingWizard = memo(function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { user } = useAuth();
  const isAr = useIsAr();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    full_name: "",
    username: "",
    bio: "",
    specialization: "",
    experience_level: "beginner" as ExperienceLevel,
    location: "",
    country_code: "",
    nationality: "",
    professional_title: "",
    professional_title_ar: "",
  });

  const totalSteps = 4;

  const stepMeta = [
    {
      icon: User,
      titleEn: "Welcome!",
      titleAr: "مرحباً بك!",
      descEn: "Let's start with your basic information",
      descAr: "لنبدأ بالمعلومات الأساسية",
    },
    {
      icon: Trophy,
      titleEn: "Professional Details",
      titleAr: "التفاصيل المهنية",
      descEn: "Your title, specialization and experience",
      descAr: "لقبك وتخصصك ومستوى خبرتك",
    },
    {
      icon: Heart,
      titleEn: "Your Interests",
      titleAr: "اهتماماتك",
      descEn: "Select topics you'd like to explore",
      descAr: "اختر المواضيع التي تهمك",
    },
    {
      icon: Camera,
      titleEn: "Profile Photo & Bio",
      titleAr: "الصورة الشخصية والنبذة",
      descEn: "Add a photo and tell us about yourself",
      descAr: "أضف صورتك الشخصية وأخبرنا عن نفسك",
    },
  ];

  const current = stepMeta[step - 1];
  const StepIcon = current.icon;

  const toggleInterest = useCallback((key: string) => {
    setSelectedInterests((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }, []);

  const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ variant: "destructive", title: isAr ? "الحد الأقصى 2MB" : "Max file size is 2MB" });
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }, [isAr, toast]);

  const validateStep = () => {
    if (step === 1) {
      if (!form.full_name.trim()) {
        toast({ variant: "destructive", title: isAr ? "الاسم مطلوب" : "Name is required" });
        return false;
      }
      if (!form.username.trim() || form.username.length < 3) {
        toast({ variant: "destructive", title: isAr ? "اسم المستخدم يجب أن يكون 3 أحرف على الأقل" : "Username must be at least 3 characters" });
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) setStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleComplete = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Upload avatar if provided
      let avatarUrl: string | null = null;
      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop() || "jpg";
        const path = `${user.id}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, avatarFile, { upsert: true });
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
          avatarUrl = urlData.publicUrl;
        }
      }

      const updateData: Record<string, unknown> = {
        full_name: form.full_name,
        username: form.username.toLowerCase(),
        bio: form.bio,
        specialization: form.specialization,
        experience_level: form.experience_level,
        location: form.location,
        country_code: form.country_code || null,
        nationality: form.nationality || null,
        interests: selectedInterests.length > 0 ? selectedInterests : null,
        profile_completed: true,
      };
      if (avatarUrl) updateData.avatar_url = avatarUrl;

      const { error: profileError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      // Create professional title if provided
      if (form.professional_title.trim()) {
        await supabase.from("user_titles").insert({
          user_id: user.id,
          title_type: "professional",
          title: form.professional_title.trim(),
          title_ar: form.professional_title_ar.trim() || null,
        });
      }

      toast({
        title: isAr ? "تم إكمال الملف الشخصي!" : "Profile completed!",
        description: isAr ? "مرحباً بك في المجتمع" : "Welcome to the community",
      });
      setShowCelebration(true);
    } catch (error: unknown) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <SuccessCelebration
        show={showCelebration}
        variant="confetti"
        title={isAr ? "تم إكمال ملفك! 🎉" : "Profile Complete! 🎉"}
        description={isAr ? "أنت الآن جاهز للبدء" : "You're all set to get started"}
        duration={2500}
        onClose={() => {
          setShowCelebration(false);
          if (onComplete) onComplete();
          else navigate("/dashboard");
        }}
      />

      {/* Step Progress */}
      <div className="mb-6">
        <StepProgress
          steps={stepMeta.map((s) => ({
            label: isAr ? s.titleAr : s.titleEn,
            description: isAr ? s.descAr : s.descEn,
          }))}
          currentStep={step - 1}
        />
      </div>

      {/* Step Card */}
      <Card className="rounded-2xl border-border/15">
        <div className="flex flex-col items-center border-b px-5 py-5 text-center">
          <div className="mb-2.5 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <StepIcon className="h-6 w-6 text-primary" />
          </div>
          <h2 className={`text-xl font-bold ${!isAr ? "font-serif" : ""}`}>
            {isAr ? current.titleAr : current.titleEn}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isAr ? current.descAr : current.descEn}
          </p>
        </div>

        <CardContent className="p-5 md:p-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "الاسم الكامل" : "Full Name"} *</Label>
                <Input
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder={isAr ? "أدخل اسمك الكامل" : "Enter your full name"}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "اسم المستخدم" : "Username"} *</Label>
                <Input
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value.replace(/[^a-zA-Z0-9_]/g, "") })}
                  placeholder={isAr ? "اختر اسم مستخدم" : "Choose a username"}
                />
                <p className="text-xs text-muted-foreground">
                  {isAr ? "أحرف إنجليزية وأرقام وشرطة سفلية فقط" : "Letters, numbers and underscores only"}
                </p>
              </div>
              <CountrySelector
                value={form.country_code}
                onChange={(code) => setForm({ ...form, country_code: code })}
                label={isAr ? "دولة الإقامة" : "Country of Residence"}
              />
              <CountrySelector
                value={form.nationality}
                onChange={(code) => setForm({ ...form, nationality: code })}
                label={isAr ? "الجنسية" : "Nationality"}
              />
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "المدينة" : "City"}</Label>
                <Input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder={isAr ? "المدينة" : "City"}
                />
              </div>
            </div>
          )}

          {/* Step 2: Professional Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">
                <p className="font-medium text-primary">
                  {isAr ? "💡 ترقية الدور" : "💡 Role Upgrade"}
                </p>
                <p className="mt-1 text-muted-foreground">
                  {isAr
                    ? "يمكنك طلب ترقية دورك (حكم، منظم، راعي...) بعد إكمال ملفك الشخصي من خلال إعدادات حسابك."
                    : "You can request a role upgrade (Judge, Organizer, Sponsor...) after completing your profile from your account settings."}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "اللقب المهني" : "Professional Title"}</Label>
                <Input
                  value={form.professional_title}
                  onChange={(e) => setForm({ ...form, professional_title: e.target.value })}
                  placeholder={isAr ? "مثال: شيف تنفيذي، مدرب طهي" : "e.g., Executive Chef, Culinary Instructor"}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "اللقب المهني (عربي)" : "Professional Title (Arabic)"}</Label>
                <Input
                  value={form.professional_title_ar}
                  onChange={(e) => setForm({ ...form, professional_title_ar: e.target.value })}
                  placeholder={isAr ? "اللقب بالعربية" : "Title in Arabic"}
                  dir="rtl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "التخصص" : "Specialization"}</Label>
                <Input
                  value={form.specialization}
                  onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                  placeholder={isAr ? "مثال: المطبخ الإيطالي، الحلويات" : "e.g., Italian Cuisine, Pastry"}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "مستوى الخبرة" : "Experience Level"}</Label>
                <Select
                  value={form.experience_level}
                  onValueChange={(v) => setForm({ ...form, experience_level: v as ExperienceLevel })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">{isAr ? "مبتدئ" : "Beginner"}</SelectItem>
                    <SelectItem value="amateur">{isAr ? "هاوٍ" : "Amateur"}</SelectItem>
                    <SelectItem value="professional">{isAr ? "محترف" : "Professional"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 3: Interests */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                {isAr
                  ? "اختر 3 اهتمامات على الأقل لتخصيص تجربتك"
                  : "Select at least 3 interests to personalize your experience"}
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {INTERESTS.map((interest) => {
                  const isSelected = selectedInterests.includes(interest.key);
                  return (
                    <button
                      key={interest.key}
                      type="button"
                      onClick={() => toggleInterest(interest.key)}
                      className={`flex items-center gap-2.5 rounded-xl border p-3 text-start transition-all active:scale-[0.98] ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-sm"
                          : "border-border/15 hover:border-border/30 hover:bg-muted/5"
                      }`}
                    >
                      <span className="text-lg">{interest.iconEn}</span>
                      <span className={`text-xs font-medium ${isSelected ? "text-primary" : "text-foreground"}`}>
                        {isAr ? interest.labelAr : interest.labelEn}
                      </span>
                      {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-primary ms-auto shrink-0" />}
                    </button>
                  );
                })}
              </div>
              <p className="text-center text-xs text-muted-foreground/50">
                {selectedInterests.length} / {INTERESTS.length} {isAr ? "محدد" : "selected"}
              </p>
            </div>
          )}

          {/* Step 4: Avatar & Bio */}
          {step === 4 && (
            <div className="space-y-5">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative group">
                  <Avatar className="h-24 w-24 border-2 border-border/15">
                    {avatarPreview ? (
                      <AvatarImage src={avatarPreview} />
                    ) : null}
                    <AvatarFallback className="text-2xl bg-primary/5 text-primary">
                      {form.full_name?.[0]?.toUpperCase() || <Camera className="h-8 w-8" />}
                    </AvatarFallback>
                  </Avatar>
                  <label
                    htmlFor="avatar-upload"
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Camera className="h-5 w-5 text-primary-foreground" />
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => document.getElementById("avatar-upload")?.click()}
                  className="text-xs text-primary hover:underline"
                >
                  {isAr ? "اختر صورة شخصية" : "Choose a profile photo"}
                </button>
              </div>

              {/* Bio */}
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "نبذة عنك" : "Bio"}</Label>
                <Textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder={isAr ? "اكتب نبذة مختصرة عن نفسك..." : "Write a short bio about yourself..."}
                  rows={3}
                  maxLength={300}
                />
                <p className="text-xs text-muted-foreground/50 text-end">{form.bio.length}/300</p>
              </div>

              {/* Summary */}
              <div className="rounded-xl border border-border/15 bg-muted/5 p-4 space-y-2">
                <p className="text-xs font-semibold flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  {isAr ? "ملخص ملفك الشخصي" : "Profile Summary"}
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">{isAr ? "الاسم:" : "Name:"}</span>{" "}
                    <span className="font-medium">{form.full_name || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{isAr ? "المستخدم:" : "Username:"}</span>{" "}
                    <span className="font-medium">@{form.username || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{isAr ? "التخصص:" : "Specialization:"}</span>{" "}
                    <span className="font-medium">{form.specialization || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{isAr ? "الاهتمامات:" : "Interests:"}</span>{" "}
                    <span className="font-medium">{selectedInterests.length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="mt-5 flex justify-between">
        <Button variant="outline" onClick={prevStep} disabled={step === 1} className="gap-1.5 rounded-xl">
          <ArrowLeft className="h-3.5 w-3.5" />
          {isAr ? "السابق" : "Back"}
        </Button>

        {step < totalSteps ? (
          <Button onClick={nextStep} className="gap-1.5 rounded-xl">
            {isAr ? "التالي" : "Next"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button onClick={handleComplete} disabled={saving} className="gap-1.5 rounded-xl">
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            {saving ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "إكمال" : "Complete")}
          </Button>
        )}
      </div>

      {/* Skip option for optional steps */}
      {(step === 3 || step === 4) && (
        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={() => step < totalSteps ? nextStep() : handleComplete()}
            className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          >
            {isAr ? "تخطي هذه الخطوة" : "Skip this step"}
          </button>
        </div>
      )}
    </div>
  );
});
