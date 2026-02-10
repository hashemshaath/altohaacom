import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useEstablishment, useEstablishmentAssociations, useAddAssociation, useAddQualification, useAssociationQualifications } from "@/hooks/useEstablishments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, MapPin, Star, Phone, Mail, Globe, Users, Award, Calendar, Plus, Briefcase } from "lucide-react";
import { format } from "date-fns";

const associationTypes = [
  { value: "employment", en: "Employment", ar: "توظيف" },
  { value: "training", en: "Training", ar: "تدريب" },
  { value: "internship", en: "Internship", ar: "تدريب عملي" },
  { value: "consulting", en: "Consulting", ar: "استشارة" },
  { value: "ownership", en: "Ownership", ar: "ملكية" },
  { value: "freelance", en: "Freelance", ar: "عمل حر" },
];

const qualificationTypes = [
  { value: "certificate", en: "Certificate", ar: "شهادة" },
  { value: "diploma", en: "Diploma", ar: "دبلوم" },
  { value: "license", en: "License", ar: "رخصة" },
  { value: "award", en: "Award", ar: "جائزة" },
  { value: "training_completion", en: "Training Completion", ar: "إتمام تدريب" },
  { value: "other", en: "Other", ar: "أخرى" },
];

const establishmentTypeLabels: Record<string, { en: string; ar: string }> = {
  restaurant: { en: "Restaurant", ar: "مطعم" },
  hotel: { en: "Hotel", ar: "فندق" },
  cafe: { en: "Café", ar: "مقهى" },
  catering: { en: "Catering", ar: "تموين" },
  bakery: { en: "Bakery", ar: "مخبز" },
  food_truck: { en: "Food Truck", ar: "عربة طعام" },
  training_center: { en: "Training Center", ar: "مركز تدريب" },
  other: { en: "Other", ar: "أخرى" },
};

