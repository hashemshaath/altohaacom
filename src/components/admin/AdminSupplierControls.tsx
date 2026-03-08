import { useState, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Factory, Search } from "lucide-react";

const SUPPLIER_CATEGORIES = [
  { value: "equipment", en: "Equipment", ar: "معدات" },
  { value: "food", en: "Food & Ingredients", ar: "أغذية ومكونات" },
  { value: "supplies", en: "Supplies", ar: "مستلزمات" },
  { value: "clothing", en: "Uniforms & Clothing", ar: "أزياء وملابس" },
  { value: "packaging", en: "Packaging", ar: "تغليف" },
  { value: "accessories", en: "Accessories & Tools", ar: "إكسسوارات وأدوات" },
];

export const AdminSupplierControls = memo(function AdminSupplierControls() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["adminSuppliers", search],
    queryFn: async () => {
      let query = supabase
        .from("companies")
        .select("id, name, name_ar, type, status, is_pro_supplier, is_verified, supplier_category, featured_order, logo_url, country_code, city")
        .order("featured_order", { ascending: true, nullsFirst: false })
        .order("name");
      if (search) query = query.or(`name.ilike.%${search}%,name_ar.ilike.%${search}%`);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { error } = await supabase.from("companies").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminSuppliers"] });
      toast({ title: isAr ? "تم التحديث" : "Updated" });
    },
  });

  const proSuppliers = companies.filter((c: any) => c.is_pro_supplier);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Factory className="h-5 w-5 text-primary" />
            {isAr ? "إدارة الموردين المحترفين" : "Pro Suppliers Management"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isAr ? `${proSuppliers.length} مورد محترف مفعّل` : `${proSuppliers.length} active pro suppliers`}
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={isAr ? "بحث..." : "Search..."}
            className="ps-9"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isAr ? "الشركة" : "Company"}</TableHead>
                <TableHead>{isAr ? "النوع" : "Type"}</TableHead>
                <TableHead className="text-center">{isAr ? "مورد محترف" : "Pro Supplier"}</TableHead>
                <TableHead>{isAr ? "التصنيف" : "Category"}</TableHead>
                <TableHead className="text-center">{isAr ? "ترتيب العرض" : "Order"}</TableHead>
                <TableHead className="text-center">{isAr ? "موثّق" : "Verified"}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {c.logo_url ? (
                        <img src={c.logo_url} className="h-8 w-8 rounded-md object-contain" alt="" />
                      ) : (
                        <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                          <Factory className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <span className="font-medium text-sm">{isAr && c.name_ar ? c.name_ar : c.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] uppercase">{c.type}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={c.is_pro_supplier || false}
                      onCheckedChange={checked => updateMutation.mutate({ id: c.id, updates: { is_pro_supplier: checked } })}
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={c.supplier_category || ""}
                      onValueChange={val => updateMutation.mutate({ id: c.id, updates: { supplier_category: val || null } })}
                    >
                      <SelectTrigger className="h-8 w-32 text-xs">
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPLIER_CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>{isAr ? cat.ar : cat.en}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-center">
                    <Input
                      type="number"
                      className="h-8 w-16 text-center text-xs mx-auto"
                      defaultValue={c.featured_order || ""}
                      onBlur={e => {
                        const val = e.target.value ? parseInt(e.target.value) : null;
                        if (val !== c.featured_order) {
                          updateMutation.mutate({ id: c.id, updates: { featured_order: val } });
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={c.is_verified || false}
                      onCheckedChange={checked => updateMutation.mutate({ id: c.id, updates: { is_verified: checked } })}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {companies.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {isLoading ? (isAr ? "جاري التحميل..." : "Loading...") : (isAr ? "لا توجد شركات" : "No companies found")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
