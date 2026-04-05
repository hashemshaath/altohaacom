import { useState, useEffect, useCallback, useRef } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MarkdownEditor } from "./MarkdownEditor";
import { ArticleImageUpload } from "./ArticleImageUpload";
import { ArticleSEOPanel } from "./ArticleSEOPanel";
import { AITextOptimizer } from "@/components/admin/AITextOptimizer";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, Save, Eye, Calendar, Star, Loader2, CheckCircle2, Globe,
  Sparkles, Link2, Tag, FolderOpen, Wand2, RotateCcw, Languages, Search,
} from "lucide-react";

interface ArticleFormData {
  title: string;
  title_ar: string;
  slug: string;
  excerpt: string;
  excerpt_ar: string;
  content: string;
  content_ar: string;
  type: string;
  status: string;
  featured_image_url: string;
  is_featured: boolean;
  published_at: string;
  category_id: string;
}

interface Props {
  articleId?: string | null;
  initialData?: Partial<ArticleFormData>;
  onBack: () => void;
}

const ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

const AR_TRANSLITERATION: Record<string, string> = {
  "ا": "a", "أ": "a", "إ": "e", "آ": "aa", "ب": "b", "ت": "t", "ث": "th",
  "ج": "j", "ح": "h", "خ": "kh", "د": "d", "ذ": "dh", "ر": "r", "ز": "z",
  "س": "s", "ش": "sh", "ص": "s", "ض": "d", "ط": "t", "ظ": "z",
  "ع": "a", "غ": "gh", "ف": "f", "ق": "q", "ك": "k", "ل": "l", "م": "m",
  "ن": "n", "ه": "h", "و": "w", "ي": "y", "ى": "a", "ة": "a",
  "ء": "", "ؤ": "o", "ئ": "e",
};

function transliterateArabic(text: string): string {
  return text.split("").map(ch => AR_TRANSLITERATION[ch] ?? ch).join("");
}

function generateSmartSlug(title: string): string {
  if (!title.trim()) return "";
  const isArabic = ARABIC_REGEX.test(title);
  let slug = isArabic ? transliterateArabic(title) : title;
  const stopWords = new Set(["the", "a", "an", "is", "are", "was", "were", "in", "on", "at", "to", "for", "of", "and", "or", "but", "with", "by", "from", "as", "its"]);
  slug = slug.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s-]/g, " ").trim()
    .split(/\s+/).filter(w => w.length > 0 && !stopWords.has(w)).slice(0, 8).join("-").replace(/-+/g, "-").slice(0, 75);
  return slug;
}

