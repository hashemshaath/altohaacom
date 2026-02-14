import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
} from "lucide-react";

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
        .select("full_name, avatar_url")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
    staleTime: 60000,
  });

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() || "U";

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
            className="h-auto gap-2 rounded-full px-2 py-1.5 hover:bg-primary/5 transition-all duration-200"
          >
            <Avatar className="h-7 w-7 border border-border/60">
              <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || ""} />
              <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            {profile?.full_name && (
              <span className="text-xs font-medium text-foreground max-w-[80px] truncate hidden xl:inline">
                {profile.full_name}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 animate-in fade-in-0 zoom-in-95">
          <DropdownMenuLabel className="font-normal">
            <div className="flex items-center gap-3 py-1">
              <Avatar className="h-9 w-9 border border-border/40">
                <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || ""} />
                <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                {profile?.full_name && (
                  <p className="text-sm font-medium truncate">{profile.full_name}</p>
                )}
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/profile" className="flex items-center gap-2.5">
              <User className="h-4 w-4 text-muted-foreground" />
              {t("myProfile")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/messages" className="flex items-center gap-2.5">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              {label("Messages", "الرسائل")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/notification-preferences" className="flex items-center gap-2.5">
              <Settings className="h-4 w-4 text-muted-foreground" />
              {t("notificationPreferences")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/help" className="flex items-center gap-2.5">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
              {label("Help Center", "مركز المساعدة")}
            </Link>
          </DropdownMenuItem>
          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/admin" className="flex items-center gap-2.5">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  {t("adminPanel")}
                </Link>
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={signOut}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="h-4 w-4 me-2.5" />
            {t("signOut")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
