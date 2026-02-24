import { useState, useEffect, useRef } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  Palette, Eye, Link as LinkIcon, Plus, Trash2, ExternalLink,
  Globe, ArrowUp, ArrowDown, Save, Copy, Check, QrCode,
  BarChart3, MousePointerClick, Pencil, Instagram, Twitter,
  Facebook, Linkedin, Youtube, Smartphone, Type, EyeOff, Settings2
} from "lucide-react";

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

const FONT_FAMILIES = [
  { id: "default", label: "Default", labelAr: "افتراضي", css: "inherit" },
  { id: "inter", label: "Inter", labelAr: "إنتر", css: "'Inter', sans-serif" },
  { id: "playfair", label: "Playfair", labelAr: "بلايفير", css: "'Playfair Display', serif" },
  { id: "poppins", label: "Poppins", labelAr: "بوبينز", css: "'Poppins', sans-serif" },
  { id: "cairo", label: "Cairo", labelAr: "القاهرة", css: "'Cairo', sans-serif" },
  { id: "tajawal", label: "Tajawal", labelAr: "تجوال", css: "'Tajawal', sans-serif" },
  { id: "montserrat", label: "Montserrat", labelAr: "مونتسيرات", css: "'Montserrat', sans-serif" },
  { id: "roboto", label: "Roboto", labelAr: "روبوتو", css: "'Roboto', sans-serif" },
];

const FONT_SIZES = [
  { id: "sm", label: "Small", labelAr: "صغير" },
  { id: "md", label: "Medium", labelAr: "متوسط" },
  { id: "lg", label: "Large", labelAr: "كبير" },
  { id: "xl", label: "Extra Large", labelAr: "كبير جداً" },
];

const THEME_MAP: Record<string, { bg: string; card: string; text: string }> = {
  default: { bg: "bg-gradient-to-br from-background via-background to-muted/30", card: "bg-card/90 backdrop-blur-xl border-border/30", text: "text-foreground" },
  dark: { bg: "bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950", card: "bg-white/5 backdrop-blur-xl border-white/10", text: "text-white" },
  ocean: { bg: "bg-gradient-to-br from-blue-950 via-cyan-900 to-teal-950", card: "bg-white/10 backdrop-blur-xl border-white/15", text: "text-white" },
  sunset: { bg: "bg-gradient-to-br from-orange-950 via-rose-900 to-purple-950", card: "bg-white/10 backdrop-blur-xl border-white/15", text: "text-white" },
  forest: { bg: "bg-gradient-to-br from-green-950 via-emerald-900 to-teal-950", card: "bg-white/10 backdrop-blur-xl border-white/15", text: "text-white" },
  minimal: { bg: "bg-white dark:bg-gray-950", card: "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800", text: "text-gray-900 dark:text-gray-100" },
  candy: { bg: "bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-500", card: "bg-white/20 backdrop-blur-xl border-white/25", text: "text-white" },
  gold: { bg: "bg-gradient-to-br from-yellow-900 via-amber-800 to-yellow-950", card: "bg-white/10 backdrop-blur-xl border-yellow-500/20", text: "text-amber-50" },
};

const SOCIAL_ICONS: Record<string, typeof Instagram> = {
  instagram: Instagram, twitter: Twitter, facebook: Facebook,
  linkedin: Linkedin, youtube: Youtube, website: Globe,
};

interface ExtraSettings {
  font_size: string;
  show_bio: boolean;
  show_job_title: boolean;
  show_location: boolean;
  show_stats: boolean;
  show_awards: boolean;
  show_membership: boolean;
  show_full_profile_btn: boolean;
}

const DEFAULT_EXTRA: ExtraSettings = {
  font_size: "md",
  show_bio: true,
  show_job_title: true,
  show_location: true,
  show_stats: true,
  show_awards: true,
  show_membership: true,
  show_full_profile_btn: true,
};

function parseExtra(customCss: string | null): ExtraSettings {
  if (!customCss) return { ...DEFAULT_EXTRA };
  try {
    const parsed = JSON.parse(customCss);
    return { ...DEFAULT_EXTRA, ...parsed };
  } catch {
    return { ...DEFAULT_EXTRA };
  }
}

