import { memo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  Bold, Italic, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Code, Link2, Image, Minus,
  Eye, Edit3, Table, Strikethrough, FileCode,
  AlignLeft, AlignRight, Columns, LayoutTemplate, ChevronDown,
  Highlighter, Superscript, Subscript, CheckSquare, MessageSquareQuote,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onInsert: (before: string, after?: string) => void;
  preview: boolean;
  onTogglePreview: () => void;
  isAr?: boolean;
  onDirectionChange?: (dir: "ltr" | "rtl" | "auto") => void;
  currentDirection?: string;
}

interface ToolDef {
  icon: LucideIcon;
  label: string;
  labelAr: string;
  before: string;
  after: string;
  shortcut?: string;
}

interface SepDef {
  type: "sep";
}

type ToolItem = ToolDef | SepDef;

// Primary formatting tools (always visible)
const PRIMARY_TOOLS: ToolItem[] = [
  { icon: Bold, label: "Bold", labelAr: "عريض", before: "**", after: "**", shortcut: "⌘B" },
  { icon: Italic, label: "Italic", labelAr: "مائل", before: "_", after: "_", shortcut: "⌘I" },
  { icon: Strikethrough, label: "Strikethrough", labelAr: "يتوسطه خط", before: "~~", after: "~~" },
  { icon: Highlighter, label: "Highlight", labelAr: "تمييز", before: "==", after: "==" },
  { type: "sep" },
  { icon: Heading2, label: "Heading 2", labelAr: "عنوان 2", before: "\n## ", after: "\n" },
  { icon: Heading3, label: "Heading 3", labelAr: "عنوان 3", before: "\n### ", after: "\n" },
  { type: "sep" },
  { icon: List, label: "Bullet List", labelAr: "قائمة نقطية", before: "- ", after: "" },
  { icon: ListOrdered, label: "Numbered List", labelAr: "قائمة مرقمة", before: "1. ", after: "" },
  { icon: CheckSquare, label: "Checklist", labelAr: "قائمة مهام", before: "- [ ] ", after: "" },
  { icon: Quote, label: "Blockquote", labelAr: "اقتباس", before: "> ", after: "" },
  { type: "sep" },
  { icon: Link2, label: "Link", labelAr: "رابط", before: "[", after: "](url)", shortcut: "⌘K" },
  { icon: Image, label: "Image", labelAr: "صورة", before: "![", after: "](image-url)" },
  { icon: Code, label: "Inline Code", labelAr: "كود", before: "`", after: "`" },
];

