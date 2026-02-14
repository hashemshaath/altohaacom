import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";
import { usePresence } from "@/hooks/usePresence";
import { NewConversationDialog } from "@/components/messages/NewConversationDialog";
import { EmojiPicker } from "@/components/messages/EmojiPicker";
import { MessageAttachments } from "@/components/messages/MessageAttachments";
import { ApprovalMessage } from "@/components/messages/ApprovalMessage";
import { ApprovalTemplateDialog } from "@/components/messages/ApprovalTemplateDialog";
import { MessageCategoryFilter, type MessageFilter } from "@/components/messages/MessageCategoryFilter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  MessageSquare,
  Send,
  Search,
  Check,
  CheckCheck,
  ArrowLeft,
  Plus,
  Star,
  Archive,
  Paperclip,
  CheckSquare,
  MoreVertical,
  Image,
  FileText,
  Film,
  Music,
  Trash2,
  Link2,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { ar, enUS } from "date-fns/locale";

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  message_type: string;
  attachment_urls: string[];
  attachment_names: string[];
  category: string;
  is_starred: boolean;
  is_archived: boolean;
  reply_to_id: string | null;
  metadata: Record<string, any>;
}

interface ConversationPartner {
  user_id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  last_message?: string;
  last_message_at?: string;
  last_message_type?: string;
  unread_count: number;
  has_approval: boolean;
  is_starred: boolean;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = {
  image: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"],
  audio: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4"],
  video: ["video/mp4", "video/webm", "video/quicktime"],
  file: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain", "application/zip"],
};

function getMessageTypeFromMime(mime: string): string {
  if (ALLOWED_TYPES.image.includes(mime)) return "image";
  if (ALLOWED_TYPES.audio.includes(mime)) return "audio";
  if (ALLOWED_TYPES.video.includes(mime)) return "video";
  return "file";
}

function getLastMsgPreview(msg: Message, isAr: boolean): string {
  if (msg.message_type === "approval_request") return isAr ? "📋 طلب موافقة" : "📋 Approval Request";
  if (msg.message_type === "approval_response") return isAr ? "✅ رد على موافقة" : "✅ Approval Response";
  if (msg.message_type === "image") return isAr ? "📷 صورة" : "📷 Image";
  if (msg.message_type === "video") return isAr ? "🎬 فيديو" : "🎬 Video";
  if (msg.message_type === "audio") return isAr ? "🎵 صوت" : "🎵 Audio";
  if (msg.message_type === "file") return isAr ? "📎 ملف" : "📎 File";
  return msg.content;
}

export default function Messages() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const initialUserId = searchParams.get("user");

