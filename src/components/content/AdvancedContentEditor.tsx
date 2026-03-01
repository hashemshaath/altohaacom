import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FileText, Eye, Save, Clock, Send, Image, Globe, CalendarIcon, Tag, Bold, Italic, Heading, List, Link as LinkIcon, Quote, Code, Undo, Redo, Layout } from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface ContentEditorProps {
  initialData?: {
    title?: string;
    titleAr?: string;
    content?: string;
    contentAr?: string;
    excerpt?: string;
    excerptAr?: string;
    type?: string;
    status?: string;
    featuredImageUrl?: string;
    tags?: string[];
  };
  onSave?: (data: any) => void;
}

const CONTENT_TYPES = [
  { value: "article", labelEn: "Article", labelAr: "مقال" },
  { value: "news", labelEn: "News", labelAr: "خبر" },
  { value: "blog", labelEn: "Blog Post", labelAr: "تدوينة" },
  { value: "event", labelEn: "Event", labelAr: "فعالية" },
  { value: "recipe", labelEn: "Recipe", labelAr: "وصفة" },
];

const TOOLBAR_ACTIONS = [
  { icon: Bold, label: "Bold", syntax: "**", wrap: true },
  { icon: Italic, label: "Italic", syntax: "_", wrap: true },
  { icon: Heading, label: "Heading", syntax: "## ", wrap: false },
  { icon: List, label: "List", syntax: "- ", wrap: false },
  { icon: Quote, label: "Quote", syntax: "> ", wrap: false },
  { icon: Code, label: "Code", syntax: "`", wrap: true },
  { icon: LinkIcon, label: "Link", syntax: "[text](url)", wrap: false },
];

const TEMPLATES = [
  { id: "blank", nameEn: "Blank", nameAr: "فارغ", content: "" },
  { id: "recipe", nameEn: "Recipe Template", nameAr: "قالب وصفة", content: "## Ingredients\n\n- \n- \n\n## Instructions\n\n1. \n2. \n\n## Tips\n\n" },
  { id: "review", nameEn: "Review Template", nameAr: "قالب مراجعة", content: "## Overview\n\n## Pros\n\n- \n\n## Cons\n\n- \n\n## Verdict\n\n" },
  { id: "news", nameEn: "News Template", nameAr: "قالب خبر", content: "## Summary\n\n## Details\n\n## Impact\n\n## What's Next\n\n" },
];

