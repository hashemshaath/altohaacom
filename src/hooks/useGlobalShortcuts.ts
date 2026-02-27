import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";

/**
 * Global keyboard shortcuts for power users.
 * Ctrl/⌘ + K → Search, Ctrl/⌘ + / → Shortcuts help
 */
export function useGlobalShortcuts() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const handler = useCallback((e: KeyboardEvent) => {
    const mod = e.metaKey || e.ctrlKey;
    if (!mod) return;

    // Ctrl+K → Go to search
    if (e.key === "k") {
      e.preventDefault();
      navigate("/search");
    }

    // Ctrl+/ → Show shortcuts toast
    if (e.key === "/") {
      e.preventDefault();
      toast({
        title: isAr ? "اختصارات لوحة المفاتيح" : "Keyboard Shortcuts",
        description: isAr
          ? "⌘K بحث · ⌘/ اختصارات"
          : "⌘K Search · ⌘/ Shortcuts",
      });
    }
  }, [navigate, toast, isAr]);

  useEffect(() => {
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handler]);
}