export default function EstablishmentDetail() {
  const { id } = useParams<{ id: string }>();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { user } = useAuth();
  const { data: est, isLoading } = useEstablishment(id);
  const { data: associations } = useEstablishmentAssociations(id);
  const addAssociation = useAddAssociation();
  const addQualification = useAddQualification();

  const [assocDialogOpen, setAssocDialogOpen] = useState(false);
  const [qualDialogOpen, setQualDialogOpen] = useState(false);
  const [selectedAssocId, setSelectedAssocId] = useState<string | null>(null);

  const [assocForm, setAssocForm] = useState({
    association_type: "employment", role_title: "", department: "", start_date: "", end_date: "", is_current: false, description: "",
  });
  const [qualForm, setQualForm] = useState({
    qualification_name: "", qualification_type: "certificate", issued_date: "", credential_id: "", description: "",
  });

  const handleAddAssoc = () => {
    if (!id) return;
    addAssociation.mutate({ ...assocForm, establishment_id: id, start_date: assocForm.start_date || undefined, end_date: assocForm.end_date || undefined }, {
      onSuccess: () => { setAssocDialogOpen(false); setAssocForm({ association_type: "employment", role_title: "", department: "", start_date: "", end_date: "", is_current: false, description: "" }); },
    });
  };

  const handleAddQual = () => {
    if (!selectedAssocId) return;
    addQualification.mutate({ ...qualForm, association_id: selectedAssocId, issued_date: qualForm.issued_date || undefined }, {
      onSuccess: () => { setQualDialogOpen(false); setQualForm({ qualification_name: "", qualification_type: "certificate", issued_date: "", credential_id: "", description: "" }); },
    });
  };

  if (isLoading) {
    return (<><Header /><div className="container py-10"><Skeleton className="h-64 w-full rounded-xl" /></div><Footer /></>);
  }

  if (!est) {
    return (<><Header /><div className="container py-20 text-center"><Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" /><p className="text-muted-foreground">{isAr ? "المنشأة غير موجودة" : "Establishment not found"}</p></div><Footer /></>);
  }

  const name = isAr && est.name_ar ? est.name_ar : est.name;
  const typeLabel = establishmentTypeLabels[est.type] || establishmentTypeLabels.other;

  return (
    <>
      <SEOHead title={`${name} | Altohaa`} description={est.description || `${name} - culinary establishment`} />
      <Header />
      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative overflow-hidden border-b bg-gradient-to-br from-primary/5 via-background to-primary/10 py-12">
          <div className="container">
            <div className="flex items-start gap-5">
              {est.logo_url ? (
                <img src={est.logo_url} alt={name} className="h-20 w-20 rounded-2xl object-cover shadow-sm" />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                  <Building2 className="h-10 w-10 text-primary" />
                </div>
              )}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold md:text-3xl">{name}</h1>
                  {est.is_verified && <Badge variant="outline" className="text-chart-3 border-chart-3">{isAr ? "موثق" : "Verified"}</Badge>}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="secondary">{isAr ? typeLabel.ar : typeLabel.en}</Badge>
                  {est.cuisine_type && <Badge variant="outline">{isAr && est.cuisine_type_ar ? est.cuisine_type_ar : est.cuisine_type}</Badge>}
                  {est.star_rating && (
                    <Badge variant="outline" className="gap-1"><Star className="h-3 w-3 fill-chart-4 text-chart-4" />{est.star_rating}</Badge>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {est.city && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{isAr && est.city_ar ? est.city_ar : est.city}{est.country_code ? `, ${est.country_code}` : ""}</span>}
                  {est.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{est.phone}</span>}
                  {est.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{est.email}</span>}
                  {est.website && <a href={est.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline"><Globe className="h-3.5 w-3.5" />{isAr ? "الموقع" : "Website"}</a>}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <div className="container py-8">
          <Tabs defaultValue="about">
            <TabsList>
              <TabsTrigger value="about">{isAr ? "حول" : "About"}</TabsTrigger>
              <TabsTrigger value="chefs" className="gap-1.5"><Users className="h-3.5 w-3.5" />{isAr ? "الطهاة" : "Chefs"} {associations?.length ? `(${associations.length})` : ""}</TabsTrigger>
            </TabsList>

            <TabsContent value="about" className="mt-6">
              {est.description && (
                <Card>
                  <CardContent className="p-5">
                    <p className="text-sm leading-relaxed text-muted-foreground">{isAr && est.description_ar ? est.description_ar : est.description}</p>
                  </CardContent>
                </Card>
              )}
              {est.address && (
                <Card className="mt-4">
                  <CardContent className="flex items-center gap-3 p-5">
                    <MapPin className="h-5 w-5 text-primary" />
                    <p className="text-sm">{isAr && est.address_ar ? est.address_ar : est.address}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="chefs" className="mt-6 space-y-4">
              {user && (
                <div className="flex justify-end">
                  <Dialog open={assocDialogOpen} onOpenChange={setAssocDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm"><Plus className="me-1.5 h-3.5 w-3.5" />{isAr ? "ربط حسابي" : "Link My Profile"}</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader><DialogTitle>{isAr ? "ربط حسابك بهذه المنشأة" : "Link Your Profile"}</DialogTitle></DialogHeader>
                      <div className="space-y-3">
                        <div>
                          <Label>{isAr ? "نوع الارتباط" : "Association Type"}</Label>
                          <Select value={assocForm.association_type} onValueChange={(v) => setAssocForm({ ...assocForm, association_type: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {associationTypes.map((t) => (<SelectItem key={t.value} value={t.value}>{isAr ? t.ar : t.en}</SelectItem>))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div><Label>{isAr ? "المسمى الوظيفي" : "Role/Title"}</Label><Input value={assocForm.role_title} onChange={(e) => setAssocForm({ ...assocForm, role_title: e.target.value })} /></div>
                        <div><Label>{isAr ? "القسم" : "Department"}</Label><Input value={assocForm.department} onChange={(e) => setAssocForm({ ...assocForm, department: e.target.value })} /></div>
                        <div className="grid grid-cols-2 gap-3">
                          <div><Label>{isAr ? "من" : "Start Date"}</Label><Input type="date" value={assocForm.start_date} onChange={(e) => setAssocForm({ ...assocForm, start_date: e.target.value })} /></div>
                          <div><Label>{isAr ? "إلى" : "End Date"}</Label><Input type="date" value={assocForm.end_date} onChange={(e) => setAssocForm({ ...assocForm, end_date: e.target.value })} disabled={assocForm.is_current} /></div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox checked={assocForm.is_current} onCheckedChange={(c) => setAssocForm({ ...assocForm, is_current: !!c, end_date: "" })} />
                          <Label className="text-sm">{isAr ? "أعمل حالياً هنا" : "I currently work here"}</Label>
                        </div>
                        <div><Label>{isAr ? "ملاحظات" : "Notes"}</Label><Textarea value={assocForm.description} onChange={(e) => setAssocForm({ ...assocForm, description: e.target.value })} rows={2} /></div>
                        <Button className="w-full" onClick={handleAddAssoc} disabled={addAssociation.isPending}>
                          {addAssociation.isPending ? "..." : isAr ? "ربط" : "Link"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              {!associations?.length ? (
                <div className="py-12 text-center">
                  <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">{isAr ? "لا يوجد طهاة مرتبطون بعد" : "No chefs associated yet"}</p>
                </div>
              ) : (
                associations.map((a) => {
                  const profile = a.profiles as any;
                  const assocLabel = associationTypes.find((t) => t.value === a.association_type);
                  return (
                    <Card key={a.id} className="transition-all hover:shadow-sm">
                      <CardContent className="flex items-center gap-4 p-4">
                        <Link to={profile?.username ? `/${profile.username}` : "#"}>
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={profile?.avatar_url} />
                            <AvatarFallback>{(profile?.full_name || "?")[0]}</AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{isAr && profile?.full_name_ar ? profile.full_name_ar : profile?.full_name || "Chef"}</p>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            <Badge variant="secondary" className="text-xs">{isAr ? assocLabel?.ar : assocLabel?.en}</Badge>
                            {a.role_title && <Badge variant="outline" className="text-xs">{a.role_title}</Badge>}
                            {a.is_current && <Badge className="bg-chart-3/20 text-chart-3 text-xs">{isAr ? "حالي" : "Current"}</Badge>}
                          </div>
                          {a.start_date && (
                            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(a.start_date), "MMM yyyy")}
                              {a.end_date ? ` - ${format(new Date(a.end_date), "MMM yyyy")}` : a.is_current ? ` - ${isAr ? "الآن" : "Present"}` : ""}
                            </p>
                          )}
                        </div>
                        {user && a.user_id === user.id && (
                          <Button size="sm" variant="outline" onClick={() => { setSelectedAssocId(a.id); setQualDialogOpen(true); }}>
                            <Award className="me-1.5 h-3.5 w-3.5" />{isAr ? "مؤهل" : "Add Qualification"}
                          </Button>
                        )}
                      </CardContent>
                      {/* Inline qualifications */}
                      <AssociationQualifications associationId={a.id} isAr={isAr} />
                    </Card>
                  );
                })
              )}

              {/* Add qualification dialog */}
              <Dialog open={qualDialogOpen} onOpenChange={setQualDialogOpen}>
                <DialogContent className="max-w-md">
                  <DialogHeader><DialogTitle>{isAr ? "إضافة مؤهل" : "Add Qualification"}</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>{isAr ? "اسم المؤهل" : "Qualification Name"} *</Label><Input value={qualForm.qualification_name} onChange={(e) => setQualForm({ ...qualForm, qualification_name: e.target.value })} /></div>
                    <div>
                      <Label>{isAr ? "النوع" : "Type"}</Label>
                      <Select value={qualForm.qualification_type} onValueChange={(v) => setQualForm({ ...qualForm, qualification_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {qualificationTypes.map((t) => (<SelectItem key={t.value} value={t.value}>{isAr ? t.ar : t.en}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>{isAr ? "تاريخ الإصدار" : "Issue Date"}</Label><Input type="date" value={qualForm.issued_date} onChange={(e) => setQualForm({ ...qualForm, issued_date: e.target.value })} /></div>
                      <div><Label>{isAr ? "رقم الاعتماد" : "Credential ID"}</Label><Input value={qualForm.credential_id} onChange={(e) => setQualForm({ ...qualForm, credential_id: e.target.value })} /></div>
                    </div>
                    <div><Label>{isAr ? "وصف" : "Description"}</Label><Textarea value={qualForm.description} onChange={(e) => setQualForm({ ...qualForm, description: e.target.value })} rows={2} /></div>
                    <Button className="w-full" onClick={handleAddQual} disabled={!qualForm.qualification_name || addQualification.isPending}>
                      {addQualification.isPending ? "..." : isAr ? "إضافة" : "Add"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </>
  );
}

function AssociationQualifications({ associationId, isAr }: { associationId: string; isAr: boolean }) {
  const { data: quals } = useAssociationQualifications(associationId);
  if (!quals?.length) return null;
  const qtLabels: Record<string, { en: string; ar: string }> = {
    certificate: { en: "Certificate", ar: "شهادة" },
    diploma: { en: "Diploma", ar: "دبلوم" },
    license: { en: "License", ar: "رخصة" },
    award: { en: "Award", ar: "جائزة" },
    training_completion: { en: "Training", ar: "إتمام تدريب" },
    other: { en: "Other", ar: "أخرى" },
  };
  return (
    <div className="border-t px-4 py-3">
      <p className="mb-2 text-xs font-medium text-muted-foreground">{isAr ? "المؤهلات" : "Qualifications"}</p>
      <div className="flex flex-wrap gap-2">
        {quals.map((q) => (
          <Badge key={q.id} variant="outline" className="gap-1 text-xs">
            <Award className="h-3 w-3 text-chart-4" />
            {isAr && q.qualification_name_ar ? q.qualification_name_ar : q.qualification_name}
            {q.qualification_type && <span className="text-muted-foreground">({isAr ? qtLabels[q.qualification_type]?.ar : qtLabels[q.qualification_type]?.en})</span>}
          </Badge>
        ))}
      </div>
    </div>
  );
}
