import { memo, useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Settings2, Clock, ShieldAlert, Bell, RefreshCw, AlertTriangle,
  Save, CheckCircle2, Timer, CalendarClock, Zap, Info, Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface PolicyConfig {
  gracePeriodDays: number;
  autoDowngradeEnabled: boolean;
  autoDowngradeTarget: "basic";
  expiryWarningDays: number[];
  autoRenewalEnabled: boolean;
  trialDurationDays: number;
  trialAutoConvert: boolean;
  suspendAfterGrace: boolean;
  maxRenewalsPerYear: number;
}

const DEFAULT_POLICY: PolicyConfig = {
  gracePeriodDays: 7,
  autoDowngradeEnabled: true,
  autoDowngradeTarget: "basic",
  expiryWarningDays: [14, 7, 3, 1],
  autoRenewalEnabled: false,
  trialDurationDays: 90,
  trialAutoConvert: false,
  suspendAfterGrace: true,
  maxRenewalsPerYear: 12,
};

const SETTINGS_KEY = "membership_policy";

const MembershipPolicySettings = memo(function MembershipPolicySettings() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const { settings, isLoading, saveSetting } = useSiteSettings();
  const [policy, setPolicy] = useState<PolicyConfig>(DEFAULT_POLICY);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Load from DB
  useEffect(() => {
    if (settings && settings[SETTINGS_KEY]) {
      const stored = settings[SETTINGS_KEY] as Record<string, unknown>;
      setPolicy(prev => ({ ...prev, ...stored }));
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSetting.mutateAsync({
        key: SETTINGS_KEY,
        value: policy as Record<string, unknown>,
        category: "membership",
      });
      setDirty(false);
      toast({
        title: isAr ? "✅ تم حفظ الإعدادات" : "✅ Settings saved",
        description: isAr ? "تم تحديث سياسات العضوية بنجاح" : "Membership policies updated successfully",
      });
    } catch {
      toast({ variant: "destructive", title: isAr ? "فشل الحفظ" : "Save failed" });
    } finally {
      setSaving(false);
    }
  };

  const updatePolicy = <K extends keyof PolicyConfig>(key: K, value: PolicyConfig[K]) => {
    setPolicy(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  if (isLoading) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Grace Period & Expiry */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Timer className="h-4 w-4 text-primary" />
            {isAr ? "فترة السماح والانتهاء" : "Grace Period & Expiry"}
          </CardTitle>
          <CardDescription>
            {isAr ? "تحكم في ما يحدث عند انتهاء العضوية" : "Control what happens when memberships expire"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{isAr ? "فترة السماح (أيام)" : "Grace Period (days)"}</Label>
              <Input
                type="number"
                min={0}
                max={30}
                value={policy.gracePeriodDays}
                onChange={e => updatePolicy("gracePeriodDays", parseInt(e.target.value) || 0)}
                className="max-w-[120px]"
              />
              <p className="text-xs text-muted-foreground">
                {isAr ? "المدة التي يحتفظ فيها العضو بالمميزات بعد الانتهاء" : "How long members keep benefits after expiry"}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{isAr ? "مدة الفترة التجريبية (أيام)" : "Trial Duration (days)"}</Label>
              <Input
                type="number"
                min={7}
                max={365}
                value={policy.trialDurationDays}
                onChange={e => updatePolicy("trialDurationDays", parseInt(e.target.value) || 90)}
                className="max-w-[120px]"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">{isAr ? "التخفيض التلقائي" : "Auto-Downgrade"}</Label>
                <p className="text-xs text-muted-foreground">
                  {isAr ? "تخفيض العضوية تلقائياً بعد انتهاء فترة السماح" : "Automatically downgrade after grace period ends"}
                </p>
              </div>
              <Switch
                checked={policy.autoDowngradeEnabled}
                onCheckedChange={v => updatePolicy("autoDowngradeEnabled", v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">{isAr ? "تعليق بعد فترة السماح" : "Suspend After Grace"}</Label>
                <p className="text-xs text-muted-foreground">
                  {isAr ? "تعليق الحساب بدلاً من التخفيض المباشر" : "Suspend account instead of direct downgrade"}
                </p>
              </div>
              <Switch
                checked={policy.suspendAfterGrace}
                onCheckedChange={v => updatePolicy("suspendAfterGrace", v)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">{isAr ? "تحويل تلقائي من التجربة" : "Auto-Convert Trial"}</Label>
                <p className="text-xs text-muted-foreground">
                  {isAr ? "تحويل المستخدمين تلقائياً بعد انتهاء التجربة" : "Auto-convert users when trial ends"}
                </p>
              </div>
              <Switch
                checked={policy.trialAutoConvert}
                onCheckedChange={v => updatePolicy("trialAutoConvert", v)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications & Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4 text-primary" />
            {isAr ? "التنبيهات والإشعارات" : "Alerts & Notifications"}
          </CardTitle>
          <CardDescription>
            {isAr ? "إعدادات تنبيهات الانتهاء والتجديد" : "Expiry and renewal alert settings"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">{isAr ? "أيام التحذير قبل الانتهاء" : "Warning Days Before Expiry"}</Label>
            <div className="flex flex-wrap gap-2">
              {[1, 3, 7, 14, 30].map(day => (
                <Button
                  key={day}
                  variant={policy.expiryWarningDays.includes(day) ? "default" : "outline"}
                  size="sm"
                  className="h-8 px-3 text-xs"
                  onClick={() => {
                    updatePolicy("expiryWarningDays",
                      policy.expiryWarningDays.includes(day)
                        ? policy.expiryWarningDays.filter(d => d !== day)
                        : [...policy.expiryWarningDays, day].sort((a, b) => b - a)
                    );
                  }}
                >
                  {day} {isAr ? "يوم" : "days"}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {isAr ? "سيتم إرسال إشعار ورسالة بريد إلكتروني في كل يوم محدد" : "A notification and email will be sent on each selected day"}
            </p>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">{isAr ? "التجديد التلقائي" : "Auto-Renewal"}</Label>
              <p className="text-xs text-muted-foreground">
                {isAr ? "تجديد العضوية تلقائياً من المحفظة" : "Auto-renew memberships from wallet balance"}
              </p>
            </div>
            <Switch
              checked={policy.autoRenewalEnabled}
              onCheckedChange={v => updatePolicy("autoRenewalEnabled", v)}
            />
          </div>

          {policy.autoRenewalEnabled && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-start gap-2">
              <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                {isAr
                  ? "سيتم خصم مبلغ التجديد تلقائياً من رصيد المحفظة. إذا كان الرصيد غير كافٍ، سيتم إرسال إشعار للعضو."
                  : "Renewal amount will be auto-deducted from wallet balance. If insufficient, the member will be notified."}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-medium">{isAr ? "الحد الأقصى للتجديدات سنوياً" : "Max Renewals Per Year"}</Label>
            <Input
              type="number"
              min={1}
              max={24}
              value={policy.maxRenewalsPerYear}
              onChange={e => updatePolicy("maxRenewalsPerYear", parseInt(e.target.value) || 12)}
              className="max-w-[120px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Policy Summary */}
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
              {isAr ? "ملخص السياسة النشطة" : "Active Policy Summary"}
            </CardTitle>
            {settings?.[SETTINGS_KEY] && (
              <Badge variant="outline" className="gap-1 text-[12px] text-muted-foreground">
                <CheckCircle2 className="h-3 w-3" />
                {isAr ? "آخر حفظ: " : "Last saved: "}
                {new Date().toLocaleDateString(isAr ? "ar-SA" : "en-US")}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border p-3 text-center">
              <p className="text-2xl font-bold text-primary">{policy.gracePeriodDays}</p>
              <p className="text-xs text-muted-foreground">{isAr ? "أيام السماح" : "Grace Days"}</p>
            </div>
            <div className="rounded-xl border p-3 text-center">
              <p className="text-2xl font-bold text-primary">{policy.trialDurationDays}</p>
              <p className="text-xs text-muted-foreground">{isAr ? "أيام التجربة" : "Trial Days"}</p>
            </div>
            <div className="rounded-xl border p-3 text-center">
              <p className="text-2xl font-bold text-primary">{policy.expiryWarningDays.length}</p>
              <p className="text-xs text-muted-foreground">{isAr ? "تنبيهات" : "Alerts"}</p>
            </div>
            <div className="rounded-xl border p-3 text-center">
              <p className="text-2xl font-bold text-primary">{policy.maxRenewalsPerYear}</p>
              <p className="text-xs text-muted-foreground">{isAr ? "تجديد/سنة" : "Renewals/yr"}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {policy.autoDowngradeEnabled && (
              <Badge variant="secondary" className="gap-1"><Zap className="h-3 w-3" />{isAr ? "تخفيض تلقائي" : "Auto-Downgrade"}</Badge>
            )}
            {policy.suspendAfterGrace && (
              <Badge variant="secondary" className="gap-1"><ShieldAlert className="h-3 w-3" />{isAr ? "تعليق بعد السماح" : "Suspend After Grace"}</Badge>
            )}
            {policy.autoRenewalEnabled && (
              <Badge variant="secondary" className="gap-1"><RefreshCw className="h-3 w-3" />{isAr ? "تجديد تلقائي" : "Auto-Renewal"}</Badge>
            )}
            {policy.trialAutoConvert && (
              <Badge variant="secondary" className="gap-1"><CalendarClock className="h-3 w-3" />{isAr ? "تحويل تجريبي" : "Trial Convert"}</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex items-center justify-between">
        {dirty && (
          <Badge variant="outline" className="gap-1 text-chart-4">
            <AlertTriangle className="h-3 w-3" />
            {isAr ? "تغييرات غير محفوظة" : "Unsaved changes"}
          </Badge>
        )}
        <div className="ms-auto" />
        <Button onClick={handleSave} disabled={saving || !dirty} className="gap-2 min-w-[140px]">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : dirty ? <Save className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          {saving ? (isAr ? "جاري الحفظ..." : "Saving...") : dirty ? (isAr ? "حفظ الإعدادات" : "Save Settings") : (isAr ? "محفوظ" : "Saved")}
        </Button>
      </div>
    </div>
  );
});

export default MembershipPolicySettings;
