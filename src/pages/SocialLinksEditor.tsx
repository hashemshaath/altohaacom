import { useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import {
  Palette, Eye, Link as LinkIcon, Plus, Trash2, GripVertical, ExternalLink,
  Globe, ArrowUp, ArrowDown, Save, Image as ImageIcon
} from "lucide-react";

const THEMES = [
  { id: "default", label: "Default", labelAr: "افتراضي" },
  { id: "dark", label: "Dark", labelAr: "داكن" },
  { id: "ocean", label: "Ocean", labelAr: "محيط" },
  { id: "sunset", label: "Sunset", labelAr: "غروب" },
  { id: "forest", label: "Forest", labelAr: "غابة" },
  { id: "minimal", label: "Minimal", labelAr: "بسيط" },
  { id: "candy", label: "Candy", labelAr: "حلوى" },
  { id: "gold", label: "Gold", labelAr: "ذهبي" },
];

const BUTTON_STYLES = [
  { id: "rounded", label: "Rounded", labelAr: "مستدير" },
  { id: "pill", label: "Pill", labelAr: "كبسولة" },
  { id: "square", label: "Square", labelAr: "مربع" },
  { id: "sharp", label: "Sharp", labelAr: "حاد" },
  { id: "outline", label: "Outline", labelAr: "إطار" },
];

export default function SocialLinksEditor() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();

  const { data: page, isLoading: pageLoading } = useSocialLinkPage(user?.id);
  const { data: items = [], isLoading: itemsLoading } = useSocialLinkItems(page?.id);
  const upsertPage = useUpsertSocialLinkPage();
  const { addItem, updateItem, deleteItem, reorderItems } = useManageSocialLinkItems();

  const { data: profile } = useQuery({
    queryKey: ["my-profile-username", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("username").eq("id", user!.id).single();
      return data;
    },
    enabled: !!user?.id,
  });

  // Page form state
  const [form, setForm] = useState({
    page_title: "", page_title_ar: "", bio: "", bio_ar: "",
    theme: "default", button_style: "rounded", button_color: "#000000",
    text_color: "#ffffff", background_color: "#ffffff",
    show_avatar: true, show_social_icons: true, is_published: true,
    background_image_url: "",
  });

  // New link form
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
      });
    }
  }, [page]);

  const handleSavePage = () => {
    upsertPage.mutate(form);
  };

  const handleAddLink = async () => {
    if (!newLink.title || !newLink.url) {
      toast({ title: isAr ? "أدخل العنوان والرابط" : "Enter title and URL", variant: "destructive" });
      return;
    }
    if (!page?.id) {
      // Create page first
      const result = await upsertPage.mutateAsync(form);
      addItem.mutate({
        page_id: result.id,
        title: newLink.title,
        title_ar: newLink.title_ar || undefined,
        url: newLink.url,
        icon: newLink.icon || undefined,
        link_type: newLink.link_type,
        sort_order: items.length,
      });
    } else {
      addItem.mutate({
        page_id: page.id,
        title: newLink.title,
        title_ar: newLink.title_ar || undefined,
        url: newLink.url,
        icon: newLink.icon || undefined,
        link_type: newLink.link_type,
        sort_order: items.length,
      });
    }
    setNewLink({ title: "", title_ar: "", url: "", icon: "", link_type: "custom" });
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    const newItems = [...items];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newItems.length) return;
    [newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]];
    reorderItems.mutate(newItems.map((item, i) => ({ id: item.id, sort_order: i })));
  };

  const isLoading = pageLoading || itemsLoading;
  const previewUrl = profile?.username ? `/${profile.username}/links` : "#";

  return (
    <div className="flex min-h-screen flex-col bg-background" dir={isAr ? "rtl" : "ltr"}>
      <Header />
      <main className="flex-1 px-4 md:px-6 max-w-4xl mx-auto w-full py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">{isAr ? "صفحة الروابط الاجتماعية" : "Social Links Page"}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isAr ? "أنشئ صفحتك الشخصية للروابط مثل Linktree" : "Create your personal link page like Linktree"}
            </p>
          </div>
          <div className="flex gap-2">
            {profile?.username && (
              <Button variant="outline" size="sm" asChild>
                <Link to={previewUrl} target="_blank">
                  <Eye className="h-4 w-4 me-1.5" />
                  {isAr ? "معاينة" : "Preview"}
                </Link>
              </Button>
            )}
            <Button size="sm" onClick={handleSavePage} disabled={upsertPage.isPending}>
              <Save className="h-4 w-4 me-1.5" />
              {isAr ? "حفظ" : "Save"}
            </Button>
          </div>
        </div>

        {profile?.username && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-3 px-4 flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-primary shrink-0" />
              <span className="font-medium">{isAr ? "رابط صفحتك:" : "Your page link:"}</span>
              <code className="text-xs bg-background/80 px-2 py-1 rounded font-mono" dir="ltr">
                altoha.com/{profile.username}/links
              </code>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: Page Settings */}
          <div className="space-y-4">
            {/* Title & Bio */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  {isAr ? "المعلومات الأساسية" : "Basic Info"}
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
                <Input
                  placeholder={isAr ? "رابط صورة الخلفية" : "Background Image URL"}
                  value={form.background_image_url}
                  onChange={e => setForm(f => ({ ...f, background_image_url: e.target.value }))}
                  dir="ltr"
                />
              </CardContent>
            </Card>

            {/* Theme & Style */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Palette className="h-4 w-4 text-primary" />
                  {isAr ? "المظهر والتخصيص" : "Theme & Customization"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs mb-2 block">{isAr ? "الثيم" : "Theme"}</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {THEMES.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setForm(f => ({ ...f, theme: t.id }))}
                        className={`text-xs py-2 px-3 rounded-lg border transition-all ${form.theme === t.id ? "border-primary bg-primary/10 font-semibold" : "border-border hover:border-primary/40"}`}
                      >
                        {isAr ? t.labelAr : t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-xs mb-2 block">{isAr ? "شكل الأزرار" : "Button Style"}</Label>
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
          </div>

          {/* Right: Links Management */}
          <div className="space-y-4">
            {/* Add New Link */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Plus className="h-4 w-4 text-primary" />
                  {isAr ? "إضافة رابط جديد" : "Add New Link"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input placeholder={isAr ? "العنوان (EN)" : "Title (EN)"} value={newLink.title} onChange={e => setNewLink(l => ({ ...l, title: e.target.value }))} dir="ltr" />
                  <Input placeholder={isAr ? "العنوان (AR)" : "Title (AR)"} value={newLink.title_ar} onChange={e => setNewLink(l => ({ ...l, title_ar: e.target.value }))} dir="rtl" />
                </div>
                <Input placeholder="https://example.com" value={newLink.url} onChange={e => setNewLink(l => ({ ...l, url: e.target.value }))} dir="ltr" />
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder={isAr ? "إيموجي/أيقونة" : "Emoji/Icon"} value={newLink.icon} onChange={e => setNewLink(l => ({ ...l, icon: e.target.value }))} />
                  <Select value={newLink.link_type} onValueChange={v => setNewLink(l => ({ ...l, link_type: v }))}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">{isAr ? "مخصص" : "Custom"}</SelectItem>
                      <SelectItem value="menu">{isAr ? "قائمة طعام" : "Menu"}</SelectItem>
                      <SelectItem value="store">{isAr ? "متجر" : "Store"}</SelectItem>
                      <SelectItem value="booking">{isAr ? "حجز" : "Booking"}</SelectItem>
                      <SelectItem value="portfolio">{isAr ? "أعمال" : "Portfolio"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddLink} disabled={addItem.isPending} className="w-full" size="sm">
                  <Plus className="h-4 w-4 me-1.5" />
                  {isAr ? "إضافة" : "Add Link"}
                </Button>
              </CardContent>
            </Card>

            {/* Existing Links */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-primary" />
                  {isAr ? "الروابط" : "Links"}
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
                      <div key={item.id} className="flex items-center gap-2 p-3 rounded-xl border border-border/50 bg-muted/20 group">
                        <div className="flex flex-col gap-0.5">
                          <button onClick={() => moveItem(index, "up")} disabled={index === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <button onClick={() => moveItem(index, "down")} disabled={index === items.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                            <ArrowDown className="h-3 w-3" />
                          </button>
                        </div>
                        {item.icon && <span className="text-lg">{item.icon}</span>}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{item.url}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Switch
                            checked={item.is_active !== false}
                            onCheckedChange={v => updateItem.mutate({ id: item.id, is_active: v })}
                          />
                          <Badge variant="outline" className="text-[10px]">{item.click_count || 0}</Badge>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100"
                            onClick={() => deleteItem.mutate(item.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
