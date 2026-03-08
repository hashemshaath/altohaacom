import { useState, useEffect, useRef, useCallback, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, RotateCcw, Timer, Bell } from "lucide-react";
import { toast } from "sonner";

interface CookingTimerProps {
  prepMinutes?: number;
  cookMinutes?: number;
  recipeName?: string;
}

type TimerPhase = "prep" | "cook";

export const CookingTimer = memo(function CookingTimer({ prepMinutes, cookMinutes, recipeName }: CookingTimerProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const hasPrep = !!prepMinutes && prepMinutes > 0;
  const hasCook = !!cookMinutes && cookMinutes > 0;
  const defaultPhase: TimerPhase = hasPrep ? "prep" : "cook";
  const defaultSeconds = ((hasPrep ? prepMinutes : cookMinutes) || 0) * 60;

  const [phase, setPhase] = useState<TimerPhase>(defaultPhase);
  const [secondsLeft, setSecondsLeft] = useState(defaultSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(defaultSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const switchPhase = useCallback((p: TimerPhase) => {
    const mins = p === "prep" ? prepMinutes : cookMinutes;
    setPhase(p);
    setSecondsLeft((mins || 0) * 60);
    setTotalSeconds((mins || 0) * 60);
    setIsRunning(false);
  }, [prepMinutes, cookMinutes]);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          // Notify
          const phaseLabel = phase === "prep"
            ? (isAr ? "التحضير" : "Prep")
            : (isAr ? "الطبخ" : "Cooking");
          toast.success(
            isAr
              ? `⏰ انتهى وقت ${phaseLabel}!`
              : `⏰ ${phaseLabel} time is up!`
          );
          // Play sound
          try {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            osc.frequency.value = 880;
            osc.connect(ctx.destination);
            osc.start();
            setTimeout(() => { osc.stop(); ctx.close(); }, 500);
          } catch {}

          // Auto-switch to cook phase if prep done
          if (phase === "prep" && hasCook) {
            setTimeout(() => switchPhase("cook"), 1000);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, phase, hasCook, isAr, switchPhase]);

  if (!hasPrep && !hasCook) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;

  const reset = () => {
    const mins = phase === "prep" ? prepMinutes : cookMinutes;
    setSecondsLeft((mins || 0) * 60);
    setIsRunning(false);
  };

  return (
    <Card className="border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">{isAr ? "مؤقت الطبخ" : "Cooking Timer"}</span>
          </div>
          <div className="flex gap-1">
            {hasPrep && (
              <Badge
                variant={phase === "prep" ? "default" : "outline"}
                className="text-[10px] cursor-pointer"
                onClick={() => switchPhase("prep")}
              >
                {isAr ? "تحضير" : "Prep"}
              </Badge>
            )}
            {hasCook && (
              <Badge
                variant={phase === "cook" ? "default" : "outline"}
                className="text-[10px] cursor-pointer"
                onClick={() => switchPhase("cook")}
              >
                {isAr ? "طبخ" : "Cook"}
              </Badge>
            )}
          </div>
        </div>

        <div className="text-center mb-3">
          <p className="text-4xl font-mono font-bold tabular-nums">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </p>
        </div>

        <Progress value={progress} className="h-1.5 mb-3" />

        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={reset}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            className="h-11 w-11 rounded-full"
            onClick={() => setIsRunning(!isRunning)}
          >
            {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});
