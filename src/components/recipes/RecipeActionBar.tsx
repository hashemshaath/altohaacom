import { useState, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRecipeSave } from "@/hooks/useRecipeSave";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Bookmark, Share2, FolderPlus, Check, Copy, Link2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface RecipeActionBarProps {
  recipeId: string;
  saveCount?: number;
  shareCount?: number;
}

export const RecipeActionBar = memo(function RecipeActionBar({ recipeId, saveCount = 0, shareCount = 0 }: RecipeActionBarProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const { isSaved, toggle, loading, trackShare } = useRecipeSave(recipeId);
  const queryClient = useQueryClient();

  const { data: collections = [] } = useQuery({
    queryKey: ["fan-collections-mini", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("fan_collections")
        .select("id, name, emoji")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const addToCollection = async (collectionId: string) => {
    if (!user) return;
    const { error } = await supabase.from("fan_collection_items").insert({
      collection_id: collectionId,
      item_type: "recipe",
      item_id: recipeId,
    });
    if (error?.code === "23505") {
      toast({ title: isAr ? "موجود بالفعل" : "Already in collection" });
    } else if (!error) {
      toast({ title: isAr ? "✅ تمت الإضافة" : "✅ Added to collection" });
      queryClient.invalidateQueries({ queryKey: ["fan-collections"] });
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ url });
        trackShare("native");
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      trackShare("copy");
      toast({ title: isAr ? "تم نسخ الرابط" : "Link copied!" });
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Save Button */}
      <Button
        variant={isSaved ? "default" : "outline"}
        size="sm"
        className="gap-1.5"
        onClick={toggle}
        disabled={!user || loading}
      >
        <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
        {isSaved ? (isAr ? "محفوظ" : "Saved") : (isAr ? "حفظ" : "Save")}
        {saveCount > 0 && (
          <Badge variant="secondary" className="text-[9px] h-4 px-1 ms-0.5">{saveCount}</Badge>
        )}
      </Button>

      {/* Add to Collection */}
      {user && collections.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <FolderPlus className="h-4 w-4" />
              {isAr ? "مجموعة" : "Collection"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel className="text-xs">
              {isAr ? "إضافة إلى مجموعة" : "Add to collection"}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {collections.map((col: any) => (
              <DropdownMenuItem key={col.id} onClick={() => addToCollection(col.id)} className="gap-2 text-sm">
                <span>{col.emoji}</span>
                {col.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Share Button */}
      <Button variant="outline" size="sm" className="gap-1.5" onClick={handleShare}>
        <Share2 className="h-4 w-4" />
        {isAr ? "مشاركة" : "Share"}
        {shareCount > 0 && (
          <Badge variant="secondary" className="text-[9px] h-4 px-1 ms-0.5">{shareCount}</Badge>
        )}
      </Button>
    </div>
  );
});
