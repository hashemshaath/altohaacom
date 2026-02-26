import { RefObject } from "react";
import { getDisplayName, getDisplayInitial } from "@/lib/getDisplayName";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { EmojiPicker } from "@/components/messages/EmojiPicker";
import { MessageAttachments } from "@/components/messages/MessageAttachments";
import { ApprovalMessage } from "@/components/messages/ApprovalMessage";
import { TypingIndicator } from "@/components/messages/TypingIndicator";
import { MessageStatus } from "@/components/messages/MessageStatus";
import { VoiceMessageRecorder } from "@/components/messages/VoiceMessageRecorder";
import { VoiceMessagePlayer } from "@/components/messages/VoiceMessagePlayer";
import { ChatSearchBar } from "@/components/messages/ChatSearchBar";
import { MessageReactions } from "@/components/messages/MessageReactions";
import {
  Send, ArrowLeft, MoreVertical, Search, CheckSquare,
  Paperclip, Star, Link2, Image, Film, Music, FileText, Trash2, MessageSquare,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Message, ConversationPartner } from "@/hooks/useMessagesData";

interface ChatAreaProps {
  user: any;
  isAr: boolean;
  selectedPartner: ConversationPartner | null;
  messages: Message[] | undefined;
  loadingMessages: boolean;
  newMessage: string;
  setNewMessage: (v: string) => void;
  pendingFiles: File[];
  setPendingFiles: React.Dispatch<React.SetStateAction<File[]>>;
  uploading: boolean;
  chatSearchOpen: boolean;
  setChatSearchOpen: (v: boolean) => void;
  highlightedMsgId: string | null;
  setHighlightedMsgId: (id: string | null) => void;
  partnerTyping: boolean;
  isOnline: (id: string) => boolean;
  messagesEndRef: RefObject<HTMLDivElement>;
  fileInputRef: RefObject<HTMLInputElement>;
  // Handlers
  handleSend: (e: React.FormEvent) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setIsApprovalOpen: (v: boolean) => void;
  onBack: () => void;
  // Mutations
  sendMessage: any;
  toggleStarMutation: any;
}

function formatMessageDate(date: string, isAr: boolean) {
  const d = new Date(date);
  const locale = isAr ? ar : enUS;
  if (isToday(d)) return format(d, "h:mm a", { locale });
  if (isYesterday(d)) return `${isAr ? "أمس" : "Yesterday"} ${format(d, "h:mm a", { locale })}`;
  return format(d, "MMM d, h:mm a", { locale });
}

function getMessageTypeIcon(type: string) {
  switch (type) {
    case "image": return <Image className="h-3 w-3" />;
    case "video": return <Film className="h-3 w-3" />;
    case "audio": return <Music className="h-3 w-3" />;
    case "file": return <FileText className="h-3 w-3" />;
    case "approval_request":
    case "approval_response": return <CheckSquare className="h-3 w-3" />;
    default: return null;
  }
}

