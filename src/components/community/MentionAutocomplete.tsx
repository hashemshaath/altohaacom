import { useState, useEffect, useRef, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface MentionSuggestion {
  user_id: string;
  full_name: string | null;
  display_name: string | null;
  display_name_ar: string | null;
  full_name_ar: string | null;
  username: string | null;
  avatar_url: string | null;
}

interface MentionAutocompleteProps {
  content: string;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onSelect: (username: string) => void;
}

export const MentionAutocomplete = memo(function MentionAutocomplete({ content, textareaRef, onSelect }: MentionAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([]);
  const [query, setQuery] = useState<string | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    // Detect @mention query at cursor position
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBefore = content.slice(0, cursorPos);
    const match = textBefore.match(/@(\w{1,20})$/);

    if (match) {
      setQuery(match[1]);
    } else {
      setQuery(null);
      setSuggestions([]);
    }
  }, [content]);

  useEffect(() => {
    if (!query || query.length < 1) {
      setSuggestions([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, full_name_ar, display_name, display_name_ar, username, avatar_url")
        .eq("account_status", "active")
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(5);
      setSuggestions(data || []);
      setSelectedIdx(0);
    }, 200);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  useEffect(() => {
    if (suggestions.length === 0) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, suggestions.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const selected = suggestions[selectedIdx];
        if (selected) onSelect(selected.username || selected.full_name || "");
      } else if (e.key === "Escape") {
        setSuggestions([]);
      }
    };

    const textarea = textareaRef.current;
    textarea?.addEventListener("keydown", handler);
    return () => textarea?.removeEventListener("keydown", handler);
  }, [suggestions, selectedIdx, onSelect]);

  if (suggestions.length === 0) return null;

  return (
    <div className="absolute z-30 mt-1 w-64 rounded-xl border border-border bg-popover shadow-lg overflow-hidden animate-in fade-in-50 slide-in-from-top-2 duration-200">
      {suggestions.map((user, i) => (
        <button
          key={user.user_id}
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(user.username || user.full_name || "");
          }}
          className={cn(
            "flex items-center gap-2.5 w-full px-3 py-2 text-start text-sm transition-colors",
            i === selectedIdx ? "bg-muted" : "hover:bg-muted/50"
          )}
        >
          <Avatar className="h-7 w-7">
            <AvatarImage src={user.avatar_url || undefined} />
            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
              {(user.display_name || user.full_name || "U")[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold truncate text-xs">{user.display_name || user.full_name || user.username}</p>
            {user.username && (
              <p className="text-[10px] text-muted-foreground">@{user.username}</p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
