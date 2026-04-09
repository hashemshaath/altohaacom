import { memo, useCallback, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus, Trash2, Pencil, Check, Loader2, GripVertical,
  Link as LinkIcon, MousePointerClick, Sparkles, Clock, Calendar,
  LayoutGrid, Globe, Palette, FileDown, FileUp,
} from "lucide-react";
import { LINK_TYPE_ICONS } from "./constants";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { detectLinkType } from "@/lib/socialLinksConstants";
import type { ExtraSettings } from "@/lib/socialLinksConstants";
import type { LinkItem, PageForm, ItemMutation } from "./types";

interface Props {
  items: LinkItem[];
  itemsLoading: boolean;
  extra: ExtraSettings;
  pageId: string | undefined;
  userId: string | undefined;
  isAr: boolean;
  addItem: ItemMutation;
  updateItem: ItemMutation;
  deleteItem: ItemMutation;
  reorderItems: ItemMutation;
  upsertPage: ItemMutation;
  form: PageForm;
  handleExportLinks: () => void;
  handleExportCSV: () => void;
  handleImportLinks: (file: File) => void;
  profileUsername?: string | null;
}

export const LinksTab = memo(function LinksTab({
  items, itemsLoading, extra, pageId, userId, isAr,
  addItem, updateItem, deleteItem, reorderItems, upsertPage, form,
  handleExportLinks, handleExportCSV, handleImportLinks, profileUsername,
}: Props) {
  const { toast } = useToast();
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", title_ar: "", url: "", icon: "", scheduled_start: "", scheduled_end: "", page_tab: "main" });
  const [newLink, setNewLink] = useState({ title: "", title_ar: "", url: "", icon: "", link_type: "custom", scheduled_start: "", scheduled_end: "", page_tab: "main" });
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  const totalClicks = items.reduce((sum, item) => sum + (item.click_count || 0), 0);

  const handleNewLinkUrlChange = useCallback((url: string) => {
    const detected = detectLinkType(url);
    setNewLink(prev => ({
      ...prev, url,
      ...(detected && !prev.icon ? { icon: detected.icon, link_type: detected.type } : {}),
    }));
  }, []);

  const handleAddLink = useCallback(async () => {
    if (!newLink.title || !newLink.url) {
      toast({ title: isAr ? "أدخل العنوان والرابط" : "Enter title and URL", variant: "destructive" });
      return;
    }
    const resolvedPageId = pageId || (await upsertPage.mutateAsync({ ...form, custom_css: JSON.stringify(extra) })).id;
    addItem.mutate({
      page_id: resolvedPageId, title: newLink.title,
      title_ar: newLink.title_ar || undefined, url: newLink.url,
      icon: newLink.icon || undefined, link_type: newLink.link_type, sort_order: items.length,
      page_tab: newLink.page_tab || "main",
      ...(newLink.scheduled_start ? { scheduled_start: new Date(newLink.scheduled_start).toISOString() } : {}),
      ...(newLink.scheduled_end ? { scheduled_end: new Date(newLink.scheduled_end).toISOString() } : {}),
    } as any);
    setNewLink({ title: "", title_ar: "", url: "", icon: "", link_type: "custom", scheduled_start: "", scheduled_end: "", page_tab: newLink.page_tab });
  }, [newLink, pageId, form, extra, items.length, isAr, toast, upsertPage, addItem]);

  const startEditing = useCallback((item: LinkItem) => {
    setEditingItem(item.id);
    setEditForm({
      title: item.title, title_ar: item.title_ar || "", url: item.url, icon: item.icon || "",
      scheduled_start: item.scheduled_start ? new Date(item.scheduled_start).toISOString().slice(0, 16) : "",
      scheduled_end: item.scheduled_end ? new Date(item.scheduled_end).toISOString().slice(0, 16) : "",
      page_tab: item.page_tab || "main",
    });
  }, []);

  const saveEdit = useCallback(() => {
    if (editingItem) {
      const { scheduled_start, scheduled_end, page_tab, ...rest } = editForm;
      updateItem.mutate({
        id: editingItem, ...rest, page_tab: page_tab || "main",
        ...(scheduled_start ? { scheduled_start: new Date(scheduled_start).toISOString() } : { scheduled_start: null }),
        ...(scheduled_end ? { scheduled_end: new Date(scheduled_end).toISOString() } : { scheduled_end: null }),
      });
      setEditingItem(null);
    }
  }, [editingItem, editForm, updateItem]);

  const handleThumbnailUpload = useCallback(async (itemId: string, file: File) => {
    if (!userId) return;
    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/link-thumb-${itemId}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("user-media").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("user-media").getPublicUrl(path);
      updateItem.mutate({ id: itemId, thumbnail_url: urlData.publicUrl });
      toast({ title: isAr ? "تم رفع الصورة المصغرة" : "Thumbnail uploaded" });
    } catch (err: unknown) {
      toast({ title: "Error", description: err instanceof Error ? err.message : String(err), variant: "destructive" });
    }
  }, [userId, isAr, toast, updateItem]);

  // Drag handlers
  const handleDragStart = useCallback((index: number, e: React.DragEvent<HTMLDivElement>) => {
    setDragIndex(index);
    dragNodeRef.current = e.currentTarget;
    e.dataTransfer.effectAllowed = "move";
    requestAnimationFrame(() => { if (dragNodeRef.current) dragNodeRef.current.style.opacity = "0.4"; });
  }, []);

  const handleDragEnter = useCallback((index: number) => {
    if (dragIndex === null || dragIndex === index) return;
    setDragOverIndex(index);
  }, [dragIndex]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragNodeRef.current) dragNodeRef.current.style.opacity = "1";
    if (dragIndex !== null && dragOverIndex !== null && dragIndex !== dragOverIndex) {
      const newItems = [...items];
      const [removed] = newItems.splice(dragIndex, 1);
      newItems.splice(dragOverIndex, 0, removed);
      reorderItems.mutate(newItems.map((item, i) => ({ id: item.id, sort_order: i })));
    }
    setDragIndex(null);
    setDragOverIndex(null);
    dragNodeRef.current = null;
  }, [dragIndex, dragOverIndex, items, reorderItems]);

  return (
    <div className="space-y-4 mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Export/Import */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleExportLinks}>
          <FileDown className="h-3 w-3" />JSON
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleExportCSV}>
          <FileDown className="h-3 w-3" />CSV
        </Button>
        <Label htmlFor="import-links" className="cursor-pointer">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs pointer-events-none" tabIndex={-1}>
            <FileUp className="h-3 w-3" />{isAr ? "استيراد" : "Import"}
          </Button>
        </Label>
        <input id="import-links" type="file" accept=".json,.csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImportLinks(f); e.target.value = ""; }} />
      </div>

      {/* Add New Link */}
      <Card className="overflow-hidden border-border/40 border-primary/15">
        <CardHeader className="pb-3 bg-primary/5">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center">
              <Plus className="h-3.5 w-3.5 text-primary" />
            </div>
            {isAr ? "إضافة رابط جديد" : "Add New Link"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">{isAr ? "العنوان (EN)" : "Title (EN)"}</Label>
              <Input value={newLink.title} onChange={e => setNewLink(l => ({ ...l, title: e.target.value }))} dir="ltr" className="h-9 text-xs rounded-xl border-border/40 bg-muted/20" />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">{isAr ? "العنوان (AR)" : "Title (AR)"}</Label>
              <Input value={newLink.title_ar} onChange={e => setNewLink(l => ({ ...l, title_ar: e.target.value }))} dir="rtl" className="h-9 text-xs rounded-xl border-border/40 bg-muted/20" />
            </div>
          </div>
          <div>
            <Label className="text-xs font-medium text-muted-foreground">URL</Label>
            <Input value={newLink.url} onChange={e => handleNewLinkUrlChange(e.target.value)} dir="ltr" className="h-9 text-xs rounded-xl border-border/40 bg-muted/20" placeholder="https://..." />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">{isAr ? "أيقونة" : "Icon"}</Label>
              <Input value={newLink.icon} onChange={e => setNewLink(l => ({ ...l, icon: e.target.value }))} placeholder="🔗" className="h-9 text-xs rounded-xl border-border/40 bg-muted/20" />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />{isAr ? "يبدأ" : "Start"}</Label>
              <Input type="datetime-local" value={newLink.scheduled_start} onChange={e => setNewLink(l => ({ ...l, scheduled_start: e.target.value }))} className="h-9 text-xs rounded-xl border-border/40 bg-muted/20" dir="ltr" />
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{isAr ? "ينتهي" : "End"}</Label>
              <Input type="datetime-local" value={newLink.scheduled_end} onChange={e => setNewLink(l => ({ ...l, scheduled_end: e.target.value }))} className="h-9 text-xs rounded-xl border-border/40 bg-muted/20" dir="ltr" />
            </div>
          </div>
          {extra.pages.length > 0 && (
            <div>
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><LayoutGrid className="h-3 w-3" />{isAr ? "الصفحة" : "Page"}</Label>
              <Select value={newLink.page_tab} onValueChange={v => setNewLink(l => ({ ...l, page_tab: v }))}>
                <SelectTrigger className="h-9 text-xs rounded-xl border-border/40 bg-muted/20"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">{isAr ? "الرئيسية" : "Main"}</SelectItem>
                  {extra.pages.map(pg => (
                    <SelectItem key={pg.id} value={pg.id}>{pg.label || pg.label_ar || pg.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button onClick={handleAddLink} disabled={addItem.isPending} className="w-full gap-2 h-10 rounded-xl font-semibold">
            {addItem.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {isAr ? "إضافة الرابط" : "Add Link"}
          </Button>
        </CardContent>
      </Card>

      {/* Links List */}
      <Card className="overflow-hidden border-border/40">
        <CardHeader className="pb-3 bg-muted/30">
          <CardTitle className="text-sm flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center">
              <LinkIcon className="h-3.5 w-3.5 text-primary" />
            </div>
            {isAr ? "الروابط" : "Links"}
            {items.length > 0 && <Badge variant="secondary" className="text-[12px] ms-1">{items.length}</Badge>}
          </CardTitle>
          <p className="text-[12px] text-muted-foreground">
            {isAr ? "اسحب وأفلت لإعادة الترتيب" : "Drag and drop to reorder"}
          </p>
        </CardHeader>
        <CardContent className="pt-3">
          {itemsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-10">
              <div className="h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                <LinkIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">{isAr ? "لا توجد روابط بعد" : "No links yet"}</p>
              <p className="text-xs text-muted-foreground/60 mt-1">{isAr ? "أضف رابطك الأول أعلاه" : "Add your first link above"}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item, index) => {
                const TypeIcon = LINK_TYPE_ICONS[item.link_type || "custom"] || LinkIcon;
                const isDragOver = dragOverIndex === index && dragIndex !== index;
                return (
                  <div
                    key={item.id}
                    draggable={editingItem !== item.id}
                    onDragStart={(e) => handleDragStart(index, e)}
                    onDragEnter={() => handleDragEnter(index)}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-2 p-3 rounded-xl border transition-all duration-200 group
                      ${item.is_active !== false ? "border-border/50 bg-card hover:border-primary/20 hover:shadow-sm" : "border-border/30 bg-muted/30 opacity-60"}
                      ${isDragOver ? "border-primary/40 bg-primary/5 scale-[1.02] shadow-md" : ""}
                      ${dragIndex === index ? "opacity-40" : ""}
                    `}
                    style={{ cursor: editingItem === item.id ? "default" : "grab" }}
                  >
                    <div className="flex items-center text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors cursor-grab active:cursor-grabbing shrink-0">
                      <GripVertical className="h-4 w-4" />
                    </div>

                    {item.icon ? (
                      <span className="text-lg shrink-0">{item.icon}</span>
                    ) : (
                      <div className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center shrink-0">
                        <TypeIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    )}

                    {editingItem === item.id ? (
                      <div className="flex-1 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <Input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} placeholder="Title (EN)" className="h-8 text-xs" dir="ltr" />
                          <Input value={editForm.title_ar} onChange={e => setEditForm(f => ({ ...f, title_ar: e.target.value }))} placeholder="العنوان (AR)" className="h-8 text-xs" dir="rtl" />
                        </div>
                        <Input value={editForm.url} onChange={e => setEditForm(f => ({ ...f, url: e.target.value }))} placeholder="URL" className="h-8 text-xs" dir="ltr" />
                        <div className="flex gap-2 items-center">
                          <Input value={editForm.icon} onChange={e => setEditForm(f => ({ ...f, icon: e.target.value }))} placeholder="🔗 Emoji" className="h-8 text-xs w-24" />
                          <Label htmlFor={`thumb-${item.id}`} className="cursor-pointer shrink-0">
                            <div className="h-8 px-2.5 rounded-md border border-border/40 bg-muted/30 hover:bg-muted/50 flex items-center gap-1 text-[12px] font-medium text-muted-foreground transition-colors">
                              <Palette className="h-3 w-3" />
                              {isAr ? "صورة" : "Thumb"}
                            </div>
                          </Label>
                          <input id={`thumb-${item.id}`} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleThumbnailUpload(item.id, f); }} />
                          <Button size="sm" variant="default" className="h-8 text-xs gap-1" onClick={saveEdit}>
                            <Check className="h-3 w-3" />{isAr ? "حفظ" : "Save"}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setEditingItem(null)}>
                            {isAr ? "إلغاء" : "Cancel"}
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-[12px] text-muted-foreground flex items-center gap-1"><Calendar className="h-2.5 w-2.5" />{isAr ? "يبدأ" : "Start"}</Label>
                            <Input type="datetime-local" value={editForm.scheduled_start} onChange={e => setEditForm(f => ({ ...f, scheduled_start: e.target.value }))} className="text-xs h-7" dir="ltr" />
                          </div>
                          <div>
                            <Label className="text-[12px] text-muted-foreground flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{isAr ? "ينتهي" : "End"}</Label>
                            <Input type="datetime-local" value={editForm.scheduled_end} onChange={e => setEditForm(f => ({ ...f, scheduled_end: e.target.value }))} className="text-xs h-7" dir="ltr" />
                          </div>
                        </div>
                        {extra.pages.length > 0 && (
                          <div>
                            <Label className="text-[12px] text-muted-foreground flex items-center gap-1"><LayoutGrid className="h-2.5 w-2.5" />{isAr ? "الصفحة" : "Page"}</Label>
                            <Select value={editForm.page_tab} onValueChange={v => setEditForm(f => ({ ...f, page_tab: v }))}>
                              <SelectTrigger className="h-7 text-[12px]"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="main">{isAr ? "الرئيسية" : "Main"}</SelectItem>
                                {extra.pages.map(pg => (
                                  <SelectItem key={pg.id} value={pg.id}>{pg.label || pg.label_ar || pg.id}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        {item.thumbnail_url && (
                          <div className="flex items-center gap-2">
                            <img loading="lazy" src={item.thumbnail_url} alt="" className="h-8 w-8 rounded-md object-cover" />
                            <Button size="sm" variant="ghost" className="h-6 text-[12px] text-destructive" onClick={() => updateItem.mutate({ id: item.id, thumbnail_url: null })}>
                              {isAr ? "إزالة الصورة" : "Remove thumbnail"}
                            </Button>
                          </div>
                        )}
                        {/* A/B Testing */}
                        <Separator className="my-2" />
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-[12px] flex items-center gap-1 font-semibold">
                              <Sparkles className="h-3 w-3 text-chart-2" />
                              {isAr ? "اختبار A/B" : "A/B Test"}
                            </Label>
                            <Switch checked={item.ab_enabled || false} onCheckedChange={v => updateItem.mutate({ id: item.id, ab_enabled: v } as any)} />
                          </div>
                          {item.ab_enabled && (
                            <div className="space-y-1.5 p-2 rounded-xl bg-muted/30 border border-border/30">
                              <p className="text-[12px] text-muted-foreground">{isAr ? "النسخة البديلة (B)" : "Variant B"}</p>
                              <div className="grid grid-cols-2 gap-1.5">
                                <Input value={item.ab_variant_title || ""} onChange={e => updateItem.mutate({ id: item.id, ab_variant_title: e.target.value } as any)} placeholder={isAr ? "عنوان B (EN)" : "Title B (EN)"} className="h-7 text-[12px]" dir="ltr" />
                                <Input value={item.ab_variant_title_ar || ""} onChange={e => updateItem.mutate({ id: item.id, ab_variant_title_ar: e.target.value } as any)} placeholder={isAr ? "عنوان B (AR)" : "Title B (AR)"} className="h-7 text-[12px]" dir="rtl" />
                              </div>
                              <Input value={item.ab_variant_icon || ""} onChange={e => updateItem.mutate({ id: item.id, ab_variant_icon: e.target.value } as any)} placeholder={isAr ? "أيقونة B (إيموجي)" : "Icon B (emoji)"} className="h-7 text-[12px] w-28" />
                              {((item.click_count || 0) + (item.ab_variant_click_count || 0)) > 0 && (
                                <div className="flex items-center gap-3 pt-1">
                                  <div className="flex-1">
                                    <div className="flex justify-between text-[12px] mb-0.5">
                                      <span className="font-medium">A</span>
                                      <span className="tabular-nums">{item.click_count || 0}</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-primary/20">
                                      <div className="h-full rounded-full bg-primary/70 transition-all" style={{ width: `${Math.max(5, ((item.click_count || 0) / Math.max((item.click_count || 0) + (item.ab_variant_click_count || 0), 1)) * 100)}%` }} />
                                    </div>
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex justify-between text-[12px] mb-0.5">
                                      <span className="font-medium">B</span>
                                      <span className="tabular-nums">{item.ab_variant_click_count || 0}</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-chart-2/20">
                                      <div className="h-full rounded-full bg-chart-2/70 transition-all" style={{ width: `${Math.max(5, ((item.ab_variant_click_count || 0) / Math.max((item.click_count || 0) + (item.ab_variant_click_count || 0), 1)) * 100)}%` }} />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        {item.title_ar && <p className="text-[12px] text-muted-foreground truncate" dir="rtl">{item.title_ar}</p>}
                        <p className="text-[12px] text-muted-foreground truncate">{item.url}</p>
                        {extra.pages.length > 0 && item.page_tab && item.page_tab !== "main" && (
                          <Badge variant="outline" className="text-[12px] h-4 px-1.5 mt-1 border-chart-3/30 text-chart-3">
                            <LayoutGrid className="h-2 w-2 me-0.5" />
                            {extra.pages.find(p => p.id === item.page_tab)?.label || item.page_tab}
                          </Badge>
                        )}
                        {(item.scheduled_start || item.scheduled_end) && (
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-2.5 w-2.5 text-chart-2" />
                            <span className="text-[12px] text-chart-2 font-medium">
                              {item.scheduled_start ? new Date(item.scheduled_start).toLocaleDateString() : "∞"}
                              {" → "}
                              {item.scheduled_end ? new Date(item.scheduled_end).toLocaleDateString() : "∞"}
                            </span>
                          </div>
                        )}
                        {item.ab_enabled && item.ab_variant_title && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <Badge variant="outline" className="text-[12px] h-4 px-1.5 gap-0.5 border-chart-2/30 text-chart-2">
                              <Sparkles className="h-2 w-2" /> A/B
                            </Badge>
                            <span className="text-[12px] text-muted-foreground">
                              A: {item.click_count || 0} • B: {item.ab_variant_click_count || 0}
                            </span>
                            {(() => {
                              const a = item.click_count || 0;
                              const b = item.ab_variant_click_count || 0;
                              if (a + b >= 10) {
                                const winner = a > b ? "A" : b > a ? "B" : "—";
                                return <Badge variant="secondary" className="text-[12px] h-4 px-1.5">🏆 {winner}</Badge>;
                              }
                              return null;
                            })()}
                          </div>
                        )}
                        {totalClicks > 0 && (item.click_count || 0) > 0 && (
                          <div className="mt-1.5 flex items-center gap-2">
                            <div className="h-1 flex-1 max-w-[80px] rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-primary/60 transition-all duration-500" style={{ width: `${Math.min(100, ((item.click_count || 0) / totalClicks) * 100)}%` }} />
                            </div>
                            <span className="text-[12px] text-muted-foreground tabular-nums">{Math.round(((item.click_count || 0) / totalClicks) * 100)}%</span>
                          </div>
                        )}
                      </div>
                    )}

                    {editingItem !== item.id && (
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-[12px] tabular-nums gap-0.5 h-5 px-1.5">
                          <MousePointerClick className="h-2.5 w-2.5" />{item.click_count || 0}
                        </Badge>
                        <Switch checked={item.is_active !== false} onCheckedChange={v => updateItem.mutate({ id: item.id, is_active: v })} />
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEditing(item)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteItem.mutate(item.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});
