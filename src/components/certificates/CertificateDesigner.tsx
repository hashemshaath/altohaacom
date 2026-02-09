import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Save,
  Eye,
  Palette,
  Type,
  Image,
  Layout,
  Settings2,
  Plus,
  Trash2,
  Move,
  GripVertical,
  Award,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

interface LogoItem {
  id: string;
  name: string;
  url: string;
  position: "header" | "footer" | "left" | "right";
  size: number;
  order: number;
}

interface SignatureItem {
  id: string;
  name: string;
  nameAr: string;
  title: string;
  titleAr: string;
  organization: string;
  signatureUrl?: string;
}

interface CertificateDesign {
  // Layout
  orientation: "landscape" | "portrait";
  paperSize: "a4" | "letter" | "a3";
  padding: number;
  
  // Background & Border
  backgroundColor: string;
  backgroundPattern: "none" | "subtle" | "elegant" | "ornate";
  borderStyle: "none" | "simple" | "double" | "ornate" | "gold";
  borderColor: string;
  borderWidth: number;
  
  // Typography
  titleFont: string;
  bodyFont: string;
  titleColor: string;
  bodyColor: string;
  
  // Content
  titleText: string;
  titleTextAr: string;
  subtitleText: string;
  subtitleTextAr: string;
  bodyTemplate: string;
  bodyTemplateAr: string;
  
  // Logos
  logos: LogoItem[];
  showHeaderLogos: boolean;
  showFooterLogos: boolean;
  headerLogoSize: number;
  footerLogoSize: number;
  
  // Signatures
  signatures: SignatureItem[];
  signatureLineWidth: number;
  
  // Decorations
  showAwardIcon: boolean;
  awardIconColor: string;
  showWatermark: boolean;
  watermarkText: string;
}

const defaultDesign: CertificateDesign = {
  orientation: "landscape",
  paperSize: "a4",
  padding: 40,
  
  backgroundColor: "#ffffff",
  backgroundPattern: "elegant",
  borderStyle: "gold",
  borderColor: "#c9a227",
  borderWidth: 8,
  
  titleFont: "serif",
  bodyFont: "sans-serif",
  titleColor: "#1a1a1a",
  bodyColor: "#4a4a4a",
  
  titleText: "Certificate of Participation",
  titleTextAr: "شهادة مشاركة",
  subtitleText: "This is to certify that",
  subtitleTextAr: "نشهد بأن",
  bodyTemplate: "has successfully participated in {{event_name}} held at {{event_location}} on {{event_date}}",
  bodyTemplateAr: "قد شارك بنجاح في {{event_name}} المقام في {{event_location}} بتاريخ {{event_date}}",
  
  logos: [],
  showHeaderLogos: true,
  showFooterLogos: true,
  headerLogoSize: 80,
  footerLogoSize: 50,
  
  signatures: [
    {
      id: "1",
      name: "Yasser B. Jad",
      nameAr: "ياسر ب. جاد",
      title: "President",
      titleAr: "الرئيس",
      organization: "Saudi Arabian Chefs Association",
    },
  ],
  signatureLineWidth: 150,
  
  showAwardIcon: true,
  awardIconColor: "#c9a227",
  showWatermark: false,
  watermarkText: "CERTIFIED",
};

