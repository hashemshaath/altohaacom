import { useState } from "react";
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
  ZoomIn, ZoomOut, RotateCcw, Save, Eye, Palette, Type, Image,
  Layout, Settings2, Plus, Trash2, GripVertical, Award, ChevronUp,
  ChevronDown, AlignLeft, AlignCenter, AlignRight, Printer, Download,
} from "lucide-react";

// ───────── Types ─────────
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

export interface CertificateDesign {
  // Layout
  orientation: "landscape" | "portrait";
  paperSize: "a4" | "letter" | "a3";
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  innerPadding: number;

  // Background & Border
  backgroundColor: string;
  backgroundImage: string;
  backgroundPattern: "none" | "subtle" | "elegant" | "ornate" | "damask" | "geometric";
  borderStyle: "none" | "simple" | "double" | "ornate" | "gold" | "classic" | "modern";
  borderColor: string;
  borderWidth: number;
  innerBorderWidth: number;
  cornerOrnament: boolean;

  // Typography
  titleFont: string;
  bodyFont: string;
  recipientFont: string;
  titleSize: number;
  recipientSize: number;
  bodySize: number;
  titleColor: string;
  bodyColor: string;
  recipientColor: string;
  titleAlignment: "left" | "center" | "right";
  bodyAlignment: "left" | "center" | "right";

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
  signatureLineColor: string;

  // Decorations
  showAwardIcon: boolean;
  awardIconColor: string;
  awardIconSize: number;
  showWatermark: boolean;
  watermarkText: string;
  watermarkOpacity: number;
  showVerificationCode: boolean;
  showCertificateNumber: boolean;
}

const fontOptions = [
  { value: "serif", label: "Serif (Times New Roman)" },
  { value: "'Georgia', serif", label: "Georgia" },
  { value: "'Playfair Display', serif", label: "Playfair Display" },
  { value: "sans-serif", label: "Sans-serif (Arial)" },
  { value: "'Segoe UI', sans-serif", label: "Segoe UI" },
  { value: "'Helvetica Neue', sans-serif", label: "Helvetica" },
  { value: "cursive", label: "Cursive" },
  { value: "'Amiri', serif", label: "Amiri (Arabic)" },
  { value: "'Cairo', sans-serif", label: "Cairo (Arabic)" },
  { value: "'Tajawal', sans-serif", label: "Tajawal (Arabic)" },
];

const defaultDesign: CertificateDesign = {
  orientation: "landscape",
  paperSize: "a4",
  marginTop: 24,
  marginBottom: 20,
  marginLeft: 28,
  marginRight: 28,
  innerPadding: 16,

  backgroundColor: "#ffffff",
  backgroundImage: "",
  backgroundPattern: "elegant",
  borderStyle: "gold",
  borderColor: "#c9a227",
  borderWidth: 6,
  innerBorderWidth: 1,
  cornerOrnament: true,

  titleFont: "'Georgia', serif",
  bodyFont: "'Segoe UI', sans-serif",
  recipientFont: "'Playfair Display', serif",
  titleSize: 28,
  recipientSize: 32,
  bodySize: 13,
  titleColor: "#1a1a1a",
  bodyColor: "#4a4a4a",
  recipientColor: "#1a1a1a",
  titleAlignment: "center",
  bodyAlignment: "center",

  titleText: "Certificate of Achievement",
  titleTextAr: "شهادة تقدير",
  subtitleText: "This is to certify that",
  subtitleTextAr: "نشهد بأن",
  bodyTemplate: "has successfully participated in {{event_name}} held at {{event_location}} on {{event_date}}",
  bodyTemplateAr: "قد شارك بنجاح في {{event_name}} المقام في {{event_location}} بتاريخ {{event_date}}",

  logos: [],
  showHeaderLogos: true,
  showFooterLogos: true,
  headerLogoSize: 70,
  footerLogoSize: 45,

  signatures: [
    {
      id: "1",
      name: "Competition President",
      nameAr: "رئيس المسابقة",
      title: "President",
      titleAr: "الرئيس",
      organization: "",
    },
  ],
  signatureLineWidth: 140,
  signatureLineColor: "#9ca3af",

  showAwardIcon: true,
  awardIconColor: "#c9a227",
  awardIconSize: 44,
  showWatermark: false,
  watermarkText: "CERTIFIED",
  watermarkOpacity: 5,
  showVerificationCode: true,
  showCertificateNumber: true,
};

