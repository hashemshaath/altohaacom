import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Eye, EyeOff, Save, Lock, Globe, Users } from "lucide-react";
import { UserDataExport } from "./UserDataExport";
import { AccountDeletion } from "./AccountDeletion";

interface ProfilePrivacySettingsProps {
  profile: any;
  userId: string;
  onSaved: () => void;
}

const DEFAULT_VISIBILITY: Record<string, boolean> = {
  phone: false,
  email: false,
  bio: true,
  social_media: true,
  certificates: true,
  competitions: true,
  badges: true,
  location: true,
  job_title: true,
  date_of_birth: false,
  activity_timeline: true,
};

export function ProfilePrivacySettings({ profile, userId, onSaved }: ProfilePrivacySettingsProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const isAr = language === "ar";

  const existingVisibility = profile?.section_visibility || {};
  const [visibility, setVisibility] = useState<Record<string, boolean>>({
    ...DEFAULT_VISIBILITY,
    ...existingVisibility,
  });
  const [profileVisibility, setProfileVisibility] = useState<string>(profile?.profile_visibility || "public");
  const [saving, setSaving] = useState(false);

  const toggle = (key: string) => setVisibility((p) => ({ ...p, [key]: !p[key] }));

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      section_visibility: visibility,
      profile_visibility: profileVisibility,
    }).eq("user_id", userId);
    setSaving(false);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: isAr ? "تم حفظ إعدادات الخصوصية" : "Privacy settings saved" });
      onSaved();
    }
  };

  const sections = [
    { key: "phone", label: isAr ? "رقم الهاتف" : "Phone Number", icon: Lock },
    { key: "email", label: isAr ? "البريد الإلكتروني" : "Email", icon: Lock },
    { key: "date_of_birth", label: isAr ? "تاريخ الميلاد" : "Date of Birth", icon: Lock },
    { key: "bio", label: isAr ? "النبذة الشخصية" : "Bio", icon: Eye },
    { key: "job_title", label: isAr ? "المسمى الوظيفي" : "Job Title", icon: Eye },
    { key: "location", label: isAr ? "الموقع" : "Location", icon: Eye },
    { key: "social_media", label: isAr ? "وسائل التواصل" : "Social Media", icon: Eye },
    { key: "certificates", label: isAr ? "الشهادات" : "Certificates", icon: Eye },
    { key: "competitions", label: isAr ? "المسابقات" : "Competitions", icon: Eye },
    { key: "badges", label: isAr ? "الشارات" : "Badges", icon: Eye },
    { key: "activity_timeline", label: isAr ? "سجل النشاط" : "Activity Timeline", icon: Eye },
  ];

  const visibilityOptions = [
    { value: "public", label: isAr ? "عام - مرئي للجميع" : "Public - Visible to everyone", icon: Globe },
    { value: "followers_only", label: isAr ? "المتابعون فقط" : "Followers Only", icon: Users },
    { value: "private", label: isAr ? "خاص - أنت فقط" : "Private - Only you", icon: Lock },
  ];

  return (
    <div className="space-y-6">
      {/* Profile Visibility */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-primary" />
            {isAr ? "ظهور الملف الشخصي" : "Profile Visibility"}
          </CardTitle>
          <CardDescription>
            {isAr ? "تحكم بمن يمكنه مشاهدة ملفك الشخصي" : "Control who can see your profile"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={profileVisibility} onValueChange={setProfileVisibility}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {visibilityOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <span className="flex items-center gap-2">
                    <opt.icon className="h-3.5 w-3.5" />
                    {opt.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Section Visibility */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <EyeOff className="h-4 w-4 text-chart-4" />
            {isAr ? "إظهار/إخفاء الأقسام" : "Show/Hide Sections"}
          </CardTitle>
          <CardDescription>
            {isAr ? "تحكم بما يظهر في ملفك العام" : "Control what appears on your public profile"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sections.map((s) => (
              <div key={s.key} className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent/30">
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${visibility[s.key] ? "bg-primary/10" : "bg-muted"}`}>
                    {visibility[s.key] ? (
                      <Eye className="h-4 w-4 text-primary" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <Label className="text-sm cursor-pointer">{s.label}</Label>
                </div>
                <Switch checked={visibility[s.key]} onCheckedChange={() => toggle(s.key)} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
        <Save className="me-1.5 h-4 w-4" />
        {saving ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ الإعدادات" : "Save Settings")}
      </Button>

      <UserDataExport />
      <AccountDeletion />
    </div>
  );
}
