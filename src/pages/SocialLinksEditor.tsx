import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { useSocialLinkPage, useSocialLinkItems, useUpsertSocialLinkPage, useManageSocialLinkItems } from "@/hooks/useSocialLinkPage";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  Palette, Eye, Link as LinkIcon, Plus, Trash2, ExternalLink,
  Globe, Save, Copy, Check, QrCode,
  BarChart3, MousePointerClick, Pencil, Instagram, Twitter,
  Facebook, Linkedin, Youtube, Smartphone, Type, EyeOff, Settings2,
  Phone, MessageCircle, Music, ShoppingBag, CalendarDays, Video, Briefcase,
  Sparkles, TrendingUp, Loader2, GripVertical,
  AlignLeft, AlignCenter, AlignRight, LayoutGrid, LayoutList, ArrowLeftRight
} from "lucide-react";
import { buildSocialLinksPath, buildSocialLinksUrl } from "@/lib/publicAppUrl";

// ── Constants ──

const SOCIAL_PLATFORMS = [
  { key: "instagram", label: "Instagram", labelAr: "انستقرام", icon: Instagram, prefix: "https://instagram.com/", placeholder: "username", color: "from-pink-500 to-purple-600" },
  { key: "twitter", label: "X / Twitter", labelAr: "إكس / تويتر", icon: Twitter, prefix: "https://x.com/", placeholder: "username", color: "from-sky-400 to-blue-500" },
  { key: "tiktok", label: "TikTok", labelAr: "تيك توك", icon: Video, prefix: "https://tiktok.com/@", placeholder: "username", color: "from-gray-700 to-gray-900" },
  { key: "youtube", label: "YouTube", labelAr: "يوتيوب", icon: Youtube, prefix: "https://youtube.com/@", placeholder: "channel", color: "from-red-500 to-red-700" },
  { key: "snapchat", label: "Snapchat", labelAr: "سناب شات", icon: Globe, prefix: "https://snapchat.com/add/", placeholder: "username", color: "from-yellow-400 to-yellow-600" },
  { key: "facebook", label: "Facebook", labelAr: "فيسبوك", icon: Facebook, prefix: "https://facebook.com/", placeholder: "username", color: "from-blue-500 to-blue-700" },
  { key: "linkedin", label: "LinkedIn", labelAr: "لينكدإن", icon: Linkedin, prefix: "https://linkedin.com/in/", placeholder: "username", color: "from-blue-600 to-blue-800" },
  { key: "website", label: "Website", labelAr: "الموقع", icon: Globe, prefix: "", placeholder: "https://example.com", color: "from-emerald-500 to-teal-600" },
];

const CONTACT_FIELDS = [
  { key: "whatsapp", label: "WhatsApp", labelAr: "واتساب", icon: MessageCircle, placeholder: "+966XXXXXXXXX", color: "from-green-500 to-green-700" },
  { key: "phone", label: "Phone", labelAr: "الهاتف", icon: Phone, placeholder: "+966XXXXXXXXX", color: "from-blue-400 to-blue-600" },
];

const THEMES = [
  { id: "default", label: "Default", labelAr: "افتراضي", preview: "bg-gradient-to-br from-background to-muted/30" },
  { id: "dark", label: "Dark", labelAr: "داكن", preview: "bg-gradient-to-br from-gray-950 to-gray-900" },
  { id: "ocean", label: "Ocean", labelAr: "محيط", preview: "bg-gradient-to-br from-blue-950 to-teal-950" },
  { id: "sunset", label: "Sunset", labelAr: "غروب", preview: "bg-gradient-to-br from-orange-950 to-purple-950" },
  { id: "forest", label: "Forest", labelAr: "غابة", preview: "bg-gradient-to-br from-green-950 to-teal-950" },
  { id: "minimal", label: "Minimal", labelAr: "بسيط", preview: "bg-white dark:bg-gray-950" },
  { id: "candy", label: "Candy", labelAr: "حلوى", preview: "bg-gradient-to-br from-pink-400 to-indigo-500" },
  { id: "gold", label: "Gold", labelAr: "ذهبي", preview: "bg-gradient-to-br from-yellow-900 to-yellow-950" },
];

const BUTTON_STYLES = [
  { id: "rounded", label: "Rounded", labelAr: "مستدير" },
  { id: "pill", label: "Pill", labelAr: "كبسولة" },
  { id: "square", label: "Square", labelAr: "مربع" },
  { id: "sharp", label: "Sharp", labelAr: "حاد" },
  { id: "outline", label: "Outline", labelAr: "إطار" },
];

// FONT_FAMILIES now imported from shared constants

const FONT_SIZES = [
  { id: "sm", label: "Small", labelAr: "صغير" },
  { id: "md", label: "Medium", labelAr: "متوسط" },
  { id: "lg", label: "Large", labelAr: "كبير" },
  { id: "xl", label: "Extra Large", labelAr: "كبير جداً" },
];

import {
  THEME_COLORS, THEME_PREVIEW_MAP, BUTTON_STYLES_MAP, FONT_MAP, FONT_SIZE_MAP,
  FONT_FAMILIES, parseExtra, DEFAULT_EXTRA, detectLinkType,
  type ExtraSettings, type PreviewTheme,
} from "@/lib/socialLinksConstants";

const SOCIAL_ICONS: Record<string, typeof Instagram> = {
  instagram: Instagram, twitter: Twitter, facebook: Facebook,
  linkedin: Linkedin, youtube: Youtube, website: Globe,
};

const LINK_TYPE_ICONS: Record<string, typeof Globe> = {
  custom: LinkIcon, menu: ShoppingBag, store: ShoppingBag,
  booking: CalendarDays, portfolio: Briefcase, video: Video, music: Music,
};

// ── Loading Skeleton ──
function EditorSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-[72px] rounded-xl" />)}
      </div>
      <Skeleton className="h-12 rounded-xl" />
      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
        <Skeleton className="hidden lg:block h-[500px] rounded-xl" />
      </div>
    </div>
  );
}

// ── Component ──

