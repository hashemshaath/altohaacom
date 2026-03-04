import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";
import { usePresence } from "@/hooks/usePresence";
import { useToast } from "@/hooks/use-toast";
import { uploadMessageAttachment } from "@/utils/storageUtils";

export interface Message {
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

export interface ConversationPartner {
  user_id: string;
  username: string | null;
  full_name: string | null;
  full_name_ar: string | null;
  display_name: string | null;
  display_name_ar: string | null;
  avatar_url: string | null;
  last_message?: string;
  last_message_at?: string;
  last_message_type?: string;
  unread_count: number;
  has_approval: boolean;
  is_starred: boolean;
}

export type MessageFilter = "all" | "unread" | "starred" | "approval" | "archived";

export const MAX_FILE_SIZE = 20 * 1024 * 1024;
export const ALLOWED_TYPES = {
  image: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"],
  audio: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4"],
  video: ["video/mp4", "video/webm", "video/quicktime"],
  file: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain", "application/zip"],
};

export function getMessageTypeFromMime(mime: string): string {
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

export function useMessagesData() {
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
  const [chatSearchOpen, setChatSearchOpen] = useState(false);
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
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
        .select("id, sender_id, receiver_id, content, message_type, is_read, is_starred, category, attachment_url, attachment_name, created_at")
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
        .select("user_id, username, full_name, full_name_ar, display_name, display_name_ar, avatar_url")
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
            full_name_ar: profile?.full_name_ar || null,
            display_name: profile?.display_name || null,
            display_name_ar: profile?.display_name_ar || null,
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
    staleTime: 1000 * 60 * 1,
  });

  // Fetch user's groups
  const { data: chatGroups = [] } = useQuery({
    queryKey: ["chatGroups", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: memberRows } = await supabase
        .from("chat_group_members")
        .select("group_id")
        .eq("user_id", user.id);
      if (!memberRows?.length) return [];
      const groupIds = memberRows.map((m) => m.group_id);
      const { data: groups } = await supabase
        .from("chat_groups")
        .select("id, name, name_ar, avatar_url, created_by, updated_at")
        .in("id", groupIds)
        .order("updated_at", { ascending: false });
      return groups || [];
    },
    enabled: !!user,
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
          .select("user_id, username, full_name, full_name_ar, display_name, display_name_ar, avatar_url")
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

    if (pendingFiles.length > 0) {
      setUploading(true);
      try {
        const urls: string[] = [];
        const names: string[] = [];
        let msgType = "file";

        for (const file of pendingFiles) {
          const filePath = `${user.id}/${Date.now()}-${file.name}`;
          const signedUrl = await uploadMessageAttachment(filePath, file);
          urls.push(signedUrl);
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

  // Filter conversations
  const filteredConversations = conversations?.filter((c) => {
    if (searchQuery && !c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) && !c.username?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (categoryFilter === "unread") return c.unread_count > 0;
    if (categoryFilter === "starred") return c.is_starred;
    if (categoryFilter === "approval") return c.has_approval;
    if (categoryFilter === "archived") return (c as any).is_archived;
    return true;
  });

  const counts = {
    all: conversations?.length || 0,
    unread: conversations?.filter((c) => c.unread_count > 0).length || 0,
    starred: conversations?.filter((c) => c.is_starred).length || 0,
    approval: conversations?.filter((c) => c.has_approval).length || 0,
    archived: conversations?.filter((c) => (c as any).is_archived).length || 0,
  };

  return {
    user,
    isAr,
    // State
    selectedPartner, setSelectedPartner,
    newMessage, setNewMessage,
    searchQuery, setSearchQuery,
    isNewConvOpen, setIsNewConvOpen,
    isApprovalOpen, setIsApprovalOpen,
    categoryFilter, setCategoryFilter,
    pendingFiles, setPendingFiles,
    uploading,
    chatSearchOpen, setChatSearchOpen,
    highlightedMsgId, setHighlightedMsgId,
    isGroupDialogOpen, setIsGroupDialogOpen,
    activeGroupId, setActiveGroupId,
    messagesEndRef,
    fileInputRef,
    // Data
    conversations, loadingConversations,
    chatGroups,
    messages, loadingMessages,
    filteredConversations,
    counts,
    // Mutations
    sendMessage,
    toggleStarMutation,
    archiveMutation,
    // Handlers
    handleSend,
    handleFileSelect,
    handleSendApproval,
    handleInputChange,
    // Realtime
    partnerTyping,
    isOnline,
    // Query client for group invalidation
    queryClient,
  };
}