export function AdvancedContentEditor({ initialData, onSave }: ContentEditorProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const isAr = language === "ar";

  const [title, setTitle] = useState(initialData?.title || "");
  const [titleAr, setTitleAr] = useState(initialData?.titleAr || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [contentAr, setContentAr] = useState(initialData?.contentAr || "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || "");
  const [excerptAr, setExcerptAr] = useState(initialData?.excerptAr || "");
  const [contentType, setContentType] = useState(initialData?.type || "article");
  const [status, setStatus] = useState(initialData?.status || "draft");
  const [featuredImage, setFeaturedImage] = useState(initialData?.featuredImageUrl || "");
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [isScheduled, setIsScheduled] = useState(false);
  const [editLang, setEditLang] = useState<"en" | "ar">("en");
  const [previewMode, setPreviewMode] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  const handleContentChange = (value: string, lang: "en" | "ar") => {
    if (lang === "en") setContent(value);
    else setContentAr(value);
    setWordCount(value.split(/\s+/).filter(Boolean).length);
  };

  const insertToolbar = (syntax: string, wrap: boolean) => {
    const textarea = document.getElementById("content-editor") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = editLang === "en" ? content : contentAr;
    const selected = text.substring(start, end);
    const newText = wrap
      ? text.substring(0, start) + syntax + selected + syntax + text.substring(end)
      : text.substring(0, start) + syntax + selected + text.substring(end);
    handleContentChange(newText, editLang);
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const applyTemplate = (templateContent: string) => {
    if (editLang === "en") setContent(templateContent);
    else setContentAr(templateContent);
  };

  const handleSave = (newStatus: string) => {
    if (!title.trim()) {
      toast({ title: isAr ? "العنوان مطلوب" : "Title is required", variant: "destructive" });
      return;
    }
    const data = {
      title, title_ar: titleAr, content, content_ar: contentAr,
      excerpt, excerpt_ar: excerptAr, type: contentType, status: newStatus,
      featured_image_url: featuredImage, tags,
      scheduled_at: isScheduled ? scheduledDate?.toISOString() : null,
    };
    onSave?.(data);
    toast({ title: isAr ? "تم الحفظ بنجاح" : "Saved successfully" });
  };

  const currentContent = editLang === "en" ? content : contentAr;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">{isAr ? "محرر المحتوى" : "Content Editor"}</h2>
          <Badge variant="outline">{status}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setPreviewMode(!previewMode)}>
            <Eye className="h-4 w-4 me-1" />
            {previewMode ? (isAr ? "تحرير" : "Edit") : (isAr ? "معاينة" : "Preview")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleSave("draft")}>
            <Save className="h-4 w-4 me-1" />
            {isAr ? "حفظ مسودة" : "Save Draft"}
          </Button>
          <Button size="sm" onClick={() => handleSave("published")}>
            <Send className="h-4 w-4 me-1" />
            {isAr ? "نشر" : "Publish"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        {/* Main Editor */}
        <div className="space-y-4">
          {/* Language tabs */}
          <Tabs value={editLang} onValueChange={v => setEditLang(v as "en" | "ar")}>
            <TabsList>
              <TabsTrigger value="en"><Globe className="h-3.5 w-3.5 me-1" /> English</TabsTrigger>
              <TabsTrigger value="ar"><Globe className="h-3.5 w-3.5 me-1" /> العربية</TabsTrigger>
            </TabsList>

            <TabsContent value="en" className="space-y-3">
              <Input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} className="text-lg font-semibold" />
              <Input placeholder="Excerpt / Summary" value={excerpt} onChange={e => setExcerpt(e.target.value)} />
            </TabsContent>
            <TabsContent value="ar" className="space-y-3" dir="rtl">
              <Input placeholder="العنوان" value={titleAr} onChange={e => setTitleAr(e.target.value)} className="text-lg font-semibold" />
              <Input placeholder="المقتطف / الملخص" value={excerptAr} onChange={e => setExcerptAr(e.target.value)} />
            </TabsContent>
          </Tabs>

          {/* Toolbar */}
          <div className="flex items-center gap-1 flex-wrap border rounded-lg p-1.5 bg-muted/30">
            {TOOLBAR_ACTIONS.map(action => (
              <Button key={action.label} variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertToolbar(action.syntax, action.wrap)} title={action.label}>
                <action.icon className="h-4 w-4" />
              </Button>
            ))}
            <div className="h-5 w-px bg-border mx-1" />
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-xs"><Layout className="h-3.5 w-3.5 me-1" />{isAr ? "قوالب" : "Templates"}</Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-1">
                {TEMPLATES.map(t => (
                  <Button key={t.id} variant="ghost" className="w-full justify-start text-sm h-8" onClick={() => applyTemplate(t.content)}>
                    {isAr ? t.nameAr : t.nameEn}
                  </Button>
                ))}
              </PopoverContent>
            </Popover>
            <span className="ms-auto text-xs text-muted-foreground">{wordCount} {isAr ? "كلمة" : "words"}</span>
          </div>

          {/* Content area */}
          {previewMode ? (
            <Card>
              <CardContent className="p-6 prose dark:prose-invert max-w-none">
                <h1>{editLang === "en" ? title : titleAr}</h1>
                <div className="whitespace-pre-wrap">{currentContent || (isAr ? "لا يوجد محتوى" : "No content")}</div>
              </CardContent>
            </Card>
          ) : (
            <Textarea
              id="content-editor"
              placeholder={isAr ? "ابدأ الكتابة..." : "Start writing..."}
              value={currentContent}
              onChange={e => handleContentChange(e.target.value, editLang)}
              className="min-h-[400px] font-mono text-sm"
              dir={editLang === "ar" ? "rtl" : "ltr"}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{isAr ? "إعدادات" : "Settings"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "النوع" : "Type"}</Label>
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONTENT_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{isAr ? t.labelAr : t.labelEn}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "صورة مميزة" : "Featured Image"}</Label>
                <Input placeholder="URL" value={featuredImage} onChange={e => setFeaturedImage(e.target.value)} />
                {featuredImage && <img src={featuredImage} alt="" className="rounded-md w-full h-32 object-cover" />}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">{isAr ? "الوسوم" : "Tags"}</Label>
                <div className="flex gap-1">
                  <Input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder={isAr ? "أضف وسم" : "Add tag"} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())} />
                  <Button size="sm" variant="outline" onClick={addTag}><Tag className="h-3.5 w-3.5" /></Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => setTags(tags.filter(t => t !== tag))}>
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-xs">{isAr ? "جدولة النشر" : "Schedule"}</Label>
                <Switch checked={isScheduled} onCheckedChange={setIsScheduled} />
              </div>
              {isScheduled && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <CalendarIcon className="h-3.5 w-3.5 me-1" />
                      {scheduledDate ? format(scheduledDate, "PPP", { locale: isAr ? ar : enUS }) : (isAr ? "اختر تاريخ" : "Pick date")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={scheduledDate} onSelect={setScheduledDate} />
                  </PopoverContent>
                </Popover>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
