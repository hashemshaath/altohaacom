import { useState, memo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FolderPlus, Folder, Check, Plus, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface BookmarkCollectionsProps {
  postId: string;
}

export const BookmarkCollections = memo(function BookmarkCollections({ postId }: BookmarkCollectionsProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: collections = [] } = useQuery({
    queryKey: ["bookmark-collections", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("bookmark_collections")
        .select("id, name, name_ar, emoji")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const { data: postCollections = [] } = useQuery({
    queryKey: ["post-collections", postId, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("bookmark_collection_items")
        .select("collection_id")
        .eq("post_id", postId);
      return data?.map((d) => d.collection_id) || [];
    },
    enabled: !!user && collections.length > 0,
    staleTime: 1000 * 60 * 2,
  });

  const toggleCollection = async (collectionId: string) => {
    if (!user || saving) return;
    setSaving(true);
    const isIn = postCollections.includes(collectionId);
    try {
      if (isIn) {
        await supabase
          .from("bookmark_collection_items")
          .delete()
          .eq("collection_id", collectionId)
          .eq("post_id", postId);
      } else {
        await supabase
          .from("bookmark_collection_items")
          .insert({ collection_id: collectionId, post_id: postId });
      }
      queryClient.invalidateQueries({ queryKey: ["post-collections", postId] });
      toast({ title: isIn ? (isAr ? "تمت الإزالة" : "Removed") : (isAr ? "تمت الإضافة" : "Added") });
    } finally {
      setSaving(false);
    }
  };

  const createCollection = async () => {
    if (!user || !newName.trim()) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("bookmark_collections")
        .insert({ user_id: user.id, name: newName.trim() })
        .select("id")
        .single();
      if (error) throw error;
      // Add post to the new collection
      await supabase
        .from("bookmark_collection_items")
        .insert({ collection_id: data.id, post_id: postId });
      queryClient.invalidateQueries({ queryKey: ["bookmark-collections"] });
      queryClient.invalidateQueries({ queryKey: ["post-collections", postId] });
      setNewName("");
      setCreating(false);
      toast({ title: isAr ? "تم إنشاء المجموعة" : "Collection created" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 rounded-full px-2 text-[10px] text-muted-foreground hover:text-primary hover:bg-primary/10"
        >
          <FolderPlus className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <p className="px-2 py-1.5 text-xs font-bold text-muted-foreground">
          {isAr ? "حفظ في مجموعة" : "Save to collection"}
        </p>
        <DropdownMenuSeparator />
        {collections.map((c) => {
          const isIn = postCollections.includes(c.id);
          return (
            <DropdownMenuItem
              key={c.id}
              onClick={() => toggleCollection(c.id)}
              className="gap-2"
            >
              <Folder className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="flex-1 truncate text-xs">
                {c.emoji} {isAr ? (c.name_ar || c.name) : c.name}
              </span>
              {isIn && <Check className="h-3.5 w-3.5 text-primary" />}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        {creating ? (
          <div className="px-2 py-1.5 flex gap-1.5">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={isAr ? "اسم المجموعة" : "Collection name"}
              className="h-7 text-xs"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && createCollection()}
            />
            <Button size="sm" className="h-7 px-2" onClick={createCollection} disabled={saving || !newName.trim()}>
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            </Button>
          </div>
        ) : (
          <DropdownMenuItem onClick={() => setCreating(true)} className="gap-2 text-primary">
            <Plus className="h-3.5 w-3.5" />
            <span className="text-xs">{isAr ? "مجموعة جديدة" : "New collection"}</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