const professionalTemplates = [
  {
    id: "classic-gold",
    name: "Classic Gold",
    nameAr: "ذهبي كلاسيكي",
    design: {
      ...defaultDesign,
      borderStyle: "gold" as const,
      borderColor: "#c9a227",
      backgroundPattern: "elegant" as const,
      awardIconColor: "#c9a227",
    },
  },
  {
    id: "modern-emerald",
    name: "Modern Emerald",
    nameAr: "زمردي عصري",
    design: {
      ...defaultDesign,
      borderStyle: "double" as const,
      borderColor: "#10B981",
      backgroundPattern: "subtle" as const,
      awardIconColor: "#10B981",
      titleColor: "#065f46",
    },
  },
  {
    id: "royal-purple",
    name: "Royal Purple",
    nameAr: "أرجواني ملكي",
    design: {
      ...defaultDesign,
      borderStyle: "ornate" as const,
      borderColor: "#8B5CF6",
      backgroundPattern: "ornate" as const,
      awardIconColor: "#8B5CF6",
      titleColor: "#5b21b6",
    },
  },
  {
    id: "minimalist",
    name: "Minimalist",
    nameAr: "بسيط",
    design: {
      ...defaultDesign,
      borderStyle: "simple" as const,
      borderColor: "#374151",
      borderWidth: 2,
      backgroundPattern: "none" as const,
      showAwardIcon: false,
    },
  },
  {
    id: "executive",
    name: "Executive",
    nameAr: "تنفيذي",
    design: {
      ...defaultDesign,
      borderStyle: "double" as const,
      borderColor: "#1f2937",
      backgroundPattern: "subtle" as const,
      awardIconColor: "#1f2937",
      titleColor: "#111827",
    },
  },
];

interface CertificateDesignerProps {
  initialDesign?: Partial<CertificateDesign>;
  recipientName?: string;
  recipientNameAr?: string;
  eventName?: string;
  eventLocation?: string;
  eventDate?: string;
  onSave?: (design: CertificateDesign) => void;
}

