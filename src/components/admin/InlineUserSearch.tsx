import { useIsAr } from "@/hooks/useIsAr";
import { CACHE } from "@/lib/queryConfig";
import { useState, useCallback, useRef, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Shield, Crown, Loader2, X, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { handleSupabaseError } from "@/lib/supabaseErrorHandler";

interface InlineUserSearchProps {
  onSelectUser: (userId: string) => void;
  onClose: () => void;
}

export const InlineUserSearch = memo(function InlineUserSearch({ onSelectUser, onClose }: InlineUserSearchProps) {
  const isAr = useIsAr();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["inlineUserSearch", query],
    queryFn: async () => {
      if (query.length < 2) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, full_name_ar, username, account_number, avatar_url, account_status, is_verified, account_type, membership_tier, email, specialization, specialization_ar, country_code")
        .or(`full_name.ilike.%${query}%,username.ilike.%${query}%,account_number.ilike.%${query}%,email.ilike.%${query}%,full_name_ar.ilike.%${query}%`)
        .limit(12);
      if (error) throw handleSupabaseError(error);
      return data || [];
    },
    enabled: query.length >= 2,
    ...CACHE.realtime,
  });

  const handleSelect = useCallback((userId: string) => {
    onSelectUser(userId);
  }, [onSelectUser]);

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
    } else if (e.key === "Escape") {
      onClose();
    }
  }, [results, selectedIndex, handleSelect, onClose]);

  const statusColor = (s: string | null) => {
    if (s === "active") return "bg-chart-3/15 text-chart-3 border-chart-3/20";
    if (s === "suspended") return "bg-destructive/15 text-destructive border-destructive/20";
    if (s === "banned") return "bg-destructive/15 text-destructive border-destructive/20";
    return "bg-muted text-muted-foreground border-border";
  };

  return (
    <Card className="border-primary/20 rounded-2xl shadow-lg shadow-primary/5 animate-in fade-in-0 slide-in-from-top-2 duration-300" dir={isAr ? "rtl" : "ltr"}>
      <CardContent className="p-0">
        {/* Search Header */}
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-primary" />
          <Input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            autoFocus
            placeholder={isAr ? "ابحث بالاسم، اسم المستخدم، البريد، أو رقم الحساب..." : "Search by name, username, email, or account number..."}
            className="border-0 focus-visible:ring-0 h-10 text-sm bg-transparent"
          />
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />}
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-xl shrink-0 hover:bg-destructive/10 hover:text-destructive">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Results */}
        {query.length < 2 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
            {isAr ? "اكتب حرفين على الأقل للبحث عن مستخدم" : "Type at least 2 characters to search for a user"}
          </div>
        ) : results.length === 0 && !isLoading ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            <UserCheck className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
            {isAr ? "لا توجد نتائج مطابقة" : "No matching results found"}
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="p-2 grid gap-1">
              {results.map((user, idx) => (
                <button
                  key={user.user_id}
                  onClick={() => handleSelect(user.user_id)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={cn(
                    "flex items-center gap-3 w-full p-3 rounded-xl text-start transition-all duration-150 touch-manipulation",
                    idx === selectedIndex ? "bg-primary/5 border border-primary/20 shadow-sm" : "hover:bg-muted/60 border border-transparent"
                  )}
                >
                  <Avatar className="h-10 w-10 border border-border/60">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">{(isAr ? (user.full_name_ar || user.full_name) : (user.full_name || "U"))?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium truncate">{isAr ? (user.full_name_ar || user.full_name || "—") : (user.full_name || "—")}</span>
                      {user.is_verified && <Shield className="h-3 w-3 text-primary shrink-0" />}
                      {user.membership_tier === "enterprise" && <Crown className="h-3 w-3 text-chart-2 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      {user.username && <span dir="ltr">@{user.username}</span>}
                      {user.account_number && <span className="font-mono" dir="ltr">{user.account_number}</span>}
                      {(isAr ? user.specialization_ar : user.specialization) && (
                        <span className="truncate max-w-[120px]">· {isAr ? user.specialization_ar : user.specialization}</span>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className={cn("text-xs shrink-0", statusColor(user.account_status))}>
                    {user.account_status === "active" ? (isAr ? "نشط" : "Active")
                      : user.account_status === "suspended" ? (isAr ? "موقوف" : "Suspended")
                      : user.account_status === "banned" ? (isAr ? "محظور" : "Banned")
                      : (isAr ? "معلق" : "Pending")}
                  </Badge>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Footer hints */}
        <div className="border-t px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>↑↓ {isAr ? "تنقل" : "Navigate"} · ↵ {isAr ? "اختيار" : "Select"} · Esc {isAr ? "إغلاق" : "Close"}</span>
          {results.length > 0 && <span>{results.length} {isAr ? "نتيجة" : "results"}</span>}
        </div>
      </CardContent>
    </Card>
  );
});
