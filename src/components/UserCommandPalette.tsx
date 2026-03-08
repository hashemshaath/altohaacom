import { memo, useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard, Trophy, Users, ShoppingBag, Calendar,
  MessageSquare, Settings, User, Search, GraduationCap,
  Landmark, BookOpen, Heart, Megaphone, FileText, Ticket,
} from "lucide-react";

const ROUTES = [
  { href: "/dashboard", icon: LayoutDashboard, en: "Dashboard", ar: "لوحة التحكم" },
  { href: "/profile", icon: User, en: "My Profile", ar: "ملفي الشخصي" },
  { href: "/competitions", icon: Trophy, en: "Competitions", ar: "المسابقات" },
  { href: "/community", icon: Users, en: "Community", ar: "المجتمع" },
  { href: "/exhibitions", icon: Landmark, en: "Exhibitions", ar: "المعارض" },
  { href: "/masterclasses", icon: GraduationCap, en: "Masterclasses", ar: "الدورات" },
  { href: "/shop", icon: ShoppingBag, en: "Shop", ar: "المتجر" },
  { href: "/messages", icon: MessageSquare, en: "Messages", ar: "الرسائل" },
  { href: "/recipes", icon: BookOpen, en: "Recipes", ar: "الوصفات" },
  { href: "/mentorship", icon: Heart, en: "Mentorship", ar: "الإرشاد" },
  { href: "/advertise", icon: Megaphone, en: "Advertise", ar: "أعلن معنا" },
  { href: "/articles", icon: FileText, en: "Articles", ar: "المقالات" },
  { href: "/support", icon: Ticket, en: "Support", ar: "الدعم" },
  { href: "/profile?tab=edit", icon: Settings, en: "Settings", ar: "الإعدادات" },
];

/**
 * User command palette - activated by Cmd+K / Ctrl+K.
 * Provides quick navigation across the platform.
 */
export const UserCommandPalette = memo(function UserCommandPalette() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = useCallback((href: string) => {
    setOpen(false);
    navigate(href);
  }, [navigate]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={isAr ? "ابحث عن صفحة..." : "Search pages..."} />
      <CommandList>
        <CommandEmpty>{isAr ? "لا توجد نتائج" : "No results found."}</CommandEmpty>
        <CommandGroup heading={isAr ? "التنقل السريع" : "Quick Navigation"}>
          {ROUTES.map((route) => (
            <CommandItem
              key={route.href}
              value={`${route.en} ${route.ar}`}
              onSelect={() => handleSelect(route.href)}
              className="gap-2"
            >
              <route.icon className="h-4 w-4 text-muted-foreground" />
              <span>{isAr ? route.ar : route.en}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
});
