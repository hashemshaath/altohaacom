import { useIsAr } from "@/hooks/useIsAr";
import { useState, useEffect, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSessionManager } from "@/hooks/useSessionManager";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PinSetupDialog } from "./PinSetupDialog";
import { ChangePasswordDialog } from "./ChangePasswordDialog";
import {
  KeyRound, Lock, Smartphone, Trash2, Loader2, Shield, Clock, AlertTriangle,
  Monitor, Globe, LogOut, Activity,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

export const SecuritySettings = memo(function SecuritySettings() {
  const { user } = useAuth();
  const isAr = useIsAr();
  const { toast } = useToast();
  const {
    sessions, loading: sessionsLoading, currentSessionId,
    listSessions, revokeSession, revokeAllSessions,
  } = useSessionManager();

  const [pinStatus, setPinStatus] = useState<{ has_pin: boolean; created_at?: string; is_expired?: boolean; days_until_expiry?: number; is_locked?: boolean } | null>(null);
  const [devices, setDevices] = useState<Array<{ id: string; device_name?: string; last_used_at?: string; browser?: string; os?: string }>>([]);
  const [loadingPin, setLoadingPin] = useState(true);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [disablingPin, setDisablingPin] = useState(false);
  const [removingDevice, setRemovingDevice] = useState<string | null>(null);
  const [revokingSession, setRevokingSession] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [pinSetupOpen, setPinSetupOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const fetchPinStatus = async () => {
    setLoadingPin(true);
    try {
      const { data } = await supabase.functions.invoke("pin-auth", {
        body: { action: "check_pin_status" },
      });
      setPinStatus(data);
    } catch {
      setPinStatus({ has_pin: false });
    } finally {
      setLoadingPin(false);
    }
  };

  const fetchDevices = async () => {
    setLoadingDevices(true);
    try {
      const { data } = await supabase.functions.invoke("pin-auth", {
        body: { action: "list_devices" },
      });
      setDevices(data?.devices || []);
    } catch {
      setDevices([]);
    } finally {
      setLoadingDevices(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      setLoadingPin(true);
      setLoadingDevices(true);
      try {
        const [pinRes, devRes] = await Promise.all([
          supabase.functions.invoke("pin-auth", { body: { action: "check_pin_status" } }),
          supabase.functions.invoke("pin-auth", { body: { action: "list_devices" } }),
        ]);
        if (cancelled) return;
        setPinStatus(pinRes.data ?? { has_pin: false });
        setDevices(devRes.data?.devices || []);
      } catch {
        if (!cancelled) {
          setPinStatus({ has_pin: false });
          setDevices([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingPin(false);
          setLoadingDevices(false);
        }
      }
      listSessions();
    };

    load();
    return () => { cancelled = true; };
  }, [user]);

  const handleDisablePin = async () => {
    setDisablingPin(true);
    try {
      await supabase.functions.invoke("pin-auth", {
        body: { action: "disable_pin" },
      });
      setPinStatus({ has_pin: false });
      toast({ title: isAr ? "تم تعطيل الرمز" : "PIN disabled" });
    } catch {
      toast({ title: isAr ? "حدث خطأ" : "Error occurred", variant: "destructive" });
    } finally {
      setDisablingPin(false);
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    setRemovingDevice(deviceId);
    try {
      await supabase.functions.invoke("pin-auth", {
        body: { action: "remove_device", device_id: deviceId },
      });
      setDevices((prev) => prev.filter((d) => d.id !== deviceId));
      toast({ title: isAr ? "تم إزالة الجهاز" : "Device removed" });
    } catch {
      toast({ title: isAr ? "حدث خطأ" : "Error occurred", variant: "destructive" });
    } finally {
      setRemovingDevice(null);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSession(sessionId);
    try {
      const success = await revokeSession(sessionId);
      toast({
        title: success
          ? (isAr ? "تم إنهاء الجلسة" : "Session revoked")
          : (isAr ? "حدث خطأ" : "Error occurred"),
        variant: success ? "default" : "destructive",
      });
    } finally {
      setRevokingSession(null);
    }
  };

  const handleRevokeAll = async () => {
    setRevokingAll(true);
    try {
      const success = await revokeAllSessions();
      toast({
        title: success
          ? (isAr ? "تم إنهاء جميع الجلسات الأخرى" : "All other sessions revoked")
          : (isAr ? "حدث خطأ" : "Error occurred"),
        variant: success ? "default" : "destructive",
      });
    } finally {
      setRevokingAll(false);
    }
  };

  const getDeviceIcon = (name: string | null) => {
    if (!name) return <Globe className="h-4 w-4" />;
    const lower = name.toLowerCase();
    if (lower.includes("iphone") || lower.includes("android") || lower.includes("mobile"))
      return <Smartphone className="h-4 w-4" />;
    return <Monitor className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Active Sessions Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-primary" />
                {isAr ? "الجلسات النشطة" : "Active Sessions"}
                <Badge variant="secondary" className="text-xs ms-1">
                  {sessions.length}
                </Badge>
              </CardTitle>
              <CardDescription>
                {isAr
                  ? "الأجهزة التي سجلت دخولك منها حالياً"
                  : "Devices where you're currently logged in"}
              </CardDescription>
            </div>
            {sessions.length > 1 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRevokeAll}
                disabled={revokingAll}
              >
                {revokingAll && <Loader2 className="me-1 h-3 w-3 animate-spin" />}
                <LogOut className="me-1 h-3.5 w-3.5" />
                {isAr ? "إنهاء الكل" : "Revoke All"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {sessionsLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              {isAr ? "جارٍ التحميل..." : "Loading..."}
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {isAr ? "لا توجد جلسات نشطة" : "No active sessions"}
            </p>
          ) : (
            <div className="space-y-2">
              {sessions.map((s) => {
                const isCurrent = s.id === currentSessionId;
                return (
                  <div
                    key={s.id}
                    className={`flex items-center justify-between rounded-lg border p-3 ${
                      isCurrent ? "border-primary/30 bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        {getDeviceIcon(s.device_name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">
                            {s.device_name || (isAr ? "جهاز غير معروف" : "Unknown Device")}
                          </p>
                          {isCurrent && (
                            <Badge variant="default" className="text-[12px] px-1.5 py-0">
                              {isAr ? "الحالية" : "Current"}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {s.device_os && <span>{s.device_os}</span>}
                          {s.ip_address && <span>• {s.ip_address}</span>}
                          {s.login_method && (
                            <Badge variant="outline" className="text-[12px] px-1 py-0">
                              {s.login_method}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[12px] text-muted-foreground mt-0.5">
                          {isAr ? "آخر نشاط: " : "Last active: "}
                          {formatDistanceToNow(new Date(s.last_active_at), {
                            addSuffix: true,
                            locale: isAr ? ar : undefined,
                          })}
                        </p>
                      </div>
                    </div>
                    {!isCurrent && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleRevokeSession(s.id)}
                        disabled={revokingSession === s.id}
                      >
                        {revokingSession === s.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <LogOut className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Login PIN Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <KeyRound className="h-5 w-5 text-primary" />
            {isAr ? "رمز الدخول السريع (PIN)" : "Quick Login PIN"}
          </CardTitle>
          <CardDescription>
            {isAr
              ? "استخدم رمزاً مكوناً من 6 أرقام لتسجيل الدخول بسرعة بدلاً من كلمة المرور"
              : "Use a 6-digit PIN for quick login instead of your password"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingPin ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              {isAr ? "جارٍ التحميل..." : "Loading..."}
            </div>
          ) : pinStatus?.has_pin ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{isAr ? "الرمز مفعّل" : "PIN Active"}</span>
                  {pinStatus.is_expired && (
                    <Badge variant="destructive" className="text-xs">
                      {isAr ? "منتهي الصلاحية" : "Expired"}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {pinStatus.is_expired
                    ? (isAr ? "يرجى إعادة التعيين" : "Please reset")
                    : (isAr ? `${pinStatus.days_until_expiry} يوم متبقي` : `${pinStatus.days_until_expiry} days left`)}
                </div>
              </div>
              {pinStatus.is_locked && (
                <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-500/10 rounded-lg px-3 py-2">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {isAr ? "الرمز مقفل مؤقتاً بسبب محاولات فاشلة" : "PIN temporarily locked due to failed attempts"}
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPinSetupOpen(true)}>
                  {isAr ? "إعادة تعيين" : "Reset PIN"}
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={handleDisablePin} disabled={disablingPin}>
                  {disablingPin && <Loader2 className="me-1 h-3 w-3 animate-spin" />}
                  {isAr ? "تعطيل" : "Disable"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {isAr
                  ? "لم يتم إعداد رمز الدخول السريع بعد. قم بإعداده لتسجيل الدخول بسرعة."
                  : "Quick login PIN is not set up yet. Set one up for faster logins."}
              </p>
              <Button size="sm" onClick={() => setPinSetupOpen(true)}>
                <KeyRound className="me-2 h-4 w-4" />
                {isAr ? "إعداد الرمز" : "Set Up PIN"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Password Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="h-5 w-5 text-primary" />
            {isAr ? "كلمة المرور" : "Password"}
          </CardTitle>
          <CardDescription>
            {isAr ? "تغيير كلمة المرور الخاصة بحسابك" : "Change your account password"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" onClick={() => setChangePasswordOpen(true)}>
            <Lock className="me-2 h-4 w-4" />
            {isAr ? "تغيير كلمة المرور" : "Change Password"}
          </Button>
        </CardContent>
      </Card>

      {/* Trusted Devices Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Smartphone className="h-5 w-5 text-primary" />
            {isAr ? "الأجهزة الموثوقة" : "Trusted Devices"}
          </CardTitle>
          <CardDescription>
            {isAr ? "الأجهزة التي يمكنها استخدام رمز الدخول السريع" : "Devices that can use your quick login PIN"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingDevices ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              {isAr ? "جارٍ التحميل..." : "Loading..."}
            </div>
          ) : devices.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {isAr ? "لا توجد أجهزة موثوقة" : "No trusted devices"}
            </p>
          ) : (
            <div className="space-y-2">
              {devices.map((device) => (
                <div key={device.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{device.device_name || (isAr ? "جهاز غير معروف" : "Unknown Device")}</p>
                      <p className="text-xs text-muted-foreground">
                        {isAr ? "آخر استخدام: " : "Last used: "}
                        {new Date(device.last_used_at).toLocaleDateString(isAr ? "ar-SA" : "en-US")}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost" size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleRemoveDevice(device.id)}
                    disabled={removingDevice === device.id}
                  >
                    {removingDevice === device.id
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Trash2 className="h-4 w-4" />}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <PinSetupDialog open={pinSetupOpen} onOpenChange={setPinSetupOpen} onSuccess={() => fetchPinStatus()} />
      <ChangePasswordDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
    </div>
  );
});
