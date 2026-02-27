import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList,
} from "@/components/ui/command";
import {
  Users, Trophy, FileText, Settings, Shield, MessageSquare,
  BarChart3, Wallet, Globe, Package, Mail, HelpCircle, Search,
} from "lucide-react";

const ADMIN_ROUTES = [
  { path: "/admin", icon: BarChart3, en: "Dashboard", ar: "لوحة التحكم", group: "main" },
  { path: "/admin/users", icon: Users, en: "Users", ar: "المستخدمين", group: "main" },
  { path: "/admin/competitions", icon: Trophy, en: "Competitions", ar: "المسابقات", group: "events" },
  { path: "/admin/exhibitions", icon: Globe, en: "Exhibitions", ar: "المعارض", group: "events" },
  { path: "/admin/articles", icon: FileText, en: "Articles", ar: "المقالات", group: "content" },
  { path: "/admin/moderation", icon: Shield, en: "Moderation", ar: "الإشراف", group: "content" },
  { path: "/admin/settings", icon: Settings, en: "Settings", ar: "الإعدادات", group: "system" },
  { path: "/admin/support", icon: HelpCircle, en: "Support", ar: "الدعم", group: "comms" },
  { path: "/admin/communications", icon: Mail, en: "Communications", ar: "التواصل", group: "comms" },
  { path: "/admin/orders", icon: Package, en: "Orders", ar: "الطلبات", group: "finance" },
  { path: "/admin/invoices", icon: Wallet, en: "Invoices", ar: "الفواتير", group: "finance" },
  { path: "/admin/analytics", icon: BarChart3, en: "Analytics", ar: "التحليلات", group: "system" },
  { path: "/admin/roles", icon: Shield, en: "Roles", ar: "الأدوار", group: "system" },
  { path: "/admin/security", icon: Shield, en: "Security", ar: "الأمان", group: "system" },
  { path: "/admin/masterclasses", icon: FileText, en: "Masterclasses", ar: "الماستركلاس", group: "content" },
  { path: "/admin/companies", icon: Globe, en: "Companies", ar: "الشركات", group: "main" },
];

const GROUPS: Record<string, { en: string; ar: string }> = {
  main: { en: "Main", ar: "رئيسي" },
  events: { en: "Events", ar: "الفعاليات" },
  content: { en: "Content", ar: "المحتوى" },
  comms: { en: "Communications", ar: "التواصل" },
  finance: { en: "Finance", ar: "المالية" },
  system: { en: "System", ar: "النظام" },
};

export function AdminSearchCommand() {
  const [open, setOpen] = useState(false);
  const { language } = useLanguage();
  const isAr = language === "ar";
  const navigate = useNavigate();

  // Ctrl+K to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const grouped = useMemo(() => {
    const map: Record<string, typeof ADMIN_ROUTES> = {};
    ADMIN_ROUTES.forEach((r) => {
      if (!map[r.group]) map[r.group] = [];
      map[r.group].push(r);
    });
    return map;
  }, []);

  const onSelect = useCallback((path: string) => {
    navigate(path);
    setOpen(false);
  }, [navigate]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-1.5",
          "text-xs text-muted-foreground hover:bg-muted transition-colors"
        )}
      >
        <Search className="h-3.5 w-3.5" />
        <span>{isAr ? "بحث سريع..." : "Quick search..."}</span>
        <kbd className="ms-2 hidden sm:inline rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono border border-border/40">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={isAr ? "ابحث عن صفحة أو إعداد..." : "Search pages & settings..."} />
        <CommandList>
          <CommandEmpty>{isAr ? "لا توجد نتائج" : "No results found"}</CommandEmpty>
          {Object.entries(grouped).map(([group, routes]) => (
            <CommandGroup key={group} heading={isAr ? GROUPS[group]?.ar : GROUPS[group]?.en}>
              {routes.map((r) => {
                const Icon = r.icon;
                return (
                  <CommandItem key={r.path} onSelect={() => onSelect(r.path)} className="gap-2">
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {isAr ? r.ar : r.en}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
