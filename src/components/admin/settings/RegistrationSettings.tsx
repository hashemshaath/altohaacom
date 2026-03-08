import { useState, useEffect, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Save, UserPlus } from "lucide-react";

interface Props {
  settings: Record<string, any>;
  onSave: (key: string, value: Record<string, any>, category?: string) => void;
  isPending: boolean;
}

const REGISTRATION_TOGGLES = [
  {
    key: "allowRegistration",
    en: "Allow Registration",
    ar: "السماح بالتسجيل",
    descEn: "Allow new users to register",
    descAr: "السماح للمستخدمين الجدد بالتسجيل",
    defaultValue: true,
  },
  {
    key: "requireEmailVerification",
    en: "Email Verification",
    ar: "التحقق من البريد",
    descEn: "Require email verification before login",
    descAr: "طلب التحقق من البريد الإلكتروني قبل الدخول",
    defaultValue: true,
  },
  {
    key: "enableSocialLogin",
    en: "Social Login",
    ar: "تسجيل اجتماعي",
    descEn: "Allow login via Google",
    descAr: "السماح بتسجيل الدخول عبر جوجل",
    defaultValue: true,
  },
  {
    key: "maintenanceMode",
    en: "Maintenance Mode",
    ar: "وضع الصيانة",
    descEn: "Temporarily disable access for users",
    descAr: "تعطيل الوصول للمستخدمين مؤقتاً",
    defaultValue: false,
  },
];

export const RegistrationSettings = memo(function RegistrationSettings({ settings, onSave, isPending }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const regCfg = settings.registration || {};
  const [reg, setReg] = useState(regCfg);

  useEffect(() => { setReg(regCfg); }, [JSON.stringify(regCfg)]);

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserPlus className="h-4.5 w-4.5 text-primary" />
          {isAr ? "إعدادات التسجيل" : "Registration Settings"}
        </CardTitle>
        <CardDescription className="text-xs">
          {isAr ? "التحكم في تسجيل المستخدمين والوصول للمنصة" : "Control user registration and platform access"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-0">
        {REGISTRATION_TOGGLES.map((item, idx) => (
          <div
            key={item.key}
            className={`flex items-center justify-between py-4 px-1 ${
              idx < REGISTRATION_TOGGLES.length - 1 ? "border-b border-border/40" : ""
            }`}
          >
            <div className="space-y-0.5">
              <p className="text-sm font-semibold">{isAr ? item.ar : item.en}</p>
              <p className="text-xs text-muted-foreground">{isAr ? item.descAr : item.descEn}</p>
            </div>
            <Switch
              checked={reg[item.key] ?? item.defaultValue}
              onCheckedChange={(v) => setReg({ ...reg, [item.key]: v })}
            />
          </div>
        ))}
        <div className="pt-4 flex justify-end">
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => onSave("registration", reg, "security")}
            disabled={isPending}
          >
            <Save className="h-3.5 w-3.5" />
            {isAr ? "حفظ التسجيل" : "Save Registration"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
