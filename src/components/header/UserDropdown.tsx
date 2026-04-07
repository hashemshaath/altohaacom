import { memo } from "react";
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
} from "@/components/ui/dropdown-menu";
import {
  User, LogOut, MessageSquare, Settings,
  HelpCircle, Shield, LayoutDashboard, Crown, ChevronDown,
} from "lucide-react";

const tierLabels: Record<string, { en: string; ar: string; color: string }> = {
  basic: { en: "Basic", ar: "أساسي", color: "bg-[var(--bg-surface)] text-[var(--color-muted)]" },
  professional: { en: "Professional", ar: "محترف", color: "bg-[var(--color-primary-light)] text-[var(--color-primary)]" },
  enterprise: { en: "Enterprise", ar: "مؤسسات", color: "bg-[var(--color-info-bg)] text-[var(--color-info)]" },
};

export const UserDropdown = memo(function UserDropdown() {
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
        <Button variant="ghost" size="sm" asChild className="text-[var(--color-body)] border border-[var(--color-border)] rounded-[var(--radius-sm)] h-10 px-4 text-[13px] font-semibold hover:bg-[var(--bg-surface)]">
          <Link to="/login">{t("signIn")}</Link>
        </Button>
        <Link
          to="/register"
          className="btn btn-primary btn-sm"
        >
          {t("signUp")}
        </Link>
      </div>
    );
  }

  return (
    <div className="hidden lg:block">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-auto gap-1.5 rounded-full px-2 py-1.5 hover:bg-[var(--bg-surface)] transition-all duration-200"
          >
            <Avatar className="h-8 w-8 border-2 border-[var(--color-primary-light)]">
              <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
              <AvatarFallback className="text-[11px] font-bold bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden xl:flex flex-col items-start max-w-[120px]">
              <span className="text-[13px] font-semibold text-[var(--color-heading)] truncate w-full">
                {displayName}
              </span>
              {tierInfo && (
                <span className="text-[10px] text-[var(--color-muted)] leading-tight">
                  {isAr ? tierInfo.ar : tierInfo.en}
                </span>
              )}
            </div>
            <ChevronDown className="h-3 w-3 text-[var(--color-muted)] hidden xl:block" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-64 p-0 rounded-[var(--radius-md)] border-[var(--color-border-light)]"
          style={{ boxShadow: "var(--shadow-lg)" }}
        >
          {/* Profile header */}
          <div className="px-4 py-3 border-b border-[var(--color-border-light)] bg-[var(--bg-surface)]">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-[var(--color-primary-light)]">
                <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                <AvatarFallback className="text-sm font-bold bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-[var(--color-heading)] truncate">{displayName}</p>
                <p className="text-[11px] text-[var(--color-muted)] truncate">{user.email}</p>
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
            {[
              { to: "/dashboard", icon: LayoutDashboard, en: "Dashboard", ar: "لوحة التحكم" },
              { to: "/profile", icon: User, en: "Profile", ar: "الملف الشخصي" },
              { to: "/messages", icon: MessageSquare, en: "Messages", ar: "الرسائل" },
              { to: "/notification-preferences", icon: Settings, en: "Settings", ar: "الإعدادات" },
              { to: "/help", icon: HelpCircle, en: "Help Center", ar: "مركز المساعدة" },
            ].map((item) => (
              <DropdownMenuItem key={item.to} asChild className="rounded-[var(--radius-sm)] mx-1">
                <Link to={item.to} className="flex items-center gap-2.5 px-3 py-2 transition-colors">
                  <item.icon className="h-4 w-4 text-[var(--color-muted)]" />
                  <span className="text-[13px]">{label(item.en, item.ar)}</span>
                </Link>
              </DropdownMenuItem>
            ))}
          </div>

          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <div className="py-1">
                <DropdownMenuItem asChild className="mx-1 rounded-[var(--radius-sm)]">
                  <Link to="/admin" className="flex items-center gap-2.5 px-3 py-2">
                    <Shield className="h-4 w-4 text-[var(--color-muted)]" />
                    <span className="text-[13px]">{t("adminPanel")}</span>
                  </Link>
                </DropdownMenuItem>
              </div>
            </>
          )}

          <DropdownMenuSeparator />
          <div className="py-1">
            <DropdownMenuItem
              onClick={signOut}
              className="text-[var(--color-error)] focus:text-[var(--color-error)] px-4 py-2 mx-1 rounded-[var(--radius-sm)]"
            >
              <LogOut className="h-4 w-4 me-2.5" />
              <span className="text-[13px]">{t("signOut")}</span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});