export function CertificateDesigner({
  initialDesign,
  recipientName = "John Doe",
  recipientNameAr = "جون دو",
  eventName = "International Culinary Championship 2025",
  eventLocation = "Riyadh, Saudi Arabia",
  eventDate = "April 10, 2025",
  onSave,
}: CertificateDesignerProps) {
  const { language } = useLanguage();
  const [design, setDesign] = useState<CertificateDesign>({ ...defaultDesign, ...initialDesign });
  const [zoom, setZoom] = useState(70);
  const [activeTab, setActiveTab] = useState("templates");
  const [previewRecipient, setPreviewRecipient] = useState(recipientName);
  const [previewRecipientAr, setPreviewRecipientAr] = useState(recipientNameAr);

  const updateDesign = (updates: Partial<CertificateDesign>) => {
    setDesign(prev => ({ ...prev, ...updates }));
  };

  const applyTemplate = (templateId: string) => {
    const template = professionalTemplates.find(t => t.id === templateId);
    if (template) {
      setDesign({ ...design, ...template.design });
    }
  };

  const addLogo = (position: "header" | "footer") => {
    const newLogo: LogoItem = {
      id: Date.now().toString(),
      name: "New Logo",
      url: "",
      position,
      size: position === "header" ? design.headerLogoSize : design.footerLogoSize,
      order: design.logos.filter(l => l.position === position).length,
    };
    updateDesign({ logos: [...design.logos, newLogo] });
  };

  const updateLogo = (id: string, updates: Partial<LogoItem>) => {
    updateDesign({
      logos: design.logos.map(l => l.id === id ? { ...l, ...updates } : l),
    });
  };

  const removeLogo = (id: string) => {
    updateDesign({ logos: design.logos.filter(l => l.id !== id) });
  };

  const moveLogo = (id: string, direction: "up" | "down") => {
    const logo = design.logos.find(l => l.id === id);
    if (!logo) return;
    
    const samePosLogos = design.logos.filter(l => l.position === logo.position);
    const currentIndex = samePosLogos.findIndex(l => l.id === id);
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= samePosLogos.length) return;
    
    const newLogos = design.logos.map(l => {
      if (l.id === id) return { ...l, order: newIndex };
      if (l.position === logo.position && l.order === newIndex) return { ...l, order: currentIndex };
      return l;
    });
    
    updateDesign({ logos: newLogos });
  };

  const addSignature = () => {
    const newSig: SignatureItem = {
      id: Date.now().toString(),
      name: "",
      nameAr: "",
      title: "",
      titleAr: "",
      organization: "",
    };
    updateDesign({ signatures: [...design.signatures, newSig] });
  };

  const updateSignature = (id: string, updates: Partial<SignatureItem>) => {
    updateDesign({
      signatures: design.signatures.map(s => s.id === id ? { ...s, ...updates } : s),
    });
  };

  const removeSignature = (id: string) => {
    updateDesign({ signatures: design.signatures.filter(s => s.id !== id) });
  };

  // Calculate preview dimensions
  const getPreviewDimensions = () => {
    const baseWidth = design.orientation === "landscape" ? 297 : 210;
    const baseHeight = design.orientation === "landscape" ? 210 : 297;
    const scale = zoom / 100;
    return {
      width: baseWidth * 2.5 * scale,
      height: baseHeight * 2.5 * scale,
    };
  };

  const { width: previewWidth, height: previewHeight } = getPreviewDimensions();

  // Replace template variables
  const replaceVariables = (text: string) => {
    return text
      .replace(/\{\{recipient_name\}\}/g, previewRecipient)
      .replace(/\{\{event_name\}\}/g, eventName)
      .replace(/\{\{event_location\}\}/g, eventLocation)
      .replace(/\{\{event_date\}\}/g, eventDate);
  };

  const getBorderClass = () => {
    switch (design.borderStyle) {
      case "simple": return "border-solid";
      case "double": return "border-double";
      case "ornate": return "border-solid shadow-lg";
      case "gold": return "border-solid shadow-xl";
      default: return "border-none";
    }
  };

  const getBackgroundPattern = () => {
    switch (design.backgroundPattern) {
      case "subtle":
        return "bg-gradient-to-br from-transparent via-muted/5 to-transparent";
      case "elegant":
        return "bg-gradient-to-br from-muted/10 via-transparent to-muted/10";
      case "ornate":
        return "bg-gradient-to-br from-muted/20 via-transparent to-muted/20 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.02)_100%)]";
      default:
        return "";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Settings Panel */}
      <div className="lg:col-span-1 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              {language === "ar" ? "إعدادات التصميم" : "Design Settings"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full grid grid-cols-5 rounded-none border-b">
                <TabsTrigger value="templates" className="text-xs">
                  <Layout className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="style" className="text-xs">
                  <Palette className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="content" className="text-xs">
                  <Type className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="logos" className="text-xs">
                  <Image className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="signatures" className="text-xs">
                  <Award className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[500px]">
                {/* Templates Tab */}
                <TabsContent value="templates" className="p-4 space-y-4 mt-0">
                  <div>
                    <Label className="text-sm font-medium mb-3 block">
                      {language === "ar" ? "القوالب الاحترافية" : "Professional Templates"}
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      {professionalTemplates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => applyTemplate(template.id)}
                          className="p-3 border rounded-lg hover:border-primary transition-colors text-left"
                        >
                          <div 
                            className="h-12 rounded mb-2 border-2"
                            style={{ 
                              borderColor: template.design.borderColor,
                              background: template.design.backgroundColor,
                            }}
                          />
                          <p className="text-xs font-medium">
                            {language === "ar" ? template.nameAr : template.name}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label>{language === "ar" ? "حجم الورق" : "Paper Size"}</Label>
                    <Select
                      value={design.paperSize}
                      onValueChange={(v) => updateDesign({ paperSize: v as "a4" | "letter" | "a3" })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="a4">A4 (210 × 297 mm)</SelectItem>
                        <SelectItem value="letter">Letter (8.5 × 11 in)</SelectItem>
                        <SelectItem value="a3">A3 (297 × 420 mm)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>{language === "ar" ? "الاتجاه" : "Orientation"}</Label>
                    <Select
                      value={design.orientation}
                      onValueChange={(v) => updateDesign({ orientation: v as "landscape" | "portrait" })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="landscape">{language === "ar" ? "أفقي" : "Landscape"}</SelectItem>
                        <SelectItem value="portrait">{language === "ar" ? "عمودي" : "Portrait"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>{language === "ar" ? "الهوامش" : "Padding"}: {design.padding}px</Label>
                    <Slider
                      value={[design.padding]}
                      onValueChange={([v]) => updateDesign({ padding: v })}
                      min={20}
                      max={80}
                      step={5}
                    />
                  </div>
                </TabsContent>

                {/* Style Tab */}
                <TabsContent value="style" className="p-4 space-y-4 mt-0">
                  <div className="space-y-3">
                    <Label>{language === "ar" ? "لون الخلفية" : "Background Color"}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={design.backgroundColor}
                        onChange={(e) => updateDesign({ backgroundColor: e.target.value })}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={design.backgroundColor}
                        onChange={(e) => updateDesign({ backgroundColor: e.target.value })}
                        className="font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>{language === "ar" ? "نمط الخلفية" : "Background Pattern"}</Label>
                    <Select
                      value={design.backgroundPattern}
                      onValueChange={(v) => updateDesign({ backgroundPattern: v as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{language === "ar" ? "بدون" : "None"}</SelectItem>
                        <SelectItem value="subtle">{language === "ar" ? "خفيف" : "Subtle"}</SelectItem>
                        <SelectItem value="elegant">{language === "ar" ? "أنيق" : "Elegant"}</SelectItem>
                        <SelectItem value="ornate">{language === "ar" ? "مزخرف" : "Ornate"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label>{language === "ar" ? "نمط الإطار" : "Border Style"}</Label>
                    <Select
                      value={design.borderStyle}
                      onValueChange={(v) => updateDesign({ borderStyle: v as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{language === "ar" ? "بدون" : "None"}</SelectItem>
                        <SelectItem value="simple">{language === "ar" ? "بسيط" : "Simple"}</SelectItem>
                        <SelectItem value="double">{language === "ar" ? "مزدوج" : "Double"}</SelectItem>
                        <SelectItem value="ornate">{language === "ar" ? "مزخرف" : "Ornate"}</SelectItem>
                        <SelectItem value="gold">{language === "ar" ? "ذهبي" : "Gold"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>{language === "ar" ? "لون الإطار" : "Border Color"}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={design.borderColor}
                        onChange={(e) => updateDesign({ borderColor: e.target.value })}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={design.borderColor}
                        onChange={(e) => updateDesign({ borderColor: e.target.value })}
                        className="font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>{language === "ar" ? "سمك الإطار" : "Border Width"}: {design.borderWidth}px</Label>
                    <Slider
                      value={[design.borderWidth]}
                      onValueChange={([v]) => updateDesign({ borderWidth: v })}
                      min={1}
                      max={20}
                      step={1}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label>{language === "ar" ? "لون العنوان" : "Title Color"}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={design.titleColor}
                        onChange={(e) => updateDesign({ titleColor: e.target.value })}
                        className="w-12 h-10 p-1"
                      />
                      <Input
                        value={design.titleColor}
                        onChange={(e) => updateDesign({ titleColor: e.target.value })}
                        className="font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>{language === "ar" ? "إظهار أيقونة الجائزة" : "Show Award Icon"}</Label>
                    <Switch
                      checked={design.showAwardIcon}
                      onCheckedChange={(v) => updateDesign({ showAwardIcon: v })}
                    />
                  </div>

                  {design.showAwardIcon && (
                    <div className="space-y-3">
                      <Label>{language === "ar" ? "لون الأيقونة" : "Icon Color"}</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={design.awardIconColor}
                          onChange={(e) => updateDesign({ awardIconColor: e.target.value })}
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          value={design.awardIconColor}
                          onChange={(e) => updateDesign({ awardIconColor: e.target.value })}
                          className="font-mono"
                        />
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Content Tab */}
                <TabsContent value="content" className="p-4 space-y-4 mt-0">
                  <div className="space-y-3">
                    <Label>{language === "ar" ? "اسم المستلم (للمعاينة)" : "Recipient Name (Preview)"}</Label>
                    <Input
                      value={previewRecipient}
                      onChange={(e) => setPreviewRecipient(e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>{language === "ar" ? "اسم المستلم بالعربي" : "Recipient Name (Arabic)"}</Label>
                    <Input
                      value={previewRecipientAr}
                      onChange={(e) => setPreviewRecipientAr(e.target.value)}
                      placeholder="جون دو"
                      dir="rtl"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label>{language === "ar" ? "عنوان الشهادة (إنجليزي)" : "Certificate Title (English)"}</Label>
                    <Input
                      value={design.titleText}
                      onChange={(e) => updateDesign({ titleText: e.target.value })}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>{language === "ar" ? "عنوان الشهادة (عربي)" : "Certificate Title (Arabic)"}</Label>
                    <Input
                      value={design.titleTextAr}
                      onChange={(e) => updateDesign({ titleTextAr: e.target.value })}
                      dir="rtl"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>{language === "ar" ? "العنوان الفرعي (إنجليزي)" : "Subtitle (English)"}</Label>
                    <Input
                      value={design.subtitleText}
                      onChange={(e) => updateDesign({ subtitleText: e.target.value })}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>{language === "ar" ? "العنوان الفرعي (عربي)" : "Subtitle (Arabic)"}</Label>
                    <Input
                      value={design.subtitleTextAr}
                      onChange={(e) => updateDesign({ subtitleTextAr: e.target.value })}
                      dir="rtl"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>{language === "ar" ? "نص الشهادة (إنجليزي)" : "Body Text (English)"}</Label>
                    <Textarea
                      value={design.bodyTemplate}
                      onChange={(e) => updateDesign({ bodyTemplate: e.target.value })}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      Variables: {"{{recipient_name}}, {{event_name}}, {{event_location}}, {{event_date}}"}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label>{language === "ar" ? "نص الشهادة (عربي)" : "Body Text (Arabic)"}</Label>
                    <Textarea
                      value={design.bodyTemplateAr}
                      onChange={(e) => updateDesign({ bodyTemplateAr: e.target.value })}
                      rows={3}
                      dir="rtl"
                    />
                  </div>
                </TabsContent>

                {/* Logos Tab */}
                <TabsContent value="logos" className="p-4 space-y-4 mt-0">
                  <div className="flex items-center justify-between">
                    <Label>{language === "ar" ? "إظهار شعارات الرأس" : "Show Header Logos"}</Label>
                    <Switch
                      checked={design.showHeaderLogos}
                      onCheckedChange={(v) => updateDesign({ showHeaderLogos: v })}
                    />
                  </div>

                  {design.showHeaderLogos && (
                    <>
                      <div className="space-y-3">
                        <Label>{language === "ar" ? "حجم شعارات الرأس" : "Header Logo Size"}: {design.headerLogoSize}px</Label>
                        <Slider
                          value={[design.headerLogoSize]}
                          onValueChange={([v]) => updateDesign({ headerLogoSize: v })}
                          min={40}
                          max={150}
                          step={5}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">{language === "ar" ? "شعارات الرأس" : "Header Logos"}</Label>
                          <Button variant="outline" size="sm" onClick={() => addLogo("header")}>
                            <Plus className="h-3 w-3 mr-1" />
                            {language === "ar" ? "إضافة" : "Add"}
                          </Button>
                        </div>
                        {design.logos.filter(l => l.position === "header").sort((a, b) => a.order - b.order).map((logo) => (
                          <div key={logo.id} className="flex items-center gap-2 p-2 border rounded">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder={language === "ar" ? "رابط الشعار" : "Logo URL"}
                              value={logo.url}
                              onChange={(e) => updateLogo(logo.id, { url: e.target.value })}
                              className="flex-1 text-xs"
                            />
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveLogo(logo.id, "up")}>
                                <ChevronUp className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveLogo(logo.id, "down")}>
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeLogo(logo.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <Separator />

                  <div className="flex items-center justify-between">
                    <Label>{language === "ar" ? "إظهار شعارات التذييل" : "Show Footer Logos"}</Label>
                    <Switch
                      checked={design.showFooterLogos}
                      onCheckedChange={(v) => updateDesign({ showFooterLogos: v })}
                    />
                  </div>

                  {design.showFooterLogos && (
                    <>
                      <div className="space-y-3">
                        <Label>{language === "ar" ? "حجم شعارات التذييل" : "Footer Logo Size"}: {design.footerLogoSize}px</Label>
                        <Slider
                          value={[design.footerLogoSize]}
                          onValueChange={([v]) => updateDesign({ footerLogoSize: v })}
                          min={30}
                          max={100}
                          step={5}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">{language === "ar" ? "شعارات التذييل" : "Footer Logos"}</Label>
                          <Button variant="outline" size="sm" onClick={() => addLogo("footer")}>
                            <Plus className="h-3 w-3 mr-1" />
                            {language === "ar" ? "إضافة" : "Add"}
                          </Button>
                        </div>
                        {design.logos.filter(l => l.position === "footer").sort((a, b) => a.order - b.order).map((logo) => (
                          <div key={logo.id} className="flex items-center gap-2 p-2 border rounded">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder={language === "ar" ? "رابط الشعار" : "Logo URL"}
                              value={logo.url}
                              onChange={(e) => updateLogo(logo.id, { url: e.target.value })}
                              className="flex-1 text-xs"
                            />
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveLogo(logo.id, "up")}>
                                <ChevronUp className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveLogo(logo.id, "down")}>
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeLogo(logo.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <Separator />

                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">
                      {language === "ar" ? "شعارات مقترحة:" : "Suggested logos:"}
                    </p>
                    <div className="space-y-1 text-xs">
                      <p>• {language === "ar" ? "شعار المسابقة" : "Competition Logo"}</p>
                      <p>• {language === "ar" ? "جمعية الطهاة السعودية" : "Saudi Chefs Association"}</p>
                      <p>• {language === "ar" ? "اتحاد الطهاة العالمي" : "World Chefs Association"}</p>
                      <p>• {language === "ar" ? "شعارات الرعاة" : "Sponsor Logos"}</p>
                    </div>
                  </div>
                </TabsContent>

                {/* Signatures Tab */}
                <TabsContent value="signatures" className="p-4 space-y-4 mt-0">
                  <div className="flex items-center justify-between">
                    <Label>{language === "ar" ? "التوقيعات" : "Signatures"}</Label>
                    <Button variant="outline" size="sm" onClick={addSignature}>
                      <Plus className="h-3 w-3 mr-1" />
                      {language === "ar" ? "إضافة" : "Add"}
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <Label>{language === "ar" ? "عرض خط التوقيع" : "Signature Line Width"}: {design.signatureLineWidth}px</Label>
                    <Slider
                      value={[design.signatureLineWidth]}
                      onValueChange={([v]) => updateDesign({ signatureLineWidth: v })}
                      min={100}
                      max={250}
                      step={10}
                    />
                  </div>

                  {design.signatures.map((sig) => (
                    <Card key={sig.id}>
                      <CardContent className="p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{language === "ar" ? "توقيع" : "Signature"}</Badge>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeSignature(sig.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder={language === "ar" ? "الاسم (إنجليزي)" : "Name (EN)"}
                            value={sig.name}
                            onChange={(e) => updateSignature(sig.id, { name: e.target.value })}
                            className="text-xs"
                          />
                          <Input
                            placeholder={language === "ar" ? "الاسم (عربي)" : "Name (AR)"}
                            value={sig.nameAr}
                            onChange={(e) => updateSignature(sig.id, { nameAr: e.target.value })}
                            className="text-xs"
                            dir="rtl"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder={language === "ar" ? "المنصب (إنجليزي)" : "Title (EN)"}
                            value={sig.title}
                            onChange={(e) => updateSignature(sig.id, { title: e.target.value })}
                            className="text-xs"
                          />
                          <Input
                            placeholder={language === "ar" ? "المنصب (عربي)" : "Title (AR)"}
                            value={sig.titleAr}
                            onChange={(e) => updateSignature(sig.id, { titleAr: e.target.value })}
                            className="text-xs"
                            dir="rtl"
                          />
                        </div>
                        <Input
                          placeholder={language === "ar" ? "المنظمة" : "Organization"}
                          value={sig.organization}
                          onChange={(e) => updateSignature(sig.id, { organization: e.target.value })}
                          className="text-xs"
                        />
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button className="w-full" onClick={() => onSave?.(design)}>
          <Save className="h-4 w-4 mr-2" />
          {language === "ar" ? "حفظ التصميم" : "Save Design"}
        </Button>
      </div>

      {/* Preview Panel */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-5 w-5" />
                {language === "ar" ? "معاينة الشهادة" : "Certificate Preview"}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => setZoom(Math.max(30, zoom - 10))}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm font-mono w-12 text-center">{zoom}%</span>
                <Button variant="outline" size="icon" onClick={() => setZoom(Math.min(100, zoom + 10))}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setZoom(70)}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {design.paperSize.toUpperCase()} • {design.orientation === "landscape" ? (language === "ar" ? "أفقي" : "Landscape") : (language === "ar" ? "عمودي" : "Portrait")}
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto bg-muted/50 rounded-lg p-8 flex items-center justify-center min-h-[600px]">
              {/* Certificate Preview */}
              <div
                className={`relative ${getBorderClass()} ${getBackgroundPattern()} transition-all duration-300`}
                style={{
                  width: previewWidth,
                  height: previewHeight,
                  backgroundColor: design.backgroundColor,
                  borderColor: design.borderStyle !== "none" ? design.borderColor : "transparent",
                  borderWidth: design.borderStyle !== "none" ? design.borderWidth : 0,
                  padding: design.padding * (zoom / 100),
                  boxShadow: design.borderStyle === "gold" ? `0 0 20px ${design.borderColor}40, inset 0 0 60px ${design.borderColor}10` : undefined,
                }}
              >
                {/* Inner border for ornate/gold styles */}
                {(design.borderStyle === "ornate" || design.borderStyle === "gold") && (
                  <div
                    className="absolute inset-2 border-2 pointer-events-none"
                    style={{ borderColor: `${design.borderColor}60` }}
                  />
                )}

                <div className="flex flex-col h-full">
                  {/* Header Logos */}
                  {design.showHeaderLogos && (
                    <div className="flex justify-center items-center gap-4 mb-4" style={{ minHeight: design.headerLogoSize * (zoom / 100) }}>
                      {design.logos.filter(l => l.position === "header").sort((a, b) => a.order - b.order).length > 0 ? (
                        design.logos.filter(l => l.position === "header").sort((a, b) => a.order - b.order).map((logo) => (
                          <div 
                            key={logo.id}
                            className="bg-muted/50 rounded flex items-center justify-center"
                            style={{ 
                              width: design.headerLogoSize * (zoom / 100), 
                              height: design.headerLogoSize * (zoom / 100) 
                            }}
                          >
                            {logo.url ? (
                              <img src={logo.url} alt="" className="max-w-full max-h-full object-contain" />
                            ) : (
                              <Image className="text-muted-foreground" style={{ width: "40%", height: "40%" }} />
                            )}
                          </div>
                        ))
                      ) : (
                        <>
                          <div 
                            className="bg-muted/50 rounded flex items-center justify-center"
                            style={{ 
                              width: design.headerLogoSize * (zoom / 100), 
                              height: design.headerLogoSize * (zoom / 100) 
                            }}
                          >
                            <Image className="text-muted-foreground" style={{ width: "40%", height: "40%" }} />
                          </div>
                          <div 
                            className="bg-muted/50 rounded flex items-center justify-center"
                            style={{ 
                              width: design.headerLogoSize * (zoom / 100), 
                              height: design.headerLogoSize * (zoom / 100) 
                            }}
                          >
                            <Image className="text-muted-foreground" style={{ width: "40%", height: "40%" }} />
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Award Icon */}
                  {design.showAwardIcon && (
                    <div className="flex justify-center mb-2">
                      <Award 
                        style={{ 
                          color: design.awardIconColor,
                          width: 40 * (zoom / 100),
                          height: 40 * (zoom / 100),
                        }} 
                      />
                    </div>
                  )}

                  {/* Title */}
                  <div className="text-center mb-2">
                    <h1
                      className="font-serif font-bold tracking-wide"
                      style={{
                        color: design.titleColor,
                        fontSize: 24 * (zoom / 100),
                      }}
                    >
                      {design.titleText}
                    </h1>
                    {design.titleTextAr && (
                      <h2
                        className="font-serif font-bold mt-1"
                        style={{
                          color: design.titleColor,
                          fontSize: 20 * (zoom / 100),
                        }}
                        dir="rtl"
                      >
                        {design.titleTextAr}
                      </h2>
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex-1 flex flex-col justify-center text-center px-4">
                    <p
                      className="mb-2"
                      style={{
                        color: design.bodyColor,
                        fontSize: 12 * (zoom / 100),
                      }}
                    >
                      {design.subtitleText}
                    </p>
                    
                    <p
                      className="font-bold mb-1"
                      style={{
                        color: design.titleColor,
                        fontSize: 28 * (zoom / 100),
                      }}
                    >
                      {previewRecipient}
                    </p>
                    
                    {previewRecipientAr && (
                      <p
                        className="font-bold mb-3"
                        style={{
                          color: design.titleColor,
                          fontSize: 22 * (zoom / 100),
                        }}
                        dir="rtl"
                      >
                        {previewRecipientAr}
                      </p>
                    )}
                    
                    <p
                      className="max-w-lg mx-auto"
                      style={{
                        color: design.bodyColor,
                        fontSize: 11 * (zoom / 100),
                        lineHeight: 1.5,
                      }}
                    >
                      {replaceVariables(design.bodyTemplate)}
                    </p>
                  </div>

                  {/* Signatures */}
                  <div className="flex justify-center gap-8 mt-4">
                    {design.signatures.map((sig) => (
                      <div key={sig.id} className="text-center">
                        <div 
                          className="mb-2 flex items-end justify-center"
                          style={{ height: 30 * (zoom / 100) }}
                        >
                          {/* Signature placeholder */}
                        </div>
                        <div 
                          className="border-t mx-auto" 
                          style={{ 
                            width: design.signatureLineWidth * (zoom / 100),
                            borderColor: design.bodyColor,
                          }} 
                        />
                        <p 
                          className="font-bold mt-1"
                          style={{ 
                            fontSize: 10 * (zoom / 100),
                            color: design.titleColor,
                          }}
                        >
                          {sig.name}
                        </p>
                        <p 
                          style={{ 
                            fontSize: 9 * (zoom / 100),
                            color: design.bodyColor,
                          }}
                        >
                          {sig.title}
                        </p>
                        {sig.organization && (
                          <p 
                            style={{ 
                              fontSize: 8 * (zoom / 100),
                              color: design.bodyColor,
                            }}
                          >
                            {sig.organization}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Footer Logos */}
                  {design.showFooterLogos && (
                    <div className="flex justify-center items-center gap-3 mt-4" style={{ minHeight: design.footerLogoSize * (zoom / 100) }}>
                      {design.logos.filter(l => l.position === "footer").sort((a, b) => a.order - b.order).length > 0 ? (
                        design.logos.filter(l => l.position === "footer").sort((a, b) => a.order - b.order).map((logo) => (
                          <div 
                            key={logo.id}
                            className="bg-muted/30 rounded flex items-center justify-center"
                            style={{ 
                              width: design.footerLogoSize * (zoom / 100), 
                              height: design.footerLogoSize * (zoom / 100) 
                            }}
                          >
                            {logo.url ? (
                              <img src={logo.url} alt="" className="max-w-full max-h-full object-contain" />
                            ) : (
                              <Image className="text-muted-foreground" style={{ width: "40%", height: "40%" }} />
                            )}
                          </div>
                        ))
                      ) : (
                        <>
                          {[1, 2, 3, 4].map((i) => (
                            <div 
                              key={i}
                              className="bg-muted/30 rounded flex items-center justify-center"
                              style={{ 
                                width: design.footerLogoSize * (zoom / 100), 
                                height: design.footerLogoSize * (zoom / 100) 
                              }}
                            >
                              <Image className="text-muted-foreground" style={{ width: "40%", height: "40%" }} />
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
