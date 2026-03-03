import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  Plus, GripVertical, Pencil, Trash2, Eye, EyeOff, Copy,
  ChevronUp, ChevronDown, LayoutGrid, Layers, X,
} from "lucide-react";
import {
  type HomepageBlock,
  useHomepageBlocks,
  useCreateHomepageBlock,
  useUpdateHomepageBlock,
  useDeleteHomepageBlock,
  useBulkUpdateHomepageBlocks,
  DATA_SOURCES,
  DISPLAY_STYLES,
} from "@/hooks/useHomepageBlocks";
import { BlockInlineEditor } from "./BlockInlineEditor";
import { toast } from "sonner";

export function BlockListManager() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { data: blocks = [], isLoading } = useHomepageBlocks();
  const createBlock = useCreateHomepageBlock();
  const updateBlock = useUpdateHomepageBlock();
  const deleteBlock = useDeleteHomepageBlock();
  const bulkUpdate = useBulkUpdateHomepageBlocks();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const sorted = [...blocks].sort((a, b) => a.sort_order - b.sort_order);

  const handleNew = () => {
    setEditingId(null);
    setIsCreating(true);
  };

  const handleEdit = (block: HomepageBlock) => {
    setIsCreating(false);
    setEditingId(editingId === block.id ? null : block.id);
  };

  const handleSave = (updates: Partial<HomepageBlock>) => {
    if (editingId) {
      updateBlock.mutate({ id: editingId, ...updates }, {
        onSuccess: () => {
          toast.success(isAr ? "تم تحديث البلوك" : "Block updated");
          setEditingId(null);
        },
        onError: () => toast.error(isAr ? "فشل التحديث" : "Update failed"),
      });
    } else if (isCreating) {
      createBlock.mutate({ ...updates, sort_order: sorted.length }, {
        onSuccess: () => {
          toast.success(isAr ? "تم إنشاء البلوك" : "Block created");
          setIsCreating(false);
        },
        onError: () => toast.error(isAr ? "فشل الإنشاء" : "Creation failed"),
      });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsCreating(false);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteBlock.mutate(deleteId, {
      onSuccess: () => {
        toast.success(isAr ? "تم الحذف" : "Block deleted");
        setDeleteId(null);
        if (editingId === deleteId) setEditingId(null);
      },
    });
  };

  const handleDuplicate = (block: HomepageBlock) => {
    const { id, created_at, updated_at, ...rest } = block;
    createBlock.mutate({
      ...rest,
      title_en: rest.title_en + " (copy)",
      title_ar: rest.title_ar + " (نسخة)",
      sort_order: sorted.length,
    }, {
      onSuccess: () => toast.success(isAr ? "تم النسخ" : "Block duplicated"),
    });
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const newSorted = [...sorted];
    const swapIdx = direction === "up" ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= newSorted.length) return;
    [newSorted[index], newSorted[swapIdx]] = [newSorted[swapIdx], newSorted[index]];
    const updates = newSorted.map((b, i) => ({ id: b.id, sort_order: i }));
    bulkUpdate.mutate(updates);
  };

  const handleToggleVisibility = (block: HomepageBlock) => {
    updateBlock.mutate({ id: block.id, is_visible: !block.is_visible });
  };

  const getSourceInfo = (source: string) => DATA_SOURCES.find((d) => d.value === source);
  const getDisplayInfo = (style: string) => DISPLAY_STYLES.find((d) => d.value === style);

  const visibleCount = sorted.filter((b) => b.is_visible).length;
  const editingBlock = editingId ? sorted.find(b => b.id === editingId) || null : null;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                {isAr ? "بلوكات الصفحة الرئيسية" : "Homepage Blocks"}
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {isAr
                  ? `${sorted.length} بلوك · ${visibleCount} ظاهر`
                  : `${sorted.length} blocks · ${visibleCount} visible`}
              </CardDescription>
            </div>
            <Button size="sm" onClick={handleNew} disabled={isCreating} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              {isAr ? "بلوك جديد" : "Add Block"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 pb-4">
          {/* New block inline editor */}
          {isCreating && (
            <BlockInlineEditor
              block={null}
              onSave={handleSave}
              onCancel={handleCancel}
              isPending={createBlock.isPending}
            />
          )}

          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {isAr ? "جاري التحميل..." : "Loading..."}
            </div>
          ) : sorted.length === 0 && !isCreating ? (
            <div className="py-8 text-center space-y-2">
              <LayoutGrid className="h-8 w-8 mx-auto text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">{isAr ? "لا توجد بلوكات بعد" : "No blocks yet"}</p>
              <Button size="sm" variant="outline" onClick={handleNew} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                {isAr ? "أضف أول بلوك" : "Add first block"}
              </Button>
            </div>
          ) : (
            sorted.map((block, idx) => {
              const src = getSourceInfo(block.data_source);
              const disp = getDisplayInfo(block.display_style);
              const isEditing = editingId === block.id;

              return (
                <div key={block.id} className="space-y-0">
                  <div
                    className={cn(
                      "group flex items-center gap-3 rounded-xl border p-3 transition-all",
                      isEditing
                        ? "border-primary bg-primary/5 shadow-sm"
                        : block.is_visible
                          ? "bg-card border-border/50 hover:border-primary/30 hover:shadow-sm"
                          : "bg-muted/20 border-border/30 opacity-60"
                    )}
                  >
                    {/* Reorder */}
                    <div className="flex flex-col items-center gap-0.5">
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleMove(idx, "up")} disabled={idx === 0}>
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleMove(idx, "down")} disabled={idx === sorted.length - 1}>
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold truncate">
                          {isAr ? (block.title_ar || block.title_en || "بدون عنوان") : (block.title_en || "Untitled")}
                        </span>
                        <Badge variant="secondary" className="text-[10px] shrink-0">#{idx + 1}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary" className="text-[10px] gap-1">
                          {src?.icon} {isAr ? src?.labelAr : src?.labelEn}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {disp?.icon} {isAr ? disp?.labelAr : disp?.labelEn}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {block.card_template}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {block.data_limit} {isAr ? "عنصر" : "items"}
                        </Badge>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Switch
                        checked={block.is_visible}
                        onCheckedChange={() => handleToggleVisibility(block)}
                        className="scale-75"
                      />
                      <Button
                        variant={isEditing ? "default" : "ghost"}
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleEdit(block)}
                      >
                        {isEditing ? <X className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDuplicate(block)}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(block.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Inline editor expands below the row */}
                  {isEditing && (
                    <div className="mt-2 mb-2">
                      <BlockInlineEditor
                        block={editingBlock}
                        onSave={handleSave}
                        onCancel={handleCancel}
                        isPending={updateBlock.isPending}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? "حذف البلوك؟" : "Delete Block?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {isAr ? "سيتم حذف هذا البلوك نهائياً من الصفحة الرئيسية." : "This block will be permanently removed from the homepage."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isAr ? "حذف" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