function autoGenerateExcerpt(content: string, maxLength = 155): string {
  if (!content) return "";
  const plain = content.replace(/^#{1,6}\s+/gm, "").replace(/[*_~`]/g, "").replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]+)\]\(.*?\)/g, "$1").replace(/>\s?/gm, "").replace(/-{3,}/g, "").replace(/\n+/g, " ").trim();
  if (plain.length <= maxLength) return plain;
  return plain.slice(0, maxLength).replace(/\s+\S*$/, "") + "...";
}

export function ArticleEditorPro({ articleId, initialData, onBack }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";
  const t = (en: string, ar: string) => isAr ? ar : en;
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const [form, setForm] = useState<ArticleFormData>({
    title: "", title_ar: "", slug: "", excerpt: "", excerpt_ar: "",
    content: "", content_ar: "", type: "news", status: "draft",
    featured_image_url: "", is_featured: false, published_at: "",
    category_id: "", ...initialData,
  });
  const [contentLang, setContentLang] = useState<"en" | "ar">("en");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!articleId);
  const [sidebarTab, setSidebarTab] = useState<"settings" | "seo">("settings");

  const { data: categories } = useQuery({
    queryKey: ["content-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("content_categories").select("id, name, name_ar, slug").order("name");
      return data || [];
    },
  });

  const { data: tags } = useQuery({
    queryKey: ["content-tags"],
    queryFn: async () => {
      const { data } = await supabase.from("content_tags").select("id, name, name_ar, slug").order("name");
      return data || [];
    },
  });

  const { data: articleTags } = useQuery({
    queryKey: ["article-tags", articleId],
    queryFn: async () => {
      if (!articleId) return [];
      const { data } = await supabase.from("article_tags").select("tag_id").eq("article_id", articleId);
      return data?.map(t => t.tag_id) || [];
    },
    enabled: !!articleId,
  });

  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    if (articleTags) setSelectedTags(articleTags);
  }, [articleTags]);

  const update = useCallback((field: keyof ArticleFormData, value: any) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      if ((field === "title" || field === "title_ar") && !slugManuallyEdited) {
        const source = field === "title" ? value : (field === "title_ar" ? value : prev.title);
        if (source) next.slug = generateSmartSlug(source);
      }
      return next;
    });
  }, [slugManuallyEdited]);

  const handleRegenerateSlug = () => {
    const source = form.title || form.title_ar;
    if (source) {
      setForm(prev => ({ ...prev, slug: generateSmartSlug(source) }));
      setSlugManuallyEdited(false);
    }
  };

  const handleAutoExcerpt = (lang: "en" | "ar") => {
    if (lang === "en" && form.content) update("excerpt", autoGenerateExcerpt(form.content));
    else if (lang === "ar" && form.content_ar) update("excerpt_ar", autoGenerateExcerpt(form.content_ar));
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]);
  };

  // Autosave
  useEffect(() => {
    if (!articleId) return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(async () => {
      setAutoSaving(true);
      try {
        await supabase.from("articles").update({
          title: form.title, title_ar: form.title_ar, slug: form.slug,
          excerpt: form.excerpt, excerpt_ar: form.excerpt_ar,
          content: form.content, content_ar: form.content_ar,
          type: form.type, featured_image_url: form.featured_image_url || null,
          is_featured: form.is_featured, category_id: form.category_id || null,
          updated_at: new Date().toISOString(),
        }).eq("id", articleId);
        setLastSaved(new Date());
      } catch {}
      setAutoSaving(false);
    }, 3000);
    return () => { if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current); };
  }, [articleId, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: ArticleFormData) => {
      const payload = {
        title: data.title, title_ar: data.title_ar,
        slug: data.slug || generateSmartSlug(data.title || data.title_ar),
        excerpt: data.excerpt, excerpt_ar: data.excerpt_ar,
        content: data.content, content_ar: data.content_ar,
        type: data.type, status: data.status,
        featured_image_url: data.featured_image_url || null,
        is_featured: data.is_featured,
        published_at: data.published_at || (data.status === "published" ? new Date().toISOString() : null),
        author_id: user?.id || null, category_id: data.category_id || null,
      };
      let savedId = articleId;
      if (articleId) {
        const { error } = await supabase.from("articles").update(payload).eq("id", articleId);
        if (error) throw error;
      } else {
        const { data: inserted, error } = await supabase.from("articles").insert([payload]).select("id").single();
        if (error) throw error;
        savedId = inserted.id;
      }
      if (savedId) {
        await supabase.from("article_tags").delete().eq("article_id", savedId);
        if (selectedTags.length > 0) {
          await supabase.from("article_tags").insert(selectedTags.map(tag_id => ({ article_id: savedId!, tag_id })));
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      toast({ title: t("Article saved!", "تم حفظ المقال!") });
      onBack();
    },
    onError: (err: Error) => {
      toast({ variant: "destructive", title: t("Save failed", "فشل الحفظ"), description: err instanceof Error ? err.message : String(err) });
    },
  });

  const currentTitle = contentLang === "ar" ? form.title_ar : form.title;
  const currentExcerpt = contentLang === "ar" ? form.excerpt_ar : form.excerpt;
  const currentContent = contentLang === "ar" ? form.content_ar : form.content;

  const wordCount = (form.content + " " + form.content_ar).trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap bg-card border border-border/40 rounded-2xl px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="rounded-xl gap-1.5 h-8">
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("Back", "رجوع")}
          </Button>
          <div className="hidden sm:flex items-center gap-2">
            <h1 className="font-serif text-base font-bold">
              {articleId ? t("Edit Article", "تعديل المقال") : t("New Article", "مقال جديد")}
            </h1>
            {form.status === "draft" && <Badge variant="secondary" className="rounded-xl text-[10px]">{t("Draft", "مسودة")}</Badge>}
            {form.status === "published" && <Badge className="rounded-xl bg-chart-2/10 text-chart-2 border-chart-2/20 text-[10px]">{t("Published", "منشور")}</Badge>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {articleId && (
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-muted-foreground">
              {autoSaving ? (
                <><Loader2 className="h-3 w-3 animate-spin" />{t("Saving...", "جاري الحفظ...")}</>
              ) : lastSaved ? (
                <><CheckCircle2 className="h-3 w-3 text-chart-2" />{t("Auto-saved", "تم الحفظ تلقائياً")}</>
              ) : null}
            </div>
          )}
          <span className="hidden md:inline text-[10px] text-muted-foreground tabular-nums">{wordCount} {t("كلمة", "words")}</span>
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5 text-xs h-8" onClick={() => window.open(`/news/${form.slug}`, "_blank")} disabled={!form.slug}>
            <Eye className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{t("Preview", "معاينة")}</span>
          </Button>
          <Button size="sm" className="rounded-xl gap-1.5 text-xs h-8" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || (!form.title && !form.title_ar)}>
            {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {t("Save", "حفظ")}
          </Button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        {/* Main Editor */}
        <div className="space-y-4">
          {/* Cover Image */}
          <ArticleImageUpload
            value={form.featured_image_url}
            onChange={(url) => update("featured_image_url", url)}
            label={t("Cover Image", "صورة الغلاف")}
          />

          {/* Language Tabs */}
          <Tabs value={contentLang} onValueChange={v => setContentLang(v as "en" | "ar")}>
            <div className="flex items-center gap-2">
              <TabsList className="rounded-xl">
                <TabsTrigger value="en" className="rounded-xl gap-1.5 text-xs">
                  <Globe className="h-3 w-3" /> English
                </TabsTrigger>
                <TabsTrigger value="ar" className="rounded-xl gap-1.5 text-xs">
                  <Globe className="h-3 w-3" /> العربية
                </TabsTrigger>
              </TabsList>
              <Badge variant="outline" className="text-[9px] rounded-lg gap-1">
                <Languages className="h-2.5 w-2.5" />
                {t("AI Translation Active", "الترجمة الآلية مفعّلة")}
              </Badge>
            </div>

            {/* English Tab */}
            <TabsContent value="en" className="space-y-4 mt-4">
              {/* Title EN */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">{t("Title", "العنوان")}</Label>
                  <AITextOptimizer
                    text={form.title}
                    lang="en"
                    compact
                    fieldType="title"
                    onOptimized={(v) => update("title", v)}
                    onTranslated={(v) => update("title_ar", v)}
                  />
                </div>
                <Input
                  value={form.title}
                  onChange={e => update("title", e.target.value)}
                  placeholder={t("Enter a compelling headline...", "أدخل عنواناً جذاباً...")}
                  className="rounded-xl text-lg font-serif font-bold h-12 border-border/40"
                />
                {form.title && (
                  <p className="text-[10px] text-muted-foreground">
                    {form.title.length}/60 {t("chars", "حرف")} {form.title.length > 60 && <span className="text-destructive font-medium">⚠ {t("Too long for SEO", "طويل جداً للسيو")}</span>}
                  </p>
                )}
              </div>

              {/* Excerpt EN */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">{t("Excerpt / Meta Description", "المقتطف / الوصف التعريفي")}</Label>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 rounded-lg" onClick={() => handleAutoExcerpt("en")} disabled={!form.content}>
                      <Wand2 className="h-3 w-3" /> {t("Auto", "تلقائي")}
                    </Button>
                    <AITextOptimizer
                      text={form.excerpt}
                      lang="en"
                      compact
                      fieldType="meta_description"
                      onOptimized={(v) => update("excerpt", v)}
                      onTranslated={(v) => update("excerpt_ar", v)}
                    />
                  </div>
                </div>
                <Textarea
                  rows={2}
                  value={form.excerpt}
                  onChange={e => update("excerpt", e.target.value)}
                  placeholder={t("Brief summary for search engines...", "ملخص موجز لمحركات البحث...")}
                  className="rounded-xl text-xs resize-none min-h-[60px]"
                  maxCharacters={160}
                />
              </div>

              {/* Content EN */}
              <MarkdownEditor
                value={form.content}
                onChange={v => update("content", v)}
                placeholder={t("Start writing your article...", "ابدأ كتابة مقالك...")}
                contentLang="en"
                onTranslateContent={(translated) => update("content_ar", translated)}
              />
            </TabsContent>

            {/* Arabic Tab */}
            <TabsContent value="ar" className="space-y-4 mt-4">
              {/* Title AR */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">{t("Title (Arabic)", "العنوان (عربي)")}</Label>
                  <AITextOptimizer
                    text={form.title_ar}
                    lang="ar"
                    compact
                    fieldType="title"
                    onOptimized={(v) => update("title_ar", v)}
                    onTranslated={(v) => update("title", v)}
                  />
                </div>
                <Input
                  dir="rtl"
                  value={form.title_ar}
                  onChange={e => update("title_ar", e.target.value)}
                  placeholder="أدخل عنواناً جذاباً..."
                  className="rounded-xl text-lg font-serif font-bold h-12 border-border/40"
                />
                {form.title_ar && (
                  <p className="text-[10px] text-muted-foreground" dir="rtl">
                    {form.title_ar.length}/60 حرف {form.title_ar.length > 60 && <span className="text-destructive font-medium">⚠ طويل جداً للسيو</span>}
                  </p>
                )}
              </div>

              {/* Excerpt AR */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">{t("Excerpt (Arabic)", "المقتطف (عربي)")}</Label>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] gap-1 rounded-lg" onClick={() => handleAutoExcerpt("ar")} disabled={!form.content_ar}>
                      <Wand2 className="h-3 w-3" /> {t("Auto", "تلقائي")}
                    </Button>
                    <AITextOptimizer
                      text={form.excerpt_ar}
                      lang="ar"
                      compact
                      fieldType="meta_description"
                      onOptimized={(v) => update("excerpt_ar", v)}
                      onTranslated={(v) => update("excerpt", v)}
                    />
                  </div>
                </div>
                <Textarea
                  dir="rtl"
                  rows={2}
                  value={form.excerpt_ar}
                  onChange={e => update("excerpt_ar", e.target.value)}
                  placeholder="ملخص موجز لمحركات البحث..."
                  className="rounded-xl text-xs resize-none min-h-[60px]"
                  maxCharacters={160}
                />
              </div>

              {/* Content AR */}
              <MarkdownEditor
                value={form.content_ar}
                onChange={v => update("content_ar", v)}
                placeholder="ابدأ كتابة مقالك..."
                dir="rtl"
                isAr
                contentLang="ar"
                onTranslateContent={(translated) => update("content", translated)}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-3">
          {/* Sidebar tabs */}
          <Tabs value={sidebarTab} onValueChange={v => setSidebarTab(v as any)}>
            <TabsList className="w-full rounded-xl">
              <TabsTrigger value="settings" className="flex-1 rounded-xl text-xs gap-1">
                <Star className="h-3 w-3" /> {t("Settings", "الإعدادات")}
              </TabsTrigger>
              <TabsTrigger value="seo" className="flex-1 rounded-xl text-xs gap-1">
                <Search className="h-3 w-3" /> {t("SEO", "السيو")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="space-y-3 mt-3">
              {/* Publish Settings */}
              <Card className="rounded-2xl border-border/40">
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-muted-foreground">{t("Type", "النوع")}</Label>
                      <Select value={form.type} onValueChange={v => update("type", v)}>
                        <SelectTrigger className="rounded-xl text-xs h-8"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="news">{t("News", "أخبار")}</SelectItem>
                          <SelectItem value="article">{t("Article", "مقال")}</SelectItem>
                          <SelectItem value="blog">{t("Blog", "مدونة")}</SelectItem>
                          <SelectItem value="exhibition">{t("Exhibition", "معرض")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-muted-foreground">{t("Status", "الحالة")}</Label>
                      <Select value={form.status} onValueChange={v => update("status", v)}>
                        <SelectTrigger className="rounded-xl text-xs h-8"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="draft">{t("Draft", "مسودة")}</SelectItem>
                          <SelectItem value="published">{t("Published", "منشور")}</SelectItem>
                          <SelectItem value="archived">{t("Archived", "مؤرشف")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {t("Schedule", "جدولة")}
                    </Label>
                    <Input
                      type="datetime-local"
                      value={form.published_at ? form.published_at.slice(0, 16) : ""}
                      onChange={e => update("published_at", e.target.value ? new Date(e.target.value).toISOString() : "")}
                      className="rounded-xl text-xs h-8"
                    />
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <Label className="text-xs flex items-center gap-1.5">
                      <Star className="h-3 w-3 text-chart-4" /> {t("Featured", "مميز")}
                    </Label>
                    <Switch checked={form.is_featured} onCheckedChange={v => update("is_featured", v)} />
                  </div>
                </CardContent>
              </Card>

              {/* Category & Tags */}
              <Card className="rounded-2xl border-border/40">
                <CardHeader className="pb-2 px-4 pt-3">
                  <CardTitle className="text-xs flex items-center gap-2">
                    <FolderOpen className="h-3.5 w-3.5 text-primary" />
                    {t("Category & Tags", "التصنيف والوسوم")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  <Select value={form.category_id || "none"} onValueChange={v => update("category_id", v === "none" ? "" : v)}>
                    <SelectTrigger className="rounded-xl text-xs h-8"><SelectValue placeholder={t("Select category", "اختر التصنيف")} /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="none">{t("None", "بدون")}</SelectItem>
                      {categories?.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{isAr ? (cat.name_ar || cat.name) : cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Tag className="h-2.5 w-2.5" /> {t("Tags", "الوسوم")}
                      {selectedTags.length > 0 && (
                        <Badge variant="secondary" className="text-[8px] rounded px-1 ms-1">{selectedTags.length}</Badge>
                      )}
                    </Label>
                    <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto">
                      {tags?.map(tag => (
                        <Badge
                          key={tag.id}
                          variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                          className={cn(
                            "text-[9px] cursor-pointer rounded-lg transition-all hover:scale-105",
                            selectedTags.includes(tag.id) && "shadow-sm"
                          )}
                          onClick={() => toggleTag(tag.id)}
                        >
                          {isAr ? (tag.name_ar || tag.name) : tag.name}
                        </Badge>
                      ))}
                      {(!tags || tags.length === 0) && (
                        <p className="text-[10px] text-muted-foreground italic">{t("No tags available", "لا توجد وسوم")}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* URL Slug */}
              <Card className="rounded-2xl border-border/40">
                <CardHeader className="pb-2 px-4 pt-3">
                  <CardTitle className="text-xs flex items-center gap-2">
                    <Link2 className="h-3.5 w-3.5 text-primary" />
                    {t("URL & Permalink", "الرابط الدائم")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2">
                  <div className="flex gap-1.5">
                    <Input
                      value={form.slug}
                      onChange={(e) => { setSlugManuallyEdited(true); update("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-")); }}
                      placeholder="article-url-slug"
                      className="rounded-xl text-xs font-mono flex-1 h-8"
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" className="rounded-xl h-8 w-8 shrink-0" onClick={handleRegenerateSlug}>
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{t("Regenerate from title", "إعادة توليد من العنوان")}</TooltipContent>
                    </Tooltip>
                  </div>
                  <p className="text-[9px] text-muted-foreground truncate font-mono">/news/{form.slug || "..."}</p>
                  {form.slug && ARABIC_REGEX.test(form.title_ar || "") && !ARABIC_REGEX.test(form.slug) && (
                    <Badge variant="secondary" className="text-[8px] rounded-lg">
                      <Sparkles className="h-2 w-2 me-1" /> {t("Auto-transliterated", "ترجمة صوتية تلقائية")}
                    </Badge>
                  )}
                </CardContent>
              </Card>

              {/* Google Preview */}
              <Card className="rounded-2xl border-border/40">
                <CardHeader className="pb-2 px-4 pt-3">
                  <CardTitle className="text-xs flex items-center gap-2">
                    <Eye className="h-3.5 w-3.5 text-primary" />
                    {t("Google Preview", "معاينة جوجل")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="rounded-xl border border-border/30 bg-card p-3 space-y-0.5">
                    <p className="text-[10px] text-chart-2 font-mono truncate">altoha.lovable.app/news/{form.slug || "..."}</p>
                    <p className="text-sm text-primary font-medium truncate leading-tight">
                      {currentTitle || t("Article Title", "عنوان المقال")}
                    </p>
                    <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {currentExcerpt || t("Add a meta description to improve click-through rates.", "أضف وصفاً تعريفياً لتحسين معدلات النقر.")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seo" className="mt-3">
              <ArticleSEOPanel
                title={currentTitle}
                excerpt={currentExcerpt}
                slug={form.slug}
                content={currentContent}
                featuredImage={form.featured_image_url}
                tags={selectedTags}
                totalTags={tags?.length || 0}
                onSlugChange={v => { setSlugManuallyEdited(true); update("slug", v); }}
                onExcerptChange={v => update(contentLang === "ar" ? "excerpt_ar" : "excerpt", v)}
                isAr={isAr}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
