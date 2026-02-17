import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Image as ImageIcon, X, Globe, Lock, Users as UsersIcon, Loader2, User,
  Trophy, CalendarDays, Quote, Sparkles,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const MAX_CHARS = 1000;
const MAX_IMAGES = 4;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

type PostType = "text" | "competition" | "event" | "testimonial";

interface PostComposerProps {
  onPosted: () => void;
  replyToPostId: string | null;
  placeholder?: string;
  compact?: boolean;
  autoFocus?: boolean;
}

const POST_TYPE_CONFIG = {
  text: { icon: Sparkles, color: "text-primary", bg: "bg-primary/10" },
  competition: { icon: Trophy, color: "text-chart-2", bg: "bg-chart-2/10" },
  event: { icon: CalendarDays, color: "text-chart-3", bg: "bg-chart-3/10" },
  testimonial: { icon: Quote, color: "text-chart-4", bg: "bg-chart-4/10" },
};

export function PostComposer({ onPosted, replyToPostId, placeholder, compact, autoFocus }: PostComposerProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const isAr = language === "ar";
  const fileRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState("");
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [visibility, setVisibility] = useState<"public" | "followers">("public");
  const [posting, setPosting] = useState(false);
  const [profile, setProfile] = useState<{ avatar_url: string | null } | null>(null);
  const [postType, setPostType] = useState<PostType>("text");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("avatar_url").eq("user_id", user.id).single().then(({ data }) => {
      if (data) setProfile(data);
    });
  }, [user]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_IMAGES - images.length;
    const selected = files.slice(0, remaining);

    for (const file of selected) {
      if (file.size > MAX_IMAGE_SIZE) {
        toast({ variant: "destructive", title: isAr ? "الملف كبير جداً" : "File too large", description: isAr ? "الحد الأقصى 5 ميجابايت" : "Maximum 5MB per image" });
        continue;
      }
      if (!file.type.startsWith("image/")) continue;
      const preview = URL.createObjectURL(file);
      setImages((prev) => [...prev, { file, preview }]);
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeImage = (idx: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    switch (postType) {
      case "competition": return isAr ? "شارك تجربتك في المسابقة..." : "Share your competition experience...";
      case "event": return isAr ? "أخبرنا عن الفعالية..." : "Tell us about the event...";
      case "testimonial": return isAr ? "شارك شهادتك أو تجربتك..." : "Share your testimonial or experience...";
      default: return isAr ? "ماذا يحدث في مجتمع الطهاة؟" : "What's happening in the chef community?";
    }
  };

  const handlePost = async () => {
    if (!user || (!content.trim() && images.length === 0)) return;
    setPosting(true);

    try {
      const uploadedUrls: string[] = [];
      for (const img of images) {
        const ext = img.file.name.split(".").pop() || "jpg";
        const path = `posts/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("user-media").upload(path, img.file, { contentType: img.file.type });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("user-media").getPublicUrl(path);
        uploadedUrls.push(urlData.publicUrl);
      }

      // Build content with post type prefix
      let finalContent = content.trim();
      if (postType === "competition" && !finalContent.includes("#competition")) {
        finalContent += isAr ? "\n\n#مسابقة #طهي" : "\n\n#competition #culinary";
      }
      if (postType === "event" && !finalContent.includes("#event")) {
        finalContent += isAr ? "\n\n#فعالية #تسجيل" : "\n\n#event #registration";
      }
      if (postType === "testimonial" && !finalContent.includes("#testimonial")) {
        finalContent += isAr ? "\n\n#شهادة #تجربة" : "\n\n#testimonial #experience";
      }

      const postData: any = {
        author_id: user.id,
        content: finalContent,
        visibility,
        image_urls: uploadedUrls,
        image_url: uploadedUrls[0] || null,
      };
      if (replyToPostId) postData.reply_to_post_id = replyToPostId;

      const { error } = await supabase.from("posts").insert(postData);
      if (error) throw error;

      setContent("");
      setImages([]);
      setPostType("text");
      onPosted();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setPosting(false);
    }
  };

  if (!user) return null;

  const charsLeft = MAX_CHARS - content.length;
  const isOverLimit = charsLeft < 0;
  const TypeIcon = POST_TYPE_CONFIG[postType].icon;

  return (
    <div className={cn("border-b border-border px-4 py-3", compact && "px-3 py-2")}>
      <div className="flex gap-3">
        <Avatar className={cn("shrink-0 ring-2 ring-primary/10", compact ? "h-8 w-8" : "h-10 w-10")}>
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          {/* Post type selector - only for new posts */}
          {!replyToPostId && !compact && (
            <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-border/30">
              {(["text", "competition", "event", "testimonial"] as PostType[]).map((type) => {
                const config = POST_TYPE_CONFIG[type];
                const Icon = config.icon;
                const labels: Record<PostType, { en: string; ar: string }> = {
                  text: { en: "Post", ar: "منشور" },
                  competition: { en: "Competition", ar: "مسابقة" },
                  event: { en: "Event", ar: "فعالية" },
                  testimonial: { en: "Testimonial", ar: "شهادة" },
                };
                return (
                  <button
                    key={type}
                    onClick={() => setPostType(type)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200",
                      postType === type
                        ? `${config.bg} ${config.color} ring-1 ring-current/20`
                        : "text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{isAr ? labels[type].ar : labels[type].en}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Post type badge */}
          {postType !== "text" && !compact && (
            <Badge variant="secondary" className={cn("mb-2 gap-1 text-[10px]", POST_TYPE_CONFIG[postType].color)}>
              <TypeIcon className="h-3 w-3" />
              {postType === "competition" && (isAr ? "مشاركة مسابقة" : "Competition Entry")}
              {postType === "event" && (isAr ? "تسجيل فعالية" : "Event Attendance")}
              {postType === "testimonial" && (isAr ? "شهادة" : "Testimonial")}
            </Badge>
          )}

          <Textarea
            placeholder={getPlaceholder()}
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, MAX_CHARS + 50))}
            className="resize-none border-0 bg-transparent px-0 py-1 text-base shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0"
            rows={compact ? 1 : 3}
            autoFocus={autoFocus}
          />

          {/* Image previews */}
          {images.length > 0 && (
            <div className={cn(
              "mt-2 overflow-hidden rounded-2xl border border-border",
              images.length >= 2 && "grid grid-cols-2 gap-0.5"
            )}>
              {images.map((img, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={img.preview}
                    alt=""
                    className={cn("w-full object-cover", images.length === 1 ? "max-h-[300px]" : "aspect-square")}
                  />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 end-1 h-7 w-7 rounded-full bg-background/80 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Toolbar */}
          <div className="mt-2 flex items-center justify-between border-t border-border/50 pt-2">
            <div className="flex items-center gap-1">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={handleImageSelect}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-primary"
                onClick={() => fileRef.current?.click()}
                disabled={images.length >= MAX_IMAGES}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>

              {!replyToPostId && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 gap-1 rounded-full px-2 text-xs text-primary">
                      {visibility === "public" ? <Globe className="h-3.5 w-3.5" /> : <UsersIcon className="h-3.5 w-3.5" />}
                      {visibility === "public" ? (isAr ? "الكل" : "Everyone") : (isAr ? "المتابعين" : "Followers")}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setVisibility("public")}>
                      <Globe className="h-4 w-4 me-2" />
                      {isAr ? "الكل يمكنه الرد" : "Everyone can reply"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setVisibility("followers")}>
                      <UsersIcon className="h-4 w-4 me-2" />
                      {isAr ? "المتابعون فقط" : "Followers only"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            <div className="flex items-center gap-2">
              {content.length > 0 && (
                <span className={cn(
                  "text-xs tabular-nums",
                  isOverLimit ? "text-destructive font-bold" : charsLeft <= 50 ? "text-chart-4" : "text-muted-foreground"
                )}>
                  {charsLeft}
                </span>
              )}
              <Button
                size="sm"
                className="rounded-full px-5 font-bold"
                disabled={posting || (content.trim().length === 0 && images.length === 0) || isOverLimit}
                onClick={handlePost}
              >
                {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : (replyToPostId ? (isAr ? "رد" : "Reply") : (isAr ? "نشر" : "Post"))}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
