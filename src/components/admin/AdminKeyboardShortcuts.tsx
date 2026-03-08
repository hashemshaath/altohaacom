import { useEffect, useState, memo } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Keyboard, Command } from "lucide-react";

const SHORTCUTS = [
  { keys: ["⌘", "K"], action: "command_palette", label: "Command Palette", labelAr: "لوحة الأوامر" },
  { keys: ["G", "U"], action: "goto_users", label: "Go to Users", labelAr: "الذهاب للمستخدمين", path: "/admin/users" },
  { keys: ["G", "C"], action: "goto_competitions", label: "Go to Competitions", labelAr: "الذهاب للمسابقات", path: "/admin/competitions" },
  { keys: ["G", "A"], action: "goto_articles", label: "Go to Articles", labelAr: "الذهاب للمقالات", path: "/admin/articles" },
  { keys: ["G", "S"], action: "goto_settings", label: "Go to Settings", labelAr: "الذهاب للإعدادات", path: "/admin/settings" },
  { keys: ["G", "D"], action: "goto_dashboard", label: "Go to Dashboard", labelAr: "الذهاب للوحة", path: "/admin" },
  { keys: ["G", "T"], action: "goto_tickets", label: "Go to Tickets", labelAr: "الذهاب للتذاكر", path: "/admin/support-tickets" },
  { keys: ["G", "N"], action: "goto_analytics", label: "Go to Analytics", labelAr: "الذهاب للتحليلات", path: "/admin/analytics" },
  { keys: ["?"], action: "show_help", label: "Show Shortcuts", labelAr: "إظهار الاختصارات" },
];

export const AdminKeyboardShortcuts = memo(function AdminKeyboardShortcuts() {
  const navigate = useNavigate();
  const [showHelp, setShowHelp] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in inputs
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) return;

      const key = e.key.toUpperCase();

      // "?" shortcut
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShowHelp(true);
        return;
      }

      // "G" prefix shortcuts
      if (pendingKey === "G") {
        const shortcut = SHORTCUTS.find(s => s.keys[0] === "G" && s.keys[1] === key);
        if (shortcut?.path) {
          e.preventDefault();
          navigate(shortcut.path);
        }
        setPendingKey(null);
        clearTimeout(timer);
        return;
      }

      if (key === "G" && !e.ctrlKey && !e.metaKey) {
        setPendingKey("G");
        timer = setTimeout(() => setPendingKey(null), 1000);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => { window.removeEventListener("keydown", handleKeyDown); clearTimeout(timer); };
  }, [navigate, pendingKey]);

  return (
    <>
      {/* Floating shortcut hint */}
      {pendingKey && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-card border border-border shadow-lg rounded-xl px-4 py-2 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Badge variant="secondary" className="text-xs">G</Badge>
          <span className="text-xs text-muted-foreground">then press next key...</span>
        </div>
      )}

      {/* Help Dialog */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="h-4 w-4" />
              Keyboard Shortcuts
            </DialogTitle>
            <DialogDescription>Navigate quickly with keyboard shortcuts</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            {SHORTCUTS.map((s) => (
              <div key={s.action} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50">
                <span className="text-sm">{s.label}</span>
                <div className="flex items-center gap-1">
                  {s.keys.map((k, i) => (
                    <span key={i}>
                      <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-muted rounded border border-border">{k}</kbd>
                      {i < s.keys.length - 1 && <span className="text-[10px] text-muted-foreground mx-0.5">+</span>}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});

/** Small widget card showing shortcut hints */
export const ShortcutHintsCard = memo(function ShortcutHintsCard() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [showHelp, setShowHelp] = useState(false);

  return (
    <Card className="border-dashed">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs font-medium">{isAr ? "اختصارات لوحة المفاتيح" : "Keyboard Shortcuts"}</p>
              <p className="text-[10px] text-muted-foreground">{isAr ? "اضغط ? للمساعدة" : "Press ? for help"}</p>
            </div>
          </div>
          <div className="flex gap-1">
            {["G+U", "G+C", "G+D"].map(k => (
              <kbd key={k} className="px-1.5 py-0.5 text-[9px] font-mono bg-muted rounded border border-border">{k}</kbd>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
