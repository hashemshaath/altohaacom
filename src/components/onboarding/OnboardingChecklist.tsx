import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Rocket, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

interface Step {
  id: string;
  label: string;
  labelAr: string;
  link: string;
  check: (profile: any) => boolean;
}

const STEPS: Step[] = [
  { id: "avatar", label: "Upload profile photo", labelAr: "رفع صورة الملف الشخصي", link: "/profile?tab=settings", check: (p) => !!p?.avatar_url },
  { id: "bio", label: "Write a bio", labelAr: "كتابة نبذة تعريفية", link: "/profile?tab=settings", check: (p) => !!p?.bio && p.bio.length > 10 },
  { id: "specialization", label: "Set your specialization", labelAr: "تحديد تخصصك", link: "/profile?tab=settings", check: (p) => !!p?.specialization },
  { id: "post", label: "Create your first post", labelAr: "أنشئ أول منشور", link: "/community", check: () => false },
  { id: "follow", label: "Follow 3 chefs", labelAr: "تابع 3 طهاة", link: "/community?tab=chefs", check: () => false },
];

const STORAGE_KEY = "altoha_onboarding_dismissed";

export function OnboardingChecklist() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "true") setDismissed(true);
  }, []);

  const { data: profile } = useQuery({
    queryKey: ["onboarding-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url, bio, specialization, user_id")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user?.id && !dismissed,
    staleTime: 1000 * 60 * 5,
  });

  const { data: postCount = 0 } = useQuery({
    queryKey: ["onboarding-posts", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("author_id", user!.id);
      return count || 0;
    },
    enabled: !!user?.id && !dismissed,
    staleTime: 1000 * 60 * 5,
  });

  const { data: followCount = 0 } = useQuery({
    queryKey: ["onboarding-follows", user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("user_follows")
        .select("id", { count: "exact", head: true })
        .eq("follower_id", user!.id);
      return count || 0;
    },
    enabled: !!user?.id && !dismissed,
    staleTime: 1000 * 60 * 5,
  });

  if (dismissed || !user || !profile) return null;

  const completedSteps = STEPS.map((step) => {
    if (step.id === "post") return postCount > 0;
    if (step.id === "follow") return followCount >= 3;
    return step.check(profile);
  });

  const completed = completedSteps.filter(Boolean).length;
  const total = STEPS.length;
  const progress = Math.round((completed / total) * 100);

  if (progress === 100) {
    localStorage.setItem(STORAGE_KEY, "true");
    return null;
  }

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setDismissed(true);
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary" />
            {isAr ? "ابدأ رحلتك" : "Get Started"}
          </CardTitle>
          <Badge variant="secondary" className="text-[10px]">
            {completed}/{total}
          </Badge>
        </div>
        <Progress value={progress} className="h-1.5 mt-2" />
      </CardHeader>
      <CardContent className="pt-0 space-y-1">
        {STEPS.map((step, idx) => {
          const done = completedSteps[idx];
          return (
            <Link
              key={step.id}
              to={step.link}
              className={`flex items-center gap-2 rounded-xl p-2 text-xs transition-colors ${
                done
                  ? "text-muted-foreground line-through opacity-60"
                  : "hover:bg-primary/10 font-medium"
              }`}
            >
              {done ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
              ) : (
                <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              )}
              <span className="flex-1">{isAr ? step.labelAr : step.label}</span>
              {!done && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
            </Link>
          );
        })}
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-[10px] text-muted-foreground mt-1"
          onClick={handleDismiss}
        >
          {isAr ? "تجاهل" : "Dismiss"}
        </Button>
      </CardContent>
    </Card>
  );
}
