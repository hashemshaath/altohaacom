import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useIsAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
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
            size="icon"
            className="h-8 w-8 rounded-full border border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
          >
            <User className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 animate-in fade-in-0 zoom-in-95">
          <DropdownMenuLabel className="font-normal text-xs text-muted-foreground truncate">
            {user.email}
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
