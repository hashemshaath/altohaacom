import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { History } from "lucide-react";
import { toEnglishDigits } from "@/lib/formatNumber";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";

interface PostEditHistoryProps {
  postId: string;
  onClose: () => void;
}

export function PostEditHistory({ postId, onClose }: PostEditHistoryProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: edits, isLoading } = useQuery({
    queryKey: ["post-edit-history", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("post_edits")
        .select("*")
        .eq("post_id", postId)
        .order("edited_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-4 w-4" />
            {isAr ? "سجل التعديلات" : "Edit History"}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[400px]">
          {isLoading ? (
            <div className="space-y-3 p-1">
              {[1, 2].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ))}
            </div>
          ) : !edits?.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {isAr ? "لا يوجد سجل تعديلات" : "No edit history"}
            </p>
          ) : (
            <div className="space-y-4 p-1">
              {edits.map((edit, idx) => (
                <div key={edit.id} className="rounded-lg border border-border p-3">
                  <p className="text-[10px] font-medium text-muted-foreground mb-2">
                    {isAr ? "النسخة السابقة" : "Previous version"} · {toEnglishDigits(
                      format(new Date(edit.edited_at), "MMM d, yyyy HH:mm", {
                        locale: isAr ? ar : enUS,
                      })
                    )}
                  </p>
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed">
                    {edit.previous_content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
