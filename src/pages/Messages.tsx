import { useMessagesData } from "@/hooks/useMessagesData";
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
  const { language } = useLanguage();
  const isAr = language === "ar";
  const t = (en: string, ar: string) => (isAr ? ar : en);

  return (
    <PageShell title="Messages" footer={false} padding="none" container={false}>
      {/* Professional Header */}
      <section className="border-b border-border/40 bg-gradient-to-b from-primary/5 via-primary/2 to-background">
        <div className="container py-5 md:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shadow-inner">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight md:text-xl">
                  {t("Messages", "الرسائل")}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {t("Connect with your peers and community", "تواصل مع زملائك ومجتمعك")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {data.counts.unread > 0 && (
                <Badge className="gap-1 text-xs px-3 py-1 animate-pulse">
                  <Bell className="h-3 w-3" />
                  {data.counts.unread} {t("unread", "غير مقروءة")}
                </Badge>
              )}
              <div className="flex items-center gap-1 rounded-lg border bg-card p-1">
                <Badge variant="secondary" className="text-[10px] gap-1 cursor-default">
                  <MessageSquare className="h-3 w-3" />
                  {data.counts.all}
                </Badge>
                {data.chatGroups.length > 0 && (
                  <Badge variant="outline" className="text-[10px] gap-1 cursor-default">
                    <Users className="h-3 w-3" />
                    {data.chatGroups.length}
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <Link to="/notification-preferences">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Chat Interface */}
      <div className="container py-4 md:py-6">
        <Card className="mx-auto overflow-hidden rounded-2xl border-border/40 bg-card/80 backdrop-blur-sm shadow-xl shadow-primary/5" style={{ height: "calc(100vh - 220px)", minHeight: 500 }}>
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
