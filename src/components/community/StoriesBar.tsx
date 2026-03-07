import { useState, useEffect, useRef, useCallback, memo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, ChevronLeft, ChevronRight, Eye, Move, Trash2, Pause, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";


const STORY_DURATION = 5000; // 5 seconds per story

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  created_at: string;
  user_name: string | null;
  user_avatar: string | null;
}

interface GroupedStories {
  user_id: string;
  user_name: string | null;
  user_avatar: string | null;
  stories: Story[];
  hasViewed: boolean;
}

export const StoriesBar = memo(function StoriesBar() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [grouped, setGrouped] = useState<GroupedStories[]>([]);
  const [viewing, setViewing] = useState<GroupedStories | null>(null);
  const [storyIndex, setStoryIndex] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [showCaptionInput, setShowCaptionInput] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [imagePosition, setImagePosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartPos, setDragStartPos] = useState(50);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressStartRef = useRef<number>(0);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartPos(imagePosition);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [imagePosition]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !previewContainerRef.current) return;
    const containerWidth = previewContainerRef.current.offsetWidth;
    const dx = e.clientX - dragStartX;
    const pctChange = (dx / containerWidth) * 100;
    const newPos = Math.max(0, Math.min(100, dragStartPos - pctChange));
    setImagePosition(newPos);
  }, [isDragging, dragStartX, dragStartPos]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    fetchStories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fetchStories = async () => {
    const { data: stories } = await supabase
      .from("community_stories")
      .select("id, user_id, media_url, media_type, caption, expires_at, created_at")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (!stories?.length) { setGrouped([]); return; }

    const userIds = [...new Set(stories.map((s) => s.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name, avatar_url")
      .in("user_id", userIds);

    let viewedIds = new Set<string>();
    if (user) {
      const { data: views } = await supabase
        .from("story_views")
        .select("story_id")
        .eq("viewer_id", user.id)
        .in("story_id", stories.map((s) => s.id));
      viewedIds = new Set(views?.map((v) => v.story_id) || []);
    }

    const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
    const groups = new Map<string, GroupedStories>();

    stories.forEach((s) => {
      const profile = profileMap.get(s.user_id);
      if (!groups.has(s.user_id)) {
        groups.set(s.user_id, {
          user_id: s.user_id,
          user_name: profile?.full_name || null,
          user_avatar: profile?.avatar_url || null,
          stories: [],
          hasViewed: true,
        });
      }
      const group = groups.get(s.user_id)!;
      group.stories.push({
        ...s,
        user_name: profile?.full_name || null,
        user_avatar: profile?.avatar_url || null,
      });
      if (!viewedIds.has(s.id)) group.hasViewed = false;
    });

    // Put current user first
    const sorted = [...groups.values()].sort((a, b) => {
      if (user && a.user_id === user.id) return -1;
      if (user && b.user_id === user.id) return 1;
      if (a.hasViewed !== b.hasViewed) return a.hasViewed ? 1 : -1;
      return 0;
    });

    setGrouped(sorted);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: "destructive", title: isAr ? "الملف كبير جداً" : "File too large (max 10MB)" });
      return;
    }
    setPendingFile(file);
    setImagePosition(50);
    setShowCaptionInput(true);
    if (fileRef.current) fileRef.current.value = "";
  };

  const uploadStory = async () => {
    if (!user || !pendingFile) return;
    setUploading(true);
    try {
      const ext = pendingFile.name.split(".").pop() || "jpg";
      const path = `${user.id}/stories/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("user-media").upload(path, pendingFile, { contentType: pendingFile.type });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("user-media").getPublicUrl(path);

      const mediaType = pendingFile.type.startsWith("video/") ? "video" : "image";
      const { error } = await supabase.from("community_stories").insert({
        user_id: user.id,
        media_url: urlData.publicUrl,
        media_type: mediaType,
        caption: caption.trim() || null,
      });
      if (error) throw error;

      setCaption("");
      setPendingFile(null);
      setShowCaptionInput(false);
      fetchStories();
      toast({ title: isAr ? "تمت إضافة القصة" : "Story added!" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setUploading(false);
    }
  };

  const openStory = async (group: GroupedStories) => {
    setViewing(group);
    setStoryIndex(0);
    setPaused(false);
    setProgress(0);
    if (user && user.id !== group.user_id) {
      await supabase.from("story_views").upsert({
        story_id: group.stories[0].id,
        viewer_id: user.id,
      }, { onConflict: "story_id,viewer_id" });
    }
    // Fetch view count for own stories
    if (user && user.id === group.user_id) {
      const { count } = await supabase
        .from("story_views")
        .select("*", { count: "exact", head: true })
        .eq("story_id", group.stories[0].id);
      setViewCount(count || 0);
    }
  };

  // Auto-progress timer
  useEffect(() => {
    if (!viewing || paused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    progressStartRef.current = Date.now();
    setProgress(0);
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - progressStartRef.current;
      const pct = Math.min((elapsed / STORY_DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        nextStory();
      }
    }, 50);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [viewing, storyIndex, paused]);

  const nextStory = async () => {
    if (!viewing) return;
    if (storyIndex < viewing.stories.length - 1) {
      const next = storyIndex + 1;
      setStoryIndex(next);
      setProgress(0);
      if (user && user.id !== viewing.user_id) {
        await supabase.from("story_views").upsert({
          story_id: viewing.stories[next].id,
          viewer_id: user.id,
        }, { onConflict: "story_id,viewer_id" });
      }
      if (user && user.id === viewing.user_id) {
        const { count } = await supabase
          .from("story_views")
          .select("*", { count: "exact", head: true })
          .eq("story_id", viewing.stories[next].id);
        setViewCount(count || 0);
      }
    } else {
      setViewing(null);
    }
  };

  const prevStory = () => {
    if (storyIndex > 0) {
      setStoryIndex(storyIndex - 1);
      setProgress(0);
    }
  };

  const deleteStory = async (storyId: string) => {
    if (!user) return;
    await supabase.from("community_stories").delete().eq("id", storyId).eq("user_id", user.id);
    toast({ title: isAr ? "تم حذف القصة" : "Story deleted" });
    if (viewing && viewing.stories.length <= 1) {
      setViewing(null);
    } else if (viewing) {
      const updated = { ...viewing, stories: viewing.stories.filter(s => s.id !== storyId) };
      setViewing(updated);
      if (storyIndex >= updated.stories.length) setStoryIndex(Math.max(0, updated.stories.length - 1));
    }
    fetchStories();
  };

  if (grouped.length === 0 && !user) return null;

  return (
    <>
      <div className="border-b border-border px-4 py-3">
        <div ref={scrollRef} className="flex items-center gap-3 overflow-x-auto scrollbar-none">
          {/* Add story button */}
          {user && (
            <div className="flex flex-col items-center gap-1 shrink-0">
              <button
                onClick={() => fileRef.current?.click()}
                className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-primary/40 bg-primary/5 transition-all hover:border-primary hover:bg-primary/10"
              >
                <Plus className="h-5 w-5 text-primary" />
              </button>
              <span className="text-[10px] text-muted-foreground font-medium">
                {isAr ? "قصتك" : "Your story"}
              </span>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          )}

          {/* Story circles */}
          {grouped.map((group) => (
            <button
              key={group.user_id}
              onClick={() => openStory(group)}
              className="flex flex-col items-center gap-1 shrink-0"
            >
              <div className={cn(
                "rounded-full p-0.5",
                group.hasViewed
                  ? "bg-muted"
                  : "bg-gradient-to-tr from-primary via-chart-2 to-chart-4"
              )}>
                <Avatar className="h-14 w-14 border-2 border-background">
                  <AvatarImage src={group.user_avatar || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {(group.user_name || "C")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <span className="text-[10px] text-muted-foreground font-medium max-w-[60px] truncate">
                {user?.id === group.user_id
                  ? (isAr ? "قصتك" : "Your story")
                  : (group.user_name?.split(" ")[0] || "Chef")}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Caption input dialog */}
      <Dialog open={showCaptionInput} onOpenChange={setShowCaptionInput}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>{isAr ? "أضف تعليقاً" : "Add a caption"}</DialogTitle>
          {pendingFile && (
            <div className="space-y-2">
              <div
                ref={previewContainerRef}
                className="relative rounded-xl overflow-hidden border border-border aspect-[9/16] max-h-[350px] cursor-grab active:cursor-grabbing select-none touch-none"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                {pendingFile.type.startsWith("video/")
                  ? <video src={URL.createObjectURL(pendingFile)} className="w-full h-full object-cover" controls />
                  : <img
                      src={URL.createObjectURL(pendingFile)}
                      className="w-full h-full object-cover pointer-events-none"
                      style={{ objectPosition: `${imagePosition}% 50%` }}
                      alt=""
                      draggable={false}
                    />
                }
                {!pendingFile.type.startsWith("video/") && (
                  <div className="absolute bottom-2 inset-x-0 flex justify-center">
                    <div className="flex items-center gap-1.5 rounded-full bg-background/70 backdrop-blur-sm px-3 py-1 text-[10px] text-muted-foreground font-medium">
                      <Move className="h-3 w-3" />
                      {isAr ? "اسحب لضبط الصورة" : "Drag to adjust"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <Input
            placeholder={isAr ? "أضف تعليقاً (اختياري)..." : "Add a caption (optional)..."}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            maxLength={200}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setShowCaptionInput(false); setPendingFile(null); }}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={uploadStory} disabled={uploading}>
              {uploading ? (isAr ? "جارٍ الرفع..." : "Uploading...") : (isAr ? "نشر القصة" : "Post Story")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Story viewer */}
      <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
        <DialogContent className="sm:max-w-sm p-0 overflow-hidden bg-background border-0 rounded-2xl">
          <DialogTitle className="sr-only">
            {viewing?.user_name || "Story"}
          </DialogTitle>
          {viewing && (
            <div className="relative">
              {/* Progress bars */}
              <div className="absolute top-0 inset-x-0 z-10 flex gap-1 p-2">
                {viewing.stories.map((_, i) => (
                  <div key={i} className="h-0.5 flex-1 rounded-full bg-foreground/20 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-foreground/80"
                      style={{
                        width: i < storyIndex ? "100%" : i === storyIndex ? `${progress}%` : "0%",
                        transition: i === storyIndex ? "none" : "width 0.3s",
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Header */}
              <div className="absolute top-4 inset-x-0 z-10 flex items-center gap-2 px-4">
                <Avatar className="h-8 w-8 ring-2 ring-background">
                  <AvatarImage src={viewing.user_avatar || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                    {(viewing.user_name || "C")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-bold text-foreground drop-shadow">{viewing.user_name || "Chef"}</span>
                <div className="ms-auto flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-foreground/80 hover:text-foreground"
                    onClick={() => setPaused(!paused)}
                  >
                    {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  </Button>
                  {user?.id === viewing.user_id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive/80 hover:text-destructive"
                      onClick={() => deleteStory(viewing.stories[storyIndex].id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-foreground/80 hover:text-foreground"
                    onClick={() => setViewing(null)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Media */}
              <div className="aspect-[9/16] bg-muted flex items-center justify-center min-h-[400px]">
                {viewing.stories[storyIndex]?.media_type === "video" ? (
                  <video
                    src={viewing.stories[storyIndex].media_url}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    src={viewing.stories[storyIndex]?.media_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Caption + View count */}
              <div className="absolute bottom-0 inset-x-0 z-10 bg-gradient-to-t from-background/90 to-transparent p-4 pt-10">
                {viewing.stories[storyIndex]?.caption && (
                  <p className="text-sm text-foreground mb-2">{viewing.stories[storyIndex].caption}</p>
                )}
                {user?.id === viewing.user_id && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Eye className="h-3.5 w-3.5" />
                    {viewCount.toLocaleString()} {isAr ? "مشاهدة" : "views"}
                  </div>
                )}
              </div>

              {/* Navigation */}
              <button
                className="absolute inset-y-0 start-0 w-1/3 z-10"
                onClick={prevStory}
              />
              <button
                className="absolute inset-y-0 end-0 w-1/3 z-10"
                onClick={nextStory}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