export default function SocialLinksEditor() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", title_ar: "", url: "", icon: "" });
  const [uploading, setUploading] = useState(false);

  const { data: page, isLoading: pageLoading } = useSocialLinkPage(user?.id);
  const { data: items = [], isLoading: itemsLoading } = useSocialLinkItems(page?.id);
  const upsertPage = useUpsertSocialLinkPage();
  const { addItem, updateItem, deleteItem, reorderItems } = useManageSocialLinkItems();

  const { data: profile } = useQuery({
    queryKey: ["my-profile-for-links", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("username, avatar_url, full_name, display_name, instagram, twitter, facebook, linkedin, youtube, website").eq("id", user!.id).single();
      return data;
    },
    enabled: !!user?.id,
  });

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
    }
  }, [page]);

  const handleSavePage = () => {
    const payload = {
      ...form,
      custom_css: JSON.stringify(extra),
    };
    upsertPage.mutate(payload);
  };

  const handleAddLink = async () => {
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
  };

  const startEditing = (item: any) => {
    setEditingItem(item.id);
    setEditForm({ title: item.title, title_ar: item.title_ar || "", url: item.url, icon: item.icon || "" });
  };

  const saveEdit = () => {
    if (editingItem) {
      updateItem.mutate({ id: editingItem, ...editForm });
      setEditingItem(null);
    }
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    const newItems = [...items];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newItems.length) return;
    [newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]];
    reorderItems.mutate(newItems.map((item, i) => ({ id: item.id, sort_order: i })));
  };

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/social-bg-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("user-media").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("user-media").getPublicUrl(path);
      setForm(f => ({ ...f, background_image_url: urlData.publicUrl }));
      toast({ title: isAr ? "تم رفع الصورة" : "Image uploaded" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const copyLink = async () => {
    if (!profile?.username) return;
    await navigator.clipboard.writeText(`https://altoha.com/${profile.username}/links`);
    setCopied(true);
    toast({ title: isAr ? "تم نسخ الرابط" : "Link copied!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const totalClicks = items.reduce((sum, item) => sum + (item.click_count || 0), 0);
  const previewUrl = profile?.username ? `/${profile.username}/links` : "#";
  const fullUrl = profile?.username ? `https://altoha.com/${profile.username}/links` : "";
  const displayName = profile?.display_name || profile?.full_name || profile?.username || "";

  const socialLinks = profile ? [
    { key: "instagram", value: profile.instagram },
    { key: "twitter", value: profile.twitter },
    { key: "facebook", value: profile.facebook },
    { key: "linkedin", value: profile.linkedin },
    { key: "youtube", value: profile.youtube },
    { key: "website", value: profile.website },
  ].filter(s => s.value) : [];

  const VISIBILITY_SECTIONS = [
    { key: "show_bio" as const, label: isAr ? "النبذة" : "Bio", icon: Type },
    { key: "show_job_title" as const, label: isAr ? "المسمى الوظيفي" : "Job Title", icon: Settings2 },
    { key: "show_location" as const, label: isAr ? "الموقع" : "Location", icon: Globe },
    { key: "show_stats" as const, label: isAr ? "الإحصائيات" : "Stats", icon: BarChart3 },
    { key: "show_awards" as const, label: isAr ? "الجوائز" : "Awards", icon: BarChart3 },
    { key: "show_membership" as const, label: isAr ? "العضوية" : "Membership", icon: Settings2 },
    { key: "show_full_profile_btn" as const, label: isAr ? "زر البروفايل الكامل" : "Full Profile Button", icon: Eye },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background" dir={isAr ? "rtl" : "ltr"}>
      <Header />
      <main className="flex-1 px-4 md:px-6 max-w-6xl mx-auto w-full py-6 space-y-6">
        {/* Header with actions */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">{isAr ? "صفحة الروابط الاجتماعية" : "Social Links Page"}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isAr ? "أنشئ صفحتك الشخصية للروابط — احترافية ومخصصة" : "Create your personalized link page — professional & customizable"}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={copyLink}>
              {copied ? <Check className="h-4 w-4 me-1.5" /> : <Copy className="h-4 w-4 me-1.5" />}
              {isAr ? "نسخ الرابط" : "Copy Link"}
            </Button>
            {profile?.username && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm"><QrCode className="h-4 w-4 me-1.5" />{isAr ? "QR" : "QR Code"}</Button>
                </DialogTrigger>
                <DialogContent className="max-w-xs">
                  <DialogHeader><DialogTitle className="text-center">{isAr ? "رمز QR" : "QR Code"}</DialogTitle></DialogHeader>
                  <div className="flex flex-col items-center gap-4 py-4">
                    <div className="p-4 bg-white rounded-2xl">
                      <QRCodeSVG value={fullUrl} size={200} level="H" />
                    </div>
                    <p className="text-xs text-muted-foreground text-center" dir="ltr">{fullUrl}</p>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            {profile?.username && (
              <Button variant="outline" size="sm" asChild>
                <Link to={previewUrl} target="_blank">
                  <Eye className="h-4 w-4 me-1.5" />{isAr ? "معاينة" : "Preview"}
                </Link>
              </Button>
            )}
            <Button size="sm" onClick={handleSavePage} disabled={upsertPage.isPending}>
              <Save className="h-4 w-4 me-1.5" />{isAr ? "حفظ" : "Save"}
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="border-border/30">
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center"><LinkIcon className="h-4 w-4 text-primary" /></div>
              <div><p className="text-lg font-bold">{items.length}</p><p className="text-[10px] text-muted-foreground">{isAr ? "روابط" : "Links"}</p></div>
            </CardContent>
          </Card>
          <Card className="border-border/30">
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-chart-3/10 flex items-center justify-center"><MousePointerClick className="h-4 w-4 text-chart-3" /></div>
              <div><p className="text-lg font-bold">{totalClicks}</p><p className="text-[10px] text-muted-foreground">{isAr ? "نقرات" : "Clicks"}</p></div>
            </CardContent>
          </Card>
          <Card className="border-border/30">
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-chart-1/10 flex items-center justify-center"><Globe className="h-4 w-4 text-chart-1" /></div>
              <div><p className="text-lg font-bold">{socialLinks.length}</p><p className="text-[10px] text-muted-foreground">{isAr ? "حسابات" : "Socials"}</p></div>
            </CardContent>
          </Card>
          <Card className="border-border/30">
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-chart-2/10 flex items-center justify-center"><BarChart3 className="h-4 w-4 text-chart-2" /></div>
              <div>
                <p className="text-lg font-bold">{items.length > 0 ? Math.round(totalClicks / items.length) : 0}</p>
                <p className="text-[10px] text-muted-foreground">{isAr ? "متوسط/رابط" : "Avg/Link"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* URL Banner */}
        {profile?.username && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-3 px-4 flex items-center justify-between gap-2 text-sm flex-wrap">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary shrink-0" />
                <span className="font-medium">{isAr ? "رابط صفحتك:" : "Your link:"}</span>
                <code className="text-xs bg-background/80 px-2 py-1 rounded font-mono" dir="ltr">altoha.com/{profile.username}/links</code>
              </div>
              <Badge variant={form.is_published ? "default" : "secondary"} className="text-[10px]">
                {form.is_published ? (isAr ? "منشور" : "Published") : (isAr ? "مسودة" : "Draft")}
              </Badge>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <div className="grid lg:grid-cols-[1fr_340px] gap-6">
          {/* Left: Editor */}
          <div className="space-y-4">
            <Tabs defaultValue="settings" className="w-full">
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="settings">{isAr ? "الإعدادات" : "Settings"}</TabsTrigger>
                <TabsTrigger value="links">{isAr ? "الروابط" : "Links"}</TabsTrigger>
                <TabsTrigger value="appearance">{isAr ? "المظهر" : "Appearance"}</TabsTrigger>
                <TabsTrigger value="visibility">{isAr ? "العرض" : "Display"}</TabsTrigger>
              </TabsList>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary" />{isAr ? "المعلومات الأساسية" : "Basic Info"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Input placeholder={isAr ? "عنوان الصفحة (EN)" : "Page Title (EN)"} value={form.page_title} onChange={e => setForm(f => ({ ...f, page_title: e.target.value }))} dir="ltr" />
                      <Input placeholder={isAr ? "عنوان الصفحة (AR)" : "Page Title (AR)"} value={form.page_title_ar} onChange={e => setForm(f => ({ ...f, page_title_ar: e.target.value }))} dir="rtl" />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Textarea placeholder={isAr ? "نبذة (EN)" : "Bio (EN)"} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} className="min-h-[60px]" dir="ltr" />
                      <Textarea placeholder={isAr ? "نبذة (AR)" : "Bio (AR)"} value={form.bio_ar} onChange={e => setForm(f => ({ ...f, bio_ar: e.target.value }))} className="min-h-[60px]" dir="rtl" />
                    </div>
                    <Separator />
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">{isAr ? "إظهار الصورة الشخصية" : "Show Avatar"}</Label>
                        <Switch checked={form.show_avatar} onCheckedChange={v => setForm(f => ({ ...f, show_avatar: v }))} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">{isAr ? "إظهار أيقونات التواصل" : "Show Social Icons"}</Label>
                        <Switch checked={form.show_social_icons} onCheckedChange={v => setForm(f => ({ ...f, show_social_icons: v }))} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">{isAr ? "نشر الصفحة" : "Published"}</Label>
                        <Switch checked={form.is_published} onCheckedChange={v => setForm(f => ({ ...f, is_published: v }))} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Links Tab */}
              <TabsContent value="links" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Plus className="h-4 w-4 text-primary" />{isAr ? "إضافة رابط جديد" : "Add New Link"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Input placeholder={isAr ? "العنوان (EN)" : "Title (EN)"} value={newLink.title} onChange={e => setNewLink(l => ({ ...l, title: e.target.value }))} dir="ltr" />
                      <Input placeholder={isAr ? "العنوان (AR)" : "Title (AR)"} value={newLink.title_ar} onChange={e => setNewLink(l => ({ ...l, title_ar: e.target.value }))} dir="rtl" />
                    </div>
                    <Input placeholder="https://example.com" value={newLink.url} onChange={e => setNewLink(l => ({ ...l, url: e.target.value }))} dir="ltr" />
                    <div className="grid grid-cols-2 gap-3">
                      <Input placeholder={isAr ? "إيموجي 🔗" : "Emoji 🔗"} value={newLink.icon} onChange={e => setNewLink(l => ({ ...l, icon: e.target.value }))} />
                      <Select value={newLink.link_type} onValueChange={v => setNewLink(l => ({ ...l, link_type: v }))}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
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
                    <Button onClick={handleAddLink} disabled={addItem.isPending} className="w-full" size="sm">
                      <Plus className="h-4 w-4 me-1.5" />{isAr ? "إضافة" : "Add Link"}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <LinkIcon className="h-4 w-4 text-primary" />{isAr ? "الروابط" : "Links"}
                      {items.length > 0 && <Badge variant="secondary" className="text-xs">{items.length}</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {items.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        {isAr ? "لا توجد روابط بعد. أضف رابطك الأول!" : "No links yet. Add your first link!"}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {items.map((item, index) => (
                          <div key={item.id} className="flex items-center gap-2 p-3 rounded-xl border border-border/50 bg-muted/20 group hover:border-primary/30 transition-all">
                            <div className="flex flex-col gap-0.5">
                              <button onClick={() => moveItem(index, "up")} disabled={index === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowUp className="h-3 w-3" /></button>
                              <button onClick={() => moveItem(index, "down")} disabled={index === items.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowDown className="h-3 w-3" /></button>
                            </div>
                            {item.icon && <span className="text-lg">{item.icon}</span>}

                            {editingItem === item.id ? (
                              <div className="flex-1 space-y-2">
                                <Input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} placeholder="Title" className="h-8 text-xs" dir="ltr" />
                                <Input value={editForm.url} onChange={e => setEditForm(f => ({ ...f, url: e.target.value }))} placeholder="URL" className="h-8 text-xs" dir="ltr" />
                                <div className="flex gap-2">
                                  <Button size="sm" variant="default" className="h-7 text-xs" onClick={saveEdit}>
                                    <Check className="h-3 w-3 me-1" />{isAr ? "حفظ" : "Save"}
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingItem(null)}>
                                    {isAr ? "إلغاء" : "Cancel"}
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{item.title}</p>
                                <p className="text-xs text-muted-foreground truncate">{item.url}</p>
                              </div>
                            )}

                            {editingItem !== item.id && (
                              <div className="flex items-center gap-1.5">
                                <Badge variant="outline" className="text-[10px] tabular-nums">
                                  <MousePointerClick className="h-2.5 w-2.5 me-0.5" />{item.click_count || 0}
                                </Badge>
                                <Switch checked={item.is_active !== false} onCheckedChange={v => updateItem.mutate({ id: item.id, is_active: v })} />
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEditing(item)}>
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100" onClick={() => deleteItem.mutate(item.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Appearance Tab */}
              <TabsContent value="appearance" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Palette className="h-4 w-4 text-primary" />{isAr ? "الثيم" : "Theme"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-2">
                      {THEMES.map(t => (
                        <button
                          key={t.id}
                          onClick={() => setForm(f => ({ ...f, theme: t.id }))}
                          className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all ${form.theme === t.id ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/40"}`}
                        >
                          <div className={`w-full h-8 rounded-lg ${t.preview}`} />
                          <span className="text-[10px] font-medium">{isAr ? t.labelAr : t.label}</span>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Font Family */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Type className="h-4 w-4 text-primary" />{isAr ? "الخط" : "Font"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-xs mb-2 block">{isAr ? "نوع الخط" : "Font Family"}</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {FONT_FAMILIES.map(f => (
                          <button
                            key={f.id}
                            onClick={() => setForm(prev => ({ ...prev, font_family: f.id }))}
                            className={`text-xs py-2.5 px-2 rounded-lg border transition-all ${form.font_family === f.id ? "border-primary bg-primary/10 font-semibold" : "border-border hover:border-primary/40"}`}
                            style={{ fontFamily: f.css }}
                          >
                            {isAr ? f.labelAr : f.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <Label className="text-xs mb-2 block">{isAr ? "حجم الخط" : "Font Size"}</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {FONT_SIZES.map(s => (
                          <button
                            key={s.id}
                            onClick={() => setExtra(prev => ({ ...prev, font_size: s.id }))}
                            className={`text-xs py-2 px-2 rounded-lg border transition-all ${extra.font_size === s.id ? "border-primary bg-primary/10 font-semibold" : "border-border hover:border-primary/40"}`}
                          >
                            {isAr ? s.labelAr : s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-primary" />{isAr ? "شكل الأزرار" : "Button Style"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-5 gap-2">
                      {BUTTON_STYLES.map(s => (
                        <button
                          key={s.id}
                          onClick={() => setForm(f => ({ ...f, button_style: s.id }))}
                          className={`text-xs py-2 px-2 rounded-lg border transition-all ${form.button_style === s.id ? "border-primary bg-primary/10 font-semibold" : "border-border hover:border-primary/40"}`}
                        >
                          {isAr ? s.labelAr : s.label}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs mb-1 block">{isAr ? "لون الأزرار" : "Button Color"}</Label>
                        <div className="flex gap-2 items-center">
                          <input type="color" value={form.button_color} onChange={e => setForm(f => ({ ...f, button_color: e.target.value }))} className="h-9 w-12 rounded cursor-pointer" />
                          <Input value={form.button_color} onChange={e => setForm(f => ({ ...f, button_color: e.target.value }))} className="text-xs font-mono h-9" dir="ltr" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">{isAr ? "لون النص" : "Text Color"}</Label>
                        <div className="flex gap-2 items-center">
                          <input type="color" value={form.text_color} onChange={e => setForm(f => ({ ...f, text_color: e.target.value }))} className="h-9 w-12 rounded cursor-pointer" />
                          <Input value={form.text_color} onChange={e => setForm(f => ({ ...f, text_color: e.target.value }))} className="text-xs font-mono h-9" dir="ltr" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Background Image Upload */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Palette className="h-4 w-4 text-primary" />{isAr ? "صورة الخلفية" : "Background Image"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {form.background_image_url && (
                      <div className="relative">
                        <img src={form.background_image_url} alt="BG" className="w-full h-32 object-cover rounded-xl" />
                        <Button size="sm" variant="destructive" className="absolute top-2 end-2 h-7 text-xs" onClick={() => setForm(f => ({ ...f, background_image_url: "" }))}>
                          <Trash2 className="h-3 w-3 me-1" />{isAr ? "إزالة" : "Remove"}
                        </Button>
                      </div>
                    )}
                    <div>
                      <Label htmlFor="bg-upload" className="cursor-pointer">
                        <div className="border-2 border-dashed border-border/50 rounded-xl p-4 text-center hover:border-primary/40 transition-colors">
                          <Palette className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                          <p className="text-xs text-muted-foreground">{uploading ? (isAr ? "جاري الرفع..." : "Uploading...") : (isAr ? "اضغط لرفع صورة خلفية" : "Click to upload background image")}</p>
                        </div>
                      </Label>
                      <input id="bg-upload" type="file" accept="image/*" className="hidden" onChange={handleBgUpload} disabled={uploading} />
                    </div>
                    <Input placeholder={isAr ? "أو أدخل رابط الصورة" : "Or enter image URL"} value={form.background_image_url} onChange={e => setForm(f => ({ ...f, background_image_url: e.target.value }))} dir="ltr" className="text-xs" />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Display / Visibility Tab */}
              <TabsContent value="visibility" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <EyeOff className="h-4 w-4 text-primary" />{isAr ? "التحكم بالأقسام" : "Section Visibility"}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isAr ? "تحكم بما يظهر في صفحة الروابط العامة" : "Control what appears on your public links page"}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {VISIBILITY_SECTIONS.map(section => (
                        <div key={section.key} className="flex items-center justify-between rounded-lg border border-border/50 p-3 transition-colors hover:bg-accent/20">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${extra[section.key] ? "bg-primary/10" : "bg-muted"}`}>
                              {extra[section.key] ? (
                                <Eye className="h-4 w-4 text-primary" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <Label className="text-sm cursor-pointer">{section.label}</Label>
                          </div>
                          <Switch
                            checked={extra[section.key]}
                            onCheckedChange={v => setExtra(prev => ({ ...prev, [section.key]: v }))}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: Live Preview */}
          <div className="hidden lg:block sticky top-20 self-start">
            <Card className="overflow-hidden border-border/30">
              <CardHeader className="py-2 px-3 bg-muted/30 border-b border-border/30">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-medium text-muted-foreground">{isAr ? "معاينة مباشرة" : "Live Preview"}</p>
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-red-400" />
                    <div className="h-2 w-2 rounded-full bg-yellow-400" />
                    <div className="h-2 w-2 rounded-full bg-green-400" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className={`p-4 min-h-[500px] ${THEME_MAP[form.theme]?.bg || THEME_MAP.default.bg}`}
                  style={{
                    ...(form.background_image_url ? { backgroundImage: `url(${form.background_image_url})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined),
                    fontFamily: FONT_FAMILIES.find(f => f.id === form.font_family)?.css || "inherit",
                  }}
                >
                  {form.background_image_url && <div className="absolute inset-0 bg-black/30 rounded-b-lg" />}
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    {form.show_avatar && (
                      <Avatar className="h-16 w-16 ring-2 ring-white/20 shadow-xl">
                        <AvatarImage src={profile?.avatar_url || ""} />
                        <AvatarFallback className="text-lg bg-primary/20">{displayName.charAt(0)}</AvatarFallback>
                      </Avatar>
                    )}
                    <div className="text-center">
                      <p className={`font-bold ${THEME_MAP[form.theme]?.text || ""} ${extra.font_size === "sm" ? "text-xs" : extra.font_size === "lg" ? "text-base" : extra.font_size === "xl" ? "text-lg" : "text-sm"}`}>
                        {form.page_title || displayName || "Your Name"}
                      </p>
                      <p className={`text-[10px] opacity-70 ${THEME_MAP[form.theme]?.text || ""}`}>
                        @{profile?.username || "username"}
                      </p>
                      {extra.show_bio && form.bio && <p className={`text-[10px] opacity-80 mt-1 ${THEME_MAP[form.theme]?.text || ""}`}>{form.bio}</p>}
                    </div>

                    {form.show_social_icons && socialLinks.length > 0 && (
                      <div className="flex gap-2 mt-1">
                        {socialLinks.map(({ key }) => {
                          const Icon = SOCIAL_ICONS[key] || Globe;
                          return <div key={key} className={`h-8 w-8 rounded-full ${THEME_MAP[form.theme]?.card || ""} border flex items-center justify-center`}><Icon className={`h-3.5 w-3.5 ${THEME_MAP[form.theme]?.text || ""}`} /></div>;
                        })}
                      </div>
                    )}

                    <div className="w-full space-y-2 mt-3">
                      {items.filter(i => i.is_active !== false).map(item => {
                        const btnRadius = form.button_style === "rounded" ? "rounded-xl" : form.button_style === "pill" ? "rounded-full" : form.button_style === "square" ? "rounded-lg" : form.button_style === "sharp" ? "rounded-none" : "rounded-xl border-2";
                        return (
                          <div key={item.id} className={`flex items-center gap-2 px-3 py-2.5 border ${btnRadius} ${THEME_MAP[form.theme]?.card || ""}`}
                            style={form.button_color !== "#000000" ? { backgroundColor: form.button_color, color: form.text_color } : undefined}
                          >
                            {item.icon && <span className="text-sm">{item.icon}</span>}
                            <span className={`flex-1 text-[11px] font-medium text-center ${THEME_MAP[form.theme]?.text || ""}`}>{item.title}</span>
                          </div>
                        );
                      })}
                      {items.length === 0 && (
                        <div className={`text-center py-6 ${THEME_MAP[form.theme]?.text || ""} opacity-40`}>
                          <Globe className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-[10px]">{isAr ? "أضف روابط" : "Add links"}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
