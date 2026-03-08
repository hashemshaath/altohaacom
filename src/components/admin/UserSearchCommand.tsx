import { useState, useEffect, useCallback, useRef, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, User, Shield, Crown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserSearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectUser?: (userId: string) => void;
}

export const UserSearchCommand = memo(function UserSearchCommand({ open, onOpenChange, onSelectUser }: UserSearchCommandProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["userSearchCommand", query],
    queryFn: async () => {
      if (query.length < 2) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, account_number, avatar_url, account_status, is_verified, account_type, membership_tier, email")
        .or(`full_name.ilike.%${query}%,username.ilike.%${query}%,account_number.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: query.length >= 2,
    staleTime: 30000,
  });

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => { setSelectedIndex(0); }, [results]);

  const handleSelect = useCallback((userId: string) => {
    onOpenChange(false);
    if (onSelectUser) {
      onSelectUser(userId);
    } else {
      navigate(`/admin/users/${userId}`);
    }
  }, [onOpenChange, onSelectUser, navigate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex].user_id);
    }
  }, [results, selectedIndex, handleSelect]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-lg">
        <div className="flex items-center border-b px-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isAr ? "ابحث بالاسم، اسم المستخدم، البريد، أو رقم الحساب..." : "Search by name, username, email, or account number..."}
            className="border-0 focus-visible:ring-0 h-12 text-sm"
          />
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        <ScrollArea className="max-h-80">
          {query.length < 2 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {isAr ? "اكتب حرفين على الأقل للبحث" : "Type at least 2 characters to search"}
            </div>
          ) : results.length === 0 && !isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {isAr ? "لا توجد نتائج" : "No results found"}
            </div>
          ) : (
            <div className="p-1">
              {results.map((user, idx) => (
                <button
                  key={user.user_id}
                  onClick={() => handleSelect(user.user_id)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    "flex items-center gap-3 w-full p-2.5 rounded-md text-start transition-colors",
                    idx === selectedIndex ? "bg-accent" : "hover:bg-accent/50"
                  )}
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">{(user.full_name || "U")[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium truncate">{user.full_name || "—"}</span>
                      {user.is_verified && <Shield className="h-3 w-3 text-primary" />}
                      {user.membership_tier === "enterprise" && <Crown className="h-3 w-3 text-chart-2" />}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {user.username && <span>@{user.username}</span>}
                      {user.account_number && <span>{user.account_number}</span>}
                    </div>
                  </div>
                  <Badge variant={user.account_status === "active" ? "default" : user.account_status === "suspended" ? "destructive" : "secondary"} className="text-[10px]">
                    {user.account_status || "pending"}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="border-t px-3 py-2 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>↑↓ {isAr ? "تنقل" : "Navigate"} · ↵ {isAr ? "اختيار" : "Select"} · Esc {isAr ? "إغلاق" : "Close"}</span>
          <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">⌘U</kbd>
        </div>
      </DialogContent>
    </Dialog>
  );
}
