import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { useLanguage } from "@/i18n/LanguageContext";
import { useEstablishments, useCreateEstablishment } from "@/hooks/useEstablishments";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2, MapPin, Star, Search, Plus, Globe, Phone, Mail } from "lucide-react";

const establishmentTypes = [
  { value: "restaurant", en: "Restaurant", ar: "مطعم" },
  { value: "hotel", en: "Hotel", ar: "فندق" },
  { value: "cafe", en: "Café", ar: "مقهى" },
  { value: "catering", en: "Catering", ar: "تموين" },
  { value: "bakery", en: "Bakery", ar: "مخبز" },
  { value: "food_truck", en: "Food Truck", ar: "عربة طعام" },
  { value: "training_center", en: "Training Center", ar: "مركز تدريب" },
  { value: "other", en: "Other", ar: "أخرى" },
];

export default function Establishments() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: establishments, isLoading } = useEstablishments({
    search: search || undefined,
    type: typeFilter !== "all" ? typeFilter : undefined,
  });
  const createMutation = useCreateEstablishment();

  const [form, setForm] = useState({ name: "", name_ar: "", type: "restaurant", description: "", city: "", country_code: "", phone: "", email: "", website: "", cuisine_type: "" });

  const handleCreate = () => {
    createMutation.mutate(form, {
      onSuccess: () => {
        setDialogOpen(false);
        setForm({ name: "", name_ar: "", type: "restaurant", description: "", city: "", country_code: "", phone: "", email: "", website: "", cuisine_type: "" });
      },
    });
  };

  return (
    <>
      <SEOHead title={isAr ? "المنشآت | التحاء" : "Establishments | Altohaa"} description="Directory of restaurants, hotels, and food establishments" />
      <Header />
      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative overflow-hidden border-b bg-gradient-to-br from-primary/5 via-background to-primary/10 py-16">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 end-0 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute bottom-0 start-0 h-60 w-60 rounded-full bg-chart-2/5 blur-3xl" />
          </div>
          <div className="container relative text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold md:text-4xl">{isAr ? "دليل المنشآت" : "Establishments Directory"}</h1>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              {isAr ? "تصفح المطاعم والفنادق ومنشآت الأغذية حيث يعمل الطهاة ويتدربون" : "Browse restaurants, hotels, and food establishments where chefs work and train"}
            </p>
          </div>
        </section>

        {/* Filters */}
        <div className="container py-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={isAr ? "ابحث عن منشأة..." : "Search establishments..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isAr ? "جميع الأنواع" : "All Types"}</SelectItem>
                {establishmentTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{isAr ? t.ar : t.en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {user && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="me-2 h-4 w-4" />{isAr ? "إضافة منشأة" : "Add Establishment"}</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{isAr ? "إضافة منشأة جديدة" : "Add New Establishment"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div><Label>{isAr ? "الاسم" : "Name"} *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                    <div><Label>{isAr ? "الاسم بالعربية" : "Name (Arabic)"}</Label><Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} dir="rtl" /></div>
                    <div>
                      <Label>{isAr ? "النوع" : "Type"}</Label>
                      <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {establishmentTypes.map((t) => (
                            <SelectItem key={t.value} value={t.value}>{isAr ? t.ar : t.en}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>{isAr ? "المدينة" : "City"}</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
                    <div><Label>{isAr ? "الوصف" : "Description"}</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
                    <div><Label>{isAr ? "نوع المطبخ" : "Cuisine Type"}</Label><Input value={form.cuisine_type} onChange={(e) => setForm({ ...form, cuisine_type: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>{isAr ? "الهاتف" : "Phone"}</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                      <div><Label>{isAr ? "البريد" : "Email"}</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                    </div>
                    <div><Label>{isAr ? "الموقع الإلكتروني" : "Website"}</Label><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
                    <Button className="w-full" onClick={handleCreate} disabled={!form.name || createMutation.isPending}>
                      {createMutation.isPending ? (isAr ? "جاري الإضافة..." : "Adding...") : (isAr ? "إضافة" : "Add")}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Grid */}
        <div className="container pb-16">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
            </div>
          ) : !establishments?.length ? (
            <div className="py-20 text-center">
              <Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
              <p className="text-muted-foreground">{isAr ? "لا توجد منشآت بعد" : "No establishments found"}</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {establishments.map((est) => {
                const name = isAr && est.name_ar ? est.name_ar : est.name;
                const typeLabel = establishmentTypes.find((t) => t.value === est.type);
                return (
                  <Link key={est.id} to={`/establishments/${est.id}`}>
                    <Card className="h-full transition-all hover:shadow-md hover:-translate-y-0.5">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3">
                          {est.logo_url ? (
                            <img src={est.logo_url} alt={name} className="h-12 w-12 rounded-lg object-cover" />
                          ) : (
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                              <Building2 className="h-6 w-6 text-primary" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold truncate">{name}</h3>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              <Badge variant="secondary" className="text-xs">{isAr ? typeLabel?.ar : typeLabel?.en}</Badge>
                              {est.is_verified && <Badge variant="outline" className="text-xs text-chart-3">{isAr ? "موثق" : "Verified"}</Badge>}
                            </div>
                          </div>
                        </div>
                        {est.description && (
                          <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{isAr && est.description_ar ? est.description_ar : est.description}</p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                          {est.city && (
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{isAr && est.city_ar ? est.city_ar : est.city}</span>
                          )}
                          {est.cuisine_type && (
                            <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{isAr && est.cuisine_type_ar ? est.cuisine_type_ar : est.cuisine_type}</span>
                          )}
                          {est.star_rating && (
                            <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-chart-4 text-chart-4" />{est.star_rating}</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
