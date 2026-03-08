import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CatalogFormData, CatalogItem, categories } from "./catalogTypes";
import { CatalogImageUpload } from "./CatalogImageUpload";

interface CatalogFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: CatalogFormData;
  setForm: (form: CatalogFormData) => void;
  editingItem: CatalogItem | null;
  onSave: () => void;
  isPending: boolean;
  language: string;
  companyId: string;
}

export const CatalogFormDialog = memo(function CatalogFormDialog({
  open, onOpenChange, form, setForm, editingItem, onSave, isPending, language, companyId,
}: CatalogFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingItem
              ? language === "ar" ? "تعديل المنتج" : "Edit Product"
              : language === "ar" ? "إضافة منتج جديد" : "Add New Product"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{language === "ar" ? "الاسم (إنجليزي)" : "Name (English)"} *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{language === "ar" ? "الاسم (عربي)" : "Name (Arabic)"}</Label>
              <Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} dir="rtl" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{language === "ar" ? "الوصف (إنجليزي)" : "Description (English)"}</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>{language === "ar" ? "الوصف (عربي)" : "Description (Arabic)"}</Label>
              <Textarea value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} dir="rtl" rows={3} />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{language === "ar" ? "الفئة" : "Category"} *</Label>
              <Select value={form.category} onValueChange={(val) => setForm({ ...form, category: val })}>
                <SelectTrigger>
                  <SelectValue placeholder={language === "ar" ? "اختر الفئة" : "Select category"} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {language === "ar" ? cat.ar : cat.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{language === "ar" ? "الفئة الفرعية" : "Subcategory"}</Label>
              <Input value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>SKU</Label>
              <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>{language === "ar" ? "السعر" : "Unit Price"}</Label>
              <Input type="number" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>{language === "ar" ? "العملة" : "Currency"}</Label>
              <Select value={form.currency} onValueChange={(val) => setForm({ ...form, currency: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SAR">SAR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="AED">AED</SelectItem>
                  <SelectItem value="KWD">KWD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{language === "ar" ? "الوحدة" : "Unit"}</Label>
              <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="kg, box, piece..." />
            </div>
            <div className="space-y-2">
              <Label>{language === "ar" ? "الكمية" : "Quantity"}</Label>
              <Input type="number" value={form.quantity_available} onChange={(e) => setForm({ ...form, quantity_available: Number(e.target.value) })} />
            </div>
          </div>

          <CatalogImageUpload
            imageUrl={form.image_url}
            onImageChange={(url) => setForm({ ...form, image_url: url })}
            companyId={companyId}
            language={language}
          />

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={form.in_stock} onCheckedChange={(val) => setForm({ ...form, in_stock: val })} />
              <Label>{language === "ar" ? "متوفر" : "In Stock"}</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(val) => setForm({ ...form, is_active: val })} />
              <Label>{language === "ar" ? "نشط" : "Active"}</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {language === "ar" ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={onSave} disabled={!form.name || !form.category || isPending}>
              {isPending
                ? language === "ar" ? "جارٍ الحفظ..." : "Saving..."
                : language === "ar" ? "حفظ" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