  const [selectedPartner, setSelectedPartner] = useState<ConversationPartner | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewConvOpen, setIsNewConvOpen] = useState(false);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<MessageFilter>("all");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingDebounceRef = useRef<ReturnType<typeof setTimeout>>();

  const { partnerTyping, sendTypingIndicator } = useRealtimeMessages(selectedPartner?.user_id || null);
  const { isOnline } = usePresence();

  // Fetch conversations
  const { data: conversations, isLoading: loadingConversations } = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: messages } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });
      if (!messages) return [];

      const partnerMap = new Map<string, { messages: Message[]; unread: number }>();
      messages.forEach((msg: any) => {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        const existing = partnerMap.get(partnerId) || { messages: [], unread: 0 };
        existing.messages.push(msg as Message);
        if (!msg.is_read && msg.receiver_id === user.id) existing.unread++;
        partnerMap.set(partnerId, existing);
      });

      const partnerIds = Array.from(partnerMap.keys());
      if (partnerIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, full_name, avatar_url")
        .in("user_id", partnerIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      return partnerIds
        .map((partnerId) => {
          const data = partnerMap.get(partnerId)!;
          const profile = profileMap.get(partnerId);
          const lastMsg = data.messages[0];
          return {
            user_id: partnerId,
            username: profile?.username,
            full_name: profile?.full_name,
            avatar_url: profile?.avatar_url,
            last_message: lastMsg ? getLastMsgPreview(lastMsg, isAr) : "",
            last_message_at: lastMsg?.created_at,
            last_message_type: lastMsg?.message_type,
            unread_count: data.unread,
            has_approval: data.messages.some((m) => m.category === "approval"),
            is_starred: data.messages.some((m) => m.is_starred),
          } as ConversationPartner;
        })
        .sort((a, b) => new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime());
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  // Fetch messages for selected conversation
  const { data: messages, isLoading: loadingMessages } = useQuery({
    queryKey: ["messages", user?.id, selectedPartner?.user_id],
    queryFn: async () => {
      if (!user || !selectedPartner) return [];
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${selectedPartner.user_id}),and(sender_id.eq.${selectedPartner.user_id},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });

      if (data && data.length > 0) {
        const unreadIds = data.filter((m) => m.receiver_id === user.id && !m.is_read).map((m) => m.id);
        if (unreadIds.length > 0) {
          await supabase
            .from("messages")
            .update({ is_read: true, read_at: new Date().toISOString() })
            .in("id", unreadIds);
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
        }
      }
      return (data || []) as Message[];
    },
    enabled: !!user && !!selectedPartner,
  });

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async (payload: { content: string; message_type?: string; attachment_urls?: string[]; attachment_names?: string[]; category?: string; metadata?: Record<string, any> }) => {
      if (!user || !selectedPartner) throw new Error("Not ready");
      const { data, error } = await supabase
        .from("messages")
        .insert({
          sender_id: user.id,
          receiver_id: selectedPartner.user_id,
          content: payload.content,
          message_type: payload.message_type || "text",
          attachment_urls: payload.attachment_urls || [],
          attachment_names: payload.attachment_names || [],
          category: payload.category || "general",
          metadata: payload.metadata || {},
        })
        .select()
        .single();
      if (error) throw error;

      // Send notification
      try {
        await supabase.from("notifications").insert([{
          user_id: selectedPartner.user_id,
          title: isAr ? "رسالة جديدة" : "New Message",
          body: payload.content.substring(0, 100),
          type: "message",
          link: `/messages?user=${user.id}`,
        }]);
      } catch {}

      return data;
    },
    onSuccess: () => {
      setNewMessage("");
      setPendingFiles([]);
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: isAr ? "فشل الإرسال" : "Failed to send", description: error.message });
    },
  });

  // Star/archive mutations
  const toggleStarMutation = useMutation({
    mutationFn: async ({ msgId, starred }: { msgId: string; starred: boolean }) => {
      const { error } = await supabase.from("messages").update({ is_starred: starred }).eq("id", msgId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (msgId: string) => {
      const { error } = await supabase.from("messages").update({ is_archived: true }).eq("id", msgId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  // Handle initial user from URL
  useEffect(() => {
    if (initialUserId && conversations && !selectedPartner) {
      const existing = conversations.find((c) => c.user_id === initialUserId);
      if (existing) {
        setSelectedPartner(existing);
      } else {
        supabase
          .from("profiles")
          .select("user_id, username, full_name, avatar_url")
          .eq("user_id", initialUserId)
          .single()
          .then(({ data }) => {
            if (data) setSelectedPartner({ ...data, unread_count: 0, has_approval: false, is_starred: false });
          });
      }
    }
  }, [initialUserId, conversations, selectedPartner]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPartner) return;

    // Upload files if any
    if (pendingFiles.length > 0) {
      setUploading(true);
      try {
        const urls: string[] = [];
        const names: string[] = [];
        let msgType = "file";

        for (const file of pendingFiles) {
          const filePath = `${user.id}/${Date.now()}-${file.name}`;
          const { error } = await supabase.storage.from("message-attachments").upload(filePath, file);
          if (error) throw error;
          const { data: urlData } = supabase.storage.from("message-attachments").getPublicUrl(filePath);
          urls.push(urlData.publicUrl);
          names.push(file.name);
          msgType = getMessageTypeFromMime(file.type);
        }

        sendMessage.mutate({
          content: newMessage.trim() || (isAr ? "مرفق" : "Attachment"),
          message_type: pendingFiles.length === 1 ? msgType : "file",
          attachment_urls: urls,
          attachment_names: names,
        });
      } catch (err: any) {
        toast({ variant: "destructive", title: isAr ? "فشل رفع الملف" : "Upload failed", description: err.message });
      } finally {
        setUploading(false);
      }
      return;
    }

    if (newMessage.trim()) {
      // Detect links
      const hasLink = /(https?:\/\/[^\s]+)/g.test(newMessage);
      sendMessage.mutate({
        content: newMessage.trim(),
        message_type: hasLink ? "link" : "text",
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter((f) => {
      if (f.size > MAX_FILE_SIZE) {
        toast({ variant: "destructive", title: isAr ? "الملف كبير جداً" : "File too large", description: `${f.name} > 20MB` });
        return false;
      }
      return true;
    });
    setPendingFiles((prev) => [...prev, ...valid].slice(0, 5));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendApproval = (data: { title: string; description: string }) => {
    sendMessage.mutate({
      content: `📋 ${data.title}`,
      message_type: "approval_request",
      category: "approval",
      metadata: {
        approval_status: "pending",
        approval_title: data.title,
        approval_description: data.description,
      },
    });
    setIsApprovalOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
    typingDebounceRef.current = setTimeout(() => sendTypingIndicator(), 300);
  };

  const formatMessageDate = (date: string) => {
    const d = new Date(date);
    const locale = isAr ? ar : enUS;
    if (isToday(d)) return format(d, "h:mm a", { locale });
    if (isYesterday(d)) return `${isAr ? "أمس" : "Yesterday"} ${format(d, "h:mm a", { locale })}`;
    return format(d, "MMM d, h:mm a", { locale });
  };

  const formatConvTime = (date?: string) => {
    if (!date) return "";
    const d = new Date(date);
    if (isToday(d)) return format(d, "h:mm a");
    if (isYesterday(d)) return isAr ? "أمس" : "Yesterday";
    return format(d, "MMM d");
  };

  // Filter conversations
  const filteredConversations = conversations?.filter((c) => {
    if (searchQuery && !c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) && !c.username?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (categoryFilter === "unread") return c.unread_count > 0;
    if (categoryFilter === "starred") return c.is_starred;
    if (categoryFilter === "approval") return c.has_approval;
    return true;
  });

  const counts = {
    all: conversations?.length || 0,
    unread: conversations?.filter((c) => c.unread_count > 0).length || 0,
    starred: conversations?.filter((c) => c.is_starred).length || 0,
    approval: conversations?.filter((c) => c.has_approval).length || 0,
    archived: 0,
  };

  // Render link previews
  const renderContent = (msg: Message) => {
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
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case "image": return <Image className="h-3 w-3" />;
      case "video": return <Film className="h-3 w-3" />;
      case "audio": return <Music className="h-3 w-3" />;
      case "file": return <FileText className="h-3 w-3" />;
      case "approval_request":
      case "approval_response": return <CheckSquare className="h-3 w-3" />;
      default: return null;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="container flex-1 py-4 md:py-6">
        <Card className="mx-auto max-w-5xl overflow-hidden rounded-3xl border-border/40 bg-card/60 backdrop-blur-sm shadow-2xl shadow-primary/5" style={{ height: "calc(100vh - 160px)", minHeight: 500 }}>
          <div className="flex h-full">
            {/* Conversations List */}
            <div className={`w-full border-e md:w-80 flex flex-col ${selectedPartner ? "hidden md:flex" : ""}`}>
              <div className="border-b border-border/40 p-4 space-y-3 bg-muted/10">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2.5 font-black text-sm tracking-tight">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 shadow-inner">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                    {isAr ? "الرسائل" : "Messages"}
                    {counts.unread > 0 && (
                      <Badge className="h-5 min-w-5 text-[9px] font-black px-1.5 animate-pulse">{counts.unread}</Badge>
                    )}
                  </h2>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/5 hover:text-primary transition-all" onClick={() => setIsNewConvOpen(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={isAr ? "بحث..." : "Search..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="ps-9 h-8 text-xs"
                  />
                </div>
                <MessageCategoryFilter active={categoryFilter} onChange={setCategoryFilter} counts={counts} />
              </div>

              <ScrollArea className="flex-1">
                {loadingConversations ? (
                  <div className="p-3 space-y-2">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
                  </div>
                ) : !filteredConversations?.length ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      {isAr ? "لا توجد محادثات" : "No conversations yet"}
                    </p>
                  </div>
                ) : (
                  <div className="p-1.5 space-y-0.5">
                    {filteredConversations.map((conv) => (
                      <button
                        key={conv.user_id}
                        onClick={() => setSelectedPartner(conv)}
                        className={`w-full flex items-center gap-3 rounded-lg p-2.5 transition-colors text-start ${
                          selectedPartner?.user_id === conv.user_id ? "bg-accent" : "hover:bg-accent/50"
                        }`}
                      >
                        <div className="relative shrink-0">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={conv.avatar_url || undefined} />
                            <AvatarFallback className="text-sm">{(conv.full_name || "U")[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          {isOnline(conv.user_id) && (
                            <div className="absolute bottom-0 end-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-sm truncate ${conv.unread_count > 0 ? "font-bold" : "font-medium"}`}>
                              {conv.full_name || conv.username || "Unknown"}
                            </p>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {formatConvTime(conv.last_message_at)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-0.5">
                            <div className="flex items-center gap-1 min-w-0">
                              {conv.last_message_type && getMessageTypeIcon(conv.last_message_type)}
                              <p className={`text-xs truncate ${conv.unread_count > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                                {conv.last_message}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {conv.is_starred && <Star className="h-3 w-3 text-chart-4 fill-chart-4" />}
                              {conv.unread_count > 0 && (
                                <Badge className="h-5 min-w-5 justify-center text-[10px] px-1.5">{conv.unread_count}</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 flex flex-col ${!selectedPartner ? "hidden md:flex" : ""}`}>
              {selectedPartner ? (
                <>
                  {/* Chat Header */}
                  <div className="border-b p-3 flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setSelectedPartner(null)}>
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="relative">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={selectedPartner.avatar_url || undefined} />
                        <AvatarFallback className="text-sm">{(selectedPartner.full_name || "U")[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      {isOnline(selectedPartner.user_id) && (
                        <div className="absolute bottom-0 end-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-primary" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">
                        {selectedPartner.full_name || selectedPartner.username || "Unknown"}
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
                            <div key={msg.id} className={`group flex ${isMine ? "justify-end" : "justify-start"} animate-fade-in`}>
                              <div className={`relative max-w-[75%] ${isMine ? "" : ""}`}>
                                {/* Message Actions */}
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

                                <div
                                  className={`rounded-2xl px-3.5 py-2 transition-all duration-200 hover:shadow-md ${
                                    isMine
                                      ? "bg-primary text-primary-foreground rounded-ee-md"
                                      : "bg-muted rounded-es-md"
                                  }`}
                                >
                                  {/* Starred indicator */}
                                  {msg.is_starred && (
                                    <Star className={`h-3 w-3 mb-1 ${isMine ? "text-primary-foreground/60" : "text-chart-4"} fill-current`} />
                                  )}

                                  {/* Approval message */}
                                  {isApproval ? (
                                    <ApprovalMessage
                                      messageId={msg.id}
                                      senderId={msg.sender_id}
                                      receiverId={msg.receiver_id}
                                      metadata={msg.metadata || {}}
                                      isMine={isMine}
                                    />
                                  ) : (
                                    renderContent(msg)
                                  )}

                                  {/* Attachments */}
                                  {msg.attachment_urls && msg.attachment_urls.length > 0 && (
                                    <MessageAttachments
                                      urls={msg.attachment_urls}
                                      names={msg.attachment_names || []}
                                      messageType={msg.message_type}
                                    />
                                  )}

                                  {/* Timestamp & Status */}
                                  <div className={`flex items-center gap-1 mt-1 text-[10px] ${isMine ? "text-primary-foreground/60 justify-end" : "text-muted-foreground"}`}>
                                    {msg.message_type !== "text" && msg.message_type !== "link" && getMessageTypeIcon(msg.message_type)}
                                    <span>{formatMessageDate(msg.created_at)}</span>
                                    {isMine && (msg.is_read ? <CheckCheck className="h-3 w-3 text-primary-foreground/80" /> : <Check className="h-3 w-3" />)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
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
                        <EmojiPicker onEmojiSelect={(emoji) => setNewMessage((prev) => prev + emoji)} />
                        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" type="button" onClick={() => fileInputRef.current?.click()}>
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                        </Button>
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
              ) : (
                <div className="flex-1 flex items-center justify-center text-center p-8">
                  <div>
                    <MessageSquare className="mx-auto h-14 w-14 text-muted-foreground/20 mb-4" />
                    <h3 className="font-semibold">{isAr ? "اختر محادثة" : "Select a conversation"}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isAr ? "اختر محادثة من القائمة لبدء المراسلة" : "Choose a conversation from the list to start messaging"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </main>

      <NewConversationDialog
        open={isNewConvOpen}
        onOpenChange={setIsNewConvOpen}
        onSelectUser={(u) => setSelectedPartner({ ...u, unread_count: 0, has_approval: false, is_starred: false })}
      />

      <ApprovalTemplateDialog
        open={isApprovalOpen}
        onOpenChange={setIsApprovalOpen}
        onSend={handleSendApproval}
        isPending={sendMessage.isPending}
      />

      <Footer />
    </div>
  );
}
