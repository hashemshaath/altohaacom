import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Shield, Bell, Palette } from "lucide-react";

interface Props {
  settings: Record<string, any>;
  onSave: (key: string, value: Record<string, any>, category?: string) => void;
  isPending: boolean;
}

export function SecurityContentSettings({ settings, onSave, isPending }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const secCfg = settings.security || {};
  const notifCfg = settings.notifications || {};
  const contentCfg = settings.content || {};

  const [sec, setSec] = useState(secCfg);
  const [notif, setNotif] = useState(notifCfg);
  const [content, setContent] = useState(contentCfg);

  useEffect(() => { setSec(secCfg); }, [JSON.stringify(secCfg)]);
  useEffect(() => { setNotif(notifCfg); }, [JSON.stringify(notifCfg)]);
  useEffect(() => { setContent(contentCfg); }, [JSON.stringify(contentCfg)]);

  return (
    <div className="space-y-6">
      {/* Security */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4.5 w-4.5 text-primary" />
            {isAr ? "إعدادات الأمان" : "Security Settings"}
          </CardTitle>
          <CardDescription className="text-xs">
            {isAr ? "كلمات المرور، الجلسات، والحماية من الوصول غير المصرح به" : "Passwords, sessions, and unauthorized access protection"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: "requireStrongPasswords", en: "Strong Passwords", ar: "كلمات مرور قوية", descEn: "Enforce minimum password complexity", descAr: "فرض تعقيد أدنى لكلمات المرور" },
            { key: "enable2FA", en: "Two-Factor Auth", ar: "المصادقة الثنائية", descEn: "Enable optional 2FA for users", descAr: "تمكين المصادقة الثنائية للمستخدمين" },
            { key: "requireEmailVerification", en: "Email Verification", ar: "التحقق من البريد", descEn: "Verify email before allowing login", descAr: "التحقق من البريد قبل السماح بالدخول" },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between rounded-lg border border-border/40 p-3">
              <div>
                <p className="text-sm font-medium">{isAr ? item.ar : item.en}</p>
                <p className="text-[11px] text-muted-foreground">{isAr ? item.descAr : item.descEn}</p>
              </div>
              <Switch checked={sec[item.key] ?? false} onCheckedChange={v => setSec({ ...sec, [item.key]: v })} />
            </div>
          ))}
          <div className="grid gap-4 sm:grid-cols-2 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "مهلة الجلسة (دقائق)" : "Session Timeout (min)"}</Label>
              <Input type="number" value={sec.sessionTimeoutMinutes || 60} onChange={e => setSec({ ...sec, sessionTimeoutMinutes: parseInt(e.target.value) })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "محاولات الدخول القصوى" : "Max Login Attempts"}</Label>
              <Input type="number" value={sec.maxLoginAttempts || 5} onChange={e => setSec({ ...sec, maxLoginAttempts: parseInt(e.target.value) })} />
            </div>
          </div>
          <Button size="sm" className="gap-1.5 mt-2" onClick={() => onSave("security", sec, "security")} disabled={isPending}>
            <Save className="h-3.5 w-3.5" />{isAr ? "حفظ الأمان" : "Save Security"}
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4.5 w-4.5 text-primary" />
            {isAr ? "إعدادات الإشعارات" : "Notification Settings"}
          </CardTitle>
          <CardDescription className="text-xs">
            {isAr ? "قنوات الإشعارات وتردد الملخصات" : "Notification channels and digest frequency"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: "emailNotifications", en: "Email Notifications", ar: "إشعارات البريد" },
            { key: "pushNotifications", en: "Push Notifications", ar: "إشعارات الدفع" },
            { key: "smsNotifications", en: "SMS Notifications", ar: "إشعارات SMS" },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between rounded-lg border border-border/40 p-3">
              <p className="text-sm font-medium">{isAr ? item.ar : item.en}</p>
              <Switch checked={notif[item.key] ?? false} onCheckedChange={v => setNotif({ ...notif, [item.key]: v })} />
            </div>
          ))}
          <div className="space-y-1.5 mt-2">
            <Label className="text-xs">{isAr ? "تردد الملخص" : "Digest Frequency"}</Label>
            <Select value={notif.digestFrequency || "daily"} onValueChange={v => setNotif({ ...notif, digestFrequency: v })}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="realtime">{isAr ? "فوري" : "Real-time"}</SelectItem>
                <SelectItem value="daily">{isAr ? "يومي" : "Daily"}</SelectItem>
                <SelectItem value="weekly">{isAr ? "أسبوعي" : "Weekly"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" className="gap-1.5 mt-2" onClick={() => onSave("notifications", notif, "notifications")} disabled={isPending}>
            <Save className="h-3.5 w-3.5" />{isAr ? "حفظ الإشعارات" : "Save Notifications"}
          </Button>
        </CardContent>
      </Card>

      {/* Content */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4.5 w-4.5 text-primary" />
            {isAr ? "إعدادات المحتوى" : "Content Settings"}
          </CardTitle>
          <CardDescription className="text-xs">
            {isAr ? "الموافقة التلقائية وحدود الرفع والتفاعل" : "Auto-approval, upload limits, and engagement controls"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: "autoApproveContent", en: "Auto-Approve Content", ar: "الموافقة التلقائية", descEn: "Skip moderation for new content", descAr: "تخطي الإشراف على المحتوى الجديد" },
            { key: "enableComments", en: "Enable Comments", ar: "تمكين التعليقات", descEn: "Allow users to comment on content", descAr: "السماح للمستخدمين بالتعليق" },
            { key: "enableReactions", en: "Enable Reactions", ar: "تمكين التفاعلات", descEn: "Allow emoji reactions on posts", descAr: "السماح بالتفاعلات على المنشورات" },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between rounded-lg border border-border/40 p-3">
              <div>
                <p className="text-sm font-medium">{isAr ? item.ar : item.en}</p>
                <p className="text-[11px] text-muted-foreground">{isAr ? item.descAr : item.descEn}</p>
              </div>
              <Switch checked={content[item.key] ?? false} onCheckedChange={v => setContent({ ...content, [item.key]: v })} />
            </div>
          ))}
          <div className="grid gap-4 sm:grid-cols-2 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "حجم الرفع الأقصى (MB)" : "Max Upload Size (MB)"}</Label>
              <Input type="number" value={content.maxUploadSizeMB || 10} onChange={e => setContent({ ...content, maxUploadSizeMB: parseInt(e.target.value) })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isAr ? "مستوى الإشراف" : "Moderation Level"}</Label>
              <Select value={content.moderationLevel || "standard"} onValueChange={v => setContent({ ...content, moderationLevel: v })}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="relaxed">{isAr ? "مرن" : "Relaxed"}</SelectItem>
                  <SelectItem value="standard">{isAr ? "قياسي" : "Standard"}</SelectItem>
                  <SelectItem value="strict">{isAr ? "صارم" : "Strict"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button size="sm" className="gap-1.5 mt-2" onClick={() => onSave("content", content, "content")} disabled={isPending}>
            <Save className="h-3.5 w-3.5" />{isAr ? "حفظ المحتوى" : "Save Content"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
