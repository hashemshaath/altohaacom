import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Shield, Eye, EyeOff, Save, Lock, Globe, Users, AlertTriangle, CheckCircle2, Phone, Mail, Cake, Briefcase, MapPin, Share2, Award, Trophy, Star, Activity, FileText } from "lucide-react";
import { UserDataExport } from "./UserDataExport";
import { AccountDeletion } from "./AccountDeletion";
import { cn } from "@/lib/utils";

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

interface SectionItem {
  key: string;
  label: string;
  labelAr: string;
  icon: React.ElementType;
  sensitive: boolean;
  description?: string;
  descriptionAr?: string;
}

const PRIVACY_SECTIONS: SectionItem[] = [
  { key: "phone", label: "Phone Number", labelAr: "رقم الهاتف", icon: Phone, sensitive: true, description: "Only visible to you and admins", descriptionAr: "مرئي لك وللمسؤولين فقط" },
  { key: "email", label: "Email Address", labelAr: "البريد الإلكتروني", icon: Mail, sensitive: true, description: "Hidden by default for security", descriptionAr: "مخفي افتراضياً للأمان" },
  { key: "date_of_birth", label: "Date of Birth", labelAr: "تاريخ الميلاد", icon: Cake, sensitive: true, description: "Personal information", descriptionAr: "معلومات شخصية" },
  { key: "bio", label: "Bio", labelAr: "النبذة الشخصية", icon: FileText, sensitive: false },
  { key: "job_title", label: "Job Title", labelAr: "المسمى الوظيفي", icon: Briefcase, sensitive: false },
  { key: "location", label: "Location", labelAr: "الموقع", icon: MapPin, sensitive: false },
  { key: "social_media", label: "Social Media", labelAr: "وسائل التواصل", icon: Share2, sensitive: false },
  { key: "certificates", label: "Certificates", labelAr: "الشهادات", icon: Award, sensitive: false },
  { key: "competitions", label: "Competitions", labelAr: "المسابقات", icon: Trophy, sensitive: false },
  { key: "badges", label: "Badges", labelAr: "الشارات", icon: Star, sensitive: false },
  { key: "activity_timeline", label: "Activity Timeline", labelAr: "سجل النشاط", icon: Activity, sensitive: false },
];

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
  const [hasChanges, setHasChanges] = useState(false);

  const toggle = (key: string) => {
    setVisibility((p) => ({ ...p, [key]: !p[key] }));
    setHasChanges(true);
  };

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
      setHasChanges(false);
      onSaved();
    }
  };

  const visibleCount = Object.values(visibility).filter(Boolean).length;
  const hiddenCount = Object.values(visibility).filter(v => !v).length;
  const sensitiveItems = PRIVACY_SECTIONS.filter(s => s.sensitive);
  const publicItems = PRIVACY_SECTIONS.filter(s => !s.sensitive);

  const visibilityOptions = [
    { value: "public", label: isAr ? "عام" : "Public", desc: isAr ? "مرئي للجميع" : "Visible to everyone", icon: Globe, color: "text-chart-2" },
    { value: "followers_only", label: isAr ? "المتابعون" : "Followers", desc: isAr ? "المتابعون فقط" : "Followers only", icon: Users, color: "text-chart-4" },
    { value: "private", label: isAr ? "خاص" : "Private", desc: isAr ? "أنت فقط" : "Only you", icon: Lock, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Privacy Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/40">
          <CardContent className="flex items-center gap-2 p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-chart-2/10">
              <Eye className="h-4 w-4 text-chart-2" />
            </div>
            <div>
              <p className="text-lg font-bold">{visibleCount}</p>
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{isAr ? "ظاهر" : "Visible"}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardContent className="flex items-center gap-2 p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-chart-4/10">
              <EyeOff className="h-4 w-4 text-chart-4" />
            </div>
            <div>
              <p className="text-lg font-bold">{hiddenCount}</p>
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{isAr ? "مخفي" : "Hidden"}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/40">
          <CardContent className="flex items-center gap-2 p-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold capitalize">{profileVisibility === "public" ? (isAr ? "عام" : "Public") : profileVisibility === "followers_only" ? (isAr ? "متابعون" : "Followers") : (isAr ? "خاص" : "Private")}</p>
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{isAr ? "الملف" : "Profile"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profile Visibility */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-primary" />
            {isAr ? "ظهور الملف الشخصي" : "Profile Visibility"}
          </CardTitle>
          <CardDescription className="text-xs">
            {isAr ? "تحكم بمن يمكنه مشاهدة ملفك الشخصي" : "Control who can see your profile"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {visibilityOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setProfileVisibility(opt.value); setHasChanges(true); }}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-3 transition-all",
                  profileVisibility === opt.value
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border/40 hover:border-border/80 hover:bg-muted/30"
                )}
              >
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                  profileVisibility === opt.value ? "bg-primary/15" : "bg-muted/50"
                )}>
                  <opt.icon className={cn("h-4 w-4", profileVisibility === opt.value ? "text-primary" : "text-muted-foreground")} />
                </div>
                <div className="text-center">
                  <p className="text-xs font-semibold">{opt.label}</p>
                  <p className="text-[9px] text-muted-foreground">{opt.desc}</p>
                </div>
                {profileVisibility === opt.value && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sensitive Information */}
      <Card className="border-chart-4/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-chart-4" />
            {isAr ? "معلومات حساسة" : "Sensitive Information"}
          </CardTitle>
          <CardDescription className="text-xs">
            {isAr ? "هذه المعلومات مخفية افتراضياً لحمايتك" : "These are hidden by default for your protection"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {sensitiveItems.map((s) => (
            <div key={s.key} className={cn(
              "flex items-center justify-between rounded-xl border p-3 transition-colors",
              visibility[s.key] ? "border-chart-4/30 bg-chart-4/5" : "border-border/30"
            )}>
              <div className="flex items-center gap-3">
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", visibility[s.key] ? "bg-chart-4/10" : "bg-muted/50")}>
                  <s.icon className={cn("h-3.5 w-3.5", visibility[s.key] ? "text-chart-4" : "text-muted-foreground")} />
                </div>
                <div>
                  <Label className="text-xs font-semibold cursor-pointer">{isAr ? s.labelAr : s.label}</Label>
                  {(isAr ? s.descriptionAr : s.description) && (
                    <p className="text-[10px] text-muted-foreground">{isAr ? s.descriptionAr : s.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {visibility[s.key] && (
                  <Badge variant="outline" className="text-[8px] px-1.5 py-0 text-chart-4 border-chart-4/30">
                    {isAr ? "ظاهر" : "Visible"}
                  </Badge>
                )}
                <Switch checked={visibility[s.key]} onCheckedChange={() => toggle(s.key)} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Public Sections */}
      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Eye className="h-4 w-4 text-chart-2" />
            {isAr ? "أقسام الملف العام" : "Public Profile Sections"}
          </CardTitle>
          <CardDescription className="text-xs">
            {isAr ? "تحكم بما يظهر في ملفك العام" : "Control what appears on your public profile"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {publicItems.map((s) => (
            <div key={s.key} className={cn(
              "flex items-center justify-between rounded-xl border p-3 transition-colors hover:bg-muted/20",
              visibility[s.key] ? "border-border/30" : "border-border/20 opacity-60"
            )}>
              <div className="flex items-center gap-3">
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", visibility[s.key] ? "bg-primary/10" : "bg-muted/50")}>
                  {visibility[s.key] ? (
                    <s.icon className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
                <Label className="text-xs font-semibold cursor-pointer">{isAr ? s.labelAr : s.label}</Label>
              </div>
              <Switch checked={visibility[s.key]} onCheckedChange={() => toggle(s.key)} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className={cn(
        "sticky bottom-4 z-10 flex justify-end transition-all",
        hasChanges ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
      )}>
        <Button onClick={handleSave} disabled={saving} className="gap-2 shadow-lg rounded-xl px-6">
          <Save className="h-4 w-4" />
          {saving ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ التغييرات" : "Save Changes")}
        </Button>
      </div>

      <Separator className="my-2" />

      {/* Data Management */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          {isAr ? "إدارة البيانات" : "Data Management"}
        </h3>
        <UserDataExport />
        <AccountDeletion />
      </div>
    </div>
  );
}