export default function SocialLinksEditor() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", title_ar: "", url: "", icon: "" });
  const [uploading, setUploading] = useState(false);
  const [savingSocials, setSavingSocials] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Drag-and-drop state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  const { data: page, isLoading: pageLoading } = useSocialLinkPage(user?.id);
  const { data: items = [], isLoading: itemsLoading } = useSocialLinkItems(page?.id);
  const upsertPage = useUpsertSocialLinkPage();
  const { addItem, updateItem, deleteItem, reorderItems } = useManageSocialLinkItems();

  const { data: profile, refetch: refetchProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["my-profile-for-links", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("username, avatar_url, full_name, full_name_ar, display_name, display_name_ar, bio, bio_ar, instagram, twitter, facebook, linkedin, youtube, tiktok, snapchat, website, phone, whatsapp, job_title, job_title_ar")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
  });

  const [socials, setSocials] = useState<Record<string, string>>({});
  const [contacts, setContacts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (profile) {
      setSocials({
        instagram: profile.instagram || "",
        twitter: profile.twitter || "",
        tiktok: profile.tiktok || "",
        youtube: profile.youtube || "",
        snapchat: profile.snapchat || "",
        facebook: profile.facebook || "",
        linkedin: profile.linkedin || "",
        website: profile.website || "",
      });
      setContacts({
        whatsapp: profile.whatsapp || "",
        phone: profile.phone || "",
      });
    }
  }, [profile]);

  const [form, setForm] = useState({
    page_title: "", page_title_ar: "", bio: "", bio_ar: "",
    theme: "default", button_style: "rounded", button_color: "#000000",
    text_color: "#ffffff", background_color: "#ffffff",
    show_avatar: true, show_social_icons: true, is_published: true,
    background_image_url: "", font_family: "default",
  });

  const [extra, setExtra] = useState<ExtraSettings>({ ...DEFAULT_EXTRA });
  const [newLink, setNewLink] = useState({ title: "", title_ar: "", url: "", icon: "", link_type: "custom" });

  useEffect(() => {
    if (page) {
      setForm({
        page_title: page.page_title || "",
        page_title_ar: page.page_title_ar || "",
        bio: page.bio || "",
        bio_ar: page.bio_ar || "",
        theme: page.theme || "default",
        button_style: page.button_style || "rounded",
        button_color: page.button_color || "#000000",
        text_color: page.text_color || "#ffffff",
        background_color: page.background_color || "#ffffff",
        show_avatar: page.show_avatar !== false,
        show_social_icons: page.show_social_icons !== false,
        is_published: page.is_published !== false,
        background_image_url: page.background_image_url || "",
        font_family: page.font_family || "default",
      });
      setExtra(parseExtra(page.custom_css));
    } else if (profile && !page) {
      setForm(f => ({
        ...f,
        page_title: profile.display_name || profile.full_name || "",
        page_title_ar: profile.display_name_ar || profile.full_name_ar || "",
        bio: profile.bio || "",
        bio_ar: profile.bio_ar || "",
      }));
    }
  }, [page, profile]);

  const updateForm = useCallback((updates: Partial<typeof form>) => {
    setForm(f => ({ ...f, ...updates }));
    setHasUnsavedChanges(true);
  }, []);

  const updateExtra = useCallback((updates: Partial<ExtraSettings>) => {
    setExtra(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  }, []);

  const handleSavePage = useCallback(() => {
    upsertPage.mutate({ ...form, custom_css: JSON.stringify(extra) }, {
      onSuccess: () => setHasUnsavedChanges(false),
    });
  }, [form, extra, upsertPage]);

  // ── Auto-save with debounce (3s) ──
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!hasUnsavedChanges || !page) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      upsertPage.mutate({ ...form, custom_css: JSON.stringify(extra) }, {
        onSuccess: () => setHasUnsavedChanges(false),
      });
    }, 3000);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [hasUnsavedChanges, form, extra, page]);

  const handleSaveSocials = useCallback(async () => {
    if (!user) return;
    setSavingSocials(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          instagram: socials.instagram || null,
          twitter: socials.twitter || null,
          tiktok: socials.tiktok || null,
          youtube: socials.youtube || null,
          snapchat: socials.snapchat || null,
          facebook: socials.facebook || null,
          linkedin: socials.linkedin || null,
          website: socials.website || null,
          whatsapp: contacts.whatsapp || null,
          phone: contacts.phone || null,
        })
        .eq("user_id", user.id);
      if (error) throw error;
      toast({ title: isAr ? "✅ تم حفظ الحسابات" : "✅ Accounts saved" });
      refetchProfile();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingSocials(false);
    }
  }, [user, socials, contacts, isAr, toast, refetchProfile]);

  // Auto-detect link type when URL changes
  const handleNewLinkUrlChange = useCallback((url: string) => {
    const detected = detectLinkType(url);
    setNewLink(prev => ({
      ...prev,
      url,
      ...(detected && !prev.icon ? { icon: detected.icon, link_type: detected.type } : {}),
    }));
  }, []);

  const handleAddLink = useCallback(async () => {
    if (!newLink.title || !newLink.url) {
      toast({ title: isAr ? "أدخل العنوان والرابط" : "Enter title and URL", variant: "destructive" });
      return;
    }
    const pageId = page?.id || (await upsertPage.mutateAsync({ ...form, custom_css: JSON.stringify(extra) })).id;
    addItem.mutate({
      page_id: pageId, title: newLink.title,
      title_ar: newLink.title_ar || undefined, url: newLink.url,
      icon: newLink.icon || undefined, link_type: newLink.link_type, sort_order: items.length,
    });
    setNewLink({ title: "", title_ar: "", url: "", icon: "", link_type: "custom" });
  }, [newLink, page, form, extra, items.length, isAr, toast, upsertPage, addItem]);

  const startEditing = useCallback((item: any) => {
    setEditingItem(item.id);
    setEditForm({ title: item.title, title_ar: item.title_ar || "", url: item.url, icon: item.icon || "" });
  }, []);

  const saveEdit = useCallback(() => {
    if (editingItem) {
      updateItem.mutate({ id: editingItem, ...editForm });
      setEditingItem(null);
    }
  }, [editingItem, editForm, updateItem]);

  const handleThumbnailUpload = useCallback(async (itemId: string, file: File) => {
    if (!user) return;
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/link-thumb-${itemId}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("user-media").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("user-media").getPublicUrl(path);
      updateItem.mutate({ id: itemId, thumbnail_url: urlData.publicUrl });
      toast({ title: isAr ? "تم رفع الصورة المصغرة" : "Thumbnail uploaded" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }, [user, isAr, toast, updateItem]);

  // ── Drag and Drop handlers ──
  const handleDragStart = useCallback((index: number, e: React.DragEvent<HTMLDivElement>) => {
    setDragIndex(index);
    dragNodeRef.current = e.currentTarget;
    e.dataTransfer.effectAllowed = "move";
    // Make drag ghost slightly transparent
    requestAnimationFrame(() => {
      if (dragNodeRef.current) {
        dragNodeRef.current.style.opacity = "0.4";
      }
    });
  }, []);

  const handleDragEnter = useCallback((index: number) => {
    if (dragIndex === null || dragIndex === index) return;
    setDragOverIndex(index);
  }, [dragIndex]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragNodeRef.current) {
      dragNodeRef.current.style.opacity = "1";
    }
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      const newItems = [...items];
      const [removed] = newItems.splice(dragIndex, 1);
      newItems.splice(dragOverIndex, 0, removed);
      reorderItems.mutate(newItems.map((item, i) => ({ id: item.id, sort_order: i })));
    }
    setDragIndex(null);
    setDragOverIndex(null);
    dragNodeRef.current = null;
  }, [dragIndex, dragOverIndex, items, reorderItems]);

  const handleBgUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/social-bg-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("user-media").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("user-media").getPublicUrl(path);
      updateForm({ background_image_url: urlData.publicUrl });
      toast({ title: isAr ? "تم رفع الصورة" : "Image uploaded" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  }, [user, isAr, toast, updateForm]);

  const copyLink = useCallback(async () => {
    if (!profile?.username) return;
    await navigator.clipboard.writeText(buildSocialLinksUrl(profile.username));
    setCopied(true);
    toast({ title: isAr ? "تم نسخ الرابط" : "Link copied!" });
    setTimeout(() => setCopied(false), 2000);
  }, [profile?.username, isAr, toast]);

  const totalClicks = useMemo(() => items.reduce((sum, item) => sum + (item.click_count || 0), 0), [items]);
  const previewUrl = profile?.username ? buildSocialLinksPath(profile.username) : "#";
  const fullUrl = profile?.username ? buildSocialLinksUrl(profile.username) : "";
  const displayName = profile?.display_name || profile?.full_name || profile?.username || "";

  const activeSocials = useMemo(() => SOCIAL_PLATFORMS.filter(p => socials[p.key]), [socials]);
  const activeContacts = useMemo(() => CONTACT_FIELDS.filter(c => contacts[c.key]), [contacts]);

  const VISIBILITY_SECTIONS = useMemo(() => [
    { key: "show_bio" as const, label: isAr ? "النبذة" : "Bio", icon: Type },
    { key: "show_job_title" as const, label: isAr ? "المسمى الوظيفي" : "Job Title", icon: Briefcase },
    { key: "show_location" as const, label: isAr ? "الموقع" : "Location", icon: Globe },
    { key: "show_stats" as const, label: isAr ? "الإحصائيات" : "Stats", icon: BarChart3 },
    { key: "show_views" as const, label: isAr ? "عدد المشاهدات" : "View Count", icon: Eye },
    { key: "show_followers" as const, label: isAr ? "زر المتابعة والمتابعين" : "Follow Button & Count", icon: TrendingUp },
    { key: "show_flags" as const, label: isAr ? "أعلام الجنسية والإقامة" : "Nationality & Residence Flags", icon: Globe },
    { key: "show_language_switcher" as const, label: isAr ? "محوّل اللغات" : "Language Switcher", icon: Globe },
    { key: "show_awards" as const, label: isAr ? "الجوائز" : "Awards", icon: Sparkles },
    { key: "show_membership" as const, label: isAr ? "العضوية" : "Membership", icon: Settings2 },
    { key: "show_full_profile_btn" as const, label: isAr ? "زر البروفايل الكامل" : "Full Profile Button", icon: Eye },
  ], [isAr]);

  const isLoading = pageLoading || profileLoading;

  // Text align mapping for preview
  const alignClass = extra.text_align === "start" ? "text-start" : extra.text_align === "end" ? "text-end" : "text-center";
  const justifyClass = extra.text_align === "start" ? "justify-start" : extra.text_align === "end" ? "justify-end" : "justify-center";

  return (
    <div className="flex min-h-screen flex-col bg-background" dir={isAr ? "rtl" : "ltr"}>
      <Header />
      <main className="flex-1 px-4 md:px-6 max-w-6xl mx-auto w-full py-6 space-y-6">
        {isLoading ? <EditorSkeleton /> : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            {/* Header with actions */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10">
                  <LinkIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold">{isAr ? "صفحة الروابط الاجتماعية" : "Social Links Page"}</h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isAr ? "أنشئ صفحتك الشخصية للروابط — احترافية ومخصصة" : "Create your personalized link page — professional & customizable"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap items-center">
                {hasUnsavedChanges && (
                  <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-600 dark:text-amber-400 animate-in fade-in duration-200 gap-1">
                    {page ? <><Loader2 className="h-2.5 w-2.5 animate-spin" />{isAr ? "حفظ تلقائي..." : "Auto-saving..."}</> : (isAr ? "تغييرات غير محفوظة" : "Unsaved changes")}
                  </Badge>
                )}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="sm" onClick={copyLink} className="gap-1.5">
                        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        <span className="hidden sm:inline">{isAr ? "نسخ الرابط" : "Copy Link"}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isAr ? "نسخ رابط الصفحة" : "Copy page link"}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {profile?.username && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1.5"><QrCode className="h-3.5 w-3.5" /><span className="hidden sm:inline">QR</span></Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-xs">
                      <DialogHeader><DialogTitle className="text-center">{isAr ? "رمز QR" : "QR Code"}</DialogTitle></DialogHeader>
                      <div className="flex flex-col items-center gap-4 py-4">
                        <div className="p-5 bg-white rounded-2xl shadow-lg">
                          <QRCodeSVG value={fullUrl} size={180} level="H" />
                        </div>
                        <p className="text-xs text-muted-foreground text-center font-mono" dir="ltr">{fullUrl}</p>
                        <Button variant="outline" size="sm" onClick={copyLink} className="gap-1.5">
                          <Copy className="h-3.5 w-3.5" />{isAr ? "نسخ" : "Copy"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                {profile?.username && (
                  <Button variant="outline" size="sm" asChild className="gap-1.5 hidden sm:inline-flex">
                    <Link to={previewUrl} target="_blank">
                      <Eye className="h-3.5 w-3.5" /><span className="hidden sm:inline">{isAr ? "معاينة" : "Preview"}</span>
                    </Link>
                  </Button>
                )}
                {/* Mobile Preview Button */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5 lg:hidden">
                      <Smartphone className="h-3.5 w-3.5" /><span className="hidden sm:inline">{isAr ? "معاينة" : "Preview"}</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm p-0 overflow-hidden max-h-[85vh]">
                    <DialogHeader className="py-2 px-4 border-b">
                      <DialogTitle className="text-sm">{isAr ? "معاينة مباشرة" : "Live Preview"}</DialogTitle>
                    </DialogHeader>
                    <div className="overflow-y-auto max-h-[75vh]">
                      {(() => {
                        const pt = THEME_PREVIEW_MAP[form.theme] || THEME_PREVIEW_MAP.default;
                        return (
                          <div className="p-4 min-h-[400px]"
                            dir={extra.text_direction === "auto" ? undefined : extra.text_direction}
                            style={{
                              background: form.background_image_url ? `url(${form.background_image_url}) center/cover` : pt.bg,
                              fontFamily: FONT_FAMILIES.find(f => f.id === form.font_family)?.css || "inherit",
                              color: pt.text,
                            }}
                          >
                            <div className="relative z-10 flex flex-col items-center gap-3">
                              {form.show_avatar && (
                                <Avatar className="h-16 w-16 shadow-xl" style={{ boxShadow: `0 0 0 2px ${pt.border}` }}>
                                  <AvatarImage src={profile?.avatar_url || ""} />
                                  <AvatarFallback className="text-lg" style={{ background: `${pt.accent}22`, color: pt.accent }}>{displayName.charAt(0)}</AvatarFallback>
                                </Avatar>
                              )}
                              <div className={alignClass}>
                                <p className={`font-bold ${extra.font_size === "sm" ? "text-xs" : extra.font_size === "lg" ? "text-base" : extra.font_size === "xl" ? "text-lg" : "text-sm"}`} style={{ color: pt.text }}>
                                  {form.page_title || displayName || "Your Name"}
                                </p>
                                <p className="text-[10px] mt-0.5" style={{ color: `${pt.text}66` }}>@{profile?.username || "username"}</p>
                                {extra.show_bio && form.bio && <p className="text-[10px] mt-1" style={{ color: `${pt.text}aa` }}>{form.bio}</p>}
                              </div>
                              {form.show_social_icons && activeSocials.length > 0 && (
                                <div className={`flex gap-2 mt-1 flex-wrap ${justifyClass}`}>
                                  {activeSocials.map(({ key, icon: Icon }) => (
                                    <div key={key} className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: pt.card, border: `1px solid ${pt.border}` }}>
                                      <Icon className="h-3.5 w-3.5" style={{ color: pt.text }} />
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className={`w-full ${extra.link_layout === "grid" ? "grid grid-cols-2 gap-2" : "space-y-2"} mt-3`}>
                                {items.filter(i => i.is_active !== false).map(item => {
                                  const btnRadius = BUTTON_STYLES_MAP[form.button_style] || "rounded-xl";
                                  const customColor = form.button_color !== "#000000" ? { backgroundColor: form.button_color, color: form.text_color, border: "1px solid transparent" } : { background: pt.card, border: `1px solid ${pt.border}` };
                                  return (
                                    <div key={item.id} className={`flex items-center gap-2 px-3 py-2.5 ${btnRadius} ${extra.link_layout === "grid" ? "flex-col text-center py-4" : ""}`} style={customColor}>
                                      {item.thumbnail_url && <img src={item.thumbnail_url} alt="" className="h-8 w-8 rounded-lg object-cover shrink-0" />}
                                      {item.icon && !item.thumbnail_url && <span className="text-sm">{item.icon}</span>}
                                      <span className={`${extra.link_layout === "grid" ? "" : "flex-1"} text-[11px] font-medium ${alignClass}`} style={{ color: (customColor as any).color || pt.text }}>{item.title}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </DialogContent>
                </Dialog>
                <Button size="sm" onClick={handleSavePage} disabled={upsertPage.isPending} className="gap-1.5 min-w-[80px]">
                  {upsertPage.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  {isAr ? "حفظ" : "Save"}
                </Button>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: LinkIcon, value: items.length, label: isAr ? "روابط" : "Links", iconBg: "bg-primary/10", iconColor: "text-primary" },
                { icon: MousePointerClick, value: totalClicks, label: isAr ? "نقرات" : "Clicks", iconBg: "bg-chart-3/10", iconColor: "text-chart-3" },
                { icon: Globe, value: activeSocials.length, label: isAr ? "حسابات" : "Socials", iconBg: "bg-chart-1/10", iconColor: "text-chart-1" },
                { icon: TrendingUp, value: items.length > 0 ? Math.round(totalClicks / items.length) : 0, label: isAr ? "متوسط/رابط" : "Avg/Link", iconBg: "bg-chart-2/10", iconColor: "text-chart-2" },
              ].map((stat, i) => (
                <Card key={i} className="border-border/30 overflow-hidden group hover:border-primary/20 transition-colors">
                  <CardContent className="py-3 px-4 flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl ${stat.iconBg} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}>
                      <stat.icon className={`h-4.5 w-4.5 ${stat.iconColor}`} />
                    </div>
                    <div>
                      <p className="text-xl font-bold tabular-nums">{stat.value}</p>
                      <p className="text-[10px] text-muted-foreground font-medium">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* URL Banner */}
            {profile?.username && (
              <Card className="border-primary/15 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent overflow-hidden">
                <CardContent className="py-3 px-4 flex items-center justify-between gap-2 text-sm flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Globe className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">{isAr ? "رابط صفحتك" : "Your page link"}</span>
                      <code className="block text-xs bg-background/80 px-2 py-0.5 rounded font-mono mt-0.5" dir="ltr">altoha.com/bio/{profile.username}</code>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={form.is_published ? "default" : "secondary"} className="text-[10px]">
                      {form.is_published ? (isAr ? "✓ منشور" : "✓ Published") : (isAr ? "مسودة" : "Draft")}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Main Content */}
            <div className="grid lg:grid-cols-[1fr_340px] gap-6">
              {/* Left: Editor */}
              <div className="space-y-4">
                <Tabs defaultValue="socials" className="w-full">
                  <TabsList className="w-full grid grid-cols-5 h-11">
                    <TabsTrigger value="socials" className="text-xs gap-1"><Globe className="h-3 w-3 hidden sm:block" />{isAr ? "الحسابات" : "Accounts"}</TabsTrigger>
                    <TabsTrigger value="settings" className="text-xs gap-1"><Settings2 className="h-3 w-3 hidden sm:block" />{isAr ? "الإعدادات" : "Settings"}</TabsTrigger>
                    <TabsTrigger value="links" className="text-xs gap-1"><LinkIcon className="h-3 w-3 hidden sm:block" />{isAr ? "الروابط" : "Links"}</TabsTrigger>
                    <TabsTrigger value="appearance" className="text-xs gap-1"><Palette className="h-3 w-3 hidden sm:block" />{isAr ? "المظهر" : "Style"}</TabsTrigger>
                    <TabsTrigger value="visibility" className="text-xs gap-1"><Eye className="h-3 w-3 hidden sm:block" />{isAr ? "العرض" : "Display"}</TabsTrigger>
                  </TabsList>

                  {/* ── Social Accounts Tab ── */}
                  <TabsContent value="socials" className="space-y-4 mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* Active Channels Summary */}
                    {(activeSocials.length > 0 || activeContacts.length > 0) && (
                      <div className="flex flex-wrap gap-1.5">
                        {activeSocials.map(p => {
                          const Icon = p.icon;
                          return (
                            <Badge key={p.key} variant="secondary" className="gap-1 py-0.5 px-2 text-[10px]">
                              <Icon className="h-2.5 w-2.5" />
                              {isAr ? p.labelAr : p.label}
                              <Check className="h-2.5 w-2.5 text-chart-1" />
                            </Badge>
                          );
                        })}
                        {activeContacts.map(c => {
                          const Icon = c.icon;
                          return (
                            <Badge key={c.key} variant="secondary" className="gap-1 py-0.5 px-2 text-[10px]">
                              <Icon className="h-2.5 w-2.5" />
                              {isAr ? c.labelAr : c.label}
                              <Check className="h-2.5 w-2.5 text-chart-1" />
                            </Badge>
                          );
                        })}
                      </div>
                    )}

                    {/* Social Media Accounts */}
                    <Card className="overflow-hidden">
                      <CardHeader className="pb-3 bg-gradient-to-r from-muted/40 to-transparent">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Globe className="h-3.5 w-3.5 text-primary" />
                          </div>
                          {isAr ? "حسابات التواصل الاجتماعي" : "Social Media Accounts"}
                        </CardTitle>
                        <p className="text-[11px] text-muted-foreground">
                          {isAr ? "أدخل اسم المستخدم فقط — سيتم إنشاء الرابط تلقائياً" : "Just enter your username — links are generated automatically"}
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-2 pt-3">
                        {SOCIAL_PLATFORMS.map(platform => {
                          const Icon = platform.icon;
                          const value = socials[platform.key] || "";
                          const isActive = !!value;
                          return (
                            <div key={platform.key} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-200 ${isActive ? "border-primary/25 bg-primary/[0.03] shadow-sm" : "border-border/40 hover:border-border"}`}>
                              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${isActive ? "bg-gradient-to-br " + platform.color + " text-white shadow-sm" : "bg-muted"}`}>
                                <Icon className={`h-3.5 w-3.5 ${isActive ? "" : "text-muted-foreground"}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <Label className="text-[11px] font-semibold mb-0.5 block">{isAr ? platform.labelAr : platform.label}</Label>
                                <div className="flex items-center gap-1">
                                  {platform.prefix && (
                                    <span className="text-[9px] text-muted-foreground shrink-0 hidden sm:inline opacity-60" dir="ltr">{platform.prefix}</span>
                                  )}
                                  <Input
                                    value={value}
                                    onChange={e => setSocials(s => ({ ...s, [platform.key]: e.target.value }))}
                                    placeholder={platform.placeholder}
                                    className="h-7 text-xs border-0 bg-transparent shadow-none focus-visible:ring-1 px-1"
                                    dir="ltr"
                                  />
                                </div>
                              </div>
                              {isActive && (
                                <div className="h-5 w-5 rounded-full bg-chart-1/10 flex items-center justify-center shrink-0">
                                  <Check className="h-3 w-3 text-chart-1" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>

                    {/* Contact: WhatsApp & Phone */}
                    <Card className="overflow-hidden">
                      <CardHeader className="pb-3 bg-gradient-to-r from-muted/40 to-transparent">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Phone className="h-3.5 w-3.5 text-primary" />
                          </div>
                          {isAr ? "معلومات الاتصال" : "Contact Info"}
                        </CardTitle>
                        <p className="text-[11px] text-muted-foreground">
                          {isAr ? "تظهر كأيقونات في صفحة الروابط العامة" : "Displayed as icons on your public links page"}
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-2 pt-3">
                        {CONTACT_FIELDS.map(field => {
                          const Icon = field.icon;
                          const value = contacts[field.key] || "";
                          const isActive = !!value;
                          return (
                            <div key={field.key} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-200 ${isActive ? "border-primary/25 bg-primary/[0.03] shadow-sm" : "border-border/40 hover:border-border"}`}>
                              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${isActive ? "bg-gradient-to-br " + field.color + " text-white shadow-sm" : "bg-muted"}`}>
                                <Icon className={`h-3.5 w-3.5 ${isActive ? "" : "text-muted-foreground"}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <Label className="text-[11px] font-semibold mb-0.5 block">{isAr ? field.labelAr : field.label}</Label>
                                <Input
                                  value={value}
                                  onChange={e => setContacts(c => ({ ...c, [field.key]: e.target.value }))}
                                  placeholder={field.placeholder}
                                  className="h-7 text-xs border-0 bg-transparent shadow-none focus-visible:ring-1 px-1"
                                  dir="ltr"
                                />
                              </div>
                              {isActive && (
                                <div className="h-5 w-5 rounded-full bg-chart-1/10 flex items-center justify-center shrink-0">
                                  <Check className="h-3 w-3 text-chart-1" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>

                    <Button onClick={handleSaveSocials} disabled={savingSocials} className="w-full gap-1.5">
                      {savingSocials ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      {savingSocials ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ الحسابات والاتصال" : "Save Accounts & Contact")}
                    </Button>
                  </TabsContent>

                  {/* ── Settings Tab ── */}
                  <TabsContent value="settings" className="space-y-4 mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <Card className="overflow-hidden">
                      <CardHeader className="pb-3 bg-gradient-to-r from-muted/40 to-transparent">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Settings2 className="h-3.5 w-3.5 text-primary" />
                          </div>
                          {isAr ? "المعلومات الأساسية" : "Basic Info"}
                        </CardTitle>
                        <p className="text-[11px] text-muted-foreground">
                          {isAr ? "يتم تعبئة الاسم والنبذة تلقائياً من بروفايلك" : "Name & bio are auto-filled from your profile"}
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-3">
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-[11px] mb-1 block font-medium">{isAr ? "عنوان الصفحة (EN)" : "Page Title (EN)"}</Label>
                            <Input value={form.page_title} onChange={e => updateForm({ page_title: e.target.value })} dir="ltr" placeholder={profile?.display_name || profile?.full_name || ""} />
                          </div>
                          <div>
                            <Label className="text-[11px] mb-1 block font-medium">{isAr ? "عنوان الصفحة (AR)" : "Page Title (AR)"}</Label>
                            <Input value={form.page_title_ar} onChange={e => updateForm({ page_title_ar: e.target.value })} dir="rtl" placeholder={profile?.display_name_ar || profile?.full_name_ar || ""} />
                          </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-[11px] mb-1 block font-medium">{isAr ? "نبذة (EN)" : "Bio (EN)"}</Label>
                            <Textarea value={form.bio} onChange={e => updateForm({ bio: e.target.value })} className="min-h-[60px] text-xs" dir="ltr" placeholder={profile?.bio || ""} />
                          </div>
                          <div>
                            <Label className="text-[11px] mb-1 block font-medium">{isAr ? "نبذة (AR)" : "Bio (AR)"}</Label>
                            <Textarea value={form.bio_ar} onChange={e => updateForm({ bio_ar: e.target.value })} className="min-h-[60px] text-xs" dir="rtl" placeholder={profile?.bio_ar || ""} />
                          </div>
                        </div>
                        <Separator />
                        <div className="space-y-2.5">
                          {[
                            { key: "show_avatar", label: isAr ? "إظهار الصورة الشخصية" : "Show Avatar", icon: Eye },
                            { key: "show_social_icons", label: isAr ? "إظهار أيقونات التواصل" : "Show Social Icons", icon: Globe },
                            { key: "is_published", label: isAr ? "نشر الصفحة" : "Published", icon: Sparkles },
                          ].map(setting => (
                            <div key={setting.key} className="flex items-center justify-between rounded-lg p-2 hover:bg-muted/30 transition-colors">
                              <div className="flex items-center gap-2">
                                <setting.icon className="h-3.5 w-3.5 text-muted-foreground" />
                                <Label className="text-xs cursor-pointer">{setting.label}</Label>
                              </div>
                              <Switch checked={(form as any)[setting.key]} onCheckedChange={v => updateForm({ [setting.key]: v })} />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* ── Links Tab (with Drag & Drop) ── */}
                  <TabsContent value="links" className="space-y-4 mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <Card className="overflow-hidden">
                      <CardHeader className="pb-3 bg-gradient-to-r from-muted/40 to-transparent">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Plus className="h-3.5 w-3.5 text-primary" />
                          </div>
                          {isAr ? "إضافة رابط جديد" : "Add New Link"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-3">
                        <div className="grid sm:grid-cols-2 gap-3">
                          <Input placeholder={isAr ? "العنوان (EN)" : "Title (EN)"} value={newLink.title} onChange={e => setNewLink(l => ({ ...l, title: e.target.value }))} dir="ltr" />
                          <Input placeholder={isAr ? "العنوان (AR)" : "Title (AR)"} value={newLink.title_ar} onChange={e => setNewLink(l => ({ ...l, title_ar: e.target.value }))} dir="rtl" />
                        </div>
                        <Input placeholder="https://example.com" value={newLink.url} onChange={e => handleNewLinkUrlChange(e.target.value)} dir="ltr" />
                        <div className="grid grid-cols-2 gap-3">
                          <Input placeholder={isAr ? "إيموجي 🔗" : "Emoji 🔗"} value={newLink.icon} onChange={e => setNewLink(l => ({ ...l, icon: e.target.value }))} />
                          <Select value={newLink.link_type} onValueChange={v => setNewLink(l => ({ ...l, link_type: v }))}>
                            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="custom">{isAr ? "مخصص" : "Custom"}</SelectItem>
                              <SelectItem value="menu">{isAr ? "قائمة طعام" : "Menu"}</SelectItem>
                              <SelectItem value="store">{isAr ? "متجر" : "Store"}</SelectItem>
                              <SelectItem value="booking">{isAr ? "حجز" : "Booking"}</SelectItem>
                              <SelectItem value="portfolio">{isAr ? "أعمال" : "Portfolio"}</SelectItem>
                              <SelectItem value="video">{isAr ? "فيديو" : "Video"}</SelectItem>
                              <SelectItem value="music">{isAr ? "موسيقى" : "Music"}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleAddLink} disabled={addItem.isPending} className="w-full gap-1.5" size="sm">
                          {addItem.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                          {isAr ? "إضافة" : "Add Link"}
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="overflow-hidden">
                      <CardHeader className="pb-3 bg-gradient-to-r from-muted/40 to-transparent">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                            <LinkIcon className="h-3.5 w-3.5 text-primary" />
                          </div>
                          {isAr ? "الروابط" : "Links"}
                          {items.length > 0 && <Badge variant="secondary" className="text-[10px] ms-1">{items.length}</Badge>}
                        </CardTitle>
                        <p className="text-[11px] text-muted-foreground">
                          {isAr ? "اسحب وأفلت لإعادة الترتيب" : "Drag and drop to reorder"}
                        </p>
                      </CardHeader>
                      <CardContent className="pt-3">
                        {itemsLoading ? (
                          <div className="space-y-2">
                            {[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
                          </div>
                        ) : items.length === 0 ? (
                          <div className="text-center py-10">
                            <div className="h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                              <LinkIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">{isAr ? "لا توجد روابط بعد" : "No links yet"}</p>
                            <p className="text-xs text-muted-foreground/60 mt-1">{isAr ? "أضف رابطك الأول أعلاه" : "Add your first link above"}</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {items.map((item, index) => {
                              const TypeIcon = LINK_TYPE_ICONS[item.link_type || "custom"] || LinkIcon;
                              const isDragOver = dragOverIndex === index && dragIndex !== index;
                              return (
                                <div
                                  key={item.id}
                                  draggable={editingItem !== item.id}
                                  onDragStart={(e) => handleDragStart(index, e)}
                                  onDragEnter={() => handleDragEnter(index)}
                                  onDragOver={handleDragOver}
                                  onDragEnd={handleDragEnd}
                                  className={`flex items-center gap-2 p-3 rounded-xl border transition-all duration-200 group
                                    ${item.is_active !== false ? "border-border/50 bg-card hover:border-primary/20 hover:shadow-sm" : "border-border/30 bg-muted/30 opacity-60"}
                                    ${isDragOver ? "border-primary/40 bg-primary/5 scale-[1.02] shadow-md" : ""}
                                    ${dragIndex === index ? "opacity-40" : ""}
                                  `}
                                  style={{ cursor: editingItem === item.id ? "default" : "grab" }}
                                >
                                  {/* Drag Handle */}
                                  <div className="flex items-center text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors cursor-grab active:cursor-grabbing shrink-0">
                                    <GripVertical className="h-4 w-4" />
                                  </div>

                                  {item.icon ? (
                                    <span className="text-lg shrink-0">{item.icon}</span>
                                  ) : (
                                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                      <TypeIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                    </div>
                                  )}

                                  {editingItem === item.id ? (
                                    <div className="flex-1 space-y-2">
                                      <div className="grid grid-cols-2 gap-2">
                                        <Input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} placeholder="Title (EN)" className="h-8 text-xs" dir="ltr" />
                                        <Input value={editForm.title_ar} onChange={e => setEditForm(f => ({ ...f, title_ar: e.target.value }))} placeholder="العنوان (AR)" className="h-8 text-xs" dir="rtl" />
                                      </div>
                                      <Input value={editForm.url} onChange={e => setEditForm(f => ({ ...f, url: e.target.value }))} placeholder="URL" className="h-8 text-xs" dir="ltr" />
                                      <div className="flex gap-2 items-center">
                                        <Input value={editForm.icon} onChange={e => setEditForm(f => ({ ...f, icon: e.target.value }))} placeholder="🔗 Emoji" className="h-8 text-xs w-24" />
                                        <Label htmlFor={`thumb-${item.id}`} className="cursor-pointer shrink-0">
                                          <div className="h-8 px-2.5 rounded-md border border-border/40 bg-muted/30 hover:bg-muted/50 flex items-center gap-1 text-[10px] font-medium text-muted-foreground transition-colors">
                                            <Palette className="h-3 w-3" />
                                            {isAr ? "صورة" : "Thumb"}
                                          </div>
                                        </Label>
                                        <input id={`thumb-${item.id}`} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleThumbnailUpload(item.id, f); }} />
                                        <Button size="sm" variant="default" className="h-8 text-xs gap-1" onClick={saveEdit}>
                                          <Check className="h-3 w-3" />{isAr ? "حفظ" : "Save"}
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setEditingItem(null)}>
                                          {isAr ? "إلغاء" : "Cancel"}
                                        </Button>
                                      </div>
                                      {item.thumbnail_url && (
                                        <div className="flex items-center gap-2">
                                          <img src={item.thumbnail_url} alt="" className="h-8 w-8 rounded-md object-cover" />
                                          <Button size="sm" variant="ghost" className="h-6 text-[10px] text-destructive" onClick={() => updateItem.mutate({ id: item.id, thumbnail_url: null })}>
                                            {isAr ? "إزالة الصورة" : "Remove thumbnail"}
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{item.title}</p>
                                      {item.title_ar && <p className="text-[10px] text-muted-foreground truncate" dir="rtl">{item.title_ar}</p>}
                                      <p className="text-[11px] text-muted-foreground truncate">{item.url}</p>
                                      {/* Mini click bar */}
                                      {totalClicks > 0 && (item.click_count || 0) > 0 && (
                                        <div className="mt-1.5 flex items-center gap-2">
                                          <div className="h-1 flex-1 max-w-[80px] rounded-full bg-muted overflow-hidden">
                                            <div className="h-full rounded-full bg-primary/60 transition-all duration-500" style={{ width: `${Math.min(100, ((item.click_count || 0) / totalClicks) * 100)}%` }} />
                                          </div>
                                          <span className="text-[9px] text-muted-foreground tabular-nums">{Math.round(((item.click_count || 0) / totalClicks) * 100)}%</span>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {editingItem !== item.id && (
                                    <div className="flex items-center gap-1">
                                      <Badge variant="outline" className="text-[9px] tabular-nums gap-0.5 h-5 px-1.5">
                                        <MousePointerClick className="h-2.5 w-2.5" />{item.click_count || 0}
                                      </Badge>
                                      <Switch checked={item.is_active !== false} onCheckedChange={v => updateItem.mutate({ id: item.id, is_active: v })} />
                                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEditing(item)}>
                                        <Pencil className="h-3 w-3" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteItem.mutate(item.id)}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* ── Appearance Tab ── */}
                  <TabsContent value="appearance" className="space-y-4 mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <Card className="overflow-hidden">
                      <CardHeader className="pb-3 bg-gradient-to-r from-muted/40 to-transparent">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Palette className="h-3.5 w-3.5 text-primary" />
                          </div>
                          {isAr ? "الثيم" : "Theme"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-3">
                        <div className="grid grid-cols-4 gap-2">
                          {THEMES.map(t => (
                            <button
                              key={t.id}
                              onClick={() => updateForm({ theme: t.id })}
                              className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border-2 transition-all duration-200 ${form.theme === t.id ? "border-primary ring-2 ring-primary/15 shadow-sm" : "border-transparent hover:border-border"}`}
                            >
                              <div className={`w-full h-10 rounded-lg ${t.preview} shadow-inner`} />
                              <span className="text-[10px] font-medium">{isAr ? t.labelAr : t.label}</span>
                            </button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="overflow-hidden">
                      <CardHeader className="pb-3 bg-gradient-to-r from-muted/40 to-transparent">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Type className="h-3.5 w-3.5 text-primary" />
                          </div>
                          {isAr ? "الخط" : "Font"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-3">
                        <div>
                          <Label className="text-[11px] mb-2 block font-medium">{isAr ? "نوع الخط" : "Font Family"}</Label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                            {FONT_FAMILIES.map(f => (
                              <button
                                key={f.id}
                                onClick={() => updateForm({ font_family: f.id })}
                                className={`text-xs py-2 px-2 rounded-lg border-2 transition-all duration-200 ${form.font_family === f.id ? "border-primary bg-primary/5 font-semibold shadow-sm" : "border-transparent bg-muted/30 hover:bg-muted/50"}`}
                                style={{ fontFamily: f.css }}
                              >
                                {isAr ? f.labelAr : f.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <Separator />
                        <div>
                          <Label className="text-[11px] mb-2 block font-medium">{isAr ? "حجم الخط" : "Font Size"}</Label>
                          <div className="grid grid-cols-4 gap-1.5">
                            {FONT_SIZES.map(s => (
                              <button
                                key={s.id}
                                onClick={() => updateExtra({ font_size: s.id })}
                                className={`text-xs py-2 px-2 rounded-lg border-2 transition-all duration-200 ${extra.font_size === s.id ? "border-primary bg-primary/5 font-semibold shadow-sm" : "border-transparent bg-muted/30 hover:bg-muted/50"}`}
                              >
                                {isAr ? s.labelAr : s.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Layout Controls */}
                    <Card className="overflow-hidden">
                      <CardHeader className="pb-3 bg-gradient-to-r from-muted/40 to-transparent">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                            <LayoutList className="h-3.5 w-3.5 text-primary" />
                          </div>
                          {isAr ? "التخطيط والمحاذاة" : "Layout & Alignment"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-3">
                        {/* Text Alignment */}
                        <div>
                          <Label className="text-[11px] mb-2 block font-medium">{isAr ? "محاذاة النص" : "Text Alignment"}</Label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {([
                              { id: "start" as const, label: isAr ? "بداية" : "Start", icon: AlignLeft },
                              { id: "center" as const, label: isAr ? "وسط" : "Center", icon: AlignCenter },
                              { id: "end" as const, label: isAr ? "نهاية" : "End", icon: AlignRight },
                            ]).map(a => (
                              <button
                                key={a.id}
                                onClick={() => updateExtra({ text_align: a.id })}
                                className={`flex items-center justify-center gap-1.5 text-xs py-2.5 px-2 rounded-lg border-2 transition-all duration-200 ${extra.text_align === a.id ? "border-primary bg-primary/5 font-semibold shadow-sm" : "border-transparent bg-muted/30 hover:bg-muted/50"}`}
                              >
                                <a.icon className="h-3.5 w-3.5" />
                                {a.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        {/* Text Direction */}
                        <div>
                          <Label className="text-[11px] mb-2 block font-medium">{isAr ? "اتجاه النص" : "Text Direction"}</Label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {([
                              { id: "auto" as const, label: isAr ? "تلقائي" : "Auto", icon: ArrowLeftRight },
                              { id: "ltr" as const, label: "LTR", icon: AlignLeft },
                              { id: "rtl" as const, label: "RTL", icon: AlignRight },
                            ]).map(d => (
                              <button
                                key={d.id}
                                onClick={() => updateExtra({ text_direction: d.id })}
                                className={`flex items-center justify-center gap-1.5 text-xs py-2.5 px-2 rounded-lg border-2 transition-all duration-200 ${extra.text_direction === d.id ? "border-primary bg-primary/5 font-semibold shadow-sm" : "border-transparent bg-muted/30 hover:bg-muted/50"}`}
                              >
                                <d.icon className="h-3.5 w-3.5" />
                                {d.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        {/* Link Layout */}
                        <div>
                          <Label className="text-[11px] mb-2 block font-medium">{isAr ? "تخطيط الروابط" : "Link Layout"}</Label>
                          <div className="grid grid-cols-2 gap-1.5">
                            {([
                              { id: "list" as const, label: isAr ? "قائمة" : "List", icon: LayoutList },
                              { id: "grid" as const, label: isAr ? "شبكة" : "Grid", icon: LayoutGrid },
                            ]).map(l => (
                              <button
                                key={l.id}
                                onClick={() => updateExtra({ link_layout: l.id })}
                                className={`flex items-center justify-center gap-1.5 text-xs py-2.5 px-2 rounded-lg border-2 transition-all duration-200 ${extra.link_layout === l.id ? "border-primary bg-primary/5 font-semibold shadow-sm" : "border-transparent bg-muted/30 hover:bg-muted/50"}`}
                              >
                                <l.icon className="h-3.5 w-3.5" />
                                {l.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="overflow-hidden">
                      <CardHeader className="pb-3 bg-gradient-to-r from-muted/40 to-transparent">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Smartphone className="h-3.5 w-3.5 text-primary" />
                          </div>
                          {isAr ? "شكل الأزرار" : "Button Style"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-3">
                        <div className="grid grid-cols-5 gap-1.5">
                          {BUTTON_STYLES.map(s => (
                            <button
                              key={s.id}
                              onClick={() => updateForm({ button_style: s.id })}
                              className={`text-xs py-2 px-2 rounded-lg border-2 transition-all duration-200 ${form.button_style === s.id ? "border-primary bg-primary/5 font-semibold shadow-sm" : "border-transparent bg-muted/30 hover:bg-muted/50"}`}
                            >
                              {isAr ? s.labelAr : s.label}
                            </button>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-[11px] mb-1.5 block font-medium">{isAr ? "لون الأزرار" : "Button Color"}</Label>
                            <div className="flex gap-2 items-center">
                              <div className="relative">
                                <input type="color" value={form.button_color} onChange={e => updateForm({ button_color: e.target.value })} className="h-9 w-12 rounded-lg cursor-pointer border border-border/30" />
                              </div>
                              <Input value={form.button_color} onChange={e => updateForm({ button_color: e.target.value })} className="text-xs font-mono h-9" dir="ltr" />
                            </div>
                          </div>
                          <div>
                            <Label className="text-[11px] mb-1.5 block font-medium">{isAr ? "لون النص" : "Text Color"}</Label>
                            <div className="flex gap-2 items-center">
                              <input type="color" value={form.text_color} onChange={e => updateForm({ text_color: e.target.value })} className="h-9 w-12 rounded-lg cursor-pointer border border-border/30" />
                              <Input value={form.text_color} onChange={e => updateForm({ text_color: e.target.value })} className="text-xs font-mono h-9" dir="ltr" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="overflow-hidden">
                      <CardHeader className="pb-3 bg-gradient-to-r from-muted/40 to-transparent">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Palette className="h-3.5 w-3.5 text-primary" />
                          </div>
                          {isAr ? "صورة الخلفية" : "Background Image"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-3">
                        {form.background_image_url && (
                          <div className="relative group rounded-xl overflow-hidden">
                            <img src={form.background_image_url} alt="BG" className="w-full h-32 object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button size="sm" variant="destructive" className="h-8 text-xs gap-1" onClick={() => updateForm({ background_image_url: "" })}>
                                <Trash2 className="h-3 w-3" />{isAr ? "إزالة" : "Remove"}
                              </Button>
                            </div>
                          </div>
                        )}
                        <div>
                          <Label htmlFor="bg-upload" className="cursor-pointer">
                            <div className="border-2 border-dashed border-border/40 rounded-xl p-5 text-center hover:border-primary/30 transition-all duration-200 hover:bg-muted/20">
                              {uploading ? (
                                <Loader2 className="h-6 w-6 mx-auto text-primary animate-spin mb-2" />
                              ) : (
                                <Palette className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                              )}
                              <p className="text-xs text-muted-foreground">{uploading ? (isAr ? "جاري الرفع..." : "Uploading...") : (isAr ? "اضغط لرفع صورة خلفية" : "Click to upload background image")}</p>
                            </div>
                          </Label>
                          <input id="bg-upload" type="file" accept="image/*" className="hidden" onChange={handleBgUpload} disabled={uploading} />
                        </div>
                        <Input placeholder={isAr ? "أو أدخل رابط الصورة" : "Or enter image URL"} value={form.background_image_url} onChange={e => updateForm({ background_image_url: e.target.value })} dir="ltr" className="text-xs" />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* ── Display / Visibility Tab ── */}
                  <TabsContent value="visibility" className="space-y-4 mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <Card className="overflow-hidden">
                      <CardHeader className="pb-3 bg-gradient-to-r from-muted/40 to-transparent">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                            <EyeOff className="h-3.5 w-3.5 text-primary" />
                          </div>
                          {isAr ? "التحكم بالأقسام" : "Section Visibility"}
                        </CardTitle>
                        <p className="text-[11px] text-muted-foreground">
                          {isAr ? "تحكم بما يظهر في صفحة الروابط العامة" : "Control what appears on your public links page"}
                        </p>
                      </CardHeader>
                      <CardContent className="pt-3">
                        <div className="space-y-1.5">
                          {VISIBILITY_SECTIONS.map(section => (
                            <div key={section.key} className={`flex items-center justify-between rounded-xl border p-3 transition-all duration-200 ${extra[section.key] ? "border-primary/15 bg-primary/[0.02]" : "border-border/30 bg-muted/10"}`}>
                              <div className="flex items-center gap-2.5">
                                <div className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${extra[section.key] ? "bg-primary/10" : "bg-muted"}`}>
                                  {extra[section.key] ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                                </div>
                                <Label className="text-xs cursor-pointer font-medium">{section.label}</Label>
                              </div>
                              <Switch checked={extra[section.key] as boolean} onCheckedChange={v => updateExtra({ [section.key]: v } as any)} />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Right: Live Preview (desktop) */}
              <div className="hidden lg:block sticky top-20 self-start">
                <Card className="overflow-hidden border-border/20 shadow-lg">
                  <CardHeader className="py-2 px-3 bg-muted/40 border-b border-border/20">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{isAr ? "معاينة مباشرة" : "Live Preview"}</p>
                      <div className="flex gap-1">
                        <div className="h-2 w-2 rounded-full bg-red-400/80" />
                        <div className="h-2 w-2 rounded-full bg-yellow-400/80" />
                        <div className="h-2 w-2 rounded-full bg-green-400/80" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {(() => {
                      const pt = THEME_PREVIEW_MAP[form.theme] || THEME_PREVIEW_MAP.default;
                      return (
                        <div className="p-4 min-h-[500px] rounded-b-lg"
                          dir={extra.text_direction === "auto" ? undefined : extra.text_direction}
                          style={{
                            background: form.background_image_url ? `url(${form.background_image_url}) center/cover` : pt.bg,
                            fontFamily: FONT_FAMILIES.find(f => f.id === form.font_family)?.css || "inherit",
                            color: pt.text,
                          }}
                        >
                          <div className="relative z-10 flex flex-col items-center gap-3">
                            {form.show_avatar && (
                              <Avatar className="h-16 w-16 shadow-xl" style={{ boxShadow: `0 0 0 2px ${pt.border}` }}>
                                <AvatarImage src={profile?.avatar_url || ""} />
                                <AvatarFallback className="text-lg" style={{ background: `${pt.accent}22`, color: pt.accent }}>{displayName.charAt(0)}</AvatarFallback>
                              </Avatar>
                            )}
                            <div className={alignClass}>
                              <p className={`font-bold ${extra.font_size === "sm" ? "text-xs" : extra.font_size === "lg" ? "text-base" : extra.font_size === "xl" ? "text-lg" : "text-sm"}`} style={{ color: pt.text }}>
                                {form.page_title || displayName || "Your Name"}
                              </p>
                              <p className="text-[10px] mt-0.5" style={{ color: `${pt.text}66` }}>@{profile?.username || "username"}</p>
                              {extra.show_bio && form.bio && <p className="text-[10px] mt-1" style={{ color: `${pt.text}aa` }}>{form.bio}</p>}
                            </div>

                            {form.show_social_icons && activeSocials.length > 0 && (
                              <div className={`flex gap-2 mt-1 flex-wrap ${justifyClass}`}>
                                {activeSocials.map(({ key, icon: Icon }) => (
                                  <div key={key} className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: pt.card, border: `1px solid ${pt.border}` }}>
                                    <Icon className="h-3.5 w-3.5" style={{ color: pt.text }} />
                                  </div>
                                ))}
                                {contacts.whatsapp && (
                                  <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: "rgba(37,211,102,0.08)", border: "1px solid rgba(37,211,102,0.15)" }}>
                                    <MessageCircle className="h-3.5 w-3.5" style={{ color: "#25d366" }} />
                                  </div>
                                )}
                                {contacts.phone && (
                                  <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: pt.card, border: `1px solid ${pt.border}` }}>
                                    <Phone className="h-3.5 w-3.5" style={{ color: pt.text }} />
                                  </div>
                                )}
                              </div>
                            )}

                            <div className={`w-full ${extra.link_layout === "grid" ? "grid grid-cols-2 gap-2" : "space-y-2"} mt-3`}>
                              {items.filter(i => i.is_active !== false).map(item => {
                                const btnRadius = form.button_style === "rounded" ? "rounded-xl" : form.button_style === "pill" ? "rounded-full" : form.button_style === "square" ? "rounded-lg" : form.button_style === "sharp" ? "rounded-none" : "rounded-xl";
                                const customColor = form.button_color !== "#000000" ? { backgroundColor: form.button_color, color: form.text_color, border: "1px solid transparent" } : { background: pt.card, border: `1px solid ${pt.border}` };
                                return (
                                  <div key={item.id} className={`flex items-center gap-2 px-3 py-2.5 ${btnRadius} ${extra.link_layout === "grid" ? "flex-col text-center py-4" : ""}`}
                                    style={customColor}
                                  >
                                    {item.icon && <span className="text-sm">{item.icon}</span>}
                                    <span className={`${extra.link_layout === "grid" ? "" : "flex-1"} text-[11px] font-medium ${alignClass}`} style={{ color: customColor.color || pt.text }}>{item.title}</span>
                                  </div>
                                );
                              })}
                              {items.length === 0 && (
                                <div className={`text-center py-6 opacity-40 ${extra.link_layout === "grid" ? "col-span-2" : ""}`} style={{ color: pt.text }}>
                                  <Globe className="h-8 w-8 mx-auto mb-2" />
                                  <p className="text-[10px]">{isAr ? "أضف روابط" : "Add links"}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
