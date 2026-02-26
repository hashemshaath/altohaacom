import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getDisplayName, getDisplayInitial } from "@/lib/getDisplayName";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  User,
  LogOut,
  MessageSquare,
  Settings,
  HelpCircle,
  Shield,
  LayoutDashboard,
  Crown,
  ChevronDown,
} from "lucide-react";

const tierLabels: Record<string, { en: string; ar: string; color: string }> = {
  basic: { en: "Basic", ar: "أساسي", color: "bg-muted text-muted-foreground" },
  professional: { en: "Professional", ar: "محترف", color: "bg-primary/10 text-primary" },
  enterprise: { en: "Enterprise", ar: "مؤسسات", color: "bg-chart-4/15 text-chart-4" },
};

export function UserDropdown() {
  const { user, signOut } = useAuth();
  const { t, language } = useLanguage();
  const { data: isAdmin } = useIsAdmin();
  const isAr = language === "ar";
  const label = (en: string, ar: string) => (isAr ? ar : en);

  const { data: profile } = useQuery({
    queryKey: ["header-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, full_name_ar, display_name, display_name_ar, avatar_url, username, membership_tier")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
    staleTime: 60000,
  });

  const displayName = getDisplayName(profile, isAr, user?.email?.split("@")[0] || "");
  const initials = getDisplayInitial(profile, isAr);
  const tier = (profile as any)?.membership_tier;
  const tierInfo = tier ? tierLabels[tier] : null;

  if (!user) {
    return (
      <div className="hidden items-center gap-2 lg:flex">
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
          <Link to="/login">{t("signIn")}</Link>
        </Button>
        <Button size="sm" asChild className="shadow-sm shadow-primary/15">
          <Link to="/register">{t("signUp")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="hidden lg:block">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-auto gap-1.5 rounded-full px-2 py-1.5 hover:bg-primary/5 transition-all duration-200"
          >
            <Avatar className="h-8 w-8 border-2 border-primary/20">
              <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
              <AvatarFallback className="text-[11px] font-bold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden xl:flex flex-col items-start max-w-[120px]">
              <span className="text-xs font-semibold text-foreground truncate w-full">
                {displayName}
              </span>
              {tierInfo && (
                <span className="text-[10px] text-muted-foreground leading-tight">
                  {isAr ? tierInfo.ar : tierInfo.en}
                </span>
              )}
            </div>
            <ChevronDown className="h-3 w-3 text-muted-foreground hidden xl:block" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 animate-in fade-in-0 zoom-in-95 p-0">
          {/* Profile header */}
          <div className="px-4 py-3 border-b border-border/50 bg-muted/30">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                <AvatarFallback className="text-sm font-bold bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{displayName}</p>
                <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                {tierInfo && (
                  <Badge variant="secondary" className={`mt-1 text-[10px] h-4 px-1.5 ${tierInfo.color}`}>
                    <Crown className="h-2.5 w-2.5 me-0.5" />
                    {isAr ? tierInfo.ar : tierInfo.en}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="py-1">
            <DropdownMenuItem asChild>
              <Link to="/dashboard" className="flex items-center gap-2.5 px-4 py-2">
                <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                {label("Dashboard", "لوحة التحكم")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/profile" className="flex items-center gap-2.5 px-4 py-2">
                <User className="h-4 w-4 text-muted-foreground" />
                {t("myProfile")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/messages" className="flex items-center gap-2.5 px-4 py-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                {label("Messages", "الرسائل")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/notification-preferences" className="flex items-center gap-2.5 px-4 py-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                {t("notificationPreferences")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/help" className="flex items-center gap-2.5 px-4 py-2">
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                {label("Help Center", "مركز المساعدة")}
              </Link>
            </DropdownMenuItem>
          </div>

          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <div className="py-1">
                <DropdownMenuItem asChild>
                  <Link to="/admin" className="flex items-center gap-2.5 px-4 py-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    {t("adminPanel")}
                  </Link>
                </DropdownMenuItem>
              </div>
            </>
          )}

          <DropdownMenuSeparator />
          <div className="py-1">
            <DropdownMenuItem
              onClick={signOut}
              className="text-destructive focus:text-destructive px-4 py-2"
            >
              <LogOut className="h-4 w-4 me-2.5" />
              {t("signOut")}
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