function renderContent(msg: Message) {
  if (msg.message_type === "link" || msg.message_type === "text") {
    const parts = msg.content.split(/(https?:\/\/[^\s]+)/g);
    return (
      <p className="text-sm break-words">
        {parts.map((part, i) =>
          /^https?:\/\//.test(part) ? (
            <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-0.5">
              <Link2 className="h-3 w-3 inline" />
              {part.length > 40 ? part.substring(0, 40) + "..." : part}
            </a>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </p>
    );
  }
  return <p className="text-sm break-words">{msg.content}</p>;
}

export function ChatArea({
  user, isAr, selectedPartner, messages, loadingMessages,
  newMessage, setNewMessage, pendingFiles, setPendingFiles, uploading,
  chatSearchOpen, setChatSearchOpen, highlightedMsgId, setHighlightedMsgId,
  partnerTyping, isOnline, messagesEndRef, fileInputRef,
  handleSend, handleFileSelect, handleInputChange,
  setIsApprovalOpen, onBack, sendMessage, toggleStarMutation,
}: ChatAreaProps) {
  const { toast } = useToast();

  if (!selectedPartner) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-8">
        <div>
          <MessageSquare className="mx-auto h-14 w-14 text-muted-foreground/20 mb-4" />
          <h3 className="font-semibold">{isAr ? "اختر محادثة" : "Select a conversation"}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {isAr ? "اختر محادثة من القائمة لبدء المراسلة" : "Choose a conversation from the list to start messaging"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Chat Header */}
      <div className="border-b border-border/40 p-3 flex items-center gap-3 bg-muted/5 backdrop-blur-sm">
        <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="relative">
          <Avatar className="h-9 w-9">
            <AvatarImage src={selectedPartner.avatar_url || undefined} />
            <AvatarFallback className="text-sm">{getDisplayInitial(selectedPartner, isAr)}</AvatarFallback>
          </Avatar>
          {isOnline(selectedPartner.user_id) && (
            <div className="absolute bottom-0 end-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-primary" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">
            {getDisplayName(selectedPartner, isAr, "Unknown")}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {partnerTyping
              ? isAr ? "يكتب..." : "typing..."
              : isOnline(selectedPartner.user_id)
              ? isAr ? "متصل" : "online"
              : selectedPartner.username ? `@${selectedPartner.username}` : ""}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setChatSearchOpen(true)}>
              <Search className="h-4 w-4 me-2" />
              {isAr ? "بحث في الرسائل" : "Search Messages"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsApprovalOpen(true)}>
              <CheckSquare className="h-4 w-4 me-2" />
              {isAr ? "طلب موافقة" : "Request Approval"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
              <Paperclip className="h-4 w-4 me-2" />
              {isAr ? "إرفاق ملف" : "Attach File"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* In-Chat Search */}
      {chatSearchOpen && messages && (
        <ChatSearchBar
          messages={messages}
          onHighlight={(id) => {
            setHighlightedMsgId(id);
            if (id) {
              document.getElementById(`msg-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }}
          onClose={() => { setChatSearchOpen(false); setHighlightedMsgId(null); }}
        />
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {loadingMessages ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-2/3" />)}
          </div>
        ) : (
          <div className="space-y-3">
            {messages?.map((msg) => {
              const isMine = msg.sender_id === user?.id;
              const isApproval = msg.message_type === "approval_request" || msg.message_type === "approval_response";

              return (
                <div key={msg.id} id={`msg-${msg.id}`} className={`group flex ${isMine ? "justify-end" : "justify-start"} animate-fade-in ${highlightedMsgId === msg.id ? "ring-2 ring-primary/40 rounded-2xl" : ""}`}>
                  <div className="relative max-w-[75%]">
                    <div className={`absolute top-0 ${isMine ? "start-0 -translate-x-full" : "end-0 translate-x-full"} opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5 px-1`}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => toggleStarMutation.mutate({ msgId: msg.id, starred: !msg.is_starred })}
                      >
                        <Star className={`h-3 w-3 ${msg.is_starred ? "text-chart-4 fill-chart-4" : ""}`} />
                      </Button>
                    </div>

                    <div className={`rounded-2xl px-3.5 py-2 transition-all duration-200 hover:shadow-md ${
                      isMine ? "bg-primary text-primary-foreground rounded-ee-md" : "bg-muted rounded-es-md"
                    }`}>
                      {msg.is_starred && (
                        <Star className={`h-3 w-3 mb-1 ${isMine ? "text-primary-foreground/60" : "text-chart-4"} fill-current`} />
                      )}

                      {isApproval ? (
                        <ApprovalMessage messageId={msg.id} senderId={msg.sender_id} receiverId={msg.receiver_id} metadata={msg.metadata || {}} isMine={isMine} />
                      ) : msg.message_type === "audio" && msg.attachment_urls?.[0] ? (
                        <VoiceMessagePlayer url={msg.attachment_urls[0]} isMine={isMine} />
                      ) : (
                        renderContent(msg)
                      )}

                      {msg.attachment_urls && msg.attachment_urls.length > 0 && (
                        <MessageAttachments urls={msg.attachment_urls} names={msg.attachment_names || []} messageType={msg.message_type} />
                      )}

                      <div className={`flex items-center gap-1 mt-1 text-[10px] ${isMine ? "text-primary-foreground/60 justify-end" : "text-muted-foreground"}`}>
                        {msg.message_type !== "text" && msg.message_type !== "link" && getMessageTypeIcon(msg.message_type)}
                        <span>{formatMessageDate(msg.created_at, isAr)}</span>
                        <MessageStatus isMine={isMine} isRead={msg.is_read} readAt={msg.read_at} createdAt={msg.created_at} />
                      </div>
                    </div>
                    {/* Message Reactions */}
                    <MessageReactions
                      reactions={(msg.metadata as any)?.reactions || {}}
                      currentUserId={user?.id || ""}
                      isMine={isMine}
                      onReact={(emoji) => {
                        const currentReactions = ((msg.metadata as any)?.reactions || {}) as Record<string, string[]>;
                        const userIds = currentReactions[emoji] || [];
                        const alreadyReacted = userIds.includes(user?.id || "");
                        const newUserIds = alreadyReacted
                          ? userIds.filter((id: string) => id !== user?.id)
                          : [...userIds, user?.id || ""];
                        const newReactions = { ...currentReactions };
                        if (newUserIds.length === 0) delete newReactions[emoji];
                        else newReactions[emoji] = newUserIds;
                        
                        supabase
                          .from("messages")
                          .update({ metadata: { ...((msg.metadata as any) || {}), reactions: newReactions } })
                          .eq("id", msg.id)
                          .then();
                      }}
                    />
                  </div>
                </div>
              );
            })}
            {partnerTyping && (
              <TypingIndicator partnerName={getDisplayName(selectedPartner, isAr) || undefined} />
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Pending Files Preview */}
      {pendingFiles.length > 0 && (
        <div className="border-t px-3 py-2 flex gap-2 overflow-x-auto">
          {pendingFiles.map((f, i) => (
            <div key={i} className="flex items-center gap-1.5 rounded-lg bg-muted px-2 py-1 text-xs shrink-0">
              <FileText className="h-3 w-3" />
              <span className="max-w-[120px] truncate">{f.name}</span>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setPendingFiles((prev) => prev.filter((_, j) => j !== i))}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Message Input */}
      <form onSubmit={handleSend} className="border-t p-3">
        <div className="flex gap-2 items-end">
          <div className="flex gap-1">
            <EmojiPicker onEmojiSelect={(emoji) => setNewMessage(newMessage + emoji)} />
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" type="button" onClick={() => fileInputRef.current?.click()}>
              <Paperclip className="h-4 w-4 text-muted-foreground" />
            </Button>
            <VoiceMessageRecorder
              disabled={sendMessage.isPending || uploading}
              onSend={async (blob, dur) => {
                try {
                  const filePath = `${user!.id}/${Date.now()}-voice.webm`;
                  const { error } = await supabase.storage.from("message-attachments").upload(filePath, blob);
                  if (error) throw error;
                  const { data: urlData } = supabase.storage.from("message-attachments").getPublicUrl(filePath);
                  sendMessage.mutate({
                    content: isAr ? "🎤 رسالة صوتية" : "🎤 Voice message",
                    message_type: "audio",
                    attachment_urls: [urlData.publicUrl],
                    attachment_names: ["voice.webm"],
                    metadata: { duration: dur },
                  });
                } catch (err: any) {
                  toast({ variant: "destructive", title: isAr ? "فشل الرفع" : "Upload failed", description: err.message });
                }
              }}
            />
          </div>
          <Input
            value={newMessage}
            onChange={handleInputChange}
            placeholder={isAr ? "اكتب رسالة..." : "Type a message..."}
            className="flex-1 h-9 text-sm"
          />
          <Button type="submit" size="sm" disabled={(!newMessage.trim() && pendingFiles.length === 0) || sendMessage.isPending || uploading}>
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt,.zip"
          onChange={handleFileSelect}
        />
      </form>
    </>
  );
}
