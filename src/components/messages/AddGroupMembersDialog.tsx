import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, UserPlus, Loader2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AddGroupMembersDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  groupId: string;
  existingMemberIds: string[];
}

export function AddGroupMembersDialog({ open, onOpenChange, groupId, existingMemberIds }: AddGroupMembersDialogProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["addGroupMembers", search],
    queryFn: async () => {
      if (search.length < 2) return [];
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, display_name, username, avatar_url")
        .or(`full_name.ilike.%${search}%,username.ilike.%${search}%,display_name.ilike.%${search}%`)
        .not("user_id", "in", `(${existingMemberIds.join(",")})`)
        .limit(20);
      return data || [];
    },
    enabled: open && search.length >= 2,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const rows = selected.map((uid) => ({ group_id: groupId, user_id: uid, role: "member" }));
      const { error } = await supabase.from("chat_group_members").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: isAr ? "تمت إضافة الأعضاء" : "Members added" });
      queryClient.invalidateQueries({ queryKey: ["chatGroupMembers", groupId] });
      setSelected([]);
      setSearch("");
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: isAr ? "فشل" : "Failed", description: err.message });
    },
  });

  const toggle = (uid: string) => {
    setSelected((prev) => prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isAr ? "إضافة أعضاء" : "Add Members"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={isAr ? "ابحث عن مستخدم..." : "Search users..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-9"
            />
          </div>

          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selected.map((uid) => {
                const u = users.find((u) => u.user_id === uid);
                return (
                  <Badge key={uid} variant="secondary" className="gap-1 cursor-pointer" onClick={() => toggle(uid)}>
                    {u?.display_name || u?.full_name || u?.username || uid.slice(0, 6)}
                    <span className="text-muted-foreground">×</span>
                  </Badge>
                );
              })}
            </div>
          )}

          <ScrollArea className="max-h-60">
            {isLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : users.length === 0 && search.length >= 2 ? (
              <p className="text-center text-sm text-muted-foreground py-4">{isAr ? "لا نتائج" : "No results"}</p>
            ) : (
              <div className="space-y-1">
                {users.map((u) => {
                  const isSelected = selected.includes(u.user_id);
                  return (
                    <button
                      key={u.user_id}
                      onClick={() => toggle(u.user_id)}
                      className={`w-full flex items-center gap-3 rounded-lg p-2 text-start transition-colors ${isSelected ? "bg-primary/10" : "hover:bg-muted"}`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={u.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">{(u.display_name || u.full_name || "U")[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{u.display_name || u.full_name || u.username}</p>
                        {u.username && <p className="text-xs text-muted-foreground">@{u.username}</p>}
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          <Button onClick={() => addMutation.mutate()} disabled={selected.length === 0 || addMutation.isPending} className="w-full">
            <UserPlus className="h-4 w-4 me-2" />
            {isAr ? `إضافة ${selected.length} عضو` : `Add ${selected.length} member(s)`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
