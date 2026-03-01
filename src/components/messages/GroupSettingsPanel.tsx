import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Settings, UserMinus, Crown, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GroupSettingsPanelProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  group: any;
  members: any[];
  onAddMembers: () => void;
}

export function GroupSettingsPanel({ open, onOpenChange, group, members, onAddMembers }: GroupSettingsPanelProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [groupName, setGroupName] = useState(group?.name || "");

  const isAdmin = members.find((m) => m.user_id === user?.id)?.role === "admin" || group?.created_by === user?.id;

  const updateNameMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("chat_groups").update({ name: groupName, updated_at: new Date().toISOString() }).eq("id", group.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: isAr ? "تم تحديث اسم المجموعة" : "Group name updated" });
      queryClient.invalidateQueries({ queryKey: ["chatGroup", group.id] });
      queryClient.invalidateQueries({ queryKey: ["chatGroups"] });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase.from("chat_group_members").delete().eq("group_id", group.id).eq("user_id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: isAr ? "تم إزالة العضو" : "Member removed" });
      queryClient.invalidateQueries({ queryKey: ["chatGroupMembers", group.id] });
    },
  });

  const promoteToAdminMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase.from("chat_group_members").update({ role: "admin" }).eq("group_id", group.id).eq("user_id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: isAr ? "تمت ترقية العضو" : "Member promoted to admin" });
      queryClient.invalidateQueries({ queryKey: ["chatGroupMembers", group.id] });
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isAr ? "left" : "right"} className="w-80 p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {isAr ? "إعدادات المجموعة" : "Group Settings"}
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1 h-[calc(100vh-80px)]">
          <div className="p-4 space-y-4">
            {/* Group Name */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                {isAr ? "اسم المجموعة" : "Group Name"}
              </label>
              <div className="flex gap-2">
                <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} disabled={!isAdmin} className="flex-1" />
                {isAdmin && (
                  <Button size="icon" className="shrink-0" disabled={!groupName.trim() || groupName === group?.name || updateNameMutation.isPending} onClick={() => updateNameMutation.mutate()}>
                    {updateNameMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            {/* Members */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">
                  {isAr ? "الأعضاء" : "Members"} ({members.length})
                </label>
                {isAdmin && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onAddMembers}>
                    {isAr ? "إضافة" : "Add"}
                  </Button>
                )}
              </div>
              <div className="space-y-1">
                {members.map((m) => {
                  const profile = m.profile;
                  const isSelf = m.user_id === user?.id;
                  const isCreator = m.user_id === group?.created_by;
                  const isMemberAdmin = m.role === "admin";
                  return (
                    <div key={m.user_id} className="flex items-center gap-2 rounded-xl p-2 hover:bg-muted/50 transition-colors">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">{(profile?.display_name || profile?.full_name || "U")[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {isSelf ? (isAr ? "أنت" : "You") : (profile?.display_name || profile?.full_name || profile?.username || "Unknown")}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {isCreator && <Badge variant="outline" className="text-[9px] px-1.5 py-0"><Crown className="h-2.5 w-2.5 me-0.5" />{isAr ? "مالك" : "Owner"}</Badge>}
                        {isMemberAdmin && !isCreator && <Badge variant="secondary" className="text-[9px] px-1.5 py-0">{isAr ? "مشرف" : "Admin"}</Badge>}
                        {isAdmin && !isSelf && !isCreator && (
                          <div className="flex gap-0.5">
                            {!isMemberAdmin && (
                              <Button variant="ghost" size="icon" className="h-6 w-6" title={isAr ? "ترقية" : "Promote"} onClick={() => promoteToAdminMutation.mutate(m.user_id)}>
                                <Crown className="h-3 w-3" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" title={isAr ? "إزالة" : "Remove"} onClick={() => removeMemberMutation.mutate(m.user_id)}>
                              <UserMinus className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
