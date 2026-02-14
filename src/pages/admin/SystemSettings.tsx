import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings, 
  Globe, 
  Bell, 
  Shield, 
  Mail, 
  Palette,
  Save,
  RefreshCw,
} from "lucide-react";

export default function SystemSettings() {
  const { language } = useLanguage();
  const { toast } = useToast();

  const [settings, setSettings] = useState({
    // General
    siteName: "Altohaa",
    siteDescription: "Culinary Competition Platform",
    maintenanceMode: false,
    
    // Registration
    allowRegistration: true,
    requireEmailVerification: true,
    defaultMembershipTier: "basic",
    
    // Notifications
    emailNotifications: true,
    pushNotifications: false,
    smsNotifications: false,
    
    // Security
    requireStrongPasswords: true,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
    
    // Content
    autoApproveContent: false,
    maxUploadSize: 10,
  });

  const handleSave = () => {
    // In a real app, this would save to database
    toast({
      title: language === "ar" ? "تم حفظ الإعدادات" : "Settings saved",
      description: language === "ar" ? "تم تحديث إعدادات النظام بنجاح" : "System settings have been updated successfully",
    });
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <Card className="overflow-hidden border-border/50 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="flex items-center justify-between p-5 md:p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold">
                {language === "ar" ? "إعدادات النظام" : "System Settings"}
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {language === "ar" ? "تكوين إعدادات المنصة والأمان" : "Configure platform and security settings"}
              </p>
            </div>
          </div>
          <Button onClick={handleSave} className="gap-2">
            <Save className="h-4 w-4" />
            {language === "ar" ? "حفظ التغييرات" : "Save Changes"}
          </Button>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* General Settings */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              {language === "ar" ? "الإعدادات العامة" : "General Settings"}
            </CardTitle>
            <CardDescription>
              {language === "ar" ? "إعدادات الموقع الأساسية" : "Basic site configuration"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{language === "ar" ? "اسم الموقع" : "Site Name"}</Label>
              <Input
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{language === "ar" ? "وصف الموقع" : "Site Description"}</Label>
              <Input
                value={settings.siteDescription}
                onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{language === "ar" ? "وضع الصيانة" : "Maintenance Mode"}</p>
                <p className="text-sm text-muted-foreground">
                  {language === "ar" ? "تعطيل الوصول للمستخدمين مؤقتاً" : "Temporarily disable user access"}
                </p>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Registration Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              {language === "ar" ? "إعدادات التسجيل" : "Registration Settings"}
            </CardTitle>
            <CardDescription>
              {language === "ar" ? "التحكم في تسجيل المستخدمين الجدد" : "Control new user registration"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{language === "ar" ? "السماح بالتسجيل" : "Allow Registration"}</p>
                <p className="text-sm text-muted-foreground">
                  {language === "ar" ? "السماح للمستخدمين الجدد بالتسجيل" : "Allow new users to register"}
                </p>
              </div>
              <Switch
                checked={settings.allowRegistration}
                onCheckedChange={(checked) => setSettings({ ...settings, allowRegistration: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{language === "ar" ? "التحقق من البريد" : "Email Verification"}</p>
                <p className="text-sm text-muted-foreground">
                  {language === "ar" ? "طلب التحقق من البريد الإلكتروني" : "Require email verification"}
                </p>
              </div>
              <Switch
                checked={settings.requireEmailVerification}
                onCheckedChange={(checked) => setSettings({ ...settings, requireEmailVerification: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              {language === "ar" ? "إعدادات الإشعارات" : "Notification Settings"}
            </CardTitle>
            <CardDescription>
              {language === "ar" ? "قنوات الإشعارات المتاحة" : "Available notification channels"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{language === "ar" ? "إشعارات البريد" : "Email Notifications"}</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{language === "ar" ? "إشعارات الدفع" : "Push Notifications"}</p>
              </div>
              <Switch
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, pushNotifications: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{language === "ar" ? "إشعارات SMS" : "SMS Notifications"}</p>
              </div>
              <Switch
                checked={settings.smsNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, smsNotifications: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              {language === "ar" ? "إعدادات الأمان" : "Security Settings"}
            </CardTitle>
            <CardDescription>
              {language === "ar" ? "إعدادات الأمان والحماية" : "Security and protection settings"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{language === "ar" ? "كلمات مرور قوية" : "Strong Passwords"}</p>
                <p className="text-sm text-muted-foreground">
                  {language === "ar" ? "طلب كلمات مرور قوية" : "Require strong passwords"}
                </p>
              </div>
              <Switch
                checked={settings.requireStrongPasswords}
                onCheckedChange={(checked) => setSettings({ ...settings, requireStrongPasswords: checked })}
              />
            </div>
            <div className="space-y-2">
              <Label>{language === "ar" ? "مهلة الجلسة (دقائق)" : "Session Timeout (minutes)"}</Label>
              <Input
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label>{language === "ar" ? "محاولات تسجيل الدخول القصوى" : "Max Login Attempts"}</Label>
              <Input
                type="number"
                value={settings.maxLoginAttempts}
                onChange={(e) => setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Content Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              {language === "ar" ? "إعدادات المحتوى" : "Content Settings"}
            </CardTitle>
            <CardDescription>
              {language === "ar" ? "إعدادات إدارة المحتوى" : "Content management settings"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">{language === "ar" ? "الموافقة التلقائية" : "Auto-Approve Content"}</p>
                  <p className="text-sm text-muted-foreground">
                    {language === "ar" ? "الموافقة على المحتوى تلقائياً" : "Automatically approve new content"}
                  </p>
                </div>
                <Switch
                  checked={settings.autoApproveContent}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoApproveContent: checked })}
                />
              </div>
              <div className="space-y-2 rounded-lg border p-4">
                <Label>{language === "ar" ? "الحد الأقصى لحجم الرفع (MB)" : "Max Upload Size (MB)"}</Label>
                <Input
                  type="number"
                  value={settings.maxUploadSize}
                  onChange={(e) => setSettings({ ...settings, maxUploadSize: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
