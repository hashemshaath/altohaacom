import { useState, useEffect, useCallback, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Trophy, Star, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AchievementEvent {
  type: "challenge" | "badge";
  points?: number;
  badge?: string;
  action?: string;
}

export function AchievementCelebration() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [event, setEvent] = useState<AchievementEvent | null>(null);
  const [visible, setVisible] = useState(false);

  const handleEvent = useCallback((e: Event) => {
    const detail = (e as CustomEvent).detail as AchievementEvent;
    setEvent(detail);
    setVisible(true);

    // Auto-dismiss after 5s
    setTimeout(() => setVisible(false), 5000);
  }, []);

  useEffect(() => {
    window.addEventListener("achievement-unlocked", handleEvent);
    return () => window.removeEventListener("achievement-unlocked", handleEvent);
  }, [handleEvent]);

  if (!visible || !event) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm animate-fade-in pointer-events-auto" onClick={() => setVisible(false)} />
      
      {/* Celebration card */}
      <div className="relative pointer-events-auto animate-scale-in z-10 mx-4 max-w-sm w-full">
        <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-card shadow-2xl shadow-primary/10">
          {/* Decorative particles */}
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="absolute h-1.5 w-1.5 rounded-full bg-primary/40 animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1.5 + Math.random()}s`,
                }}
              />
            ))}
          </div>

          {/* Glow effect */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full bg-primary/20 blur-[60px]" />

          <div className="relative p-6 text-center space-y-4">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 end-2 h-7 w-7 rounded-full"
              onClick={() => setVisible(false)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>

            {/* Icon */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-4 ring-primary/10 animate-pulse">
                  <Trophy className="h-10 w-10 text-primary" />
                </div>
                <div className="absolute -top-1 -end-1 h-6 w-6 rounded-full bg-chart-3 flex items-center justify-center animate-bounce">
                  <Star className="h-3.5 w-3.5 text-chart-3-foreground" />
                </div>
              </div>
            </div>

            {/* Title */}
            <div>
              <div className="flex items-center justify-center gap-1.5 text-primary mb-1">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-widest">
                  {isAr ? "إنجاز جديد!" : "Achievement Unlocked!"}
                </span>
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className="text-lg font-bold">
                {event.badge || (isAr ? "تحدي مكتمل" : "Challenge Complete")}
              </h3>
            </div>

            {/* Points */}
            {event.points && (
              <div className="inline-flex items-center gap-2 rounded-2xl bg-primary/10 px-4 py-2">
                <Star className="h-4 w-4 text-primary" />
                <span className="text-xl font-bold text-primary">+{event.points}</span>
                <span className="text-xs text-muted-foreground">{isAr ? "نقطة" : "points"}</span>
              </div>
            )}

            {/* Action label */}
            {event.action && (
              <p className="text-xs text-muted-foreground">
                {isAr ? `الإجراء: ${event.action}` : `Action: ${event.action}`}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
