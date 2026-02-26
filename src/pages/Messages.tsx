import { useMessagesData } from "@/hooks/useMessagesData";
import { ConversationList } from "@/components/messages/ConversationList";
import { ChatArea } from "@/components/messages/ChatArea";
import { GroupChatView } from "@/components/messages/GroupChatView";
import { NewConversationDialog } from "@/components/messages/NewConversationDialog";
import { ApprovalTemplateDialog } from "@/components/messages/ApprovalTemplateDialog";
import { CreateGroupDialog } from "@/components/messages/CreateGroupDialog";
import { PageShell } from "@/components/PageShell";
import { Card } from "@/components/ui/card";

export default function Messages() {
  const data = useMessagesData();

  return (
    <PageShell title="Messages" footer={false} padding="sm">
      <Card className="mx-auto overflow-hidden rounded-3xl border-border/40 bg-card/60 backdrop-blur-sm shadow-2xl shadow-primary/5" style={{ height: "calc(100vh - 160px)", minHeight: 500 }}>
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