// Section templates for long-form articles
const SECTION_TEMPLATES = [
  {
    label: "Introduction Section",
    labelAr: "قسم المقدمة",
    template: "\n## Introduction\n\nProvide context and hook the reader with a compelling opening paragraph.\n\n",
    templateAr: "\n## المقدمة\n\nقدّم السياق واجذب القارئ بفقرة افتتاحية مقنعة.\n\n",
  },
  {
    label: "Main Section with Image",
    labelAr: "قسم رئيسي مع صورة",
    template: "\n## Section Title\n\n![Section image description](image-url)\n\nWrite detailed content for this section. Include relevant facts, quotes, and analysis.\n\n",
    templateAr: "\n## عنوان القسم\n\n![وصف صورة القسم](رابط-الصورة)\n\nاكتب محتوى تفصيلياً لهذا القسم. أدرج حقائق واقتباسات وتحليلات ذات صلة.\n\n",
  },
  {
    label: "Key Points / Highlights",
    labelAr: "النقاط الرئيسية",
    template: "\n## Key Points\n\n- **Point 1**: Description of the first key insight\n- **Point 2**: Description of the second key insight\n- **Point 3**: Description of the third key insight\n\n",
    templateAr: "\n## النقاط الرئيسية\n\n- **النقطة 1**: وصف أول نقطة مهمة\n- **النقطة 2**: وصف ثاني نقطة مهمة\n- **النقطة 3**: وصف ثالث نقطة مهمة\n\n",
  },
  {
    label: "Quote / Testimonial",
    labelAr: "اقتباس / شهادة",
    template: '\n> "Insert a powerful quote here that supports your narrative."\n>\n> — **Speaker Name**, Title or Organization\n\n',
    templateAr: '\n> "أدرج اقتباساً قوياً هنا يدعم سردك."\n>\n> — **اسم المتحدث**، المنصب أو المؤسسة\n\n',
  },
  {
    label: "Comparison Table",
    labelAr: "جدول مقارنة",
    template: "\n## Comparison\n\n| Feature | Option A | Option B |\n|---------|----------|----------|\n| Detail 1 | ✅ Yes | ❌ No |\n| Detail 2 | ⭐ Excellent | 👍 Good |\n| Detail 3 | Value | Value |\n\n",
    templateAr: "\n## مقارنة\n\n| الميزة | الخيار أ | الخيار ب |\n|--------|----------|----------|\n| التفصيل 1 | ✅ نعم | ❌ لا |\n| التفصيل 2 | ⭐ ممتاز | 👍 جيد |\n| التفصيل 3 | قيمة | قيمة |\n\n",
  },
  {
    label: "Step-by-Step Guide",
    labelAr: "دليل خطوة بخطوة",
    template: "\n## How To: Step-by-Step\n\n### Step 1: Title\nDescribe what to do in this step.\n\n### Step 2: Title\nDescribe the next action clearly.\n\n### Step 3: Title\nConclude with the final steps.\n\n",
    templateAr: "\n## كيفية: خطوة بخطوة\n\n### الخطوة 1: العنوان\nصف ما يجب فعله في هذه الخطوة.\n\n### الخطوة 2: العنوان\nصف الإجراء التالي بوضوح.\n\n### الخطوة 3: العنوان\nاختتم بالخطوات النهائية.\n\n",
  },
  {
    label: "FAQ Section",
    labelAr: "قسم الأسئلة الشائعة",
    template: "\n## Frequently Asked Questions\n\n### Q: Question goes here?\nAnswer with a clear, concise response.\n\n### Q: Another common question?\nProvide helpful information that addresses the reader's concern.\n\n",
    templateAr: "\n## الأسئلة الشائعة\n\n### س: ضع السؤال هنا؟\nأجب بإجابة واضحة وموجزة.\n\n### س: سؤال شائع آخر؟\nقدّم معلومات مفيدة تعالج اهتمام القارئ.\n\n",
  },
  {
    label: "Conclusion & CTA",
    labelAr: "الخاتمة والدعوة للعمل",
    template: "\n## Conclusion\n\nSummarize the key takeaways and reinforce your main message.\n\n**What's Next?** Share your thoughts or take action by [doing something](link).\n\n",
    templateAr: "\n## الخاتمة\n\nلخّص النقاط الرئيسية وعزّز رسالتك الأساسية.\n\n**ما التالي؟** شاركنا رأيك أو اتخذ إجراءً عبر [فعل شيء](رابط).\n\n",
  },
  {
    label: "Image Gallery",
    labelAr: "معرض صور",
    template: "\n## Gallery\n\n![Image 1 description](image-1-url)\n\n![Image 2 description](image-2-url)\n\n![Image 3 description](image-3-url)\n\n",
    templateAr: "\n## معرض الصور\n\n![وصف الصورة 1](رابط-صورة-1)\n\n![وصف الصورة 2](رابط-صورة-2)\n\n![وصف الصورة 3](رابط-صورة-3)\n\n",
  },
  {
    label: "Full Article Structure",
    labelAr: "هيكل مقال كامل",
    template: "\n## Introduction\n\nOpen with a compelling hook that draws readers in. Provide context for why this topic matters.\n\n---\n\n## Background\n\nGive necessary background information. Set the stage for the main discussion.\n\n## Main Discussion\n\n### Key Aspect 1\nDive deep into the first major point with evidence and examples.\n\n![Supporting image](image-url)\n\n### Key Aspect 2\nExplore the second dimension with data and expert opinions.\n\n### Key Aspect 3\nAddress the third angle with real-world applications.\n\n## Expert Insights\n\n> \"Quote from an expert or authority on the subject.\"\n>\n> — **Expert Name**, Title\n\n## Key Takeaways\n\n- **Takeaway 1**: Summary of first insight\n- **Takeaway 2**: Summary of second insight\n- **Takeaway 3**: Summary of third insight\n\n## Conclusion\n\nSummarize findings and provide a forward-looking perspective.\n\n",
    templateAr: "\n## المقدمة\n\nافتتح بعبارة جذابة تشد القارئ. قدّم السياق لأهمية الموضوع.\n\n---\n\n## الخلفية\n\nقدّم المعلومات الأساسية اللازمة. مهّد للنقاش الرئيسي.\n\n## النقاش الرئيسي\n\n### الجانب الأول\nتعمّق في النقطة الرئيسية الأولى مع أدلة وأمثلة.\n\n![صورة داعمة](رابط-الصورة)\n\n### الجانب الثاني\nاستكشف البُعد الثاني مع بيانات وآراء خبراء.\n\n### الجانب الثالث\nتناول الزاوية الثالثة مع تطبيقات واقعية.\n\n## رؤى الخبراء\n\n> \"اقتباس من خبير أو مرجع في الموضوع.\"\n>\n> — **اسم الخبير**، المنصب\n\n## النقاط الرئيسية\n\n- **النقطة 1**: ملخص أول استنتاج\n- **النقطة 2**: ملخص ثاني استنتاج\n- **النقطة 3**: ملخص ثالث استنتاج\n\n## الخاتمة\n\nلخّص النتائج وقدّم نظرة مستقبلية.\n\n",
  },
];

