import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Megaphone, Plus, Send, Pin, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface CompetitionActivityFeedProps {
  competitionId: string;
  isOrganizer: boolean;
}

const typeIcons: Record<string, string> = {
  announcement: "📢",
  update: "🔄",
  reminder: "⏰",
  result: "🏆",
};

export function CompetitionActivityFeed({ competitionId, isOrganizer }: CompetitionActivityFeedProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data: updates = [] } = useQuery({
    queryKey: ["competition-updates", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competition_updates")
        .select("*")
        .eq("competition_id", competitionId)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("competition_updates").insert({
        competition_id: competitionId,
        author_id: user.id,
        title: title.trim(),
        content: content.trim() || null,
        update_type: "announcement",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competition-updates", competitionId] });
      setTitle("");
      setContent("");
      setShowForm(false);
      toast({ title: isAr ? "تم نشر التحديث" : "Update posted" });
    },
  });

  return (
    <Card className="overflow-hidden">
      <div className="border-b bg-muted/30 px-4 py-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold text-sm">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-chart-4/10">
            <Megaphone className="h-3.5 w-3.5 text-chart-4" />
          </div>
          {isAr ? "آخر التحديثات" : "Updates"}
          {updates.length > 0 && (
            <Badge variant="secondary" className="ms-1 text-[10px]">{updates.length}</Badge>
          )}
        </h3>
        {isOrganizer && (
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowForm(!showForm)}>
            {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5 me-1" />}
            {showForm ? "" : (isAr ? "نشر" : "Post")}
          </Button>
        )}
      </div>
      <CardContent className="p-0">
        {showForm && (
          <div className="p-3 border-b space-y-2">
            <Input
              placeholder={isAr ? "عنوان التحديث..." : "Update title..."}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-8 text-sm"
            />
            <Textarea
              placeholder={isAr ? "تفاصيل (اختياري)..." : "Details (optional)..."}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={2}
              className="text-sm"
            />
            <Button
              size="sm"
              className="w-full h-7 text-xs"
              disabled={!title.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              <Send className="h-3 w-3 me-1" />
              {isAr ? "نشر التحديث" : "Post Update"}
            </Button>
          </div>
        )}

        {updates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-muted/60">
              <Megaphone className="h-4 w-4 text-muted-foreground/40" />
            </div>
            <p className="text-xs text-muted-foreground">
              {isAr ? "لا توجد تحديثات بعد" : "No updates yet"}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {updates.map((update) => (
              <div key={update.id} className="px-4 py-3">
                <div className="flex items-start gap-2">
                  <span className="text-sm shrink-0 mt-0.5">
                    {typeIcons[update.update_type] || "📌"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium truncate">
                        {isAr && update.title_ar ? update.title_ar : update.title}
                      </p>
                      {update.is_pinned && <Pin className="h-3 w-3 text-chart-4 shrink-0" />}
                    </div>
                    {(update.content || update.content_ar) && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                        {isAr && update.content_ar ? update.content_ar : update.content}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(update.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
