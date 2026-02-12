import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Languages,
  Search,
  Sparkles,
  Globe,
  FileText,
  Shield,
  AlertTriangle,
  CheckCircle,
  Settings,
  BookOpen,
} from "lucide-react";

interface TranslatableField {
  id: string;
  table: string;
  field: string;
  fieldAr: string;
  label: string;
  labelAr: string;
  category: string;
  maxLength: number;
  required: boolean;
  seoOptimize: boolean;
  description: string;
  descriptionAr: string;
}

const TRANSLATABLE_FIELDS: TranslatableField[] = [
  // Competitions
  { id: "comp_name", table: "competitions", field: "name", fieldAr: "name_ar", label: "Competition Name", labelAr: "اسم المسابقة", category: "competitions", maxLength: 120, required: true, seoOptimize: true, description: "Main competition title for SEO and display", descriptionAr: "عنوان المسابقة الرئيسي للعرض ومحركات البحث" },
  { id: "comp_desc", table: "competitions", field: "description", fieldAr: "description_ar", label: "Competition Description", labelAr: "وصف المسابقة", category: "competitions", maxLength: 500, required: true, seoOptimize: true, description: "Description used in meta tags and listings", descriptionAr: "الوصف المستخدم في وسوم ميتا والقوائم" },
  { id: "comp_location", table: "competitions", field: "location", fieldAr: "location_ar", label: "Competition Location", labelAr: "موقع المسابقة", category: "competitions", maxLength: 200, required: false, seoOptimize: false, description: "Physical or virtual venue", descriptionAr: "المكان الفعلي أو الافتراضي" },
  // Articles
  { id: "art_title", table: "articles", field: "title", fieldAr: "title_ar", label: "Article Title", labelAr: "عنوان المقال", category: "articles", maxLength: 60, required: true, seoOptimize: true, description: "SEO-optimized title under 60 characters", descriptionAr: "عنوان محسّن لمحركات البحث أقل من 60 حرف" },
  { id: "art_excerpt", table: "articles", field: "excerpt", fieldAr: "excerpt_ar", label: "Article Excerpt", labelAr: "مقتطف المقال", category: "articles", maxLength: 160, required: true, seoOptimize: true, description: "Meta description under 160 characters", descriptionAr: "وصف ميتا أقل من 160 حرف" },
  { id: "art_content", table: "articles", field: "content", fieldAr: "content_ar", label: "Article Content", labelAr: "محتوى المقال", category: "articles", maxLength: 50000, required: true, seoOptimize: false, description: "Full article body content", descriptionAr: "محتوى المقال الكامل" },
  // Companies
  { id: "co_name", table: "companies", field: "name", fieldAr: "name_ar", label: "Company Name", labelAr: "اسم الشركة", category: "companies", maxLength: 150, required: true, seoOptimize: true, description: "Company display name", descriptionAr: "اسم الشركة للعرض" },
  { id: "co_desc", table: "companies", field: "description", fieldAr: "description_ar", label: "Company Description", labelAr: "وصف الشركة", category: "companies", maxLength: 500, required: false, seoOptimize: true, description: "Company profile description", descriptionAr: "وصف ملف الشركة" },
  // Entities
  { id: "ent_name", table: "culinary_entities", field: "name", fieldAr: "name_ar", label: "Entity Name", labelAr: "اسم الجهة", category: "entities", maxLength: 200, required: true, seoOptimize: true, description: "Organization or entity name", descriptionAr: "اسم الجهة أو المنظمة" },
  { id: "ent_desc", table: "culinary_entities", field: "description", fieldAr: "description_ar", label: "Entity Description", labelAr: "وصف الجهة", category: "entities", maxLength: 500, required: false, seoOptimize: true, description: "Entity profile description", descriptionAr: "وصف ملف الجهة" },
  // Exhibitions
  { id: "exh_name", table: "exhibitions", field: "name", fieldAr: "name_ar", label: "Exhibition Name", labelAr: "اسم المعرض", category: "exhibitions", maxLength: 150, required: true, seoOptimize: true, description: "Exhibition title for SEO", descriptionAr: "عنوان المعرض لمحركات البحث" },
  { id: "exh_desc", table: "exhibitions", field: "description", fieldAr: "description_ar", label: "Exhibition Description", labelAr: "وصف المعرض", category: "exhibitions", maxLength: 500, required: false, seoOptimize: true, description: "Exhibition description for meta", descriptionAr: "وصف المعرض لوسوم ميتا" },
  // Certificates
  { id: "cert_title", table: "certificate_templates", field: "title_text", fieldAr: "title_text_ar", label: "Certificate Title", labelAr: "عنوان الشهادة", category: "certificates", maxLength: 200, required: true, seoOptimize: false, description: "Certificate heading text", descriptionAr: "نص عنوان الشهادة" },
  { id: "cert_body", table: "certificate_templates", field: "body_template", fieldAr: "body_template_ar", label: "Certificate Body", labelAr: "نص الشهادة", category: "certificates", maxLength: 2000, required: true, seoOptimize: false, description: "Certificate body content template", descriptionAr: "قالب محتوى نص الشهادة" },
  // Ad Campaigns
  { id: "ad_name", table: "ad_campaigns", field: "name", fieldAr: "name_ar", label: "Campaign Name", labelAr: "اسم الحملة", category: "advertising", maxLength: 150, required: true, seoOptimize: false, description: "Advertising campaign name", descriptionAr: "اسم الحملة الإعلانية" },
  // Communication Templates
  { id: "tpl_name", table: "communication_templates", field: "name", fieldAr: "name_ar", label: "Template Name", labelAr: "اسم القالب", category: "communications", maxLength: 150, required: true, seoOptimize: false, description: "Communication template name", descriptionAr: "اسم قالب الاتصال" },
  { id: "tpl_subject", table: "communication_templates", field: "subject", fieldAr: "subject_ar", label: "Template Subject", labelAr: "موضوع القالب", category: "communications", maxLength: 200, required: false, seoOptimize: false, description: "Email subject line", descriptionAr: "سطر موضوع البريد" },
];

