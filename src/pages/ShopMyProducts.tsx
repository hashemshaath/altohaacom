import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2, ShoppingBag, Package } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function ShopMyProducts() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isAr = language === "ar";
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "", title_ar: "", description: "", description_ar: "",
    product_type: "physical" as string, category: "general",
    price: "", currency: "SAR", stock_quantity: "0", image_url: "",
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["my-shop-products", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("shop_products")
        .select("id, seller_id, title, title_ar, description, description_ar, product_type, category, price, currency, stock_quantity, image_url, is_active, created_at, updated_at")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const payload = {
        seller_id: user.id,
        title: form.title,
        title_ar: form.title_ar || null,
        description: form.description || null,
        description_ar: form.description_ar || null,
        product_type: form.product_type as any,
        category: form.category,
        price: parseFloat(form.price) || 0,
        currency: form.currency,
        stock_quantity: parseInt(form.stock_quantity) || 0,
        image_url: form.image_url || null,
      };

      if (editingId) {
        const { error } = await supabase.from("shop_products").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("shop_products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-shop-products"] });
      toast({ title: isAr ? "تم الحفظ بنجاح" : "Product saved" });
      resetForm();
    },
    onError: (e: any) => {
      toast({ title: isAr ? "خطأ" : "Error", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shop_products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-shop-products"] });
      toast({ title: isAr ? "تم الحذف" : "Product deleted" });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("shop_products").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-shop-products"] }),
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ title: "", title_ar: "", description: "", description_ar: "", product_type: "physical", category: "general", price: "", currency: "SAR", stock_quantity: "0", image_url: "" });
  };

  const startEdit = (p: any) => {
    setEditingId(p.id);
    setForm({
      title: p.title, title_ar: p.title_ar || "", description: p.description || "",
      description_ar: p.description_ar || "", product_type: p.product_type,
      category: p.category, price: String(p.price), currency: p.currency || "SAR",
      stock_quantity: String(p.stock_quantity || 0), image_url: p.image_url || "",
    });
    setShowForm(true);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SEOHead title="My Products" description="Manage your shop products on Altoha." />
      <Header />

      <main className="container flex-1 py-8 md:py-12">
        <Button variant="ghost" size="sm" asChild className="mb-4 -ms-2">
          <Link to="/shop"><ArrowLeft className="me-1.5 h-4 w-4" />{isAr ? "المتجر" : "Shop"}</Link>
        </Button>

        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                <Package className="h-4 w-4 text-primary" />
              </div>
              <h1 className="font-serif text-2xl font-bold md:text-3xl">{isAr ? "منتجاتي" : "My Products"}</h1>
            </div>
          </div>
          <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="me-1.5 h-4 w-4" />{isAr ? "إضافة منتج" : "Add Product"}
          </Button>
        </div>

        {/* Product Form */}
        {showForm && (
          <Card className="mb-8">
            <CardHeader className="border-b bg-muted/30 px-4 py-3">
              <CardTitle className="text-base">
                {editingId ? (isAr ? "تعديل المنتج" : "Edit Product") : (isAr ? "إضافة منتج جديد" : "Add New Product")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>{isAr ? "العنوان (إنجليزي)" : "Title (English)"}</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div><Label>{isAr ? "العنوان (عربي)" : "Title (Arabic)"}</Label><Input value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} /></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>{isAr ? "الوصف (إنجليزي)" : "Description"}</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
                <div><Label>{isAr ? "الوصف (عربي)" : "Description (Arabic)"}</Label><Textarea value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} rows={3} /></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-4">
                <div>
                  <Label>{isAr ? "النوع" : "Type"}</Label>
                  <Select value={form.product_type} onValueChange={(v) => setForm({ ...form, product_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="physical">{isAr ? "مادي" : "Physical"}</SelectItem>
                      <SelectItem value="digital">{isAr ? "رقمي" : "Digital"}</SelectItem>
                      <SelectItem value="service">{isAr ? "خدمة" : "Service"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>{isAr ? "التصنيف" : "Category"}</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
                <div><Label>{isAr ? "السعر" : "Price"}</Label><Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
                <div><Label>{isAr ? "الكمية" : "Stock"}</Label><Input type="number" min="0" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} /></div>
              </div>
              <div><Label>{isAr ? "رابط الصورة" : "Image URL"}</Label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." /></div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={resetForm}>{isAr ? "إلغاء" : "Cancel"}</Button>
                <Button onClick={() => saveMutation.mutate()} disabled={!form.title || saveMutation.isPending}>
                  {saveMutation.isPending ? (isAr ? "جارٍ الحفظ..." : "Saving...") : (isAr ? "حفظ" : "Save")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Products List */}
        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
        ) : products.length === 0 && !showForm ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 rounded-2xl bg-muted/60 p-5"><ShoppingBag className="h-10 w-10 text-muted-foreground/40" /></div>
            <h3 className="mb-1 text-lg font-semibold">{isAr ? "لا توجد منتجات" : "No products yet"}</h3>
            <p className="max-w-sm text-sm text-muted-foreground">{isAr ? "أضف منتجك الأول لبدء البيع" : "Add your first product to start selling"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((p: any) => {
              const title = isAr && p.title_ar ? p.title_ar : p.title;
              return (
                <Card key={p.id}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                      {p.image_url ? (
                        <img src={p.image_url} alt={title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center"><ShoppingBag className="h-6 w-6 text-muted-foreground/30" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium line-clamp-1">{title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px]">{p.category}</Badge>
                        <span className="text-sm font-bold text-primary">{p.currency} {Number(p.price).toFixed(2)}</span>
                        {p.product_type === "physical" && (
                          <span className="text-xs text-muted-foreground">{p.stock_quantity} {isAr ? "متاح" : "in stock"}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch checked={p.is_active} onCheckedChange={(v) => toggleActive.mutate({ id: p.id, is_active: v })} />
                      <Button variant="ghost" size="icon" onClick={() => startEdit(p)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate(p.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
