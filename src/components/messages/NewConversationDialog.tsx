import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, UserPlus } from "lucide-react";

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectUser: (user: { user_id: string; full_name: string | null; username: string | null; avatar_url: string | null }) => void;
}

export function NewConversationDialog({ open, onOpenChange, onSelectUser }: NewConversationDialogProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [search, setSearch] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["searchUsers", search],
    queryFn: async () => {
      if (!user || search.length < 2) return [];
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, username, avatar_url")
        .neq("user_id", user.id)
        .or(`full_name.ilike.%${search}%,username.ilike.%${search}%`)
        .limit(20);
      return data || [];
    },
    enabled: search.length >= 2,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            {isAr ? "محادثة جديدة" : "New Conversation"}
          </DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isAr ? "ابحث عن مستخدم..." : "Search users..."}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="ps-9"
            autoFocus
          />
        </div>

        <ScrollArea className="max-h-[300px]">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : search.length < 2 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              {isAr ? "اكتب حرفين على الأقل للبحث" : "Type at least 2 characters to search"}
            </p>
          ) : users.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              {isAr ? "لا توجد نتائج" : "No users found"}
            </p>
          ) : (
            <div className="space-y-1 p-1">
              {users.map(u => (
                <button
                  key={u.user_id}
                  onClick={() => {
                    onSelectUser(u);
                    onOpenChange(false);
                    setSearch("");
                  }}
                  className="w-full flex items-center gap-3 rounded-lg p-3 hover:bg-accent transition-colors text-start"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={u.avatar_url || undefined} />
                    <AvatarFallback className="text-sm">
                      {(u.full_name || "U")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{u.full_name || "Unknown"}</p>
                    {u.username && (
                      <p className="text-xs text-muted-foreground">@{u.username}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
