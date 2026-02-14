import { useState } from "react";
import { useCompanyAccess } from "@/hooks/useCompanyAccess";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Filter } from "lucide-react";
import { CatalogItem, CatalogFormData, defaultForm, categories } from "@/components/company/catalog/catalogTypes";
import { CatalogStats } from "@/components/company/catalog/CatalogStats";
import { CatalogTable } from "@/components/company/catalog/CatalogTable";
import { CatalogFormDialog } from "@/components/company/catalog/CatalogFormDialog";

export default function CompanyCatalog() {
  const { language } = useLanguage();
  const { companyId } = useCompanyAccess();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [form, setForm] = useState<CatalogFormData>(defaultForm);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["companyCatalog", companyId, searchQuery, categoryFilter],
    queryFn: async () => {
      if (!companyId) return [];
      let query = supabase
        .from("company_catalog")
        .select("*")
        .eq("company_id", companyId)
        .order("category")
        .order("name");

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`);
      }
      if (categoryFilter !== "all") {
        query = query.eq("category", categoryFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as CatalogItem[];
    },
    enabled: !!companyId,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: CatalogFormData) => {
      if (!companyId) throw new Error("No company");
      const payload = {
        company_id: companyId,
        name: data.name,
        name_ar: data.name_ar || null,
        description: data.description || null,
        description_ar: data.description_ar || null,
        category: data.category,
        subcategory: data.subcategory || null,
        sku: data.sku || null,
        unit: data.unit || null,
        unit_price: data.unit_price || null,
        currency: data.currency || "SAR",
        quantity_available: data.quantity_available || null,
        in_stock: data.in_stock,
        is_active: data.is_active,
        image_url: data.image_url || null,
      };

      if (editingItem) {
        const { error } = await supabase.from("company_catalog").update(payload).eq("id", editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("company_catalog").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyCatalog"] });
      setDialogOpen(false);
      setEditingItem(null);
      setForm(defaultForm);
      toast({ title: language === "ar" ? "تم الحفظ" : "Saved successfully" });
    },
    onError: () => {
      toast({ title: language === "ar" ? "حدث خطأ" : "Error saving", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("company_catalog").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyCatalog"] });
      toast({ title: language === "ar" ? "تم الحذف" : "Item deleted" });
    },
  });

  const openEdit = (item: CatalogItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      name_ar: item.name_ar || "",
      description: item.description || "",
      description_ar: item.description_ar || "",
      category: item.category,
      subcategory: item.subcategory || "",
      sku: item.sku || "",
      unit: item.unit || "",
      unit_price: item.unit_price || 0,
      currency: item.currency || "SAR",
      quantity_available: item.quantity_available || 0,
      in_stock: item.in_stock ?? true,
      is_active: item.is_active ?? true,
      image_url: item.image_url || "",
    });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingItem(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const activeCount = items.filter((i) => i.is_active).length;
  const inStockCount = items.filter((i) => i.in_stock).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {language === "ar" ? "كتالوج المنتجات" : "Product Catalog"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {language === "ar" ? "إدارة منتجاتكم وخدماتكم" : "Manage your products and services"}
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="me-2 h-4 w-4" />
          {language === "ar" ? "إضافة منتج" : "Add Product"}
        </Button>
      </div>

      <CatalogStats total={items.length} active={activeCount} inStock={inStockCount} language={language} />

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={language === "ar" ? "بحث بالاسم أو SKU..." : "Search by name or SKU..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="me-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === "ar" ? "كل الفئات" : "All Categories"}</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {language === "ar" ? cat.ar : cat.en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <CatalogTable
        items={items}
        isLoading={isLoading}
        language={language}
        onEdit={openEdit}
        onDelete={(id) => deleteMutation.mutate(id)}
      />

      <CatalogFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        form={form}
        setForm={setForm}
        editingItem={editingItem}
        onSave={() => saveMutation.mutate(form)}
        isPending={saveMutation.isPending}
        language={language}
        companyId={companyId || ""}
      />
    </div>
  );
}
