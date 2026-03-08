import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus, Trash2, ChevronUp, ChevronDown, AlignLeft, AlignCenter, AlignRight, GripVertical, Type,
} from "lucide-react";
import type { CertificateLine } from "./types";
import { fontOptions } from "./types";

interface CertificateLineEditorProps {
  lines: CertificateLine[];
  onChange: (lines: CertificateLine[]) => void;
  selectedLineId: string | null;
  onSelectLine: (id: string | null) => void;
}

export const CertificateLineEditor = memo(function CertificateLineEditor({ lines, onChange, selectedLineId, onSelectLine }: CertificateLineEditorProps) {
  const { language } = useLanguage();

  const addLine = () => {
    const newLine: CertificateLine = {
      id: Date.now().toString(),
      text: language === "ar" ? "نص جديد" : "New line",
      font: "sans-serif",
      fontSize: 14,
      color: "#4a4a4a",
      alignment: "center",
      fontWeight: 400,
      letterSpacing: 0,
      lineHeight: 1.4,
      marginBottom: 6,
    };
    onChange([...lines, newLine]);
    onSelectLine(newLine.id);
  };

  const updateLine = (id: string, updates: Partial<CertificateLine>) => {
    onChange(lines.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const removeLine = (id: string) => {
    onChange(lines.filter(l => l.id !== id));
    if (selectedLineId === id) onSelectLine(null);
  };

  const moveLine = (id: string, direction: "up" | "down") => {
    const idx = lines.findIndex(l => l.id === id);
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= lines.length) return;
    const newLines = [...lines];
    [newLines[idx], newLines[newIdx]] = [newLines[newIdx], newLines[idx]];
    onChange(newLines);
  };

  const selectedLine = lines.find(l => l.id === selectedLineId);

  const ColorInput = ({ value, onChange: onColorChange, label }: { value: string; onChange: (v: string) => void; label: string }) => (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-2">
        <Input type="color" value={value} onChange={e => onColorChange(e.target.value)} className="w-10 h-8 p-0.5 cursor-pointer" />
        <Input value={value} onChange={e => onColorChange(e.target.value)} className="font-mono text-xs flex-1" />
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Lines list */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{language === "ar" ? "أسطر الشهادة" : "Certificate Lines"}</Label>
        <Button variant="outline" size="sm" onClick={addLine} className="h-7 text-xs">
          <Plus className="h-3 w-3 me-1" />{language === "ar" ? "إضافة سطر" : "Add Line"}
        </Button>
      </div>

      <ScrollArea className="max-h-[160px]">
        <div className="space-y-1">
          {lines.map((line, idx) => (
            <div
              key={line.id}
              className={`flex items-center gap-1 p-1.5 rounded border text-xs cursor-pointer transition-colors ${
                selectedLineId === line.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
              }`}
              onClick={() => onSelectLine(line.id)}
            >
              <GripVertical className="h-3 w-3 text-muted-foreground shrink-0" />
              <Type className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="flex-1 truncate font-medium" style={{ fontFamily: line.font, fontSize: Math.min(line.fontSize, 12) }}>
                {line.text.replace(/\{\{.*?\}\}/g, "•••").substring(0, 30)}
              </span>
              <Badge variant="outline" className="text-[9px] shrink-0">{line.fontSize}px</Badge>
              <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={e => { e.stopPropagation(); moveLine(line.id, "up"); }} disabled={idx === 0}>
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={e => { e.stopPropagation(); moveLine(line.id, "down"); }} disabled={idx === lines.length - 1}>
                <ChevronDown className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0 text-destructive" onClick={e => { e.stopPropagation(); removeLine(line.id); }}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Selected line editor */}
      {selectedLine && (
        <>
          <Separator />
          <Card>
            <CardContent className="p-3 space-y-3">
              <Label className="text-xs font-medium flex items-center gap-1">
                <Type className="h-3 w-3" />
                {language === "ar" ? "تحرير السطر" : "Edit Line"}
              </Label>

              {/* Text */}
              <div className="space-y-1">
                <Label className="text-[10px]">{language === "ar" ? "النص" : "Text"}</Label>
                <Textarea
                  value={selectedLine.text}
                  onChange={e => updateLine(selectedLine.id, { text: e.target.value })}
                  rows={2}
                  className="text-xs"
                  dir={selectedLine.font.includes("Amiri") || selectedLine.font.includes("Cairo") || selectedLine.font.includes("Tajawal") || selectedLine.font.includes("Naskh") || selectedLine.font.includes("Plex Sans Arabic") ? "rtl" : "ltr"}
                />
                {selectedLine.isVariable && (
                  <p className="text-[9px] text-muted-foreground">
                    {"{{recipient_name}} {{event_name}} {{event_location}} {{event_date}} {{achievement}} {{certificate_number}} {{verification_code}}"}
                  </p>
                )}
              </div>

              {/* Font */}
              <div className="space-y-1">
                <Label className="text-[10px]">{language === "ar" ? "الخط" : "Font"}</Label>
                <Select value={selectedLine.font} onValueChange={v => updateLine(selectedLine.id, { font: v })}>
                  <SelectTrigger className="text-xs h-8"><SelectValue /></SelectTrigger>
                  <SelectContent>{fontOptions.map(f => <SelectItem key={f.value} value={f.value} className="text-xs">{f.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              {/* Size & Weight */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px]">{language === "ar" ? "الحجم" : "Size"}: {selectedLine.fontSize}px</Label>
                  <Slider value={[selectedLine.fontSize]} onValueChange={([v]) => updateLine(selectedLine.id, { fontSize: v })} min={8} max={60} step={1} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">{language === "ar" ? "الوزن" : "Weight"}: {selectedLine.fontWeight}</Label>
                  <Slider value={[selectedLine.fontWeight]} onValueChange={([v]) => updateLine(selectedLine.id, { fontWeight: v })} min={100} max={900} step={100} />
                </div>
              </div>

              {/* Letter Spacing & Line Height */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px]">{language === "ar" ? "تباعد الحروف" : "Letter Spacing"}: {selectedLine.letterSpacing}px</Label>
                  <Slider value={[selectedLine.letterSpacing]} onValueChange={([v]) => updateLine(selectedLine.id, { letterSpacing: v })} min={-2} max={10} step={0.5} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">{language === "ar" ? "ارتفاع السطر" : "Line Height"}: {selectedLine.lineHeight}</Label>
                  <Slider value={[selectedLine.lineHeight]} onValueChange={([v]) => updateLine(selectedLine.id, { lineHeight: v })} min={0.8} max={3} step={0.1} />
                </div>
              </div>

              {/* Color */}
              <ColorInput label={language === "ar" ? "اللون" : "Color"} value={selectedLine.color} onChange={v => updateLine(selectedLine.id, { color: v })} />

              {/* Alignment */}
              <div className="space-y-1">
                <Label className="text-[10px]">{language === "ar" ? "المحاذاة" : "Alignment"}</Label>
                <div className="flex gap-1">
                  {(["left", "center", "right"] as const).map(a => (
                    <Button key={a} variant={selectedLine.alignment === a ? "default" : "outline"} size="icon" className="h-7 w-7" onClick={() => updateLine(selectedLine.id, { alignment: a })}>
                      {a === "left" ? <AlignLeft className="h-3 w-3" /> : a === "center" ? <AlignCenter className="h-3 w-3" /> : <AlignRight className="h-3 w-3" />}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Margin Bottom */}
              <div className="space-y-1">
                <Label className="text-[10px]">{language === "ar" ? "مسافة أسفل" : "Space Below"}: {selectedLine.marginBottom}px</Label>
                <Slider value={[selectedLine.marginBottom]} onValueChange={([v]) => updateLine(selectedLine.id, { marginBottom: v })} min={0} max={40} step={1} />
              </div>

              {/* Variable toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!selectedLine.isVariable}
                  onChange={e => updateLine(selectedLine.id, { isVariable: e.target.checked })}
                  className="rounded"
                />
                <Label className="text-[10px] cursor-pointer">{language === "ar" ? "يحتوي على متغيرات" : "Contains variables"}</Label>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
});