// Additional formatting tools (in dropdown)
const EXTRA_TOOLS: ToolItem[] = [
  { icon: Heading1, label: "Heading 1", labelAr: "عنوان 1", before: "\n# ", after: "\n" },
  { icon: FileCode, label: "Code Block", labelAr: "كتلة كود", before: "\n```\n", after: "\n```\n" },
  { icon: Table, label: "Table", labelAr: "جدول", before: "\n| Header | Header |\n|--------|--------|\n| Cell   | Cell   |\n", after: "" },
  { icon: Minus, label: "Divider", labelAr: "فاصل", before: "\n---\n", after: "" },
  { icon: Superscript, label: "Superscript", labelAr: "نص علوي", before: "<sup>", after: "</sup>" },
  { icon: Subscript, label: "Subscript", labelAr: "نص سفلي", before: "<sub>", after: "</sub>" },
  { icon: MessageSquareQuote, label: "Callout / Note", labelAr: "ملاحظة", before: "\n> **💡 Note:** ", after: "\n" },
];

export const MarkdownToolbar = memo(function MarkdownToolbar({ textareaRef, onInsert, preview, onTogglePreview, isAr, onDirectionChange, currentDirection }: Props) {
  const [sectionOpen, setSectionOpen] = useState(false);
  const [extraOpen, setExtraOpen] = useState(false);
  const [imageUrlOpen, setImageUrlOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");

  const handleInsertImage = useCallback(() => {
    if (imageUrl) {
      onInsert(`![${imageAlt || "image"}](`, `${imageUrl})`);
      setImageUrl("");
      setImageAlt("");
      setImageUrlOpen(false);
    }
  }, [imageUrl, imageAlt, onInsert]);

  const handleInsertSection = useCallback((template: string) => {
    onInsert(template, "");
    setSectionOpen(false);
  }, [onInsert]);

  return (
    <div className="flex items-center gap-0.5 flex-wrap rounded-t-2xl border border-b-0 border-border/40 bg-muted/30 px-2 py-1.5">
      {/* Primary Tools */}
      {PRIMARY_TOOLS.map((tool, i) => {
        if ("type" in tool) {
          return <Separator key={i} orientation="vertical" className="mx-0.5 h-5" />;
        }
        const t = tool as ToolDef;
        return (
          <Tooltip key={t.label}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 rounded-lg hover:bg-background"
                onClick={() => onInsert(t.before, t.after || "")}
              >
                <t.icon className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {isAr ? t.labelAr : t.label}
              {t.shortcut && <span className="text-muted-foreground ms-1.5">{t.shortcut}</span>}
            </TooltipContent>
          </Tooltip>
        );
      })}

      <Separator orientation="vertical" className="mx-0.5 h-5" />

      {/* Image Insert with URL */}
      <Popover open={imageUrlOpen} onOpenChange={setImageUrlOpen}>
        <PopoverTrigger asChild>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg hover:bg-background">
                <Image className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">{isAr ? "إدراج صورة" : "Insert Image"}</TooltipContent>
          </Tooltip>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3 space-y-2 rounded-xl" align="start">
          <p className="text-xs font-medium">{isAr ? "إدراج صورة" : "Insert Image"}</p>
          <Input
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            placeholder={isAr ? "رابط الصورة..." : "Image URL..."}
            className="rounded-lg text-xs h-8"
          />
          <Input
            value={imageAlt}
            onChange={e => setImageAlt(e.target.value)}
            placeholder={isAr ? "النص البديل (للسيو)..." : "Alt text (for SEO)..."}
            className="rounded-lg text-xs h-8"
          />
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 rounded-lg text-xs h-7" onClick={handleInsertImage} disabled={!imageUrl}>
              {isAr ? "إدراج" : "Insert"}
            </Button>
            <Button size="sm" variant="outline" className="rounded-lg text-xs h-7" onClick={() => setImageUrlOpen(false)}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
          </div>
          <p className="text-[9px] text-muted-foreground">
            💡 {isAr ? "استخدم نصاً بديلاً وصفياً لتحسين السيو" : "Use descriptive alt text for better SEO"}
          </p>
        </PopoverContent>
      </Popover>

      {/* Extra formatting dropdown */}
      <Popover open={extraOpen} onOpenChange={setExtraOpen}>
        <PopoverTrigger asChild>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="h-7 gap-0.5 px-1.5 rounded-lg hover:bg-background text-xs">
                <Code className="h-3.5 w-3.5" />
                <ChevronDown className="h-2.5 w-2.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">{isAr ? "أدوات إضافية" : "More tools"}</TooltipContent>
          </Tooltip>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-1 rounded-xl" align="start">
          {EXTRA_TOOLS.map((tool) => {
            if ("type" in tool) return null;
            const t = tool as ToolDef;
            return (
              <Button
                key={t.label}
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 h-8 rounded-lg text-xs"
                onClick={() => { onInsert(t.before, t.after || ""); setExtraOpen(false); }}
              >
                <t.icon className="h-3.5 w-3.5" />
                {isAr ? t.labelAr : t.label}
              </Button>
            );
          })}
        </PopoverContent>
      </Popover>

      <Separator orientation="vertical" className="mx-0.5 h-5" />

      {/* Section Templates */}
      <Popover open={sectionOpen} onOpenChange={setSectionOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="ghost" size="sm" className="h-7 gap-1 px-2 rounded-lg hover:bg-background text-xs">
            <LayoutTemplate className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isAr ? "أقسام" : "Sections"}</span>
            <ChevronDown className="h-2.5 w-2.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-1 rounded-xl max-h-80 overflow-y-auto" align="start">
          <p className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            {isAr ? "قوالب الأقسام" : "Section Templates"}
          </p>
          {SECTION_TEMPLATES.map((section) => (
            <Button
              key={section.label}
              type="button"
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 h-8 rounded-lg text-xs"
              onClick={() => handleInsertSection(isAr ? section.templateAr : section.template)}
            >
              <LayoutTemplate className="h-3 w-3 shrink-0 text-primary" />
              <span className="truncate">{isAr ? section.labelAr : section.label}</span>
            </Button>
          ))}
        </PopoverContent>
      </Popover>

      {/* Text Direction Controls */}
      {onDirectionChange && (
        <>
          <Separator orientation="vertical" className="mx-0.5 h-5" />
          <div className="flex gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant={currentDirection === "ltr" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 w-7 p-0 rounded-lg"
                  onClick={() => onDirectionChange("ltr")}
                >
                  <AlignLeft className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">LTR</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant={currentDirection === "rtl" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 w-7 p-0 rounded-lg"
                  onClick={() => onDirectionChange("rtl")}
                >
                  <AlignRight className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">RTL</TooltipContent>
            </Tooltip>
          </div>
        </>
      )}

      {/* Preview Toggle */}
      <div className="ms-auto">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={preview ? "default" : "ghost"}
              size="sm"
              className="h-7 gap-1.5 rounded-lg text-xs"
              onClick={onTogglePreview}
            >
              {preview ? <Edit3 className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {preview ? (isAr ? "تحرير" : "Edit") : (isAr ? "معاينة" : "Preview")}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {preview ? (isAr ? "العودة للتحرير" : "Switch to editor") : (isAr ? "معاينة المحتوى" : "Preview markdown")}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
});
