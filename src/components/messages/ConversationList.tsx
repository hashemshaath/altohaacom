import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getDisplayName, getDisplayInitial } from "@/lib/getDisplayName";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCategoryFilter } from "@/components/messages/MessageCategoryFilter";
import { MessageSquare, Search, Plus, Star, Users, Image, Film, Music, FileText, CheckSquare } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import type { ConversationPartner, MessageFilter } from "@/hooks/useMessagesData";

interface ConversationListProps {
  isAr: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  categoryFilter: MessageFilter;
  setCategoryFilter: (f: MessageFilter) => void;
  counts: { all: number; unread: number; starred: number; approval: number; archived: number };
  loadingConversations: boolean;
  filteredConversations: ConversationPartner[] | undefined;
  chatGroups: any[];
  selectedPartner: ConversationPartner | null;
  activeGroupId: string | null;
  isOnline: (id: string) => boolean;
  onSelectPartner: (p: ConversationPartner) => void;
  onSelectGroup: (id: string) => void;
  onNewConversation: () => void;
  onNewGroup: () => void;
  hidden: boolean;
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

function formatConvTime(date?: string, isAr?: boolean) {
  if (!date) return "";
  const d = new Date(date);
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return isAr ? "أمس" : "Yesterday";
  return format(d, "MMM d");
}

export function ConversationList({
  isAr, searchQuery, setSearchQuery, categoryFilter, setCategoryFilter, counts,
  loadingConversations, filteredConversations, chatGroups,
  selectedPartner, activeGroupId, isOnline,
  onSelectPartner, onSelectGroup, onNewConversation, onNewGroup, hidden,
}: ConversationListProps) {
  const onlineCount = filteredConversations?.filter(c => isOnline(c.user_id)).length || 0;

  return (
    <div className={`w-full border-e border-border/30 md:w-80 flex flex-col bg-card/50 ${hidden ? "hidden md:flex" : ""}`}>
      <div className="border-b border-border/30 p-4 space-y-3 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2.5 font-black text-sm tracking-tight">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 shadow-inner ring-1 ring-primary/10">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            {isAr ? "الرسائل" : "Messages"}
            {counts.unread > 0 && (
              <Badge className="h-5 min-w-5 text-[9px] font-black px-1.5 rounded-lg animate-pulse">{counts.unread}</Badge>
            )}
          </h2>
          <div className="flex items-center gap-1">
            {onlineCount > 0 && (
              <Badge variant="outline" className="text-[9px] gap-1 h-6 border-primary/20 text-primary rounded-lg">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                {onlineCount} {isAr ? "متصل" : "online"}
              </Badge>
            )}
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/5 hover:text-primary transition-all" onClick={onNewGroup} title={isAr ? "مجموعة جديدة" : "New Group"}>
              <Users className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/5 hover:text-primary transition-all" onClick={onNewConversation}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute start-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder={isAr ? "بحث في المحادثات..." : "Search conversations..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9 h-9 text-xs border-border/30 bg-muted/20 rounded-xl transition-all focus:bg-background focus:ring-primary/20"
          />
        </div>
        <MessageCategoryFilter active={categoryFilter} onChange={setCategoryFilter} counts={counts} />
      </div>

      <ScrollArea className="flex-1">
        {loadingConversations ? (
          <div className="p-3 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
                <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-3/4 rounded-lg" />
                  <Skeleton className="h-3 w-1/2 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : !filteredConversations?.length ? (
          <div className="flex flex-col items-center justify-center p-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/30 mb-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground/25" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {isAr ? "لا توجد محادثات" : "No conversations yet"}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {isAr ? "ابدأ محادثة جديدة للتواصل" : "Start a new conversation to connect"}
            </p>
            <Button variant="outline" size="sm" className="mt-4 gap-1.5 rounded-xl" onClick={onNewConversation}>
              <Plus className="h-3.5 w-3.5" />
              {isAr ? "محادثة جديدة" : "New Chat"}
            </Button>
          </div>
        ) : (
          <div className="p-2 space-y-0.5">
            {chatGroups.length > 0 && (
              <>
                <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {isAr ? "المجموعات" : "Groups"}
                </p>
                {chatGroups.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => onSelectGroup(g.id)}
                    className={`w-full flex items-center gap-3 rounded-xl p-3 transition-all duration-200 text-start ${
                      activeGroupId === g.id
                        ? "bg-primary/8 ring-1 ring-primary/15 shadow-sm"
                        : "hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                      <Users className="h-4.5 w-4.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{g.name}</p>
                      <p className="text-xs text-muted-foreground">{isAr ? "مجموعة" : "Group"}</p>
                    </div>
                  </button>
                ))}
                <Separator className="my-1.5" />
                <p className="px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {isAr ? "المحادثات" : "Direct"}
                </p>
              </>
            )}
            {filteredConversations.map((conv) => (
              <button
                key={conv.user_id}
                onClick={() => onSelectPartner(conv)}
                className={`w-full flex items-center gap-3 rounded-xl p-3 transition-all duration-200 text-start ${
                  selectedPartner?.user_id === conv.user_id
                    ? "bg-primary/8 ring-1 ring-primary/15 shadow-sm"
                    : "hover:bg-muted/40"
                }`}
              >
                <div className="relative shrink-0">
                  <Avatar className="h-11 w-11 rounded-xl border-2 border-background shadow-sm">
                    <AvatarImage src={conv.avatar_url || undefined} className="rounded-xl" />
                    <AvatarFallback className="rounded-xl text-sm font-bold bg-muted">{getDisplayInitial(conv, isAr)}</AvatarFallback>
                  </Avatar>
                  {isOnline(conv.user_id) && (
                    <div className="absolute -bottom-0.5 -end-0.5 h-3 w-3 rounded-full border-2 border-card bg-chart-2" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm truncate ${conv.unread_count > 0 ? "font-bold" : "font-medium"}`}>
                      {getDisplayName(conv, isAr, "Unknown")}
                    </p>
                    <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                      {formatConvTime(conv.last_message_at, isAr)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <div className="flex items-center gap-1 min-w-0">
                      {conv.last_message_type && getMessageTypeIcon(conv.last_message_type)}
                      <p className={`text-xs truncate ${conv.unread_count > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                        {conv.last_message}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {conv.is_starred && <Star className="h-3 w-3 text-chart-4 fill-chart-4" />}
                      {conv.unread_count > 0 && (
                        <Badge className="h-5 min-w-5 justify-center text-[10px] px-1.5 rounded-full font-bold">{conv.unread_count}</Badge>
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
  );
}
