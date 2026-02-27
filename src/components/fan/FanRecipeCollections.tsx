import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BookOpen, Plus, Trash2, FolderOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function FanRecipeCollections() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("📖");
  const [open, setOpen] = useState(false);

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ["fan-collections", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("fan_collections")
        .select("id, name, name_ar, emoji, is_public, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!data || data.length === 0) return [];

      // Get item counts
      const { data: items } = await supabase
        .from("fan_collection_items")
        .select("collection_id")
        .in("collection_id", data.map(c => c.id));

      const countMap = new Map<string, number>();
      items?.forEach(i => countMap.set(i.collection_id, (countMap.get(i.collection_id) || 0) + 1));

      return data.map(c => ({ ...c, itemCount: countMap.get(c.id) || 0 }));
    },
    enabled: !!user,
  });

  const createCollection = async () => {
    if (!user || !newName.trim()) return;
    await supabase.from("fan_collections").insert({
      user_id: user.id,
      name: newName.trim(),
      emoji: newEmoji || "📖",
    });
    setNewName("");
    setNewEmoji("📖");
    setOpen(false);
    queryClient.invalidateQueries({ queryKey: ["fan-collections"] });
    toast({ title: isAr ? "✅ تم إنشاء المجموعة" : "✅ Collection created!" });
  };

  const deleteCollection = async (id: string) => {
    await supabase.from("fan_collections").delete().eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["fan-collections"] });
    toast({ title: isAr ? "تم الحذف" : "Collection deleted" });
  };

  const emojis = ["📖", "🍳", "🌮", "🍰", "🥗", "🍝", "🔥", "⭐", "❤️", "🏆"];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-chart-4/10">
              <BookOpen className="h-3.5 w-3.5 text-chart-4" />
            </div>
            {isAr ? "مجموعاتي" : "My Collections"}
            {collections.length > 0 && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{collections.length}</Badge>
            )}
          </CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xs">
              <DialogHeader>
                <DialogTitle className="text-sm">{isAr ? "مجموعة جديدة" : "New Collection"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <Input
                  placeholder={isAr ? "اسم المجموعة" : "Collection name"}
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="text-sm"
                />
                <div className="flex gap-1.5 flex-wrap">
                  {emojis.map(e => (
                    <button
                      key={e}
                      onClick={() => setNewEmoji(e)}
                      className={`h-8 w-8 rounded-lg text-sm flex items-center justify-center transition-colors ${newEmoji === e ? "bg-primary/20 ring-1 ring-primary/40" : "bg-muted/50 hover:bg-muted"}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
                <Button size="sm" className="w-full" onClick={createCollection} disabled={!newName.trim()}>
                  {isAr ? "إنشاء" : "Create"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-12 rounded-lg bg-muted/50 animate-pulse" />)}</div>
        ) : collections.length === 0 ? (
          <div className="text-center py-6">
            <FolderOpen className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">{isAr ? "أنشئ مجموعتك الأولى" : "Create your first collection"}</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {collections.map((col: any) => (
              <div key={col.id} className="flex items-center gap-2.5 rounded-lg p-2 hover:bg-muted/40 transition-colors group">
                <span className="text-lg shrink-0">{col.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{isAr ? col.name_ar || col.name : col.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {col.itemCount} {isAr ? "عنصر" : "items"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={() => deleteCollection(col.id)}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
