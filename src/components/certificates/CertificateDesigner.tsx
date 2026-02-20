import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Layout, Settings2, Plus, Trash2, Award, AlignLeft, AlignCenter,
  AlignRight, Printer, Globe,
} from "lucide-react";
import { CertificateLineEditor } from "./CertificateLineEditor";
import { CertificateLogoManager } from "./CertificateLogoManager";
import { CertificatePreview } from "./CertificatePreview";
import type { CertificateDesign, SignatureItem } from "./types";
import { defaultDesign, defaultLines, defaultLinesAr, professionalTemplates, fontOptions } from "./types";

export type { CertificateDesign } from "./types";

interface CertificateDesignerProps {
  initialDesign?: Partial<CertificateDesign>;
  recipientName?: string;
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
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);

  const updateDesign = (updates: Partial<CertificateDesign>) => {
    setDesign(prev => ({ ...prev, ...updates }));
  };

  const applyTemplate = (templateId: string) => {
    const template = professionalTemplates.find(t => t.id === templateId);
    if (template) {
      setDesign(prev => ({
        ...prev,
        ...template.design,
        certificateLanguage: prev.certificateLanguage,
        lines: prev.lines,
        logos: prev.logos,
        signatures: prev.signatures,
      }));
    }
  };

  const switchLanguage = (lang: "en" | "ar") => {
    updateDesign({
      certificateLanguage: lang,
      lines: lang === "ar" ? [...defaultLinesAr] : [...defaultLines],
    });
  };

  // Signature helpers
  const addSignature = () => {
    updateDesign({
      signatures: [...design.signatures, {
        id: Date.now().toString(),
        name: design.certificateLanguage === "ar" ? "" : "",
        title: "",
        organization: "",
      }],
    });
  };

  const updateSignature = (id: string, updates: Partial<SignatureItem>) => {
    updateDesign({ signatures: design.signatures.map(s => s.id === id ? { ...s, ...updates } : s) });
  };

  const removeSignature = (id: string) => {
    updateDesign({ signatures: design.signatures.filter(s => s.id !== id) });
  };

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
            {/* Language Selector */}
            <div className="flex items-center gap-2 mt-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <Label className="text-xs">{language === "ar" ? "لغة الشهادة" : "Certificate Language"}</Label>
              <div className="flex gap-1 ms-auto">
                <Button
                  variant={design.certificateLanguage === "en" ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs px-3"
                  onClick={() => switchLanguage("en")}
                >
                  English
                </Button>
                <Button
                  variant={design.certificateLanguage === "ar" ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs px-3"
                  onClick={() => switchLanguage("ar")}
                >
                  العربية
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full grid grid-cols-6 rounded-none border-b">
                <TabsTrigger value="templates" className="text-xs px-1"><Layout className="h-4 w-4" /></TabsTrigger>
                <TabsTrigger value="layout" className="text-xs px-1"><Settings2 className="h-4 w-4" /></TabsTrigger>
                <TabsTrigger value="style" className="text-xs px-1"><Palette className="h-4 w-4" /></TabsTrigger>
                <TabsTrigger value="lines" className="text-xs px-1"><Type className="h-4 w-4" /></TabsTrigger>
                <TabsTrigger value="logos" className="text-xs px-1"><Image className="h-4 w-4" /></TabsTrigger>
                <TabsTrigger value="signatures" className="text-xs px-1"><Award className="h-4 w-4" /></TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[520px]">
                {/* ─── Templates ─── */}
                <TabsContent value="templates" className="p-4 space-y-4 mt-0">
                  <Label className="text-sm font-medium block">{language === "ar" ? "القوالب الاحترافية" : "Professional Templates"}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {professionalTemplates.map(t => (
                      <button key={t.id} onClick={() => applyTemplate(t.id)} className="p-3 border rounded-lg hover:border-primary transition-colors text-start">
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
                </TabsContent>

                {/* ─── Lines (per-line controls) ─── */}
                <TabsContent value="lines" className="p-4 space-y-4 mt-0">
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-2 mb-2">
                    <p className="text-[10px] text-primary font-medium flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {design.certificateLanguage === "ar"
                        ? "الشهادة باللغة العربية — كل سطر مستقل بالتنسيق"
                        : "Certificate in English — each line independently styled"}
                    </p>
                  </div>
                  <CertificateLineEditor
                    lines={design.lines}
                    onChange={lines => updateDesign({ lines })}
                    selectedLineId={selectedLineId}
                    onSelectLine={setSelectedLineId}
                  />
                </TabsContent>

                {/* ─── Logos ─── */}
                <TabsContent value="logos" className="p-4 space-y-4 mt-0">
                  <CertificateLogoManager
                    logos={design.logos}
                    onChange={logos => updateDesign({ logos })}
                  />
                </TabsContent>

                {/* ─── Signatures ─── */}
                <TabsContent value="signatures" className="p-4 space-y-4 mt-0">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">{language === "ar" ? "التوقيعات" : "Signatures"}</Label>
                    <Button variant="outline" size="sm" onClick={addSignature} className="h-7 text-xs">
                      <Plus className="h-3 w-3 me-1" />{language === "ar" ? "إضافة" : "Add"}
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
                        <Input placeholder={language === "ar" ? "الاسم" : "Name"} value={sig.name} onChange={e => updateSignature(sig.id, { name: e.target.value })} className="text-xs h-7" dir={design.certificateLanguage === "ar" ? "rtl" : "ltr"} />
                        <Input placeholder={language === "ar" ? "المنصب" : "Title"} value={sig.title} onChange={e => updateSignature(sig.id, { title: e.target.value })} className="text-xs h-7" dir={design.certificateLanguage === "ar" ? "rtl" : "ltr"} />
                        <Input placeholder={language === "ar" ? "المؤسسة" : "Organization"} value={sig.organization} onChange={e => updateSignature(sig.id, { organization: e.target.value })} className="text-xs h-7" dir={design.certificateLanguage === "ar" ? "rtl" : "ltr"} />
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
            <Save className="h-4 w-4 me-2" />
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
                <Badge variant="outline" className="text-[10px]">
                  {design.certificateLanguage === "ar" ? "عربي" : "English"}
                </Badge>
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
              <CertificatePreview
                design={design}
                zoom={zoom}
                previewData={{
                  recipientName: recipientName,
                  eventName: eventName,
                  eventLocation: eventLocation,
                  eventDate: eventDate,
                  achievement: achievement || "",
                  certificateNumber: certificateNumber,
                  verificationCode: verificationCode,
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
