import { useState, createContext, useContext, memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Pencil, Trash2, X, Check, GripVertical, ArrowRightLeft, Languages, Loader2,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ── Smart Translate Button ──────────────────────────────────────

export const SmartTranslateBtn = memo(function SmartTranslateBtn({ sourceText, fromLang, onTranslated, className }: {
  sourceText: string; fromLang: "en" | "ar"; onTranslated: (text: string) => void; className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("smart-translate", {
        body: { text: sourceText, from: fromLang, to: fromLang === "ar" ? "en" : "ar", context: "culinary/hospitality/food industry professional CV" },
      });
      if (error) throw error;
      if (data?.translated) onTranslated(data.translated);
    } catch (e: any) {
      toast({ title: "Translation failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button type="button" variant="ghost" size="icon" className={`h-7 w-7 shrink-0 text-primary/70 hover:text-primary ${className || ""}`}
      onClick={handleTranslate} disabled={loading || !sourceText.trim()} title={fromLang === "en" ? "ترجمة إلى العربية" : "Translate to English"}>
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Languages className="h-3.5 w-3.5" />}
    </Button>
  );
});

export const TranslateInlineButton = memo(function TranslateInlineButton({ text, fromLang, toLang, onTranslated, isAr }: {
  text: string; fromLang: "en" | "ar"; toLang: "en" | "ar";
  onTranslated: (v: string) => void; isAr: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const handleTranslate = async () => {
    if (!text?.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("smart-translate", {
        body: { text, from: fromLang, to: toLang, context: "culinary/chef profile/section titles" },
      });
      if (error) throw error;
      if (data?.translated) onTranslated(data.translated);
    } catch { /* silent */ } finally { setLoading(false); }
  };
  return (
    <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={handleTranslate} disabled={loading}
      title={toLang === "ar" ? "ترجمة إلى العربية" : "Translate to English"}>
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3 text-primary" />}
    </Button>
  );
});

// ── Empty & Add ──────────────────────────────────────

export const EmptyState = memo(function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border/50 p-6 text-center bg-muted/20">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted/40 mb-2">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-xs text-muted-foreground font-medium">{message}</p>
    </div>
  );
}

export function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button variant="outline" size="sm" className="w-full gap-2 text-xs h-9 border-dashed hover:bg-muted/50 hover:border-border/80 transition-all" onClick={onClick}>
      <Plus className="h-3.5 w-3.5" />{label}
    </Button>
  );
}

// ── Form Actions ──────────────────────────────────────

