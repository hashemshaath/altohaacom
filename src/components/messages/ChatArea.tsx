import { RefObject, useState, useCallback, useMemo } from "react";
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
import { ReplyPreview } from "@/components/messages/ReplyPreview";
import { ForwardMessageDialog } from "@/components/messages/ForwardMessageDialog";
import { PinnedMessagesBar } from "@/components/messages/PinnedMessagesBar";
import { LocationShareButton, LocationBubble } from "@/components/messages/LocationShareButton";
import { MediaPreviewOverlay } from "@/components/messages/MediaPreviewOverlay";
import { QuickReplySuggestions } from "@/components/messages/QuickReplySuggestions";
import { UnreadDivider } from "@/components/messages/UnreadDivider";
import { LastSeenLabel } from "@/components/messages/LastSeenLabel";
import {
  Send, ArrowLeft, MoreVertical, Search, CheckSquare,
  Paperclip, Star, Link2, Image, Film, Music, FileText, Trash2, MessageSquare,
  Plus, X, Smile, Phone, Video, Reply, Forward, Pin,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { uploadMessageAttachment } from "@/utils/storageUtils";
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
  handleSend: (e: React.FormEvent) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setIsApprovalOpen: (v: boolean) => void;
  onBack: () => void;
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

function getDateLabel(date: string, isAr: boolean): string {
  const d = new Date(date);
  if (isToday(d)) return isAr ? "اليوم" : "Today";
  if (isYesterday(d)) return isAr ? "أمس" : "Yesterday";
  const locale = isAr ? ar : enUS;
  return format(d, "EEEE, MMMM d, yyyy", { locale });
}

function shouldShowDateSeparator(messages: Message[], index: number): boolean {
  if (index === 0) return true;
  const prev = new Date(messages[index - 1].created_at).toDateString();
  const curr = new Date(messages[index].created_at).toDateString();
  return prev !== curr;
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
      <p className="text-sm break-words leading-relaxed">
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
  return <p className="text-sm break-words leading-relaxed">{msg.content}</p>;
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
  const [replyTo, setReplyTo] = useState<{ id: string; content: string; senderName: string } | null>(null);
  const [forwardMsg, setForwardMsg] = useState<Message | null>(null);
  const [mediaPreview, setMediaPreview] = useState<{ urls: string[]; index: number } | null>(null);

  const pinnedMessages = useMemo(() => (messages || []).filter((m) => (m as any).is_pinned), [messages]);

  // Compute unread divider position
  const firstUnreadIdx = useMemo(() => {
    if (!messages || !user) return -1;
    return messages.findIndex((m) => m.receiver_id === user.id && !m.is_read);
  }, [messages, user]);

  const unreadCount = useMemo(() => {
    if (!messages || !user) return 0;
    return messages.filter((m) => m.receiver_id === user.id && !m.is_read).length;
  }, [messages, user]);

  // Last received message for quick reply context
  const lastReceivedMsg = useMemo(() => {
    if (!messages || !user) return null;
    const received = messages.filter((m) => m.sender_id !== user.id);
    return received.length > 0 ? received[received.length - 1] : null;
  }, [messages, user]);

  const handleDeleteMessage = useCallback(async (msgId: string) => {
    const { error } = await supabase.from("messages").delete().eq("id", msgId);
    if (!error) {
      toast({ title: isAr ? "تم حذف الرسالة" : "Message deleted" });
    }
  }, [isAr, toast]);

  const handlePin = useCallback(async (msgId: string, pin: boolean) => {
    await supabase.from("messages").update({ is_pinned: pin } as any).eq("id", msgId);
    toast({ title: pin ? (isAr ? "تم تثبيت الرسالة" : "Message pinned") : (isAr ? "تم إلغاء التثبيت" : "Message unpinned") });
  }, [isAr, toast]);

  const handleShareLocation = useCallback((loc: { lat: number; lng: number; label: string }) => {
    sendMessage.mutate({
      content: `📍 ${loc.label}`,
      message_type: "location",
      metadata: { location: loc },
    });
  }, [sendMessage]);

  const handleReply = useCallback((msg: Message) => {
    const senderName = msg.sender_id === user?.id
      ? (isAr ? "أنت" : "You")
      : getDisplayName(selectedPartner, isAr, "Unknown");
    setReplyTo({ id: msg.id, content: msg.content.substring(0, 120), senderName });
  }, [user?.id, isAr, selectedPartner]);

  const handleSendWithReply = useCallback((e: React.FormEvent) => {
    if (replyTo) {
      e.preventDefault();
      if (!newMessage.trim() && pendingFiles.length === 0) return;
      sendMessage.mutate({
        content: newMessage.trim() || (isAr ? "رد" : "Reply"),
        message_type: "text",
        metadata: { reply_to: replyTo },
      });
      setNewMessage("");
      setReplyTo(null);
      return;
    }
    handleSend(e);
  }, [replyTo, handleSend, newMessage, pendingFiles, sendMessage, isAr, setNewMessage]);

  if (!selectedPartner) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-8 bg-gradient-to-b from-muted/5 to-background">
        <div className="max-w-xs space-y-5">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 shadow-lg shadow-primary/10 ring-1 ring-primary/10">
            <MessageSquare className="h-10 w-10 text-primary/60" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight">{isAr ? "مرحباً بك في الرسائل" : "Welcome to Messages"}</h3>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              {isAr ? "اختر محادثة من القائمة أو ابدأ محادثة جديدة" : "Select a conversation or start a new one"}
            </p>
          </div>
          <div className="flex flex-col gap-2.5 pt-2">
            <div className="flex items-center gap-3 rounded-2xl border border-border/30 bg-card/50 p-4 text-start transition-all hover:bg-card/80 hover:shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                <Send className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold">{isAr ? "رسائل فورية" : "Instant Messages"}</p>
                <p className="text-[11px] text-muted-foreground">{isAr ? "تواصل مع زملائك مباشرة" : "Connect with peers directly"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-border/30 bg-card/50 p-4 text-start transition-all hover:bg-card/80 hover:shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                <Paperclip className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold">{isAr ? "ملفات ووسائط" : "Files & Media"}</p>
                <p className="text-[11px] text-muted-foreground">{isAr ? "شارك الصور والملفات والمقاطع" : "Share images, files & recordings"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Chat Header */}
      <div className="border-b border-border/30 p-2.5 sm:p-3 flex items-center gap-2.5 sm:gap-3 bg-card/80 backdrop-blur-sm">
        <Button variant="ghost" size="icon" className="md:hidden h-9 w-9 rounded-xl touch-manipulation active:scale-90" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="relative">
          <Avatar className="h-10 w-10 rounded-xl border-2 border-background shadow-sm">
            <AvatarImage src={selectedPartner.avatar_url || undefined} className="rounded-xl" />
            <AvatarFallback className="rounded-xl text-sm font-bold">{getDisplayInitial(selectedPartner, isAr)}</AvatarFallback>
          </Avatar>
          {isOnline(selectedPartner.user_id) && (
            <div className="absolute -bottom-0.5 -end-0.5 h-3 w-3 rounded-full border-2 border-card bg-chart-2" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold truncate">
            {getDisplayName(selectedPartner, isAr, "Unknown")}
          </p>
          <p className="text-[11px] text-muted-foreground">
            <LastSeenLabel
              userId={selectedPartner.user_id}
              isOnline={isOnline(selectedPartner.user_id)}
              isTyping={partnerTyping}
              isAr={isAr}
              username={selectedPartner.username}
            />
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl w-48">
            <DropdownMenuItem onClick={() => setChatSearchOpen(true)} className="rounded-xl gap-2 text-xs">
              <Search className="h-3.5 w-3.5" />
              {isAr ? "بحث في الرسائل" : "Search Messages"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsApprovalOpen(true)} className="rounded-xl gap-2 text-xs">
              <CheckSquare className="h-3.5 w-3.5" />
              {isAr ? "طلب موافقة" : "Request Approval"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="rounded-xl gap-2 text-xs">
              <Paperclip className="h-3.5 w-3.5" />
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

      {/* Pinned Messages Bar */}
      <PinnedMessagesBar
        pinnedMessages={pinnedMessages}
        isAr={isAr}
        onUnpin={(id) => handlePin(id, false)}
        onJumpTo={(id) => {
          setHighlightedMsgId(id);
          document.getElementById(`msg-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        }}
      />

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-background to-muted/5">
        {loadingMessages ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                <Skeleton className={`h-14 rounded-2xl ${i % 2 === 0 ? "w-1/2" : "w-2/3"}`} />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {messages?.map((msg, idx) => {
              const isMine = msg.sender_id === user?.id;
              const isApproval = msg.message_type === "approval_request" || msg.message_type === "approval_response";
              const isLocation = msg.message_type === "location";
              const hasImages = msg.attachment_urls?.length > 0 && (msg.message_type === "image" || msg.message_type === "video");
              const showDate = shouldShowDateSeparator(messages, idx);

              return (
                <div key={msg.id}>
                  {/* Date Separator */}
                  {showDate && (
                    <div className="flex items-center gap-3 py-4">
                      <div className="flex-1 h-px bg-border/30" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 bg-background px-3 py-1 rounded-full border border-border/20">
                        {getDateLabel(msg.created_at, isAr)}
                      </span>
                      <div className="flex-1 h-px bg-border/30" />
                    </div>
                  )}

                  <div id={`msg-${msg.id}`} className={`group flex ${isMine ? "justify-end" : "justify-start"} animate-fade-in ${highlightedMsgId === msg.id ? "ring-2 ring-primary/30 rounded-2xl bg-primary/5 p-1.5 -m-1.5 transition-all duration-500" : ""}`}>
                    <div className="relative max-w-[75%]">
                      <div className={`absolute top-0 ${isMine ? "start-0 -translate-x-full" : "end-0 translate-x-full"} opacity-0 group-hover:opacity-100 transition-all duration-200 flex gap-0.5 px-1`}>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl hover:bg-primary/10" title={isAr ? "رد" : "Reply"} onClick={() => handleReply(msg)}>
                          <Reply className="h-3 w-3 scale-x-[-1]" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl hover:bg-primary/10" title={isAr ? "إعادة توجيه" : "Forward"} onClick={() => setForwardMsg(msg)}>
                          <Forward className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl hover:bg-primary/10" title={isAr ? "تثبيت" : "Pin"} onClick={() => handlePin(msg.id, !(msg as any).is_pinned)}>
                          <Pin className={`h-3 w-3 ${(msg as any).is_pinned ? "text-chart-4 fill-chart-4" : ""}`} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl hover:bg-primary/10" onClick={() => toggleStarMutation.mutate({ msgId: msg.id, starred: !msg.is_starred })}>
                          <Star className={`h-3 w-3 ${msg.is_starred ? "text-chart-4 fill-chart-4" : ""}`} />
                        </Button>
                      </div>

                      <div className={`rounded-2xl px-4 py-3 transition-all duration-200 hover:shadow-md ${
                        isMine ? "bg-primary text-primary-foreground rounded-ee-md shadow-sm shadow-primary/10" : "bg-card border border-border/30 rounded-es-md shadow-sm"
                      }`}>
                        {(msg as any).is_pinned && (
                          <div className={`flex items-center gap-1 mb-1 text-[10px] ${isMine ? "text-primary-foreground/50" : "text-chart-4"}`}>
                            <Pin className="h-2.5 w-2.5" /> {isAr ? "مثبتة" : "Pinned"}
                          </div>
                        )}
                        {msg.is_starred && (
                          <Star className={`h-3 w-3 mb-1 ${isMine ? "text-primary-foreground/60" : "text-chart-4"} fill-current`} />
                        )}

                        {isApproval ? (
                          <ApprovalMessage messageId={msg.id} senderId={msg.sender_id} receiverId={msg.receiver_id} metadata={msg.metadata || {}} isMine={isMine} />
                        ) : isLocation && (msg.metadata as any)?.location ? (
                          <LocationBubble lat={(msg.metadata as any).location.lat} lng={(msg.metadata as any).location.lng} label={(msg.metadata as any).location.label} isMine={isMine} />
                        ) : msg.message_type === "audio" && msg.attachment_urls?.[0] ? (
                          <VoiceMessagePlayer url={msg.attachment_urls[0]} isMine={isMine} />
                        ) : (
                          renderContent(msg)
                        )}

                        {msg.attachment_urls && msg.attachment_urls.length > 0 && msg.message_type !== "audio" && (
                          <div className={hasImages ? "cursor-pointer" : ""} onClick={() => { if (hasImages) setMediaPreview({ urls: msg.attachment_urls, index: 0 }); }}>
                            <MessageAttachments urls={msg.attachment_urls} names={msg.attachment_names || []} messageType={msg.message_type} />
                          </div>
                        )}

                        <div className={`flex items-center gap-1 mt-1.5 text-[10px] ${isMine ? "text-primary-foreground/60 justify-end" : "text-muted-foreground"}`}>
                          {msg.message_type !== "text" && msg.message_type !== "link" && getMessageTypeIcon(msg.message_type)}
                          <span className="tabular-nums">{formatMessageDate(msg.created_at, isAr)}</span>
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
        <div className="border-t border-border/30 bg-muted/5 px-4 py-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Paperclip className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              {isAr ? `${pendingFiles.length} ملفات مرفقة` : `${pendingFiles.length} file${pendingFiles.length > 1 ? "s" : ""} attached`}
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            {pendingFiles.map((f, i) => {
              const isImage = f.type.startsWith("image/");
              return (
                <div key={i} className="relative group/file shrink-0">
                  {isImage ? (
                    <div className="relative h-16 w-16 rounded-xl overflow-hidden border border-border/30 shadow-sm">
                      <img src={URL.createObjectURL(f)} alt={f.name} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPendingFiles((prev) => prev.filter((_, j) => j !== i))}
                        className="absolute inset-0 bg-background/60 opacity-0 group-hover/file:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 rounded-xl border border-border/30 bg-background px-3 py-2 text-xs shadow-sm">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="max-w-[100px] truncate">{f.name}</span>
                      <button
                        type="button"
                        onClick={() => setPendingFiles((prev) => prev.filter((_, j) => j !== i))}
                        className="h-5 w-5 shrink-0 flex items-center justify-center rounded-xl hover:bg-destructive/10 transition-colors"
                      >
                        <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reply Preview */}
      <ReplyPreview replyToMessage={replyTo} onClear={() => setReplyTo(null)} />

      {/* Message Input */}
      <form onSubmit={handleSendWithReply} className="border-t border-border/30 bg-card/80 backdrop-blur-sm p-2 sm:p-3" style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 0.5rem)" }}>
        <div className="flex gap-1.5 sm:gap-2 items-end">
          <div className="flex items-center gap-0.5 rounded-xl border border-border/20 bg-muted/10 p-0.5 sm:p-1">
            <EmojiPicker onEmojiSelect={(emoji) => setNewMessage(newMessage + emoji)} />
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-xl hover:bg-primary/5 hover:text-primary transition-colors touch-manipulation" type="button" onClick={() => fileInputRef.current?.click()}>
              <Paperclip className="h-4 w-4" />
            </Button>
            <span className="hidden sm:inline-flex">
              <LocationShareButton isAr={isAr} onShare={handleShareLocation} disabled={sendMessage.isPending} />
            </span>
            <VoiceMessageRecorder
              disabled={sendMessage.isPending || uploading}
              onSend={async (blob, dur) => {
                try {
                  const filePath = `${user!.id}/${Date.now()}-voice.webm`;
                  const signedUrl = await uploadMessageAttachment(filePath, blob);
                  sendMessage.mutate({
                    content: isAr ? "🎤 رسالة صوتية" : "🎤 Voice message",
                    message_type: "audio",
                    attachment_urls: [signedUrl],
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
            className="flex-1 h-11 text-base sm:text-sm rounded-xl border-border/30 bg-muted/10 focus:bg-background focus:ring-primary/20 transition-colors"
          />
          <Button
            type="submit"
            size="icon"
            className="h-11 w-11 sm:h-10 sm:w-10 rounded-xl shrink-0 shadow-sm shadow-primary/15 touch-manipulation active:scale-90"
            disabled={(!newMessage.trim() && pendingFiles.length === 0) || sendMessage.isPending || uploading}
          >
            <Send className="h-4 w-4" />
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

      {/* Forward Dialog */}
      <ForwardMessageDialog
        open={!!forwardMsg}
        onOpenChange={(v) => { if (!v) setForwardMsg(null); }}
        message={forwardMsg ? {
          content: forwardMsg.content,
          message_type: forwardMsg.message_type,
          attachment_urls: forwardMsg.attachment_urls,
          attachment_names: forwardMsg.attachment_names,
        } : null}
      />

      {/* Media Preview Overlay */}
      <MediaPreviewOverlay
        open={!!mediaPreview}
        onOpenChange={(v) => { if (!v) setMediaPreview(null); }}
        urls={mediaPreview?.urls || []}
        initialIndex={mediaPreview?.index || 0}
      />
    </>
  );
}
