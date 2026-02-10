import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { CountrySelector } from "@/components/auth/CountrySelector";
import { useToast } from "@/hooks/use-toast";
import {
  ChefHat, User, Trophy, ArrowRight, ArrowLeft, Sparkles,
  CheckCircle2, Loader2, GraduationCap, Building2, Hand,
  Heart, Headphones, Eye,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type ExperienceLevel = Database["public"]["Enums"]["experience_level"];
type AppRole = Database["public"]["Enums"]["app_role"];

const ROLES: { value: AppRole; labelEn: string; labelAr: string; icon: React.ReactNode }[] = [
  { value: "chef", labelEn: "Chef", labelAr: "طاهٍ", icon: <ChefHat className="h-5 w-5" /> },
  { value: "judge", labelEn: "Judge", labelAr: "حكم", icon: <Trophy className="h-5 w-5" /> },
  { value: "student", labelEn: "Student", labelAr: "طالب", icon: <GraduationCap className="h-5 w-5" /> },
  { value: "organizer", labelEn: "Organizer", labelAr: "منظم", icon: <Sparkles className="h-5 w-5" /> },
  { value: "volunteer", labelEn: "Volunteer", labelAr: "متطوع", icon: <Hand className="h-5 w-5" /> },
  { value: "sponsor", labelEn: "Sponsor", labelAr: "راعي", icon: <Heart className="h-5 w-5" /> },
  { value: "assistant", labelEn: "Assistant", labelAr: "مساعد", icon: <Headphones className="h-5 w-5" /> },
  { value: "supervisor", labelEn: "Supervisor", labelAr: "مشرف", icon: <Eye className="h-5 w-5" /> },
];

interface OnboardingWizardProps {
  onComplete?: () => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isAr = language === "ar";

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

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

  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>([]);

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const stepMeta = [
    {
      icon: User,
      titleEn: "Welcome!",
      titleAr: "مرحباً بك!",
      descEn: "Let's start with your basic information",
      descAr: "لنبدأ بالمعلومات الأساسية",
    },
    {
      icon: ChefHat,
      titleEn: "Select Your Roles",
      titleAr: "اختر أدوارك",
      descEn: "You can select multiple roles — they determine your permissions",
      descAr: "يمكنك اختيار أكثر من دور — وسيحدد ذلك صلاحياتك",
    },
    {
      icon: Trophy,
      titleEn: "Professional Details",
      titleAr: "التفاصيل المهنية",
      descEn: "Your title, specialization and experience",
      descAr: "لقبك وتخصصك ومستوى خبرتك",
    },
  ];

  const current = stepMeta[step - 1];
  const StepIcon = current.icon;

  const handleRoleToggle = (role: AppRole) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

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
    if (step === 2 && selectedRoles.length === 0) {
      toast({ variant: "destructive", title: isAr ? "يرجى اختيار دور واحد على الأقل" : "Please select at least one role" });
      return false;
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
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name,
          username: form.username.toLowerCase(),
          bio: form.bio,
          specialization: form.specialization,
          experience_level: form.experience_level,
          location: form.location,
          country_code: form.country_code || null,
          nationality: form.nationality || null,
          profile_completed: true,
        })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      // Upsert roles
      if (selectedRoles.length > 0) {
        const roleInserts = selectedRoles.map((role) => ({
          user_id: user.id,
          role,
        }));
        const { error: rolesError } = await supabase
          .from("user_roles")
          .upsert(roleInserts, { onConflict: "user_id,role" });
        if (rolesError) throw rolesError;
      }

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
      onComplete?.();
      navigate("/dashboard");
    } catch (error: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress */}
      <div className="mb-6">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {isAr ? `الخطوة ${step} من ${totalSteps}` : `Step ${step} of ${totalSteps}`}
          </span>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Step Card */}
      <Card>
        <div className="flex flex-col items-center border-b px-5 py-5 text-center">
          <div className="mb-2.5 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <StepIcon className="h-6 w-6 text-primary" />
          </div>
          <h2 className="font-serif text-xl font-bold">
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
                <p className="text-[10px] text-muted-foreground">
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

          {/* Step 2: Select Roles */}
          {step === 2 && (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {ROLES.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => handleRoleToggle(role.value)}
                  className={`flex items-center gap-3 rounded-xl border-2 p-3.5 text-start transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5 active:scale-95 ${
                    selectedRoles.includes(role.value)
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <Checkbox
                    checked={selectedRoles.includes(role.value)}
                    onCheckedChange={() => handleRoleToggle(role.value)}
                    className="pointer-events-none"
                  />
                  <div className="flex items-center gap-2">
                    {role.icon}
                    <span className="text-sm font-medium">
                      {isAr ? role.labelAr : role.labelEn}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 3: Professional Details */}
          {step === 3 && (
            <div className="space-y-4">
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
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "نبذة عنك" : "Bio"}</Label>
                <Textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder={isAr ? "اكتب نبذة مختصرة عن نفسك..." : "Write a short bio about yourself..."}
                  rows={3}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="mt-5 flex justify-between">
        <Button variant="outline" onClick={prevStep} disabled={step === 1} className="gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" />
          {isAr ? "السابق" : "Back"}
        </Button>

        {step < totalSteps ? (
          <Button onClick={nextStep} className="gap-1.5">
            {isAr ? "التالي" : "Next"}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button onClick={handleComplete} disabled={saving} className="gap-1.5">
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" />
            )}
            {saving ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "إكمال" : "Complete")}
          </Button>
        )}
      </div>
    </div>
  );
}
