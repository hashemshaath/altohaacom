import { useState, useEffect, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLoginStreak } from "@/hooks/useLoginStreak";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Flame, Trophy, Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const LAST_SEEN_KEY = "altoha_last_active";
const REENGAGEMENT_COOLDOWN = 3 * 24 * 60 * 60 * 1000; // 3 days

/**
 * Shows a welcome-back modal when a user returns after 3+ days of inactivity.
 */
export const ReEngagementPrompt = memo(function ReEngagementPrompt() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const navigate = useNavigate();
  const { currentStreak } = useLoginStreak();
  const [open, setOpen] = useState(false);
  const [daysAway, setDaysAway] = useState(0);

  useEffect(() => {
    if (!user) return;

    const lastSeen = localStorage.getItem(LAST_SEEN_KEY);
    const now = Date.now();

    if (lastSeen) {
      const elapsed = now - parseInt(lastSeen);
      if (elapsed > REENGAGEMENT_COOLDOWN) {
        setDaysAway(Math.floor(elapsed / (24 * 60 * 60 * 1000)));
        // Small delay to not flash on page load
        setTimeout(() => setOpen(true), 1500);
      }
    }

    localStorage.setItem(LAST_SEEN_KEY, now.toString());
  }, [user?.id]);

  const handleExplore = () => {
    setOpen(false);
    navigate("/competitions");
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-sm rounded-2xl [&>button]:hidden">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-chart-4/20 mb-3">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-xl">
            {isAr ? "أهلاً بعودتك! 👋" : "Welcome Back! 👋"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            {isAr
              ? `لقد مضت ${daysAway} أيام منذ آخر زيارة. اكتشف ما هو جديد!`
              : `It's been ${daysAway} days since your last visit. See what's new!`}
          </p>

          {/* Streak recovery prompt */}
          <div className="rounded-xl border border-chart-4/20 bg-chart-4/5 p-3 flex items-center gap-3">
            <Flame className="h-5 w-5 text-chart-4 shrink-0" />
            <div className="text-start flex-1">
              <p className="text-xs font-bold">
                {currentStreak > 0
                  ? (isAr ? "سلسلتك مستمرة!" : "Your streak is alive!")
                  : (isAr ? "ابدأ سلسلة جديدة!" : "Start a new streak!")}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {isAr
                  ? "سجّل دخولك يومياً للحصول على مضاعف النقاط"
                  : "Log in daily to earn point multipliers"}
              </p>
            </div>
            {currentStreak > 0 && (
              <div className="flex items-center gap-1 text-chart-4 font-bold text-sm">
                <Flame className="h-3.5 w-3.5" />
                <AnimatedCounter value={currentStreak} className="inline" />
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { setOpen(false); navigate("/competitions"); }}
              className="rounded-xl border border-border/50 p-3 text-center hover:bg-accent/50 transition-colors active:scale-95"
            >
              <Trophy className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-xs font-semibold">{isAr ? "المسابقات" : "Competitions"}</p>
            </button>
            <button
              onClick={() => { setOpen(false); navigate("/community"); }}
              className="rounded-xl border border-border/50 p-3 text-center hover:bg-accent/50 transition-colors active:scale-95"
            >
              <Sparkles className="h-5 w-5 mx-auto text-chart-5 mb-1" />
              <p className="text-xs font-semibold">{isAr ? "المجتمع" : "Community"}</p>
            </button>
          </div>

          <Button onClick={handleExplore} className="w-full gap-2 rounded-xl">
            {isAr ? "اكتشف الجديد" : "Explore What's New"}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});