const professionalTemplates = [
  {
    id: "classic-gold",
    name: "Classic Gold",
    nameAr: "ذهبي كلاسيكي",
    preview: "#c9a227",
    design: { ...defaultDesign },
  },
  {
    id: "modern-emerald",
    name: "Modern Emerald",
    nameAr: "زمردي عصري",
    preview: "#10B981",
    design: {
      ...defaultDesign,
      borderStyle: "modern" as const,
      borderColor: "#10B981",
      backgroundPattern: "subtle" as const,
      awardIconColor: "#10B981",
      titleColor: "#065f46",
      recipientColor: "#065f46",
      cornerOrnament: false,
    },
  },
  {
    id: "royal-purple",
    name: "Royal Purple",
    nameAr: "أرجواني ملكي",
    preview: "#8B5CF6",
    design: {
      ...defaultDesign,
      borderStyle: "classic" as const,
      borderColor: "#8B5CF6",
      backgroundPattern: "damask" as const,
      awardIconColor: "#8B5CF6",
      titleColor: "#5b21b6",
      recipientColor: "#5b21b6",
    },
  },
  {
    id: "executive",
    name: "Executive",
    nameAr: "تنفيذي",
    preview: "#1f2937",
    design: {
      ...defaultDesign,
      borderStyle: "double" as const,
      borderColor: "#1f2937",
      backgroundPattern: "geometric" as const,
      awardIconColor: "#374151",
      titleColor: "#111827",
      recipientColor: "#111827",
      cornerOrnament: false,
    },
  },
  {
    id: "minimalist",
    name: "Minimalist",
    nameAr: "بسيط",
    preview: "#6b7280",
    design: {
      ...defaultDesign,
      borderStyle: "simple" as const,
      borderColor: "#d1d5db",
      borderWidth: 2,
      innerBorderWidth: 0,
      backgroundPattern: "none" as const,
      showAwardIcon: false,
      cornerOrnament: false,
    },
  },
  {
    id: "navy-formal",
    name: "Navy Formal",
    nameAr: "كحلي رسمي",
    preview: "#1e3a5f",
    design: {
      ...defaultDesign,
      borderStyle: "classic" as const,
      borderColor: "#1e3a5f",
      awardIconColor: "#c9a227",
      titleColor: "#1e3a5f",
      recipientColor: "#1e3a5f",
      backgroundPattern: "subtle" as const,
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
  certificateNumber?: string;
  verificationCode?: string;
  achievement?: string;
  onSave?: (design: CertificateDesign) => void;
  onPrint?: () => void;
}

export function CertificateDesigner({
  initialDesign,
  recipientName = "John Doe",
  recipientNameAr = "جون دو",
  eventName = "International Culinary Championship 2026",
  eventLocation = "Riyadh, Saudi Arabia",
  eventDate = "April 10, 2026",
  certificateNumber = "CERT-2026-001",
  verificationCode = "A1B2C3D4",
  achievement,
  onSave,
  onPrint,
}: CertificateDesignerProps) {
  const { language } = useLanguage();
  const [design, setDesign] = useState<CertificateDesign>({ ...defaultDesign, ...initialDesign });
  const [zoom, setZoom] = useState(65);
  const [activeTab, setActiveTab] = useState("templates");
  const [previewRecipient, setPreviewRecipient] = useState(recipientName);
  const [previewRecipientAr, setPreviewRecipientAr] = useState(recipientNameAr);

  const updateDesign = (updates: Partial<CertificateDesign>) => {
    setDesign(prev => ({ ...prev, ...updates }));
  };

  const applyTemplate = (templateId: string) => {
    const template = professionalTemplates.find(t => t.id === templateId);
    if (template) setDesign({ ...design, ...template.design });
  };

  // Logo helpers
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
    updateDesign({ logos: design.logos.map(l => l.id === id ? { ...l, ...updates } : l) });
  };
  const removeLogo = (id: string) => {
    updateDesign({ logos: design.logos.filter(l => l.id !== id) });
  };
  const moveLogo = (id: string, direction: "up" | "down") => {
    const logo = design.logos.find(l => l.id === id);
    if (!logo) return;
    const samePosLogos = design.logos.filter(l => l.position === logo.position).sort((a, b) => a.order - b.order);
    const ci = samePosLogos.findIndex(l => l.id === id);
    const ni = direction === "up" ? ci - 1 : ci + 1;
    if (ni < 0 || ni >= samePosLogos.length) return;
    const newLogos = design.logos.map(l => {
      if (l.id === id) return { ...l, order: ni };
      if (l.id === samePosLogos[ni].id) return { ...l, order: ci };
      return l;
    });
    updateDesign({ logos: newLogos });
  };

  // Signature helpers
  const addSignature = () => {
    updateDesign({
      signatures: [...design.signatures, {
        id: Date.now().toString(), name: "", nameAr: "", title: "", titleAr: "", organization: "",
      }],
    });
  };
  const updateSignature = (id: string, updates: Partial<SignatureItem>) => {
    updateDesign({ signatures: design.signatures.map(s => s.id === id ? { ...s, ...updates } : s) });
  };
  const removeSignature = (id: string) => {
    updateDesign({ signatures: design.signatures.filter(s => s.id !== id) });
  };

  // Preview dimensions – A4 is 210×297mm. We use mm→px at ~3px/mm
  const getDimensions = () => {
    const sizes: Record<string, [number, number]> = { a4: [210, 297], letter: [216, 279], a3: [297, 420] };
    const [w, h] = sizes[design.paperSize] || sizes.a4;
    const baseW = design.orientation === "landscape" ? h : w;
    const baseH = design.orientation === "landscape" ? w : h;
    const scale = zoom / 100;
    return { width: baseW * 2.6 * scale, height: baseH * 2.6 * scale };
  };
  const { width: pw, height: ph } = getDimensions();

  const replaceVars = (text: string) =>
    text
      .replace(/\{\{recipient_name\}\}/g, previewRecipient)
      .replace(/\{\{event_name\}\}/g, eventName)
      .replace(/\{\{event_location\}\}/g, eventLocation)
      .replace(/\{\{event_date\}\}/g, eventDate)
      .replace(/\{\{achievement\}\}/g, achievement || "")
      .replace(/\{\{certificate_number\}\}/g, certificateNumber)
      .replace(/\{\{verification_code\}\}/g, verificationCode);

  const s = (px: number) => px * (zoom / 100); // scale helper

  const getBgPattern = () => {
    switch (design.backgroundPattern) {
      case "subtle": return "background-image: radial-gradient(circle at 20% 50%, rgba(0,0,0,0.02) 0%, transparent 50%)";
      case "elegant": return "background-image: linear-gradient(135deg, rgba(0,0,0,0.015) 25%, transparent 25%, transparent 50%, rgba(0,0,0,0.015) 50%, rgba(0,0,0,0.015) 75%, transparent 75%); background-size: 60px 60px;";
      case "ornate": return "background-image: radial-gradient(circle, rgba(0,0,0,0.03) 1px, transparent 1px); background-size: 20px 20px;";
      case "damask": return "background-image: radial-gradient(ellipse at center, rgba(0,0,0,0.02) 0%, transparent 70%); background-size: 40px 40px;";
      case "geometric": return "background-image: linear-gradient(30deg, rgba(0,0,0,0.015) 12%, transparent 12.5%, transparent 87%, rgba(0,0,0,0.015) 87.5%); background-size: 40px 40px;";
      default: return "";
    }
  };

  const getOuterBorder = () => {
    switch (design.borderStyle) {
      case "simple": return { border: `${design.borderWidth}px solid ${design.borderColor}` };
      case "double": return { border: `${design.borderWidth}px double ${design.borderColor}` };
      case "ornate": return { border: `${design.borderWidth}px solid ${design.borderColor}`, boxShadow: `inset 0 0 0 ${design.borderWidth + 2}px ${design.backgroundColor}, inset 0 0 0 ${design.borderWidth + 4}px ${design.borderColor}80` };
      case "gold": return { border: `${design.borderWidth}px solid ${design.borderColor}`, boxShadow: `0 0 15px ${design.borderColor}30, inset 0 0 0 ${design.borderWidth + 3}px ${design.backgroundColor}, inset 0 0 0 ${design.borderWidth + 5}px ${design.borderColor}50, inset 0 0 40px ${design.borderColor}08` };
      case "classic": return { border: `${design.borderWidth}px solid ${design.borderColor}`, boxShadow: `inset 0 0 0 2px ${design.backgroundColor}, inset 0 0 0 4px ${design.borderColor}60, inset 0 0 0 8px ${design.backgroundColor}, inset 0 0 0 9px ${design.borderColor}30` };
      case "modern": return { border: `${design.borderWidth}px solid ${design.borderColor}`, borderRadius: "4px" };
      default: return {};
    }
  };

  // ───────── Color input helper ─────────
  const ColorInput = ({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) => (
    <div className="space-y-2">
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-2">
        <Input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-10 h-9 p-0.5 cursor-pointer" />
        <Input value={value} onChange={e => onChange(e.target.value)} className="font-mono text-xs flex-1" />
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* ═══ Settings Panel ═══ */}
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
              <TabsList className="w-full grid grid-cols-6 rounded-none border-b">
                <TabsTrigger value="templates" className="text-xs px-1"><Layout className="h-4 w-4" /></TabsTrigger>
                <TabsTrigger value="layout" className="text-xs px-1"><Settings2 className="h-4 w-4" /></TabsTrigger>
                <TabsTrigger value="style" className="text-xs px-1"><Palette className="h-4 w-4" /></TabsTrigger>
                <TabsTrigger value="content" className="text-xs px-1"><Type className="h-4 w-4" /></TabsTrigger>
                <TabsTrigger value="logos" className="text-xs px-1"><Image className="h-4 w-4" /></TabsTrigger>
                <TabsTrigger value="signatures" className="text-xs px-1"><Award className="h-4 w-4" /></TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[520px]">
                {/* ─── Templates ─── */}
                <TabsContent value="templates" className="p-4 space-y-4 mt-0">
                  <Label className="text-sm font-medium block">{language === "ar" ? "القوالب الاحترافية" : "Professional Templates"}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {professionalTemplates.map(t => (
                      <button key={t.id} onClick={() => applyTemplate(t.id)} className="p-3 border rounded-lg hover:border-primary transition-colors text-left">
                        <div className="h-10 rounded mb-2 border-2" style={{ borderColor: t.preview, background: "#fff" }} />
                        <p className="text-xs font-medium">{language === "ar" ? t.nameAr : t.name}</p>
                      </button>
                    ))}
                  </div>
                </TabsContent>

                {/* ─── Layout ─── */}
                <TabsContent value="layout" className="p-4 space-y-4 mt-0">
                  <div className="space-y-3">
                    <Label>{language === "ar" ? "حجم الورق" : "Paper Size"}</Label>
                    <Select value={design.paperSize} onValueChange={v => updateDesign({ paperSize: v as any })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="a4">A4 (210 × 297 mm)</SelectItem>
                        <SelectItem value="letter">Letter (8.5 × 11 in)</SelectItem>
                        <SelectItem value="a3">A3 (297 × 420 mm)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label>{language === "ar" ? "الاتجاه" : "Orientation"}</Label>
                    <Select value={design.orientation} onValueChange={v => updateDesign({ orientation: v as any })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="landscape">{language === "ar" ? "أفقي" : "Landscape"}</SelectItem>
                        <SelectItem value="portrait">{language === "ar" ? "عمودي" : "Portrait"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator />
                  <Label className="text-sm font-medium">{language === "ar" ? "الهوامش (mm)" : "Margins (mm)"}</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">{language === "ar" ? "أعلى" : "Top"}: {design.marginTop}</Label>
                      <Slider value={[design.marginTop]} onValueChange={([v]) => updateDesign({ marginTop: v })} min={8} max={50} step={2} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{language === "ar" ? "أسفل" : "Bottom"}: {design.marginBottom}</Label>
                      <Slider value={[design.marginBottom]} onValueChange={([v]) => updateDesign({ marginBottom: v })} min={8} max={50} step={2} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{language === "ar" ? "يسار" : "Left"}: {design.marginLeft}</Label>
                      <Slider value={[design.marginLeft]} onValueChange={([v]) => updateDesign({ marginLeft: v })} min={8} max={50} step={2} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{language === "ar" ? "يمين" : "Right"}: {design.marginRight}</Label>
                      <Slider value={[design.marginRight]} onValueChange={([v]) => updateDesign({ marginRight: v })} min={8} max={50} step={2} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{language === "ar" ? "حشو داخلي" : "Inner Padding"}: {design.innerPadding}</Label>
                    <Slider value={[design.innerPadding]} onValueChange={([v]) => updateDesign({ innerPadding: v })} min={0} max={30} step={2} />
                  </div>
                </TabsContent>

                {/* ─── Style ─── */}
                <TabsContent value="style" className="p-4 space-y-4 mt-0">
                  <ColorInput label={language === "ar" ? "لون الخلفية" : "Background Color"} value={design.backgroundColor} onChange={v => updateDesign({ backgroundColor: v })} />

                  <div className="space-y-2">
                    <Label className="text-xs">{language === "ar" ? "صورة خلفية (URL)" : "Background Image (URL)"}</Label>
                    <Input value={design.backgroundImage} onChange={e => updateDesign({ backgroundImage: e.target.value })} placeholder="https://..." className="text-xs" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">{language === "ar" ? "نمط الخلفية" : "Background Pattern"}</Label>
                    <Select value={design.backgroundPattern} onValueChange={v => updateDesign({ backgroundPattern: v as any })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{language === "ar" ? "بدون" : "None"}</SelectItem>
                        <SelectItem value="subtle">{language === "ar" ? "خفيف" : "Subtle"}</SelectItem>
                        <SelectItem value="elegant">{language === "ar" ? "أنيق" : "Elegant"}</SelectItem>
                        <SelectItem value="ornate">{language === "ar" ? "مزخرف" : "Ornate"}</SelectItem>
                        <SelectItem value="damask">{language === "ar" ? "دمشقي" : "Damask"}</SelectItem>
                        <SelectItem value="geometric">{language === "ar" ? "هندسي" : "Geometric"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label className="text-xs">{language === "ar" ? "نمط الإطار" : "Frame Style"}</Label>
                    <Select value={design.borderStyle} onValueChange={v => updateDesign({ borderStyle: v as any })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{language === "ar" ? "بدون" : "None"}</SelectItem>
                        <SelectItem value="simple">{language === "ar" ? "بسيط" : "Simple"}</SelectItem>
                        <SelectItem value="double">{language === "ar" ? "مزدوج" : "Double"}</SelectItem>
                        <SelectItem value="ornate">{language === "ar" ? "مزخرف" : "Ornate"}</SelectItem>
                        <SelectItem value="gold">{language === "ar" ? "ذهبي" : "Gold"}</SelectItem>
                        <SelectItem value="classic">{language === "ar" ? "كلاسيكي" : "Classic"}</SelectItem>
                        <SelectItem value="modern">{language === "ar" ? "عصري" : "Modern"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <ColorInput label={language === "ar" ? "لون الإطار" : "Frame Color"} value={design.borderColor} onChange={v => updateDesign({ borderColor: v })} />

                  <div className="space-y-1">
                    <Label className="text-xs">{language === "ar" ? "سمك الإطار" : "Frame Width"}: {design.borderWidth}px</Label>
                    <Slider value={[design.borderWidth]} onValueChange={([v]) => updateDesign({ borderWidth: v })} min={1} max={16} step={1} />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-xs">{language === "ar" ? "زخارف الزوايا" : "Corner Ornaments"}</Label>
                    <Switch checked={design.cornerOrnament} onCheckedChange={v => updateDesign({ cornerOrnament: v })} />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <Label className="text-xs">{language === "ar" ? "علامة مائية" : "Watermark"}</Label>
                    <Switch checked={design.showWatermark} onCheckedChange={v => updateDesign({ showWatermark: v })} />
                  </div>
                  {design.showWatermark && (
                    <>
                      <Input value={design.watermarkText} onChange={e => updateDesign({ watermarkText: e.target.value })} placeholder="CERTIFIED" className="text-xs" />
                      <div className="space-y-1">
                        <Label className="text-xs">{language === "ar" ? "شفافية" : "Opacity"}: {design.watermarkOpacity}%</Label>
                        <Slider value={[design.watermarkOpacity]} onValueChange={([v]) => updateDesign({ watermarkOpacity: v })} min={2} max={20} step={1} />
                      </div>
                    </>
                  )}
                </TabsContent>

                {/* ─── Content (Typography & Text) ─── */}
                <TabsContent value="content" className="p-4 space-y-4 mt-0">
                  <Label className="text-sm font-medium">{language === "ar" ? "الخطوط" : "Fonts"}</Label>

                  <div className="space-y-2">
                    <Label className="text-xs">{language === "ar" ? "خط العنوان" : "Title Font"}</Label>
                    <Select value={design.titleFont} onValueChange={v => updateDesign({ titleFont: v })}>
                      <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{fontOptions.map(f => <SelectItem key={f.value} value={f.value} className="text-xs">{f.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">{language === "ar" ? "خط اسم المستلم" : "Recipient Font"}</Label>
                    <Select value={design.recipientFont} onValueChange={v => updateDesign({ recipientFont: v })}>
                      <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{fontOptions.map(f => <SelectItem key={f.value} value={f.value} className="text-xs">{f.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">{language === "ar" ? "خط النص" : "Body Font"}</Label>
                    <Select value={design.bodyFont} onValueChange={v => updateDesign({ bodyFont: v })}>
                      <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{fontOptions.map(f => <SelectItem key={f.value} value={f.value} className="text-xs">{f.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>

                  <Separator />
                  <Label className="text-sm font-medium">{language === "ar" ? "أحجام الخطوط" : "Font Sizes"}</Label>
                  <div className="space-y-1">
                    <Label className="text-xs">{language === "ar" ? "حجم العنوان" : "Title Size"}: {design.titleSize}px</Label>
                    <Slider value={[design.titleSize]} onValueChange={([v]) => updateDesign({ titleSize: v })} min={16} max={48} step={1} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{language === "ar" ? "حجم اسم المستلم" : "Recipient Size"}: {design.recipientSize}px</Label>
                    <Slider value={[design.recipientSize]} onValueChange={([v]) => updateDesign({ recipientSize: v })} min={18} max={52} step={1} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{language === "ar" ? "حجم النص" : "Body Size"}: {design.bodySize}px</Label>
                    <Slider value={[design.bodySize]} onValueChange={([v]) => updateDesign({ bodySize: v })} min={9} max={20} step={1} />
                  </div>

                  <Separator />
                  <Label className="text-sm font-medium">{language === "ar" ? "الألوان" : "Colors"}</Label>
                  <ColorInput label={language === "ar" ? "لون العنوان" : "Title Color"} value={design.titleColor} onChange={v => updateDesign({ titleColor: v })} />
                  <ColorInput label={language === "ar" ? "لون الاسم" : "Recipient Color"} value={design.recipientColor} onChange={v => updateDesign({ recipientColor: v })} />
                  <ColorInput label={language === "ar" ? "لون النص" : "Body Color"} value={design.bodyColor} onChange={v => updateDesign({ bodyColor: v })} />

                  <Separator />
                  <Label className="text-sm font-medium">{language === "ar" ? "المحاذاة" : "Alignment"}</Label>
                  <div className="space-y-2">
                    <Label className="text-xs">{language === "ar" ? "محاذاة العنوان" : "Title Alignment"}</Label>
                    <div className="flex gap-1">
                      {(["left", "center", "right"] as const).map(a => (
                        <Button key={a} variant={design.titleAlignment === a ? "default" : "outline"} size="icon" className="h-8 w-8" onClick={() => updateDesign({ titleAlignment: a })}>
                          {a === "left" ? <AlignLeft className="h-3.5 w-3.5" /> : a === "center" ? <AlignCenter className="h-3.5 w-3.5" /> : <AlignRight className="h-3.5 w-3.5" />}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">{language === "ar" ? "محاذاة النص" : "Body Alignment"}</Label>
                    <div className="flex gap-1">
                      {(["left", "center", "right"] as const).map(a => (
                        <Button key={a} variant={design.bodyAlignment === a ? "default" : "outline"} size="icon" className="h-8 w-8" onClick={() => updateDesign({ bodyAlignment: a })}>
                          {a === "left" ? <AlignLeft className="h-3.5 w-3.5" /> : a === "center" ? <AlignCenter className="h-3.5 w-3.5" /> : <AlignRight className="h-3.5 w-3.5" />}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Separator />
                  <Label className="text-sm font-medium">{language === "ar" ? "أيقونة الجائزة" : "Award Icon"}</Label>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">{language === "ar" ? "إظهار" : "Show"}</Label>
                    <Switch checked={design.showAwardIcon} onCheckedChange={v => updateDesign({ showAwardIcon: v })} />
                  </div>
                  {design.showAwardIcon && (
                    <>
                      <ColorInput label={language === "ar" ? "لون الأيقونة" : "Icon Color"} value={design.awardIconColor} onChange={v => updateDesign({ awardIconColor: v })} />
                      <div className="space-y-1">
                        <Label className="text-xs">{language === "ar" ? "حجم الأيقونة" : "Icon Size"}: {design.awardIconSize}px</Label>
                        <Slider value={[design.awardIconSize]} onValueChange={([v]) => updateDesign({ awardIconSize: v })} min={24} max={72} step={2} />
                      </div>
                    </>
                  )}

                  <Separator />
                  <Label className="text-sm font-medium">{language === "ar" ? "عناصر إضافية" : "Extra Elements"}</Label>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">{language === "ar" ? "رقم الشهادة" : "Certificate Number"}</Label>
                    <Switch checked={design.showCertificateNumber} onCheckedChange={v => updateDesign({ showCertificateNumber: v })} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">{language === "ar" ? "كود التحقق" : "Verification Code"}</Label>
                    <Switch checked={design.showVerificationCode} onCheckedChange={v => updateDesign({ showVerificationCode: v })} />
                  </div>

                  <Separator />
                  <Label className="text-sm font-medium">{language === "ar" ? "نصوص الشهادة" : "Certificate Text"}</Label>
                  <div className="space-y-2">
                    <Label className="text-xs">{language === "ar" ? "العنوان (EN)" : "Title (EN)"}</Label>
                    <Input value={design.titleText} onChange={e => updateDesign({ titleText: e.target.value })} className="text-xs" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">{language === "ar" ? "العنوان (AR)" : "Title (AR)"}</Label>
                    <Input value={design.titleTextAr} onChange={e => updateDesign({ titleTextAr: e.target.value })} className="text-xs" dir="rtl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">{language === "ar" ? "العنوان الفرعي (EN)" : "Subtitle (EN)"}</Label>
                    <Input value={design.subtitleText} onChange={e => updateDesign({ subtitleText: e.target.value })} className="text-xs" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">{language === "ar" ? "العنوان الفرعي (AR)" : "Subtitle (AR)"}</Label>
                    <Input value={design.subtitleTextAr} onChange={e => updateDesign({ subtitleTextAr: e.target.value })} className="text-xs" dir="rtl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">{language === "ar" ? "نص الشهادة (EN)" : "Body (EN)"}</Label>
                    <Textarea value={design.bodyTemplate} onChange={e => updateDesign({ bodyTemplate: e.target.value })} rows={2} className="text-xs" />
                    <p className="text-[10px] text-muted-foreground">{"{{recipient_name}}, {{event_name}}, {{event_location}}, {{event_date}}, {{achievement}}"}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">{language === "ar" ? "نص الشهادة (AR)" : "Body (AR)"}</Label>
                    <Textarea value={design.bodyTemplateAr} onChange={e => updateDesign({ bodyTemplateAr: e.target.value })} rows={2} className="text-xs" dir="rtl" />
                  </div>
                </TabsContent>

                {/* ─── Logos ─── */}
                <TabsContent value="logos" className="p-4 space-y-4 mt-0">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">{language === "ar" ? "شعارات الرأس" : "Header Logos"}</Label>
                    <Switch checked={design.showHeaderLogos} onCheckedChange={v => updateDesign({ showHeaderLogos: v })} />
                  </div>
                  {design.showHeaderLogos && (
                    <>
                      <div className="space-y-1">
                        <Label className="text-xs">{language === "ar" ? "الحجم" : "Size"}: {design.headerLogoSize}px</Label>
                        <Slider value={[design.headerLogoSize]} onValueChange={([v]) => updateDesign({ headerLogoSize: v })} min={30} max={120} step={5} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">{language === "ar" ? "الشعارات" : "Logos"}</Label>
                        <Button variant="outline" size="sm" onClick={() => addLogo("header")} className="h-7 text-xs">
                          <Plus className="h-3 w-3 mr-1" />{language === "ar" ? "إضافة" : "Add"}
                        </Button>
                      </div>
                      {design.logos.filter(l => l.position === "header").sort((a, b) => a.order - b.order).map(logo => (
                        <div key={logo.id} className="flex items-center gap-1.5 p-2 border rounded text-xs">
                          <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <Input placeholder="Logo URL" value={logo.url} onChange={e => updateLogo(logo.id, { url: e.target.value })} className="flex-1 text-xs h-7" />
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveLogo(logo.id, "up")}><ChevronUp className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveLogo(logo.id, "down")}><ChevronDown className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeLogo(logo.id)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      ))}
                    </>
                  )}

                  <Separator />

                  <div className="flex items-center justify-between">
                    <Label className="text-xs">{language === "ar" ? "شعارات التذييل" : "Footer Logos"}</Label>
                    <Switch checked={design.showFooterLogos} onCheckedChange={v => updateDesign({ showFooterLogos: v })} />
                  </div>
                  {design.showFooterLogos && (
                    <>
                      <div className="space-y-1">
                        <Label className="text-xs">{language === "ar" ? "الحجم" : "Size"}: {design.footerLogoSize}px</Label>
                        <Slider value={[design.footerLogoSize]} onValueChange={([v]) => updateDesign({ footerLogoSize: v })} min={20} max={80} step={5} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">{language === "ar" ? "الشعارات" : "Logos"}</Label>
                        <Button variant="outline" size="sm" onClick={() => addLogo("footer")} className="h-7 text-xs">
                          <Plus className="h-3 w-3 mr-1" />{language === "ar" ? "إضافة" : "Add"}
                        </Button>
                      </div>
                      {design.logos.filter(l => l.position === "footer").sort((a, b) => a.order - b.order).map(logo => (
                        <div key={logo.id} className="flex items-center gap-1.5 p-2 border rounded text-xs">
                          <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <Input placeholder="Logo URL" value={logo.url} onChange={e => updateLogo(logo.id, { url: e.target.value })} className="flex-1 text-xs h-7" />
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveLogo(logo.id, "up")}><ChevronUp className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveLogo(logo.id, "down")}><ChevronDown className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeLogo(logo.id)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      ))}
                    </>
                  )}
                </TabsContent>

                {/* ─── Signatures ─── */}
                <TabsContent value="signatures" className="p-4 space-y-4 mt-0">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">{language === "ar" ? "التوقيعات" : "Signatures"}</Label>
                    <Button variant="outline" size="sm" onClick={addSignature} className="h-7 text-xs">
                      <Plus className="h-3 w-3 mr-1" />{language === "ar" ? "إضافة" : "Add"}
                    </Button>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">{language === "ar" ? "عرض خط التوقيع" : "Line Width"}: {design.signatureLineWidth}px</Label>
                    <Slider value={[design.signatureLineWidth]} onValueChange={([v]) => updateDesign({ signatureLineWidth: v })} min={80} max={220} step={10} />
                  </div>

                  <ColorInput label={language === "ar" ? "لون خط التوقيع" : "Line Color"} value={design.signatureLineColor} onChange={v => updateDesign({ signatureLineColor: v })} />

                  {design.signatures.map(sig => (
                    <Card key={sig.id}>
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-[10px]">{language === "ar" ? "توقيع" : "Signature"}</Badge>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeSignature(sig.id)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input placeholder="Name (EN)" value={sig.name} onChange={e => updateSignature(sig.id, { name: e.target.value })} className="text-xs h-7" />
                          <Input placeholder="الاسم (AR)" value={sig.nameAr} onChange={e => updateSignature(sig.id, { nameAr: e.target.value })} className="text-xs h-7" dir="rtl" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input placeholder="Title (EN)" value={sig.title} onChange={e => updateSignature(sig.id, { title: e.target.value })} className="text-xs h-7" />
                          <Input placeholder="المنصب (AR)" value={sig.titleAr} onChange={e => updateSignature(sig.id, { titleAr: e.target.value })} className="text-xs h-7" dir="rtl" />
                        </div>
                        <Input placeholder="Organization" value={sig.organization} onChange={e => updateSignature(sig.id, { organization: e.target.value })} className="text-xs h-7" />
                        <div className="space-y-1">
                          <Label className="text-[10px]">{language === "ar" ? "صورة التوقيع (URL)" : "Signature Image (URL)"}</Label>
                          <Input placeholder="https://..." value={sig.signatureUrl || ""} onChange={e => updateSignature(sig.id, { signatureUrl: e.target.value })} className="text-xs h-7" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => onSave?.(design)}>
            <Save className="h-4 w-4 mr-2" />
            {language === "ar" ? "حفظ التصميم" : "Save Design"}
          </Button>
          {onPrint && (
            <Button variant="outline" onClick={onPrint}>
              <Printer className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* ═══ Preview Panel ═══ */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-5 w-5" />
                {language === "ar" ? "معاينة الشهادة" : "Certificate Preview"}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoom(Math.max(30, zoom - 5))}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs font-mono w-10 text-center">{zoom}%</span>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoom(Math.min(100, zoom + 5))}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setZoom(65)}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {design.paperSize.toUpperCase()} • {design.orientation === "landscape" ? (language === "ar" ? "أفقي" : "Landscape") : (language === "ar" ? "عمودي" : "Portrait")} • {language === "ar" ? "هوامش" : "Margins"}: {design.marginTop}/{design.marginRight}/{design.marginBottom}/{design.marginLeft}mm
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto bg-muted/30 rounded-lg p-6 flex items-center justify-center" style={{ minHeight: 500 }}>
              {/* Certificate Canvas */}
              <div
                className="relative shadow-2xl transition-all duration-300"
                style={{
                  width: pw,
                  height: ph,
                  backgroundColor: design.backgroundColor,
                  ...getOuterBorder(),
                  backgroundImage: design.backgroundImage ? `url(${design.backgroundImage})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                {/* Background pattern overlay */}
                <div className="absolute inset-0 pointer-events-none" ref={el => { if (el) el.style.cssText = getBgPattern(); }} />

                {/* Watermark */}
                {design.showWatermark && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: design.watermarkOpacity / 100 }}>
                    <span className="text-muted-foreground font-bold tracking-[0.3em] rotate-[-30deg]" style={{ fontSize: s(60) }}>
                      {design.watermarkText}
                    </span>
                  </div>
                )}

                {/* Corner ornaments */}
                {design.cornerOrnament && design.borderStyle !== "none" && (
                  <>
                    {[
                      { top: s(8), left: s(8) },
                      { top: s(8), right: s(8) },
                      { bottom: s(8), left: s(8) },
                      { bottom: s(8), right: s(8) },
                    ].map((pos, i) => (
                      <div key={i} className="absolute" style={{ ...pos, width: s(20), height: s(20) }}>
                        <svg viewBox="0 0 20 20" fill="none">
                          <path
                            d={i === 0 ? "M0 20 Q0 0 20 0" : i === 1 ? "M0 0 Q20 0 20 20" : i === 2 ? "M0 0 Q0 20 20 20" : "M20 0 Q0 0 0 20"}
                            stroke={design.borderColor}
                            strokeWidth="1.5"
                            opacity="0.5"
                          />
                        </svg>
                      </div>
                    ))}
                  </>
                )}

                {/* Inner content area with margins */}
                <div
                  className="absolute inset-0 flex flex-col"
                  style={{
                    paddingTop: s(design.marginTop),
                    paddingBottom: s(design.marginBottom),
                    paddingLeft: s(design.marginLeft),
                    paddingRight: s(design.marginRight),
                  }}
                >
                  {/* Inner border */}
                  {design.innerBorderWidth > 0 && design.borderStyle !== "none" && (
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        top: s(design.marginTop - 4),
                        bottom: s(design.marginBottom - 4),
                        left: s(design.marginLeft - 4),
                        right: s(design.marginRight - 4),
                        border: `${design.innerBorderWidth}px solid ${design.borderColor}50`,
                      }}
                    />
                  )}

                  {/* Padded content */}
                  <div className="flex flex-col h-full" style={{ padding: s(design.innerPadding) }}>
                    {/* Header Logos */}
                    {design.showHeaderLogos && (
                      <div className="flex justify-between items-center shrink-0" style={{ marginBottom: s(8), minHeight: s(design.headerLogoSize) }}>
                        {(() => {
                          const headerLogos = design.logos.filter(l => l.position === "header").sort((a, b) => a.order - b.order);
                          if (headerLogos.length > 0) {
                            return (
                              <div className="flex justify-center items-center gap-4 w-full">
                                {headerLogos.map(logo => (
                                  <div key={logo.id} className="bg-muted/30 rounded flex items-center justify-center" style={{ width: s(design.headerLogoSize), height: s(design.headerLogoSize) }}>
                                    {logo.url ? <img src={logo.url} alt="" className="max-w-full max-h-full object-contain" /> : <Image className="text-muted-foreground/40" style={{ width: "40%", height: "40%" }} />}
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return (
                            <div className="flex justify-between items-center w-full">
                              <div className="bg-muted/20 rounded flex items-center justify-center" style={{ width: s(design.headerLogoSize), height: s(design.headerLogoSize) }}>
                                <Image className="text-muted-foreground/30" style={{ width: "40%", height: "40%" }} />
                              </div>
                              <div className="bg-muted/20 rounded flex items-center justify-center" style={{ width: s(design.headerLogoSize), height: s(design.headerLogoSize) }}>
                                <Image className="text-muted-foreground/30" style={{ width: "40%", height: "40%" }} />
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Decorative line under header */}
                    <div className="shrink-0 mx-auto" style={{ width: "60%", height: 1, background: `linear-gradient(90deg, transparent, ${design.borderColor}40, transparent)`, marginBottom: s(6) }} />

                    {/* Award Icon */}
                    {design.showAwardIcon && (
                      <div className="flex justify-center shrink-0" style={{ marginBottom: s(4) }}>
                        <Award style={{ color: design.awardIconColor, width: s(design.awardIconSize), height: s(design.awardIconSize) }} />
                      </div>
                    )}

                    {/* Title */}
                    <div className="shrink-0" style={{ textAlign: design.titleAlignment, marginBottom: s(4) }}>
                      <h1 style={{ fontFamily: design.titleFont, color: design.titleColor, fontSize: s(design.titleSize), fontWeight: 700, letterSpacing: "0.05em", lineHeight: 1.2 }}>
                        {design.titleText}
                      </h1>
                      {design.titleTextAr && (
                        <h2 dir="rtl" style={{ fontFamily: design.titleFont, color: design.titleColor, fontSize: s(design.titleSize * 0.8), fontWeight: 700, marginTop: s(2) }}>
                          {design.titleTextAr}
                        </h2>
                      )}
                    </div>

                    {/* Decorative divider */}
                    <div className="shrink-0 mx-auto flex items-center gap-2" style={{ marginBottom: s(6) }}>
                      <div style={{ width: s(40), height: 1, background: design.borderColor + "60" }} />
                      <div style={{ width: s(6), height: s(6), borderRadius: "50%", border: `1px solid ${design.borderColor}60` }} />
                      <div style={{ width: s(40), height: 1, background: design.borderColor + "60" }} />
                    </div>

                    {/* Body Content */}
                    <div className="flex-1 flex flex-col justify-center" style={{ textAlign: design.bodyAlignment }}>
                      {/* Subtitle */}
                      <p style={{ fontFamily: design.bodyFont, color: design.bodyColor, fontSize: s(design.bodySize), marginBottom: s(4) }}>
                        {design.subtitleText}
                      </p>

                      {/* Recipient Name */}
                      <p style={{ fontFamily: design.recipientFont, color: design.recipientColor, fontSize: s(design.recipientSize), fontWeight: 700, marginBottom: s(2), lineHeight: 1.3 }}>
                        {previewRecipient}
                      </p>
                      {previewRecipientAr && (
                        <p dir="rtl" style={{ fontFamily: design.recipientFont, color: design.recipientColor, fontSize: s(design.recipientSize * 0.8), fontWeight: 700, marginBottom: s(6) }}>
                          {previewRecipientAr}
                        </p>
                      )}

                      {/* Achievement badge */}
                      {achievement && (
                        <div className="flex justify-center" style={{ marginBottom: s(4) }}>
                          <span style={{ fontFamily: design.bodyFont, color: design.awardIconColor, fontSize: s(design.bodySize + 2), fontWeight: 600, borderBottom: `2px solid ${design.awardIconColor}40`, paddingBottom: s(2) }}>
                            {achievement}
                          </span>
                        </div>
                      )}

                      {/* Body text */}
                      <p style={{ fontFamily: design.bodyFont, color: design.bodyColor, fontSize: s(design.bodySize), lineHeight: 1.6, maxWidth: "80%", margin: "0 auto" }}>
                        {replaceVars(design.bodyTemplate)}
                      </p>
                    </div>

                    {/* Signatures */}
                    <div className="flex justify-center shrink-0" style={{ gap: s(24), marginTop: s(10) }}>
                      {design.signatures.map(sig => (
                        <div key={sig.id} className="text-center">
                          {/* Signature image */}
                          <div className="flex items-end justify-center" style={{ height: s(28), marginBottom: s(2) }}>
                            {sig.signatureUrl && (
                              <img src={sig.signatureUrl} alt="" className="max-h-full object-contain" style={{ maxWidth: s(design.signatureLineWidth) }} />
                            )}
                          </div>
                          {/* Signature line */}
                          <div className="mx-auto" style={{ width: s(design.signatureLineWidth), height: 1, background: design.signatureLineColor }} />
                          <p style={{ fontFamily: design.bodyFont, fontSize: s(10), fontWeight: 600, color: design.titleColor, marginTop: s(3) }}>{sig.name}</p>
                          {sig.nameAr && <p dir="rtl" style={{ fontFamily: design.bodyFont, fontSize: s(9), color: design.titleColor }}>{sig.nameAr}</p>}
                          <p style={{ fontFamily: design.bodyFont, fontSize: s(8.5), color: design.bodyColor }}>{sig.title}</p>
                          {sig.organization && <p style={{ fontFamily: design.bodyFont, fontSize: s(7.5), color: design.bodyColor + "cc" }}>{sig.organization}</p>}
                        </div>
                      ))}
                    </div>

                    {/* Decorative line before footer */}
                    <div className="shrink-0 mx-auto" style={{ width: "60%", height: 1, background: `linear-gradient(90deg, transparent, ${design.borderColor}30, transparent)`, marginTop: s(8), marginBottom: s(4) }} />

                    {/* Footer Logos */}
                    {design.showFooterLogos && (
                      <div className="flex justify-center items-center shrink-0" style={{ gap: s(8), minHeight: s(design.footerLogoSize) }}>
                        {(() => {
                          const footerLogos = design.logos.filter(l => l.position === "footer").sort((a, b) => a.order - b.order);
                          if (footerLogos.length > 0) {
                            return footerLogos.map(logo => (
                              <div key={logo.id} className="bg-muted/15 rounded flex items-center justify-center" style={{ width: s(design.footerLogoSize), height: s(design.footerLogoSize) }}>
                                {logo.url ? <img src={logo.url} alt="" className="max-w-full max-h-full object-contain" /> : <Image className="text-muted-foreground/25" style={{ width: "40%", height: "40%" }} />}
                              </div>
                            ));
                          }
                          return [1, 2, 3].map(i => (
                            <div key={i} className="bg-muted/15 rounded flex items-center justify-center" style={{ width: s(design.footerLogoSize), height: s(design.footerLogoSize) }}>
                              <Image className="text-muted-foreground/20" style={{ width: "40%", height: "40%" }} />
                            </div>
                          ));
                        })()}
                      </div>
                    )}

                    {/* Certificate number & verification */}
                    {(design.showCertificateNumber || design.showVerificationCode) && (
                      <div className="flex justify-between items-end shrink-0" style={{ marginTop: s(4) }}>
                        {design.showCertificateNumber && (
                          <p style={{ fontFamily: "monospace", fontSize: s(7), color: design.bodyColor + "99" }}>
                            {language === "ar" ? "رقم: " : "No: "}{certificateNumber}
                          </p>
                        )}
                        {design.showVerificationCode && (
                          <p style={{ fontFamily: "monospace", fontSize: s(7), color: design.bodyColor + "99" }}>
                            {language === "ar" ? "كود التحقق: " : "Verify: "}{verificationCode}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
