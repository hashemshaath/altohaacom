import { CACHE } from "@/lib/queryConfig";
import { useIsAr } from "@/hooks/useIsAr";
import { memo, forwardRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getDisplayName, getDisplayInitial } from "@/lib/getDisplayName";
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
  basic: { en: "Basic", ar: "أساسي", color: "bg-[#F5F0E8] text-[#9E9890]" },
  professional: { en: "Professional", ar: "محترف", color: "bg-[rgba(192,91,46,0.1)] text-[#C05B2E]" },
  enterprise: { en: "Enterprise", ar: "مؤسسات", color: "bg-[rgba(45,80,22,0.1)] text-[#2D5016]" },
};

export const UserDropdown = memo(forwardRef<HTMLDivElement>(function UserDropdown(_props, ref) {
  const isAr = useIsAr();
  const { user, signOut } = useAuth();
  const { t, language } = useLanguage();
  const { data: isAdmin } = useIsAdmin();
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
    ...CACHE.realtime,
  });

  const displayName = getDisplayName(profile, isAr, user?.email?.split("@")[0] || "");
  const initials = getDisplayInitial(profile, isAr);
  const tier = profile?.membership_tier;
  const tierInfo = tier ? tierLabels[tier] : null;

  if (!user) {
    return (
      <div className="hidden items-center gap-2 lg:flex">
        <Link
          to="/login"
          className="inline-flex items-center justify-center font-semibold transition-all"
          style={{
            border: "1.5px solid rgba(28,28,26,0.2)",
            color: "#1C1C1A",
            padding: "8px 20px",
            borderRadius: "8px",
            fontSize: "0.875rem",
          }}
        >
          {t("signIn")}
        </Link>
        <Link
          to="/register"
          className="inline-flex items-center justify-center font-bold transition-all active:scale-[0.98]"
          style={{
            background: "#C05B2E",
            color: "#FEFCF8",
            padding: "8px 20px",
            borderRadius: "8px",
            fontSize: "0.875rem",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#A34D24")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#C05B2E")}
        >
          {t("signUp")}
        </Link>
      </div>
    );
  }

  return (
    <div ref={ref} className="hidden lg:block">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center gap-1.5 rounded-full px-2 py-1.5 transition-all duration-200"
            style={{ background: "transparent" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#F5F0E8")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <Avatar className="h-8 w-8" style={{ border: "2px solid rgba(192,91,46,0.2)" }}>
              <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
              <AvatarFallback
                className="text-xs font-bold"
                style={{ background: "rgba(192,91,46,0.1)", color: "#C05B2E" }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden xl:flex flex-col items-start max-w-[120px]">
              <span className="text-[0.8125rem] font-semibold truncate w-full" style={{ color: "#1C1C1A" }}>
                {displayName}
              </span>
              {tierInfo && (
                <span className="text-xs leading-tight" style={{ color: "#9E9890" }}>
                  {isAr ? tierInfo.ar : tierInfo.en}
                </span>
              )}
            </div>
            <ChevronDown className="h-3 w-3 hidden xl:block" style={{ color: "#9E9890" }} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-64 p-0 rounded-xl"
          style={{
            background: "#FEFCF8",
            border: "1px solid rgba(28,28,26,0.1)",
            boxShadow: "0 8px 32px rgba(28,28,26,0.12)",
          }}
        >
          {/* Profile header */}
          <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(28,28,26,0.06)", background: "#F5F0E8" }}>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10" style={{ border: "2px solid rgba(192,91,46,0.2)" }}>
                <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                <AvatarFallback
                  className="text-sm font-bold"
                  style={{ background: "rgba(192,91,46,0.1)", color: "#C05B2E" }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold truncate" style={{ color: "#1C1C1A" }}>{displayName}</p>
                <p className="text-xs truncate" style={{ color: "#9E9890" }}>{user.email}</p>
                {tierInfo && (
                  <Badge variant="secondary" className={`mt-1 text-xs h-4 px-1.5 ${tierInfo.color}`}>
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
              <DropdownMenuItem key={item.to} asChild className="rounded-lg mx-1">
                <Link to={item.to} className="flex items-center gap-2.5 px-3 py-2 transition-colors">
                  <item.icon className="h-4 w-4" style={{ color: "#9E9890" }} />
                  <span className="text-[0.8125rem]" style={{ color: "#1C1C1A" }}>{label(item.en, item.ar)}</span>
                </Link>
              </DropdownMenuItem>
            ))}
          </div>

          {isAdmin && (
            <>
              <DropdownMenuSeparator style={{ background: "rgba(28,28,26,0.06)" }} />
              <div className="py-1">
                <DropdownMenuItem asChild className="mx-1 rounded-lg">
                  <Link to="/admin" className="flex items-center gap-2.5 px-3 py-2">
                    <Shield className="h-4 w-4" style={{ color: "#9E9890" }} />
                    <span className="text-[0.8125rem]" style={{ color: "#1C1C1A" }}>{t("adminPanel")}</span>
                  </Link>
                </DropdownMenuItem>
              </div>
            </>
          )}

          <DropdownMenuSeparator style={{ background: "rgba(28,28,26,0.06)" }} />
          <div className="py-1">
            <DropdownMenuItem
              onClick={signOut}
              className="px-4 py-2 mx-1 rounded-lg"
              style={{ color: "#8B1A1A" }}
            >
              <LogOut className="h-4 w-4 me-2.5" />
              <span className="text-[0.8125rem]">{t("signOut")}</span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}));