const CATEGORIES = [
  { value: "all", label: "All Fields", labelAr: "كل الحقول" },
  { value: "competitions", label: "Competitions", labelAr: "المسابقات" },
  { value: "articles", label: "Articles & News", labelAr: "المقالات والأخبار" },
  { value: "companies", label: "Companies", labelAr: "الشركات" },
  { value: "entities", label: "Entities", labelAr: "الجهات" },
  { value: "exhibitions", label: "Exhibitions", labelAr: "المعارض" },
  { value: "certificates", label: "Certificates", labelAr: "الشهادات" },
  { value: "advertising", label: "Advertising", labelAr: "الإعلانات" },
  { value: "communications", label: "Communications", labelAr: "الاتصالات" },
];

interface SEORule {
  id: string;
  field: string;
  rule: string;
  ruleAr: string;
  severity: "error" | "warning" | "info";
  enabled: boolean;
}

const DEFAULT_SEO_RULES: SEORule[] = [
  { id: "title_length", field: "title", rule: "Title must be under 60 characters for optimal SEO display", ruleAr: "يجب أن يكون العنوان أقل من 60 حرفاً لعرض أمثل في محركات البحث", severity: "error", enabled: true },
  { id: "desc_length", field: "description", rule: "Meta description must be 120-160 characters", ruleAr: "وصف ميتا يجب أن يكون بين 120 و160 حرفاً", severity: "error", enabled: true },
  { id: "no_markdown", field: "all", rule: "No Markdown or special characters (**, ##) allowed in translated text", ruleAr: "لا يُسمح بعلامات Markdown أو الأحرف الخاصة في النص المترجم", severity: "error", enabled: true },
  { id: "no_duplicate", field: "title", rule: "Title and description must not be identical", ruleAr: "يجب ألا يتطابق العنوان والوصف", severity: "warning", enabled: true },
  { id: "keyword_presence", field: "title", rule: "Primary keyword should appear in the first 30 characters of the title", ruleAr: "يجب أن تظهر الكلمة الرئيسية في أول 30 حرفاً من العنوان", severity: "warning", enabled: true },
  { id: "clean_spacing", field: "all", rule: "Text must have proper spacing without extra whitespace", ruleAr: "يجب أن يكون النص منسق بمسافات صحيحة بدون مسافات زائدة", severity: "info", enabled: true },
  { id: "ar_quality", field: "all", rule: "Arabic text must be professionally written with correct grammar", ruleAr: "يجب أن يكون النص العربي مكتوباً بشكل احترافي مع قواعد نحوية صحيحة", severity: "error", enabled: true },
  { id: "no_mixed_lang", field: "all", rule: "Do not mix languages within a single translated field unless brand names", ruleAr: "لا تخلط اللغات داخل حقل مترجم واحد إلا لأسماء العلامات التجارية", severity: "warning", enabled: true },
];

