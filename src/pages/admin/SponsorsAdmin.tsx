import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Crown, Star, Medal, Award, Plus, Edit, Trash2, Building, Package } from "lucide-react";

const TIER_ICONS: Record<string, any> = {
  platinum: Crown,
  gold: Star,
  silver: Medal,
  bronze: Award,
  custom: Package,
};

const TIER_COLORS: Record<string, string> = {
  platinum: "bg-chart-3/10 text-chart-3",
  gold: "bg-chart-4/10 text-chart-4",
  silver: "bg-muted text-muted-foreground",
  bronze: "bg-chart-2/10 text-chart-2",
  custom: "bg-primary/10 text-primary",
};

export default function SponsorsAdmin() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<any>(null);

  const [form, setForm] = useState({
    name: "", name_ar: "", tier: "gold" as string, description: "", description_ar: "",
    price: "", logo_placement: "footer", logo_on_certificates: false, benefits: "",
  });

  const { data: packages } = useQuery({
    queryKey: ["sponsorship-packages-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sponsorship_packages")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: activeSponsors } = useQuery({
    queryKey: ["all-competition-sponsors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competition_sponsors")
        .select("*, companies(name, name_ar), competitions(title, title_ar), sponsorship_packages(name, tier)")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const benefitsArray = form.benefits.split("\n").filter(b => b.trim());
      const payload = {
        name: form.name,
        name_ar: form.name_ar || null,
        tier: form.tier as any,
        description: form.description || null,
        description_ar: form.description_ar || null,
        price: form.price ? parseFloat(form.price) : null,
        logo_placement: form.logo_placement,
        logo_on_certificates: form.logo_on_certificates,
        benefits: JSON.stringify(benefitsArray),
        created_by: user?.id,
      };

      if (editingPkg) {
        const { error } = await supabase.from("sponsorship_packages").update(payload).eq("id", editingPkg.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("sponsorship_packages").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsorship-packages-admin"] });
      setDialogOpen(false);
      resetForm();
      toast({ title: language === "ar" ? "تم الحفظ" : "Saved" });
    },
    onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sponsorship_packages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsorship-packages-admin"] });
      toast({ title: language === "ar" ? "تم الحذف" : "Deleted" });
    },
  });

  const resetForm = () => {
    setForm({ name: "", name_ar: "", tier: "gold", description: "", description_ar: "", price: "", logo_placement: "footer", logo_on_certificates: false, benefits: "" });
    setEditingPkg(null);
  };

  const openEdit = (pkg: any) => {
    const benefits = Array.isArray(pkg.benefits) ? pkg.benefits : JSON.parse(pkg.benefits || "[]");
    setForm({
      name: pkg.name, name_ar: pkg.name_ar || "", tier: pkg.tier,
      description: pkg.description || "", description_ar: pkg.description_ar || "",
      price: pkg.price?.toString() || "", logo_placement: pkg.logo_placement || "footer",
      logo_on_certificates: pkg.logo_on_certificates || false,
      benefits: benefits.join("\n"),
    });
    setEditingPkg(pkg);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Crown className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-serif text-xl font-bold sm:text-2xl">
              {language === "ar" ? "إدارة الرعاة" : "Sponsorship Management"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {language === "ar" ? "إدارة باقات الرعاية وربط الرعاة بالمسابقات" : "Manage sponsorship packages and link sponsors to competitions"}
            </p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="me-2 h-4 w-4" />{language === "ar" ? "باقة جديدة" : "New Package"}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingPkg
                  ? (language === "ar" ? "تعديل الباقة" : "Edit Package")
                  : (language === "ar" ? "باقة رعاية جديدة" : "New Sponsorship Package")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === "ar" ? "الاسم (EN)" : "Name (EN)"}</Label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{language === "ar" ? "الاسم (AR)" : "Name (AR)"}</Label>
                  <Input value={form.name_ar} onChange={e => setForm({ ...form, name_ar: e.target.value })} dir="rtl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === "ar" ? "المستوى" : "Tier"}</Label>
                  <Select value={form.tier} onValueChange={v => setForm({ ...form, tier: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["platinum", "gold", "silver", "bronze", "custom"].map(t => (
                        <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{language === "ar" ? "السعر (SAR)" : "Price (SAR)"}</Label>
                  <Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === "ar" ? "موضع الشعار" : "Logo Placement"}</Label>
                  <Select value={form.logo_placement} onValueChange={v => setForm({ ...form, logo_placement: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="header">{language === "ar" ? "رأس الصفحة" : "Header"}</SelectItem>
                      <SelectItem value="footer">{language === "ar" ? "تذييل الصفحة" : "Footer"}</SelectItem>
                      <SelectItem value="sidebar">{language === "ar" ? "الشريط الجانبي" : "Sidebar"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-2 pb-1">
                  <Switch checked={form.logo_on_certificates} onCheckedChange={v => setForm({ ...form, logo_on_certificates: v })} />
                  <Label className="text-sm">{language === "ar" ? "على الشهادات" : "On certificates"}</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{language === "ar" ? "المزايا (سطر لكل ميزة)" : "Benefits (one per line)"}</Label>
                <Textarea rows={3} value={form.benefits} onChange={e => setForm({ ...form, benefits: e.target.value })} />
              </div>
              <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={!form.name || saveMutation.isPending}>
                {language === "ar" ? "حفظ" : "Save"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Packages Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {packages?.map(pkg => {
          const Icon = TIER_ICONS[pkg.tier] || Package;
          const benefits = Array.isArray(pkg.benefits) ? pkg.benefits : JSON.parse(pkg.benefits as string || "[]");
          return (
            <Card key={pkg.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge className={TIER_COLORS[pkg.tier] || ""}>
                    <Icon className="mr-1 h-3 w-3" />
                    {pkg.tier.charAt(0).toUpperCase() + pkg.tier.slice(1)}
                  </Badge>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(pkg)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutate(pkg.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-base">{language === "ar" && pkg.name_ar ? pkg.name_ar : pkg.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pkg.price && <p className="text-lg font-bold text-primary">{Number(pkg.price).toLocaleString()} SAR</p>}
                {benefits.length > 0 && (
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {(benefits as string[]).slice(0, 4).map((b, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-primary">•</span> {b}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex gap-2 text-xs text-muted-foreground">
                  {pkg.logo_on_certificates && <Badge variant="outline" className="text-[10px]">📜 Cert</Badge>}
                  <Badge variant="outline" className="text-[10px]">📍 {pkg.logo_placement}</Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Active Sponsorships */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            {language === "ar" ? "الرعايات النشطة" : "Active Sponsorships"}
          </CardTitle>
          <CardDescription>
            {language === "ar" ? "الشركات المرتبطة حالياً بمسابقات" : "Companies currently linked to competitions"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeSponsors?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === "ar" ? "الشركة" : "Company"}</TableHead>
                  <TableHead>{language === "ar" ? "المسابقة" : "Competition"}</TableHead>
                  <TableHead>{language === "ar" ? "المستوى" : "Tier"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeSponsors.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      {language === "ar" && s.companies?.name_ar ? s.companies.name_ar : s.companies?.name}
                    </TableCell>
                    <TableCell>
                      {language === "ar" && s.competitions?.title_ar ? s.competitions.title_ar : s.competitions?.title}
                    </TableCell>
                    <TableCell>
                      <Badge className={TIER_COLORS[s.tier] || ""}>
                        {s.tier}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {language === "ar" ? "لا توجد رعايات نشطة" : "No active sponsorships"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
