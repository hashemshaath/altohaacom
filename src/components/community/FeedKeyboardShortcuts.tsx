import { useIsAr } from "@/hooks/useIsAr";
import { memo, useEffect, useCallback } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";

interface FeedKeyboardShortcutsProps {
  onRefresh: () => void;
  onScrollTop: () => void;
}

/**
 * Global keyboard shortcuts for the community feed.
 * - R: Refresh feed
 * - T: Scroll to top
 * - N: Focus composer (if exists)
 */
export const FeedKeyboardShortcuts = memo(function FeedKeyboardShortcuts({
  onRefresh,
  onScrollTop,
}: FeedKeyboardShortcutsProps) {
  const isAr = useIsAr();
  const { toast } = useToast();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger if user is typing in an input/textarea
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

    switch (e.key.toLowerCase()) {
      case "r":
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          onRefresh();
          toast({
            title: isAr ? "تم تحديث الخلاصة" : "Feed refreshed",
            duration: 1500,
          });
        }
        break;
      case "t":
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          onScrollTop();
        }
        break;
      case "n":
        if (!e.ctrlKey && !e.metaKey) {
          const composer = document.querySelector<HTMLTextAreaElement>('[data-composer]');
          if (composer) {
            e.preventDefault();
            composer.focus();
          }
        }
        break;
    }
  }, [onRefresh, onScrollTop, isAr, toast]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return null;
});