export function FormActions({ isAr, isPending, editingId, canSave, onSave, onCancel }: {
  isAr: boolean; isPending: boolean; editingId?: string | null; canSave: boolean; onSave: () => void; onCancel: () => void;
}) {
  return (
    <div className="flex gap-2 pt-2 border-t border-border/30">
      <Button variant="outline" size="sm" className="flex-1 h-8 text-xs font-medium" onClick={onCancel}>{isAr ? "إلغاء" : "Cancel"}</Button>
      <Button size="sm" className="flex-1 h-8 text-xs font-medium gap-1.5" onClick={onSave} disabled={!canSave || isPending}>
        {isPending ? <span className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" /> : <Check className="h-3 w-3" />}
        {editingId ? (isAr ? "حفظ" : "Save") : (isAr ? "إضافة" : "Add")}
      </Button>
    </div>
  );
}

// ── Bilingual Field Pair ──────────────────────────────────────

export function BilingualFieldPair({ labelEn, labelAr, valueEn, valueAr, onChangeEn, onChangeAr, isAr, placeholderEn, placeholderAr, required }: {
  labelEn: string; labelAr: string; valueEn: string; valueAr: string;
  onChangeEn: (v: string) => void; onChangeAr: (v: string) => void;
  isAr: boolean; placeholderEn?: string; placeholderAr?: string; required?: boolean;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="space-y-1">
        <Label className="text-[11px] font-medium text-muted-foreground">{labelEn} {required && <span className="text-destructive">*</span>}</Label>
        <div className="flex gap-1">
          <Input value={valueEn} onChange={(e) => onChangeEn(e.target.value)} className="h-8 text-xs flex-1" dir="ltr" placeholder={placeholderEn || "English"} />
          <SmartTranslateBtn sourceText={valueEn} fromLang="en" onTranslated={onChangeAr} />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-[11px] font-medium text-muted-foreground">{labelAr} <span className="text-muted-foreground/60">(AR)</span></Label>
        <div className="flex gap-1">
          <Input value={valueAr} onChange={(e) => onChangeAr(e.target.value)} className="h-8 text-xs flex-1" dir="rtl" placeholder={placeholderAr || "عربي"} />
          <SmartTranslateBtn sourceText={valueAr} fromLang="ar" onTranslated={onChangeEn} />
        </div>
      </div>
    </div>
  );
}

// ── Compact Row ──────────────────────────────────────

export function CompactRow({ icon: Icon, color, logoUrl, title, subtitle, meta, badge, badgeVariant, isCurrent, isAr, onEdit, onDelete, draggable, moveSections, onMove }: {
  icon: any; color: string; logoUrl?: string; title: string; subtitle: string; meta: string;
  badge?: string; badgeVariant?: "default" | "secondary" | "outline"; isCurrent?: boolean; isAr: boolean;
  onEdit?: () => void; onDelete?: () => void; draggable?: boolean;
  moveSections?: { key: string; label: string }[]; onMove?: (targetSection: string) => void;
}) {
  const mainContent = [title, subtitle, meta].filter(Boolean).join(" · ");
  const [moveOpen, setMoveOpen] = useState(false);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/50 px-4 py-2.5 hover:bg-muted/50 transition-all hover:border-border/80 group">
      {logoUrl ? (
        <img src={logoUrl} className="h-8 w-8 rounded-xl object-cover shrink-0" alt="" />
      ) : (
        <div className={`flex h-8 w-8 items-center justify-center rounded-xl shrink-0 ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
        <p className="text-sm font-medium truncate">{mainContent}</p>
        {isCurrent && <Badge variant="default" className="text-[10px] h-5 px-1.5 shrink-0 whitespace-nowrap">{isAr ? "مستمر" : "Ongoing"}</Badge>}
        {badge && <Badge variant={badgeVariant || "secondary"} className="text-[10px] h-5 px-1.5 shrink-0 capitalize whitespace-nowrap">{badge}</Badge>}
      </div>
      {(onEdit || onDelete || (moveSections && moveSections.length > 0)) && (
        <div className="flex items-center gap-1 shrink-0 ms-2">
          {onEdit && (
            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={onEdit} title={isAr ? "تعديل" : "Edit"}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          {moveSections && moveSections.length > 0 && onMove && (
            <Popover open={moveOpen} onOpenChange={setMoveOpen}>
              <PopoverTrigger asChild>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground" title={isAr ? "نقل إلى قسم آخر" : "Move to another section"}>
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-1.5" align="end">
                <p className="text-xs font-semibold text-muted-foreground px-2 py-1.5">{isAr ? "نقل إلى:" : "Move to:"}</p>
                {moveSections.map(s => (
                  <button key={s.key} className="w-full text-start text-xs px-2 py-1.5 rounded-md hover:bg-muted/60 transition-colors"
                    onClick={() => { onMove(s.key); setMoveOpen(false); }}>
                    {s.label}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          )}
          {onDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive/60 hover:text-destructive hover:bg-destructive/5" title={isAr ? "حذف" : "Delete"}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{isAr ? "تأكيد الحذف" : "Confirm Deletion"}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {isAr ? "هل أنت متأكد من حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء." : "Are you sure you want to delete this item? This action cannot be undone."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{isAr ? "إلغاء" : "Cancel"}</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {isAr ? "حذف" : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sortable Wrappers ──────────────────────────────────────

export function SortableItem({ id, sectionKey, children }: { id: string; sectionKey: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    data: { sectionKey },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative" as const,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="flex items-center gap-0.5">
        <button {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground/40 hover:text-muted-foreground transition-colors touch-none">
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}

export const SectionDragListenersContext = createContext<Record<string, any> | null>(null);

export function SortableSectionItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    data: { type: "section" },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    position: "relative" as const,
    zIndex: isDragging ? 20 : undefined,
  };

  return (
    <SectionDragListenersContext.Provider value={listeners || {}}>
      <div ref={setNodeRef} style={style} {...attributes}>
        {children}
      </div>
    </SectionDragListenersContext.Provider>
  );
}

export function SectionDragHandle() {
  const listeners = useContext(SectionDragListenersContext);
  return (
    <button {...(listeners || {})} className="cursor-grab active:cursor-grabbing p-1.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors touch-none">
      <GripVertical className="h-4 w-4" />
    </button>
  );
}
