import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, X } from "lucide-react";
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
      await supabase.from("post_edits").insert({
        post_id: post.id,
        previous_content: post.content,
        edited_by: user.id,
      });

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
    <div className="border-y border-border bg-muted/30 px-4 py-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold">{isAr ? "تعديل المنشور" : "Edit Post"}</p>
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={onClose} disabled={saving}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value.slice(0, MAX_CHARS + 50))}
        className="min-h-[120px] text-sm"
        autoFocus
      />
      <div className="flex items-center justify-between">
        <span className={`text-xs ${charsLeft < 0 ? "text-destructive" : "text-muted-foreground"}`}>
          {charsLeft}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
            {isAr ? "إلغاء" : "Cancel"}
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !content.trim() || content === post.content || charsLeft < 0}
          >
            {saving && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
            {isAr ? "حفظ" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