export default function TranslationSEOAdmin() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const isAr = language === "ar";
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [seoRules, setSeoRules] = useState(DEFAULT_SEO_RULES);

  const filteredFields = TRANSLATABLE_FIELDS.filter((f) => {
    const matchesSearch =
      !search ||
      f.label.toLowerCase().includes(search.toLowerCase()) ||
      f.labelAr.includes(search) ||
      f.table.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || f.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const seoFields = TRANSLATABLE_FIELDS.filter((f) => f.seoOptimize);
  const requiredFields = TRANSLATABLE_FIELDS.filter((f) => f.required);

  const toggleRule = (ruleId: string) => {
    setSeoRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const handleSaveRules = () => {
    toast({
      title: isAr ? "تم الحفظ" : "Rules Saved",
      description: isAr ? "تم حفظ قواعد الترجمة وتحسين المحتوى" : "Translation and SEO optimization rules saved",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold">
            {isAr ? "مركز الترجمة وتحسين المحتوى" : "Translation & SEO Optimization Center"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAr
              ? "إدارة الحقول ثنائية اللغة وقواعد تحسين محركات البحث والقيود اللغوية"
              : "Manage bilingual fields, SEO rules, and language constraints across all content"}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="gap-1">
            <Globe className="h-3 w-3" />
            {TRANSLATABLE_FIELDS.length} {isAr ? "حقل" : "fields"}
          </Badge>
          <Badge className="gap-1 bg-chart-3/15 text-chart-3 border-chart-3/20">
            <Sparkles className="h-3 w-3" />
            {seoFields.length} {isAr ? "محسّن SEO" : "SEO optimized"}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="fields">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="fields" className="gap-2">
            <Languages className="h-4 w-4" />
            {isAr ? "الحقول القابلة للترجمة" : "Translatable Fields"}
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-2">
            <Shield className="h-4 w-4" />
            {isAr ? "القواعد والقيود" : "Rules & Constraints"}
          </TabsTrigger>
          <TabsTrigger value="guidelines" className="gap-2">
            <BookOpen className="h-4 w-4" />
            {isAr ? "إرشادات المحتوى" : "Content Guidelines"}
          </TabsTrigger>
        </TabsList>

        {/* Translatable Fields Tab */}
        <TabsContent value="fields" className="mt-6 space-y-4">
          <Card>
            <CardContent className="flex flex-wrap gap-4 pt-6">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={isAr ? "بحث في الحقول..." : "Search fields..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="ps-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {isAr ? cat.labelAr : cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{isAr ? "خريطة الحقول ثنائية اللغة" : "Bilingual Field Map"}</CardTitle>
              <CardDescription>
                {isAr
                  ? "جميع الحقول التي تتطلب ترجمة وتحسين محتوى عبر جميع الأقسام"
                  : "All fields requiring translation and content optimization across all sections"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isAr ? "القسم" : "Section"}</TableHead>
                      <TableHead>{isAr ? "الحقل" : "Field"}</TableHead>
                      <TableHead>{isAr ? "الحقل العربي" : "Arabic Field"}</TableHead>
                      <TableHead>{isAr ? "الحد الأقصى" : "Max Length"}</TableHead>
                      <TableHead>{isAr ? "مطلوب" : "Required"}</TableHead>
                      <TableHead>SEO</TableHead>
                      <TableHead>{isAr ? "الوصف" : "Description"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFields.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell>
                          <Badge variant="outline" className="capitalize text-xs">
                            {isAr ? CATEGORIES.find((c) => c.value === f.category)?.labelAr : f.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{f.field}</TableCell>
                        <TableCell className="font-mono text-xs" dir="rtl">{f.fieldAr}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">{f.maxLength}</Badge>
                        </TableCell>
                        <TableCell>
                          {f.required ? (
                            <CheckCircle className="h-4 w-4 text-chart-3" />
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {f.seoOptimize ? (
                            <Sparkles className="h-4 w-4 text-chart-4" />
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px] text-xs text-muted-foreground truncate">
                          {isAr ? f.descriptionAr : f.description}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rules & Constraints Tab */}
        <TabsContent value="rules" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{isAr ? "قواعد تحسين المحتوى والترجمة" : "Content Optimization & Translation Rules"}</CardTitle>
                  <CardDescription>
                    {isAr
                      ? "القواعد التي يجب الالتزام بها عند استخدام مساعد تحسين المحتوى والترجمة"
                      : "Rules that must be strictly followed when using the content optimization and translation assistant"}
                  </CardDescription>
                </div>
                <Button onClick={handleSaveRules}>
                  <Settings className="me-2 h-4 w-4" />
                  {isAr ? "حفظ القواعد" : "Save Rules"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {seoRules.map((rule) => (
                <div
                  key={rule.id}
                  className={`flex items-start gap-4 rounded-xl border p-4 transition-all ${
                    rule.enabled ? "" : "opacity-50 bg-muted/30"
                  }`}
                >
                  <div className="mt-1">
                    {rule.severity === "error" ? (
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    ) : rule.severity === "warning" ? (
                      <AlertTriangle className="h-5 w-5 text-chart-4" />
                    ) : (
                      <FileText className="h-5 w-5 text-chart-1" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={rule.severity === "error" ? "destructive" : "outline"}
                        className="text-xs"
                      >
                        {rule.severity === "error"
                          ? isAr ? "إلزامي" : "Required"
                          : rule.severity === "warning"
                          ? isAr ? "تحذير" : "Warning"
                          : isAr ? "معلومة" : "Info"}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-mono">{rule.field}</span>
                    </div>
                    <p className="text-sm font-medium">{isAr ? rule.ruleAr : rule.rule}</p>
                  </div>
                  <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Guidelines Tab */}
        <TabsContent value="guidelines" className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  {isAr ? "إرشادات SEO" : "SEO Guidelines"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                  <p className="font-medium">{isAr ? "العناوين (Title Tags)" : "Title Tags"}</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>{isAr ? "أقل من 60 حرف مع الكلمة الرئيسية" : "Under 60 characters with primary keyword"}</li>
                    <li>{isAr ? "وصفي وجذاب للنقر" : "Descriptive and click-worthy"}</li>
                    <li>{isAr ? "فريد لكل صفحة" : "Unique per page"}</li>
                  </ul>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                  <p className="font-medium">{isAr ? "الوصف التعريفي (Meta Description)" : "Meta Descriptions"}</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>{isAr ? "بين 120 و160 حرف" : "Between 120-160 characters"}</li>
                    <li>{isAr ? "يتضمن دعوة للعمل" : "Include call-to-action"}</li>
                    <li>{isAr ? "يعكس محتوى الصفحة بدقة" : "Accurately reflects page content"}</li>
                  </ul>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                  <p className="font-medium">{isAr ? "المحتوى الهيكلي" : "Structured Content"}</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>{isAr ? "عنوان H1 واحد فقط لكل صفحة" : "Single H1 per page"}</li>
                    <li>{isAr ? "استخدم عناصر HTML الدلالية" : "Use semantic HTML elements"}</li>
                    <li>{isAr ? "أضف نص بديل وصفي للصور" : "Descriptive alt text for images"}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Languages className="h-5 w-5 text-primary" />
                  {isAr ? "إرشادات الترجمة" : "Translation Guidelines"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                  <p className="font-medium">{isAr ? "جودة النص العربي" : "Arabic Text Quality"}</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>{isAr ? "كتابة احترافية بقواعد نحوية صحيحة" : "Professional writing with correct grammar"}</li>
                    <li>{isAr ? "لا تستخدم علامات Markdown (**, ##, __)" : "No Markdown characters (**, ##, __)"}</li>
                    <li>{isAr ? "مسافات صحيحة بدون مسافات زائدة" : "Proper spacing without extra whitespace"}</li>
                  </ul>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                  <p className="font-medium">{isAr ? "اتساق اللغة" : "Language Consistency"}</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>{isAr ? "لا تخلط اللغات إلا لأسماء العلامات التجارية" : "Don't mix languages except brand names"}</li>
                    <li>{isAr ? "استخدم مصطلحات موحدة عبر المنصة" : "Use unified terminology across the platform"}</li>
                    <li>{isAr ? "تأكد من التوافق بين المذكر والمؤنث" : "Ensure gender agreement in Arabic"}</li>
                  </ul>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                  <p className="font-medium">{isAr ? "قيود خاصة" : "Special Constraints"}</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>{isAr ? "النص المترجم يجب أن يكون نصاً نظيفاً بدون تنسيق" : "Translated text must be clean, format-free"}</li>
                    <li>{isAr ? "احترم حدود الأحرف المحددة لكل حقل" : "Respect character limits for each field"}</li>
                    <li>{isAr ? "الحقول المطلوبة يجب ترجمتها في كلتا اللغتين" : "Required fields must be translated in both languages"}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{isAr ? "ملخص متطلبات الحقول" : "Field Requirements Summary"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border p-4 text-center">
                  <p className="text-3xl font-bold text-primary">{TRANSLATABLE_FIELDS.length}</p>
                  <p className="text-sm text-muted-foreground">{isAr ? "إجمالي الحقول" : "Total Fields"}</p>
                </div>
                <div className="rounded-xl border p-4 text-center">
                  <p className="text-3xl font-bold text-chart-3">{requiredFields.length}</p>
                  <p className="text-sm text-muted-foreground">{isAr ? "حقول مطلوبة" : "Required Fields"}</p>
                </div>
                <div className="rounded-xl border p-4 text-center">
                  <p className="text-3xl font-bold text-chart-4">{seoFields.length}</p>
                  <p className="text-sm text-muted-foreground">{isAr ? "محسّنة SEO" : "SEO Optimized"}</p>
                </div>
                <div className="rounded-xl border p-4 text-center">
                  <p className="text-3xl font-bold text-chart-1">{new Set(TRANSLATABLE_FIELDS.map((f) => f.category)).size}</p>
                  <p className="text-sm text-muted-foreground">{isAr ? "أقسام" : "Sections"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
