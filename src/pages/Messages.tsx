import { useMessagesData } from "@/hooks/useMessagesData";
import { useMessageNotificationSound } from "@/components/messages/useMessageNotificationSound";
import { useLanguage } from "@/i18n/LanguageContext";
import { ConversationList } from "@/components/messages/ConversationList";
import { ChatArea } from "@/components/messages/ChatArea";
import { GroupChatView } from "@/components/messages/GroupChatView";
import { NewConversationDialog } from "@/components/messages/NewConversationDialog";
import { ApprovalTemplateDialog } from "@/components/messages/ApprovalTemplateDialog";
import { CreateGroupDialog } from "@/components/messages/CreateGroupDialog";
import { PageShell } from "@/components/PageShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Settings, Bell, Users } from "lucide-react";
import { Link } from "react-router-dom";

export default function Messages() {
  const data = useMessagesData();
  useMessageNotificationSound();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const t = (en: string, ar: string) => (isAr ? ar : en);

  return (
    <PageShell title="Messages" footer={false} padding="none" container={false}>
      {/* Compact Header - hidden on mobile when chat is open */}
      <section className={`border-b border-border/30 bg-gradient-to-b from-primary/5 via-primary/2 to-background ${data.selectedPartner || data.activeGroupId ? "hidden md:block" : ""}`}>
        <div className="container py-2 md:py-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 sm:gap-3.5">
              <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 shadow-sm shadow-primary/10 ring-1 ring-primary/10">
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight md:text-xl">
                  {t("Messages", "الرسائل")}
                </h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                  {t("Connect with your peers and community", "تواصل مع زملائك ومجتمعك")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {data.counts.unread > 0 && (
                <Badge className="gap-1 text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl animate-pulse shadow-sm shadow-primary/15">
                  <Bell className="h-3 w-3" />
                  {data.counts.unread}
                </Badge>
              )}
              <div className="hidden sm:flex items-center gap-1 rounded-xl border border-border/30 bg-card/60 backdrop-blur-sm p-1">
                <Badge variant="secondary" className="text-[10px] gap-1 cursor-default rounded-xl">
                  <MessageSquare className="h-3 w-3" />
                  {data.counts.all}
                </Badge>
                {data.chatGroups.length > 0 && (
                  <Badge variant="outline" className="text-[10px] gap-1 cursor-default rounded-xl">
                    <Users className="h-3 w-3" />
                    {data.chatGroups.length}
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl hover:bg-muted" asChild>
                <Link to="/notification-preferences">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Chat Interface - full height on mobile */}
      <div className="container py-0 md:py-6">
        <Card className="mx-auto overflow-hidden rounded-none md:rounded-2xl border-0 md:border border-border/30 bg-card/80 backdrop-blur-sm shadow-none md:shadow-2xl md:shadow-primary/5" style={{ height: "calc(100dvh - 120px)", minHeight: 400 }}>
          <div className="flex h-full">
            <ConversationList
              isAr={data.isAr}
              searchQuery={data.searchQuery}
              setSearchQuery={data.setSearchQuery}
              categoryFilter={data.categoryFilter}
              setCategoryFilter={data.setCategoryFilter}
              counts={data.counts}
              loadingConversations={data.loadingConversations}
              filteredConversations={data.filteredConversations}
              chatGroups={data.chatGroups}
              selectedPartner={data.selectedPartner}
              activeGroupId={data.activeGroupId}
              isOnline={data.isOnline}
              onSelectPartner={(p) => { data.setSelectedPartner(p); data.setActiveGroupId(null); }}
              onSelectGroup={(id) => { data.setActiveGroupId(id); data.setSelectedPartner(null); }}
              onNewConversation={() => data.setIsNewConvOpen(true)}
              onNewGroup={() => data.setIsGroupDialogOpen(true)}
              hidden={!!(data.selectedPartner || data.activeGroupId)}
            />

            <div className={`flex-1 flex flex-col ${!data.selectedPartner && !data.activeGroupId ? "hidden md:flex" : ""}`}>
              {data.activeGroupId ? (
                <GroupChatView groupId={data.activeGroupId} onBack={() => data.setActiveGroupId(null)} />
              ) : (
                <ChatArea
                  user={data.user}
                  isAr={data.isAr}
                  selectedPartner={data.selectedPartner}
                  messages={data.messages}
                  loadingMessages={data.loadingMessages}
                  newMessage={data.newMessage}
                  setNewMessage={data.setNewMessage}
                  pendingFiles={data.pendingFiles}
                  setPendingFiles={data.setPendingFiles}
                  uploading={data.uploading}
                  chatSearchOpen={data.chatSearchOpen}
                  setChatSearchOpen={data.setChatSearchOpen}
                  highlightedMsgId={data.highlightedMsgId}
                  setHighlightedMsgId={data.setHighlightedMsgId}
                  partnerTyping={data.partnerTyping}
                  isOnline={data.isOnline}
                  messagesEndRef={data.messagesEndRef}
                  fileInputRef={data.fileInputRef}
                  handleSend={data.handleSend}
                  handleFileSelect={data.handleFileSelect}
                  handleInputChange={data.handleInputChange}
                  setIsApprovalOpen={data.setIsApprovalOpen}
                  onBack={() => data.setSelectedPartner(null)}
                  sendMessage={data.sendMessage}
                  toggleStarMutation={data.toggleStarMutation}
                />
              )}
            </div>
          </div>
        </Card>
      </div>

      <NewConversationDialog
        open={data.isNewConvOpen}
        onOpenChange={data.setIsNewConvOpen}
        onSelectUser={(u) => data.setSelectedPartner({ ...u, full_name_ar: null, display_name: null, display_name_ar: null, unread_count: 0, has_approval: false, is_starred: false })}
      />

      <ApprovalTemplateDialog
        open={data.isApprovalOpen}
        onOpenChange={data.setIsApprovalOpen}
        onSend={data.handleSendApproval}
        isPending={data.sendMessage.isPending}
      />

      <CreateGroupDialog
        open={data.isGroupDialogOpen}
        onOpenChange={data.setIsGroupDialogOpen}
        onCreated={(gid) => {
          data.setActiveGroupId(gid);
          data.setSelectedPartner(null);
          data.queryClient.invalidateQueries({ queryKey: ["chatGroups"] });
        }}
      />
    </PageShell>
  );
}
