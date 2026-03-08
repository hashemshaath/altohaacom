import { useState, useEffect, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface UsernameSuggestionsProps {
  baseUsername: string;
  onSelect: (username: string) => void;
}

function generateCandidates(base: string): string[] {
  const clean = base.replace(/[^a-z0-9_]/g, "").slice(0, 24);
  if (!clean) return [];
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const candidates: string[] = [];
  for (let i = 1; i <= 5; i++) candidates.push(`${clean}${i}`);
  candidates.push(`${clean}_${year}`);
  candidates.push(`${clean}x`);
  candidates.push(`the_${clean}`);
  candidates.push(`${clean}_official`);
  candidates.push(`${clean}pro`);
  return candidates.filter((c) => /^[a-zA-Z][a-zA-Z0-9_]{2,29}$/.test(c));
}

export const UsernameSuggestions = memo(function UsernameSuggestions({ baseUsername, onSelect }: UsernameSuggestionsProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!baseUsername || baseUsername.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const candidates = generateCandidates(baseUsername.toLowerCase());
      if (candidates.length === 0) {
        setSuggestions([]);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("username")
        .in("username", candidates);

      const takenSet = new Set((data || []).map((d) => d.username));
      const available = candidates.filter((c) => !takenSet.has(c)).slice(0, 4);
      setSuggestions(available);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [baseUsername]);

  if (!baseUsername || baseUsername.length < 2) return null;
  if (loading) return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />;
  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] text-muted-foreground">
        {isAr ? "أسماء مستخدمين مقترحة:" : "Suggested usernames:"}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((s) => (
          <Badge
            key={s}
            variant="outline"
            className="cursor-pointer text-xs hover:bg-primary/10 hover:border-primary/30 transition-colors"
            onClick={() => onSelect(s)}
          >
            {s}
          </Badge>
        ))}
      </div>
    </div>
  );
}
