import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { uploadMessageAttachment } from "@/utils/storageUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Send, ArrowLeft, Users, MoreVertical, UserPlus, LogOut, Paperclip, FileText, Trash2, Settings } from "lucide-react";
import { EmojiPicker } from "@/components/messages/EmojiPicker";
import { MessageAttachments } from "@/components/messages/MessageAttachments";
import { VoiceMessageRecorder } from "@/components/messages/VoiceMessageRecorder";
import { VoiceMessagePlayer } from "@/components/messages/VoiceMessagePlayer";
import { AddGroupMembersDialog } from "@/components/messages/AddGroupMembersDialog";
import { GroupSettingsPanel } from "@/components/messages/GroupSettingsPanel";
import { useToast } from "@/hooks/use-toast";
import { format, isToday, isYesterday } from "date-fns";
import { ar, enUS } from "date-fns/locale";

interface GroupChatViewProps {
  groupId: string;
  onBack: () => void;
}

export function GroupChatView({ groupId, onBack }: GroupChatViewProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [addMembersOpen, setAddMembersOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch group info + members
  const { data: group } = useQuery({
    queryKey: ["chatGroup", groupId],
    queryFn: async () => {
      const { data } = await supabase.from("chat_groups").select("id, name, name_ar, avatar_url, created_by, created_at, updated_at").eq("id", groupId).single();
      return data;
    },
  });

  const { data: members = [] } = useQuery({
    queryKey: ["chatGroupMembers", groupId],
    queryFn: async () => {
      const { data: memberRows } = await supabase
        .from("chat_group_members")
        .select("id, group_id, user_id, role, joined_at")
        .eq("group_id", groupId);
      if (!memberRows) return [];
      const userIds = memberRows.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, display_name, username, avatar_url")
        .in("user_id", userIds);
      return memberRows.map((m) => ({
        ...m,
        profile: profiles?.find((p) => p.user_id === m.user_id),
      }));
    },
  });

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["chatGroupMessages", groupId],
    queryFn: async () => {
      const { data } = await supabase
        .from("chat_group_messages")
        .select("id, group_id, sender_id, content, message_type, attachment_urls, attachment_names, metadata, created_at")
        .eq("group_id", groupId)
        .order("created_at", { ascending: true })
        .limit(200);
      return data || [];
    },
    refetchInterval: 5000,
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`group:${groupId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_group_messages", filter: `group_id=eq.${groupId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["chatGroupMessages", groupId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [groupId, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: async (payload: { content: string; message_type?: string; attachment_urls?: string[]; attachment_names?: string[]; metadata?: Record<string, any> }) => {
      if (!user) throw new Error("Not logged in");
      const { error } = await supabase.from("chat_group_messages").insert({
        group_id: groupId,
        sender_id: user.id,
        content: payload.content,
        message_type: payload.message_type || "text",
        attachment_urls: payload.attachment_urls || [],
        attachment_names: payload.attachment_names || [],
        metadata: payload.metadata || {},
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["chatGroupMessages", groupId] });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      await supabase.from("chat_group_members").delete().eq("group_id", groupId).eq("user_id", user.id);
    },
    onSuccess: () => {
      toast({ title: isAr ? "غادرت المجموعة" : "Left group" });
      queryClient.invalidateQueries({ queryKey: ["chatGroups"] });
      onBack();
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMutation.mutate({ content: newMessage.trim() });
    }
  };

  const getSenderName = (senderId: string) => {
    const m = members.find((mem) => mem.user_id === senderId);
    return m?.profile?.display_name || m?.profile?.full_name || m?.profile?.username || "Unknown";
  };

  const getSenderAvatar = (senderId: string) => {
    const m = members.find((mem) => mem.user_id === senderId);
    return m?.profile?.avatar_url;
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const locale = isAr ? ar : enUS;
    if (isToday(d)) return format(d, "h:mm a", { locale });
    if (isYesterday(d)) return `${isAr ? "أمس" : "Yesterday"} ${format(d, "h:mm a", { locale })}`;
    return format(d, "MMM d, h:mm a", { locale });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border/40 p-3 flex items-center gap-3 bg-muted/5">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
          <Users className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{group?.name || "Group"}</p>
          <p className="text-[11px] text-muted-foreground">
            {members.length} {isAr ? "عضو" : "members"}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setAddMembersOpen(true)}>
              <UserPlus className="h-4 w-4 me-2" />
              {isAr ? "إضافة أعضاء" : "Add Members"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
              <Settings className="h-4 w-4 me-2" />
              {isAr ? "إعدادات المجموعة" : "Group Settings"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => leaveMutation.mutate()} className="text-destructive">
              <LogOut className="h-4 w-4 me-2" />
              {isAr ? "مغادرة المجموعة" : "Leave Group"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Members bar */}
      <div className="border-b border-border/20 px-3 py-2 flex gap-1 overflow-x-auto">
        {members.map((m) => (
          <div key={m.user_id} className="flex flex-col items-center gap-0.5 px-1.5">
            <Avatar className="h-7 w-7">
              <AvatarImage src={m.profile?.avatar_url || undefined} />
              <AvatarFallback className="text-[10px]">{(m.profile?.display_name || m.profile?.full_name || "U")[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-[9px] text-muted-foreground truncate max-w-[50px]">
              {m.user_id === user?.id ? (isAr ? "أنت" : "You") : ((m.profile?.display_name || m.profile?.full_name)?.split(" ")[0] || "")}
            </span>
          </div>
        ))}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-2/3" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => {
              const isMine = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[75%]">
                    {!isMine && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={getSenderAvatar(msg.sender_id) || undefined} />
                          <AvatarFallback className="text-[8px]">{getSenderName(msg.sender_id)[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-[11px] font-medium text-muted-foreground">{getSenderName(msg.sender_id)}</span>
                      </div>
                    )}
                    <div className={`rounded-2xl px-3.5 py-2 ${isMine ? "bg-primary text-primary-foreground rounded-ee-md" : "bg-muted rounded-es-md"}`}>
                      {msg.message_type === "audio" && msg.attachment_urls?.[0] ? (
                        <VoiceMessagePlayer url={msg.attachment_urls[0]} isMine={isMine} />
                      ) : (
                        <p className="text-sm break-words">{msg.content}</p>
                      )}
                      {msg.attachment_urls && msg.attachment_urls.length > 0 && msg.message_type !== "audio" && (
                        <MessageAttachments urls={msg.attachment_urls} names={msg.attachment_names || []} messageType={msg.message_type} />
                      )}
                      <p className={`text-[10px] mt-1 ${isMine ? "text-primary-foreground/60 text-end" : "text-muted-foreground"}`}>
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t p-3">
        <div className="flex gap-2 items-end">
          <div className="flex gap-1">
            <EmojiPicker onEmojiSelect={(emoji) => setNewMessage((p) => p + emoji)} />
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" type="button" onClick={() => fileInputRef.current?.click()}>
              <Paperclip className="h-4 w-4 text-muted-foreground" />
            </Button>
            <VoiceMessageRecorder
              disabled={sendMutation.isPending || uploading}
              onSend={async (blob, dur) => {
                setUploading(true);
                try {
                  const filePath = `groups/${groupId}/${Date.now()}-voice.webm`;
                  const signedUrl = await uploadMessageAttachment(filePath, blob);
                  sendMutation.mutate({
                    content: isAr ? "🎤 رسالة صوتية" : "🎤 Voice message",
                    message_type: "audio",
                    attachment_urls: [signedUrl],
                    attachment_names: ["voice.webm"],
                    metadata: { duration: dur },
                  });
                } catch (err: any) {
                  toast({ variant: "destructive", title: isAr ? "فشل" : "Failed", description: err.message });
                } finally {
                  setUploading(false);
                }
              }}
            />
          </div>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isAr ? "اكتب رسالة..." : "Type a message..."}
            className="flex-1 h-9 text-sm"
          />
          <Button type="submit" size="sm" disabled={!newMessage.trim() || sendMutation.isPending}>
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
        <input ref={fileInputRef} type="file" className="hidden" multiple accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt,.zip" onChange={async (e) => {
          const files = Array.from(e.target.files || []);
          if (files.length === 0) return;
          setUploading(true);
          try {
            const urls: string[] = [];
            const names: string[] = [];
            for (const file of files) {
              const path = `groups/${groupId}/${Date.now()}-${file.name}`;
              const signedUrl = await uploadMessageAttachment(path, file);
              urls.push(signedUrl);
              names.push(file.name);
            }
            sendMutation.mutate({ content: isAr ? "مرفق" : "Attachment", message_type: "file", attachment_urls: urls, attachment_names: names });
          } catch (err: any) {
            toast({ variant: "destructive", title: isAr ? "فشل" : "Failed", description: err.message });
          } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }
        }} />
      </form>

      {/* Add Members Dialog */}
      <AddGroupMembersDialog
        open={addMembersOpen}
        onOpenChange={setAddMembersOpen}
        groupId={groupId}
        existingMemberIds={members.map((m) => m.user_id)}
      />

      {/* Group Settings Panel */}
      {group && (
        <GroupSettingsPanel
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          group={group}
          members={members}
          onAddMembers={() => { setSettingsOpen(false); setAddMembersOpen(true); }}
        />
      )}
    </div>
  );
}
