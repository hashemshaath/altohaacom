import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, BellOff, X, Smartphone } from "lucide-react";

interface Props {
  exhibitionId: string;
  exhibitionName: string;
  isAr: boolean;
  isFollowing: boolean;
}

export function ExhibitionNotificationPrompt({ exhibitionId, exhibitionName, isAr, isFollowing }: Props) {
  const { user } = useAuth();
  const { isSubscribed, isSupported, isLoading, subscribe, checkSubscription } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (user && isSupported) {
      checkSubscription();
    }
  }, [user, isSupported]);

  // Only show for logged-in followers who haven't enabled push & haven't dismissed
  if (!user || !isFollowing || !isSupported || isSubscribed || dismissed) return null;

  // Check localStorage dismiss
  const dismissKey = `notif_prompt_dismissed_${exhibitionId}`;
  if (typeof window !== "undefined" && localStorage.getItem(dismissKey)) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(dismissKey, "1");
  };

  const handleEnable = async () => {
    const ok = await subscribe();
    if (ok) setDismissed(true);
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-chart-4/5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-500">
      <CardContent className="p-3.5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Bell className="h-5 w-5 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">
              {isAr ? "لا تفوّت تحديثات المعرض! 🔔" : "Don't miss exhibition updates! 🔔"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isAr
                ? "فعّل الإشعارات للحصول على آخر الأخبار والتنبيهات"
                : "Enable push notifications to stay updated on schedule changes and announcements"}
            </p>

            <div className="flex items-center gap-2 mt-3">
              <Button
                size="sm"
                className="h-8 rounded-xl text-xs gap-1.5"
                onClick={handleEnable}
                disabled={isLoading}
              >
                <Smartphone className="h-3.5 w-3.5" />
                {isLoading
                  ? (isAr ? "جارٍ التفعيل..." : "Enabling...")
                  : (isAr ? "تفعيل الإشعارات" : "Enable Notifications")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-xl text-xs text-muted-foreground"
                onClick={handleDismiss}
              >
                {isAr ? "لاحقاً" : "Later"}
              </Button>
            </div>
          </div>

          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 -mt-0.5 -me-1" onClick={handleDismiss}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
