import { useState, useMemo, memo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Forward, Search, Loader2, Check } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { getDisplayName, getDisplayInitial } from "@/lib/getDisplayName";
import { toast } from "sonner";

interface ForwardMessageDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  message: { content: string; message_type: string; attachment_urls?: string[]; attachment_names?: string[] } | null;
}

export const ForwardMessageDialog = memo(function ForwardMessageDialog({ open, onOpenChange, message }: ForwardMessageDialogProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [sent, setSent] = useState<Set<string>>(new Set());

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["forward-contacts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      // Get recent conversation partners
      const { data: messages } = await supabase
        .from("messages")
        .select("sender_id, receiver_id")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(200);

      const ids = new Set<string>();
      messages?.forEach((m: any) => {
        if (m.sender_id !== user.id) ids.add(m.sender_id);
        if (m.receiver_id !== user.id) ids.add(m.receiver_id);
      });

      if (ids.size === 0) return [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, full_name, full_name_ar, display_name, display_name_ar, avatar_url")
        .in("user_id", Array.from(ids));
      return profiles || [];
    },
    enabled: !!user && open,
  });

  const forwardMutation = useMutation({
    mutationFn: async (receiverId: string) => {
      if (!user || !message) throw new Error("Not ready");
      await supabase.from("messages").insert({
        sender_id: user.id,
        receiver_id: receiverId,
        content: `↪️ ${message.content}`,
        message_type: message.message_type,
        attachment_urls: message.attachment_urls || [],
        attachment_names: message.attachment_names || [],
        metadata: { forwarded: true },
      });
    },
    onSuccess: (_, receiverId) => {
      setSent((prev) => new Set(prev).add(receiverId));
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast.success(isAr ? "تم إعادة التوجيه" : "Message forwarded");
    },
  });

  const filtered = useMemo(() => contacts.filter((c: any) => {
    if (!search) return true;
    const name = (c.full_name || c.username || "").toLowerCase();
    return name.includes(search.toLowerCase());
  }), [contacts, search]);

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setSearch(""); setSent(new Set()); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Forward className="h-4 w-4" />
            {isAr ? "إعادة توجيه الرسالة" : "Forward Message"}
          </DialogTitle>
        </DialogHeader>

        {message && (
          <div className="rounded-xl bg-muted/50 p-3 mb-3">
            <p className="text-xs text-muted-foreground truncate">{message.content}</p>
          </div>
        )}

        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? "بحث..." : "Search..."}
            className="ps-9"
          />
        </div>

        <ScrollArea className="max-h-64">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((c: any) => {
                const isSent = sent.has(c.user_id);
                return (
                  <div key={c.user_id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-muted/50 transition-colors">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={c.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">{getDisplayInitial(c, isAr)}</AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-sm font-medium truncate">{getDisplayName(c, isAr, "Unknown")}</span>
                    <Button
                      size="sm"
                      variant={isSent ? "secondary" : "default"}
                      className="h-7 text-xs px-3"
                      disabled={isSent || forwardMutation.isPending}
                      onClick={() => forwardMutation.mutate(c.user_id)}
                    >
                      {isSent ? <Check className="h-3.5 w-3.5" /> : isAr ? "إرسال" : "Send"}
                    </Button>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-6">
                  {isAr ? "لا توجد محادثات" : "No contacts found"}
                </p>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
