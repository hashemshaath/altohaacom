import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { CommunityPost } from "./CommunityFeed";

interface PostEditDialogProps {
  post: CommunityPost;
  onClose: () => void;
  onSaved: (postId: string, newContent: string) => void;
}

const MAX_CHARS = 1000;

export function PostEditDialog({ post, onClose, onSaved }: PostEditDialogProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const isAr = language === "ar";
  const [content, setContent] = useState(post.content);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user || !content.trim() || content === post.content) return;
    setSaving(true);

    try {
      // Save previous version to edit history
      await supabase.from("post_edits").insert({
        post_id: post.id,
        previous_content: post.content,
        edited_by: user.id,
      });

      // Update the post
      const { error } = await supabase
        .from("posts")
        .update({ content: content.trim(), edited_at: new Date().toISOString() })
        .eq("id", post.id)
        .eq("author_id", user.id);

      if (error) throw error;

      onSaved(post.id, content.trim());
      toast({ title: isAr ? "تم تعديل المنشور" : "Post updated" });
      onClose();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const charsLeft = MAX_CHARS - content.length;

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isAr ? "تعديل المنشور" : "Edit Post"}</DialogTitle>
        </DialogHeader>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, MAX_CHARS + 50))}
          className="min-h-[120px] text-sm"
          autoFocus
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className={charsLeft < 0 ? "text-destructive" : ""}>
            {charsLeft}
          </span>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            {isAr ? "إلغاء" : "Cancel"}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !content.trim() || content === post.content || charsLeft < 0}
          >
            {saving && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
            {isAr ? "حفظ" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
