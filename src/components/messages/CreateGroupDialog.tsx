import { useState, memo } from "react";
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
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Users, X, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (groupId: string) => void;
}

export const CreateGroupDialog = memo(function CreateGroupDialog({ open, onOpenChange, onCreated }: CreateGroupDialogProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const [groupName, setGroupName] = useState("");
  const [search, setSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Array<{ user_id: string; full_name: string | null; display_name: string | null; username: string | null; avatar_url: string | null }>>([]);
  const [creating, setCreating] = useState(false);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["searchUsersGroup", search],
    queryFn: async () => {
      if (!user || search.length < 2) return [];
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, display_name, username, avatar_url")
        .neq("user_id", user.id)
        .or(`full_name.ilike.%${search}%,username.ilike.%${search}%`)
        .limit(20);
      return data || [];
    },
    enabled: search.length >= 2,
  });

  const toggleUser = (u: typeof selectedUsers[0]) => {
    setSelectedUsers((prev) =>
      prev.some((s) => s.user_id === u.user_id)
        ? prev.filter((s) => s.user_id !== u.user_id)
        : [...prev, u]
    );
  };

  const handleCreate = async () => {
    if (!user || !groupName.trim() || selectedUsers.length === 0) return;
    setCreating(true);
    try {
      // Create group
      const { data: group, error: gErr } = await supabase
        .from("chat_groups")
        .insert({ name: groupName.trim(), created_by: user.id })
        .select()
        .single();
      if (gErr) throw gErr;

      // Add creator as admin + selected users as members
      const members = [
        { group_id: group.id, user_id: user.id, role: "admin" },
        ...selectedUsers.map((u) => ({ group_id: group.id, user_id: u.user_id, role: "member" })),
      ];
      const { error: mErr } = await supabase.from("chat_group_members").insert(members);
      if (mErr) throw mErr;

      toast({ title: isAr ? "تم إنشاء المجموعة" : "Group created" });
      onCreated(group.id);
      onOpenChange(false);
      setGroupName("");
      setSelectedUsers([]);
      setSearch("");
    } catch (err: any) {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: err.message });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {isAr ? "مجموعة جديدة" : "New Group"}
          </DialogTitle>
        </DialogHeader>

        <Input
          placeholder={isAr ? "اسم المجموعة" : "Group name"}
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />

        {/* Selected members */}
        {selectedUsers.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedUsers.map((u) => (
              <Badge key={u.user_id} variant="secondary" className="gap-1 pe-1">
                {u.display_name || u.full_name || u.username}
                <button onClick={() => toggleUser(u)} className="rounded-full hover:bg-muted p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isAr ? "ابحث عن أعضاء..." : "Search members..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9"
          />
        </div>

        <ScrollArea className="max-h-[250px]">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : search.length < 2 ? (
            <p className="text-center text-sm text-muted-foreground py-6">
              {isAr ? "اكتب حرفين على الأقل" : "Type at least 2 characters"}
            </p>
          ) : users.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">
              {isAr ? "لا توجد نتائج" : "No users found"}
            </p>
          ) : (
            <div className="space-y-1 p-1">
              {users.map((u) => {
                const selected = selectedUsers.some((s) => s.user_id === u.user_id);
                return (
                  <button
                    key={u.user_id}
                    onClick={() => toggleUser(u)}
                    className={`w-full flex items-center gap-3 rounded-xl p-2.5 transition-colors text-start ${
                      selected ? "bg-primary/10 ring-1 ring-primary/20" : "hover:bg-accent/50"
                    }`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={u.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">{(u.display_name || u.full_name || "U")[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{u.display_name || u.full_name || "Unknown"}</p>
                      {u.username && <p className="text-xs text-muted-foreground">@{u.username}</p>}
                    </div>
                    {selected && <Badge className="text-[10px]">{isAr ? "محدد" : "Added"}</Badge>}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <Button
          onClick={handleCreate}
          disabled={!groupName.trim() || selectedUsers.length === 0 || creating}
          className="w-full"
        >
          <Plus className="h-4 w-4 me-2" />
          {creating
            ? (isAr ? "جارٍ الإنشاء..." : "Creating...")
            : (isAr ? `إنشاء مجموعة (${selectedUsers.length} عضو)` : `Create Group (${selectedUsers.length} members)`)}
        </Button>
      </DialogContent>
    </Dialog>
  );
});
