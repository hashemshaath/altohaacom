import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { MarkdownEditor } from "./MarkdownEditor";
import { ArticleImageUpload } from "./ArticleImageUpload";
import { ArticleSEOPanel } from "./ArticleSEOPanel";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, Save, Eye, Calendar, Star, Loader2, CheckCircle2, Globe,
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
}

interface Props {
  articleId?: string | null;
  initialData?: ArticleFormData;
  onBack: () => void;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)
    + "-" + Date.now().toString(36).slice(-4);
}

export function ArticleEditorPro({ articleId, initialData, onBack }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";
  const t = (en: string, ar: string) => isAr ? ar : en;
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const [form, setForm] = useState<ArticleFormData>(initialData || {
    title: "", title_ar: "", slug: "", excerpt: "", excerpt_ar: "",
    content: "", content_ar: "", type: "news", status: "draft",
    featured_image_url: "", is_featured: false, published_at: "",
  });
  const [contentLang, setContentLang] = useState<"en" | "ar">("en");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaving, setAutoSaving] = useState(false);

  const update = (field: keyof ArticleFormData, value: any) => {
    setForm(prev => {
      const next = { ...prev, [field]: value };
      // Auto-generate slug from title
      if (field === "title" && !articleId && !prev.slug) {
        next.slug = generateSlug(value);
      }
      return next;
    });
  };

  // Autosave for existing articles
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
          is_featured: form.is_featured, updated_at: new Date().toISOString(),
        }).eq("id", articleId);
        setLastSaved(new Date());
      } catch {}
      setAutoSaving(false);
    }, 3000);
    return () => { if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current); };
  }, [articleId, form.title, form.content, form.content_ar, form.title_ar, form.excerpt, form.excerpt_ar, form.featured_image_url, form.is_featured, form.type, form.slug]);

  const saveMutation = useMutation({
    mutationFn: async (data: ArticleFormData) => {
      const payload = {
        ...data,
        slug: data.slug || generateSlug(data.title),
        published_at: data.published_at || (data.status === "published" ? new Date().toISOString() : null),
        featured_image_url: data.featured_image_url || null,
        author_id: user?.id || null,
      };
      if (articleId) {
        const { error } = await supabase.from("articles").update(payload).eq("id", articleId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("articles").insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      toast({ title: t("Article saved!", "تم حفظ المقال!") });
      onBack();
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: t("Save failed", "فشل الحفظ"), description: err.message });
    },
  });

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="rounded-xl gap-1.5">
            <ArrowLeft className="h-4 w-4" />
            {t("Back", "رجوع")}
          </Button>
          <h1 className="font-serif text-xl font-bold">
            {articleId ? t("Edit Article", "تعديل المقال") : t("New Article", "مقال جديد")}
          </h1>
          {form.status === "draft" && <Badge variant="secondary" className="rounded-xl">{t("Draft", "مسودة")}</Badge>}
          {form.status === "published" && <Badge className="rounded-xl bg-chart-2/10 text-chart-2 border-chart-2/20">{t("Published", "منشور")}</Badge>}
        </div>
        <div className="flex items-center gap-2">
          {/* Autosave indicator */}
          {articleId && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {autoSaving ? (
                <><Loader2 className="h-3 w-3 animate-spin" />{t("Saving...", "جاري الحفظ...")}</>
              ) : lastSaved ? (
                <><CheckCircle2 className="h-3 w-3 text-chart-2" />{t("Auto-saved", "تم الحفظ تلقائياً")}</>
              ) : null}
            </div>
          )}
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => window.open(`/news/${form.slug}`, "_blank")} disabled={!form.slug}>
            <Eye className="h-3.5 w-3.5" /> {t("Preview", "معاينة")}
          </Button>
          <Button size="sm" className="rounded-xl gap-1.5" onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || !form.title}>
            {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {t("Save", "حفظ")}
          </Button>
        </div>
      </div>

      {/* Main Layout: Editor + Sidebar */}
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
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
            <TabsList className="rounded-xl">
              <TabsTrigger value="en" className="rounded-xl gap-1.5">
                <Globe className="h-3.5 w-3.5" /> English
              </TabsTrigger>
              <TabsTrigger value="ar" className="rounded-xl gap-1.5">
                <Globe className="h-3.5 w-3.5" /> العربية
              </TabsTrigger>
            </TabsList>

            <TabsContent value="en" className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{t("Title", "العنوان")}</Label>
                <Input
                  value={form.title}
                  onChange={e => update("title", e.target.value)}
                  placeholder={t("Enter a compelling headline...", "أدخل عنواناً جذاباً...")}
                  className="rounded-xl text-lg font-serif font-bold h-12 border-border/40"
                />
              </div>
              <MarkdownEditor
                value={form.content}
                onChange={v => update("content", v)}
                placeholder={t("Start writing your article in Markdown...", "ابدأ كتابة مقالك بتنسيق Markdown...")}
              />
            </TabsContent>

            <TabsContent value="ar" className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{t("Title (Arabic)", "العنوان (عربي)")}</Label>
                <Input
                  dir="rtl"
                  value={form.title_ar}
                  onChange={e => update("title_ar", e.target.value)}
                  placeholder="أدخل عنواناً جذاباً..."
                  className="rounded-xl text-lg font-serif font-bold h-12 border-border/40"
                />
              </div>
              <MarkdownEditor
                value={form.content_ar}
                onChange={v => update("content_ar", v)}
                placeholder="ابدأ كتابة مقالك بتنسيق Markdown..."
                dir="rtl"
                isAr
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Publish Settings */}
          <Card className="rounded-2xl border-border/40">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">{t("Type", "النوع")}</Label>
                <Select value={form.type} onValueChange={v => update("type", v)}>
                  <SelectTrigger className="rounded-xl text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="news">{t("News", "أخبار")}</SelectItem>
                    <SelectItem value="article">{t("Article", "مقال")}</SelectItem>
                    <SelectItem value="exhibition">{t("Exhibition", "معرض")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("Status", "الحالة")}</Label>
                <Select value={form.status} onValueChange={v => update("status", v)}>
                  <SelectTrigger className="rounded-xl text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="draft">{t("Draft", "مسودة")}</SelectItem>
                    <SelectItem value="published">{t("Published", "منشور")}</SelectItem>
                    <SelectItem value="archived">{t("Archived", "مؤرشف")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" /> {t("Schedule", "جدولة")}
                </Label>
                <Input
                  type="datetime-local"
                  value={form.published_at ? form.published_at.slice(0, 16) : ""}
                  onChange={e => update("published_at", e.target.value ? new Date(e.target.value).toISOString() : "")}
                  className="rounded-xl text-xs"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs flex items-center gap-1.5">
                  <Star className="h-3 w-3" /> {t("Featured", "مميز")}
                </Label>
                <Switch checked={form.is_featured} onCheckedChange={v => update("is_featured", v)} />
              </div>
            </CardContent>
          </Card>

          {/* SEO Panel */}
          <ArticleSEOPanel
            title={contentLang === "ar" ? form.title_ar : form.title}
            excerpt={contentLang === "ar" ? form.excerpt_ar : form.excerpt}
            slug={form.slug}
            content={contentLang === "ar" ? form.content_ar : form.content}
            onSlugChange={v => update("slug", v)}
            onExcerptChange={v => update(contentLang === "ar" ? "excerpt_ar" : "excerpt", v)}
            isAr={isAr}
          />
        </div>
      </div>
    </div>
  );
}
