import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAccountType } from "@/hooks/useAccountType";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  CheckCircle2, Circle, Camera, FileText, MapPin, Briefcase,
  Globe, Sparkles, ArrowRight, X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "altoha_welcome_dismissed";

interface ProfileField {
  key: string;
  labelEn: string;
  labelAr: string;
  icon: any;
  check: (p: any) => boolean;
  actionEn: string;
  actionAr: string;
  link: string;
}

const PRO_FIELDS: ProfileField[] = [
  { key: "avatar", labelEn: "Profile Photo", labelAr: "صورة الملف", icon: Camera, check: (p) => !!p?.avatar_url, actionEn: "Upload photo", actionAr: "رفع صورة", link: "/profile?tab=edit" },
  { key: "bio", labelEn: "Bio", labelAr: "نبذة عنك", icon: FileText, check: (p) => !!p?.bio && p.bio.length > 10, actionEn: "Write a short bio", actionAr: "اكتب نبذة مختصرة", link: "/profile?tab=edit" },
  { key: "location", labelEn: "Location", labelAr: "الموقع", icon: MapPin, check: (p) => !!p?.location || !!p?.country_code, actionEn: "Add your location", actionAr: "أضف موقعك", link: "/profile?tab=edit" },
  { key: "specialization", labelEn: "Specialization", labelAr: "التخصص", icon: Briefcase, check: (p) => !!p?.specialization || !!p?.job_title, actionEn: "Set your specialty", actionAr: "حدد تخصصك", link: "/profile?tab=edit" },
  { key: "social", labelEn: "Social Links", labelAr: "روابط اجتماعية", icon: Globe, check: (p) => !!p?.instagram || !!p?.twitter || !!p?.linkedin, actionEn: "Connect social accounts", actionAr: "اربط حساباتك", link: "/profile?tab=edit" },
];

const FAN_FIELDS: ProfileField[] = [
  { key: "avatar", labelEn: "Profile Photo", labelAr: "صورة الملف", icon: Camera, check: (p) => !!p?.avatar_url, actionEn: "Upload photo", actionAr: "رفع صورة", link: "/profile?tab=edit" },
  { key: "bio", labelEn: "Bio", labelAr: "نبذة عنك", icon: FileText, check: (p) => !!p?.bio && p.bio.length > 10, actionEn: "Write a short bio", actionAr: "اكتب نبذة مختصرة", link: "/profile?tab=edit" },
  { key: "location", labelEn: "Location", labelAr: "الموقع", icon: MapPin, check: (p) => !!p?.location || !!p?.country_code, actionEn: "Add your location", actionAr: "أضف موقعك", link: "/profile?tab=edit" },
  { key: "social", labelEn: "Social Links", labelAr: "روابط اجتماعية", icon: Globe, check: (p) => !!p?.instagram || !!p?.twitter || !!p?.linkedin, actionEn: "Connect social accounts", actionAr: "اربط حساباتك", link: "/profile?tab=edit" },
];

export const WelcomeModal = forwardRef<HTMLDivElement>(function WelcomeModal(_props, _ref) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { isFan } = useAccountType();
  const isAr = language === "ar";
  const [open, setOpen] = useState(false);
  const FIELDS = useMemo(() => isFan ? FAN_FIELDS : PRO_FIELDS, [isFan]);

  const { data: profile } = useQuery({
    queryKey: ["welcome-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url, bio, location, country_code, specialization, job_title, instagram, twitter, linkedin, profile_completed, created_at")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
    staleTime: 60000,
  });

  useEffect(() => {
    if (!user || !profile) return;
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) return;

    // Show only for new users (created within last 7 days) with incomplete profiles
    const createdAt = new Date(profile.created_at || "");
    const daysSinceCreation = (Date.now() - createdAt.getTime()) / 86400000;
    if (daysSinceCreation > 7) return;

    const completed = FIELDS.filter((f) => f.check(profile)).length;
    if (completed < FIELDS.length) {
      // Delay to avoid flash
      const timer = setTimeout(() => setOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [user, profile]);

  const handleDismiss = () => {
    setOpen(false);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  if (!profile) return null;

  const completed = FIELDS.filter((f) => f.check(profile)).length;
  const percent = Math.round((completed / FIELDS.length) * 100);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-xl font-bold">
            {isAr ? `مرحباً ${profile.full_name || ""}! 🎉` : `Welcome ${profile.full_name || ""}! 🎉`}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {isFan
              ? (isAr ? "أكمل ملفك الشخصي واستكشف الطهاة والفعاليات" : "Complete your profile and explore chefs & events")
              : (isAr ? "أكمل ملفك الشخصي للحصول على أفضل تجربة" : "Complete your profile for the best experience")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress */}
          <div className="rounded-xl border border-border p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground">
                {isAr ? "اكتمال الملف" : "Profile completion"}
              </span>
              <span className="text-sm font-bold text-primary">{percent}%</span>
            </div>
            <Progress value={percent} className="h-2" />
          </div>

          {/* Checklist */}
          <div className="space-y-1">
            {FIELDS.map((field) => {
              const done = field.check(profile);
              const Icon = field.icon;
              return (
                <Link
                  key={field.key}
                  to={field.link}
                  onClick={handleDismiss}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
                    done ? "opacity-60" : "hover:bg-muted/50"
                  )}
                >
                  {done ? (
                    <CheckCircle2 className="h-4 w-4 text-chart-3 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm", done ? "line-through text-muted-foreground" : "font-medium")}>
                      {isAr ? field.labelAr : field.labelEn}
                    </p>
                    {!done && (
                      <p className="text-[10px] text-muted-foreground">
                        {isAr ? field.actionAr : field.actionEn}
                      </p>
                    )}
                  </div>
                  {!done && <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                </Link>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleDismiss}>
              {isAr ? "لاحقاً" : "Later"}
            </Button>
            <Link to="/onboarding" onClick={handleDismiss} className="flex-1">
              <Button className="w-full gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                {isAr ? "أكمل الآن" : "Complete Now"}
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});
