import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  ChefHat, 
  User, 
  Trophy, 
  ArrowRight, 
  ArrowLeft,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type ExperienceLevel = Database["public"]["Enums"]["experience_level"];
type AppRole = Database["public"]["Enums"]["app_role"];

const ROLES: { value: AppRole; labelEn: string; labelAr: string; icon: React.ReactNode }[] = [
  { value: "chef", labelEn: "Chef", labelAr: "طاهٍ", icon: <ChefHat className="h-5 w-5" /> },
  { value: "judge", labelEn: "Judge", labelAr: "حكم", icon: <Trophy className="h-5 w-5" /> },
  { value: "student", labelEn: "Student", labelAr: "طالب", icon: <User className="h-5 w-5" /> },
  { value: "organizer", labelEn: "Organizer", labelAr: "منظم", icon: <Sparkles className="h-5 w-5" /> },
];

interface OnboardingWizardProps {
  onComplete?: () => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    full_name: "",
    username: "",
    bio: "",
    specialization: "",
    experience_level: "beginner" as ExperienceLevel,
    location: "",
  });
  
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>([]);

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const handleRoleToggle = (role: AppRole) => {
    setSelectedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const validateStep = () => {
    if (step === 1) {
      if (!form.full_name.trim()) {
        toast({ variant: "destructive", title: language === "ar" ? "الاسم مطلوب" : "Name is required" });
        return false;
      }
      if (!form.username.trim() || form.username.length < 3) {
        toast({ variant: "destructive", title: language === "ar" ? "اسم المستخدم يجب أن يكون 3 أحرف على الأقل" : "Username must be at least 3 characters" });
        return false;
      }
    }
    if (step === 2 && selectedRoles.length === 0) {
      toast({ variant: "destructive", title: language === "ar" ? "يرجى اختيار دور واحد على الأقل" : "Please select at least one role" });
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleComplete = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name,
          username: form.username.toLowerCase(),
          bio: form.bio,
          specialization: form.specialization,
          experience_level: form.experience_level,
          location: form.location,
          profile_completed: true,
        })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      // Insert roles
      if (selectedRoles.length > 0) {
        const roleInserts = selectedRoles.map(role => ({
          user_id: user.id,
          role,
        }));
        
        const { error: rolesError } = await supabase
          .from("user_roles")
          .upsert(roleInserts, { onConflict: "user_id,role" });

        if (rolesError) throw rolesError;
      }

      toast({
        title: language === "ar" ? "تم إكمال الملف الشخصي!" : "Profile completed!",
        description: language === "ar" ? "مرحباً بك في المجتمع" : "Welcome to the community",
      });

      onComplete?.();
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: language === "ar" ? "خطأ" : "Error",
        description: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-4">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="text-muted-foreground">
            {language === "ar" ? `الخطوة ${step} من ${totalSteps}` : `Step ${step} of ${totalSteps}`}
          </span>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <User className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-serif text-2xl">
              {language === "ar" ? "مرحباً بك!" : "Welcome!"}
            </CardTitle>
            <CardDescription>
              {language === "ar" ? "لنبدأ بالمعلومات الأساسية" : "Let's start with your basic information"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{language === "ar" ? "الاسم الكامل" : "Full Name"} *</Label>
              <Input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder={language === "ar" ? "أدخل اسمك الكامل" : "Enter your full name"}
              />
            </div>
            <div className="space-y-2">
              <Label>{language === "ar" ? "اسم المستخدم" : "Username"} *</Label>
              <Input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value.replace(/[^a-zA-Z0-9_]/g, "") })}
                placeholder={language === "ar" ? "اختر اسم مستخدم" : "Choose a username"}
              />
              <p className="text-xs text-muted-foreground">
                {language === "ar" ? "أحرف إنجليزية وأرقام وشرطة سفلية فقط" : "Letters, numbers and underscores only"}
              </p>
            </div>
            <div className="space-y-2">
              <Label>{language === "ar" ? "الموقع" : "Location"}</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder={language === "ar" ? "المدينة، البلد" : "City, Country"}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Select Roles */}
      {step === 2 && (
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <ChefHat className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-serif text-2xl">
              {language === "ar" ? "اختر أدوارك" : "Select Your Roles"}
            </CardTitle>
            <CardDescription>
              {language === "ar" ? "يمكنك اختيار أكثر من دور" : "You can select multiple roles"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {ROLES.map((role) => (
                <div
                  key={role.value}
                  onClick={() => handleRoleToggle(role.value)}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-4 transition-colors ${
                    selectedRoles.includes(role.value)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <Checkbox
                    checked={selectedRoles.includes(role.value)}
                    onCheckedChange={() => handleRoleToggle(role.value)}
                  />
                  <div className="flex items-center gap-2">
                    {role.icon}
                    <span className="font-medium">
                      {language === "ar" ? role.labelAr : role.labelEn}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Professional Details */}
      {step === 3 && (
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Trophy className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="font-serif text-2xl">
              {language === "ar" ? "التفاصيل المهنية" : "Professional Details"}
            </CardTitle>
            <CardDescription>
              {language === "ar" ? "أخبرنا المزيد عن خبرتك" : "Tell us more about your expertise"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{language === "ar" ? "التخصص" : "Specialization"}</Label>
              <Input
                value={form.specialization}
                onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                placeholder={language === "ar" ? "مثال: المطبخ الإيطالي، الحلويات" : "e.g., Italian Cuisine, Pastry"}
              />
            </div>
            <div className="space-y-2">
              <Label>{language === "ar" ? "مستوى الخبرة" : "Experience Level"}</Label>
              <Select
                value={form.experience_level}
                onValueChange={(v) => setForm({ ...form, experience_level: v as ExperienceLevel })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">{language === "ar" ? "مبتدئ" : "Beginner"}</SelectItem>
                  <SelectItem value="amateur">{language === "ar" ? "هاوٍ" : "Amateur"}</SelectItem>
                  <SelectItem value="professional">{language === "ar" ? "محترف" : "Professional"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{language === "ar" ? "نبذة عنك" : "Bio"}</Label>
              <Textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder={language === "ar" ? "اكتب نبذة مختصرة عن نفسك..." : "Write a short bio about yourself..."}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="mt-6 flex justify-between">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={step === 1}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {language === "ar" ? "السابق" : "Back"}
        </Button>

        {step < totalSteps ? (
          <Button onClick={nextStep} className="gap-2">
            {language === "ar" ? "التالي" : "Next"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleComplete} disabled={saving} className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {saving 
              ? (language === "ar" ? "جاري الحفظ..." : "Saving...") 
              : (language === "ar" ? "إكمال" : "Complete")}
          </Button>
        )}
      </div>
    </div>
  );
}
