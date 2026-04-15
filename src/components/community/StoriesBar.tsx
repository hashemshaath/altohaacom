import { useIsAr } from "@/hooks/useIsAr";
import { useState, useEffect, useRef, useCallback, memo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Eye, Move, Trash2, Pause, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useStoriesData, type GroupedStories } from "@/hooks/community/useStoriesData";

const STORY_DURATION = 5000;

export { type GroupedStories } from "@/hooks/community/useStoriesData";

export const StoriesBar = memo(function StoriesBar() {
  const { user } = useAuth();
  const isAr = useIsAr();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressStartRef = useRef<number>(0);

  const { grouped, uploadStory, isUploading, deleteStory, recordView, fetchViewCount } = useStoriesData();

  // Viewer state
  const [viewing, setViewing] = useState<GroupedStories | null>(null);
  const [storyIndex, setStoryIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [viewCount, setViewCount] = useState(0);

  // Upload state
  const [caption, setCaption] = useState("");
  const [showCaptionInput, setShowCaptionInput] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [imagePosition, setImagePosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartPos, setDragStartPos] = useState(50);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "video/mp4", "video/webm"];
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({ variant: "destructive", title: isAr ? "نوع ملف غير مدعوم" : "Unsupported file type" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: "destructive", title: isAr ? "الملف كبير جداً" : "File too large (max 10MB)" });
      return;
    }
    setPendingFile(file);
    setImagePosition(50);
    setShowCaptionInput(true);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!pendingFile) return;
    try {
      await uploadStory(pendingFile, caption);
      setCaption("");
      setPendingFile(null);
      setShowCaptionInput(false);
      toast({ title: isAr ? "تمت إضافة القصة" : "Story added!" });
    } catch (err: unknown) {
      toast({ variant: "destructive", title: "Error", description: err instanceof Error ? err.message : String(err) });
    }
  };

  const openStory = async (group: GroupedStories) => {
    setViewing(group);
    setStoryIndex(0);
    setPaused(false);
    setProgress(0);
    if (user && user.id !== group.user_id) {
      await recordView(group.stories[0].id);
    }
    if (user && user.id === group.user_id) {
      const count = await fetchViewCount(group.stories[0].id);
      setViewCount(count);
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
  }, [viewing, storyIndex, paused]); // eslint-disable-line react-hooks/exhaustive-deps

  const nextStory = async () => {
    if (!viewing) return;
    if (storyIndex < viewing.stories.length - 1) {
      const next = storyIndex + 1;
      setStoryIndex(next);
      setProgress(0);
      if (user && user.id !== viewing.user_id) {
        await recordView(viewing.stories[next].id);
      }
      if (user && user.id === viewing.user_id) {
        const count = await fetchViewCount(viewing.stories[next].id);
        setViewCount(count);
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

  const handleDelete = async (storyId: string) => {
    try {
      await deleteStory(storyId);
      toast({ title: isAr ? "تم حذف القصة" : "Story deleted" });
      if (viewing && viewing.stories.length <= 1) {
        setViewing(null);
      } else if (viewing) {
        const updated = { ...viewing, stories: viewing.stories.filter(s => s.id !== storyId) };
        setViewing(updated);
        if (storyIndex >= updated.stories.length) setStoryIndex(Math.max(0, updated.stories.length - 1));
      }
    } catch {}
  };

  if (grouped.length === 0 && !user) return null;

  return (
    <>
      <div className="border-b border-border px-4 py-3">
        <div ref={scrollRef} className="flex items-center gap-3 overflow-x-auto scrollbar-none">
          {user && (
            <div className="flex flex-col items-center gap-1 shrink-0">
              <button
                onClick={() => fileRef.current?.click()}
                className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-primary/40 bg-primary/5 transition-all hover:border-primary hover:bg-primary/10"
              >
                <Plus className="h-5 w-5 text-primary" />
              </button>
              <span className="text-xs text-muted-foreground font-medium">
                {isAr ? "قصتك" : "Your story"}
              </span>
              <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
            </div>
          )}

          {grouped.map((group) => (
            <button key={group.user_id} onClick={() => openStory(group)} className="flex flex-col items-center gap-1 shrink-0">
              <div className={cn(
                "rounded-full p-0.5",
                group.hasViewed ? "bg-muted" : "bg-gradient-to-tr from-primary via-chart-2 to-chart-4"
              )}>
                <Avatar className="h-14 w-14 border-2 border-background">
                  <AvatarImage src={group.user_avatar || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                    {(group.user_name || "C")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <span className="text-xs text-muted-foreground font-medium max-w-[60px] truncate">
                {user?.id === group.user_id ? (isAr ? "قصتك" : "Your story") : (group.user_name?.split(" ")[0] || "Chef")}
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
                  : <img loading="lazy" src={URL.createObjectURL(pendingFile)} className="w-full h-full object-cover pointer-events-none" style={{ objectPosition: `${imagePosition}% 50%` }} alt="Story preview" draggable={false} />
                }
                {!pendingFile.type.startsWith("video/") && (
                  <div className="absolute bottom-2 inset-x-0 flex justify-center">
                    <div className="flex items-center gap-1.5 rounded-full bg-background/70 backdrop-blur-sm px-3 py-1 text-xs text-muted-foreground font-medium">
                      <Move className="h-3 w-3" />
                      {isAr ? "اسحب لضبط الصورة" : "Drag to adjust"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <Input placeholder={isAr ? "أضف تعليقاً (اختياري)..." : "Add a caption (optional)..."} value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={200} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => { setShowCaptionInput(false); setPendingFile(null); }}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={handleUpload} disabled={isUploading}>
              {isUploading ? (isAr ? "جارٍ الرفع..." : "Uploading...") : (isAr ? "نشر القصة" : "Post Story")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Story viewer */}
      <Dialog open={!!viewing} onOpenChange={() => setViewing(null)}>
        <DialogContent className="sm:max-w-sm p-0 overflow-hidden bg-background border-0 rounded-2xl">
          <DialogTitle className="sr-only">{viewing?.user_name || "Story"}</DialogTitle>
          {viewing && (
            <div className="relative">
              <div className="absolute top-0 inset-x-0 z-10 flex gap-1 p-2">
                {viewing.stories.map((_, i) => (
                  <div key={i} className="h-0.5 flex-1 rounded-full bg-foreground/20 overflow-hidden">
                    <div className="h-full rounded-full bg-foreground/80" style={{ width: i < storyIndex ? "100%" : i === storyIndex ? `${progress}%` : "0%", transition: i === storyIndex ? "none" : "width 0.3s" }} />
                  </div>
                ))}
              </div>

              <div className="absolute top-4 inset-x-0 z-10 flex items-center gap-2 px-4">
                <Avatar className="h-8 w-8 ring-2 ring-background">
                  <AvatarImage src={viewing.user_avatar || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{(viewing.user_name || "C")[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-xs font-bold text-foreground drop-shadow">{viewing.user_name || "Chef"}</span>
                <div className="ms-auto flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground/80 hover:text-foreground" onClick={() => setPaused(!paused)}>
                    {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  </Button>
                  {user?.id === viewing.user_id && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/80 hover:text-destructive" onClick={() => handleDelete(viewing.stories[storyIndex].id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground/80 hover:text-foreground" onClick={() => setViewing(null)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="aspect-[9/16] bg-muted flex items-center justify-center min-h-[400px]">
                {viewing.stories[storyIndex]?.media_type === "video" ? (
                  <video src={viewing.stories[storyIndex].media_url} className="w-full h-full object-cover" autoPlay muted playsInline />
                ) : (
                  <img src={viewing.stories[storyIndex]?.media_url} alt={viewing.stories[storyIndex]?.caption || "Story"} className="w-full h-full object-cover" loading="lazy" />
                )}
              </div>

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

              <button className="absolute inset-y-0 start-0 w-1/3 z-10" onClick={prevStory} />
              <button className="absolute inset-y-0 end-0 w-1/3 z-10" onClick={nextStory} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
});
