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
import { toEnglishDigits } from "@/lib/formatNumber";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Crown, Star, Medal, Award, Plus, Edit, Trash2, Building, Package, Send, CheckCircle, XCircle, Clock, Mail } from "lucide-react";
import { format } from "date-fns";

const TIER_ICONS: Record<string, any> = {
  platinum: Crown, gold: Star, silver: Medal, bronze: Award, custom: Package,
};
const TIER_COLORS: Record<string, string> = {
  platinum: "bg-chart-3/10 text-chart-3", gold: "bg-chart-4/10 text-chart-4",
  silver: "bg-muted text-muted-foreground", bronze: "bg-chart-2/10 text-chart-2",
  custom: "bg-primary/10 text-primary",
};

export default function SponsorsAdmin() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<any>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const [form, setForm] = useState({
    name: "", name_ar: "", tier: "gold" as string, description: "", description_ar: "",
    price: "", logo_placement: "footer", logo_on_certificates: false, benefits: "",
  });

  const [inviteForm, setInviteForm] = useState({
    company_id: "", competition_id: "", package_id: "",
    title: "", title_ar: "", description: "", description_ar: "",
    invitation_type: "sponsorship", event_date: "", expires_at: "",
  });

  const { data: packages } = useQuery({
    queryKey: ["sponsorship-packages-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sponsorship_packages").select("*").order("sort_order");
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

  const { data: allInvitations } = useQuery({
    queryKey: ["all-sponsor-invitations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_invitations")
        .select("*, companies(name, name_ar, logo_url), competitions(title, title_ar)")
        .in("invitation_type", ["sponsorship", "exhibition_sponsor", "section_sponsor"])
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const { data: sponsorCompanies } = useQuery({
    queryKey: ["sponsor-companies-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, name_ar")
        .eq("status", "active")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: inviteDialogOpen,
  });

  const { data: competitionsList } = useQuery({
    queryKey: ["competitions-for-invite"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitions")
        .select("id, title, title_ar, competition_start")
        .in("status", ["draft", "upcoming", "registration_open", "in_progress"])
        .order("competition_start", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: inviteDialogOpen,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const benefitsArray = form.benefits.split("\n").filter(b => b.trim());
      const payload = {
        name: form.name, name_ar: form.name_ar || null, tier: form.tier as any,
        description: form.description || null, description_ar: form.description_ar || null,
        price: form.price ? parseFloat(form.price) : null, logo_placement: form.logo_placement,
        logo_on_certificates: form.logo_on_certificates,
        benefits: JSON.stringify(benefitsArray), created_by: user?.id,
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

  const sendInviteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("company_invitations").insert({
        company_id: inviteForm.company_id,
        competition_id: inviteForm.competition_id || null,
        invitation_type: inviteForm.invitation_type,
        title: inviteForm.title,
        title_ar: inviteForm.title_ar || null,
        description: inviteForm.description || null,
        description_ar: inviteForm.description_ar || null,
        event_date: inviteForm.event_date || null,
        expires_at: inviteForm.expires_at || null,
        status: "pending",
        created_by: user?.id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-sponsor-invitations"] });
      setInviteDialogOpen(false);
      resetInviteForm();
      toast({ title: language === "ar" ? "تم إرسال الدعوة" : "Invitation sent" });
    },
    onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.message }),
  });

  const resetForm = () => {
    setForm({ name: "", name_ar: "", tier: "gold", description: "", description_ar: "", price: "", logo_placement: "footer", logo_on_certificates: false, benefits: "" });
    setEditingPkg(null);
  };

  const resetInviteForm = () => {
    setInviteForm({ company_id: "", competition_id: "", package_id: "", title: "", title_ar: "", description: "", description_ar: "", invitation_type: "sponsorship", event_date: "", expires_at: "" });
  };

  const openEdit = (pkg: any) => {
    const benefits = Array.isArray(pkg.benefits) ? pkg.benefits : JSON.parse(pkg.benefits || "[]");
    setForm({
      name: pkg.name, name_ar: pkg.name_ar || "", tier: pkg.tier,
      description: pkg.description || "", description_ar: pkg.description_ar || "",
      price: pkg.price?.toString() || "", logo_placement: pkg.logo_placement || "footer",
      logo_on_certificates: pkg.logo_on_certificates || false, benefits: benefits.join("\n"),
    });
    setEditingPkg(pkg);
    setDialogOpen(true);
  };

  const invStatusColors: Record<string, string> = {
    pending: "bg-chart-4/10 text-chart-4", accepted: "bg-chart-5/10 text-chart-5",
    declined: "bg-destructive/10 text-destructive", expired: "bg-muted text-muted-foreground",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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
              {language === "ar" ? "إدارة باقات الرعاية والدعوات" : "Manage packages, invitations & sponsors"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setInviteDialogOpen(true)}>
            <Send className="me-2 h-4 w-4" />
            {language === "ar" ? "إرسال دعوة" : "Send Invitation"}
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="me-2 h-4 w-4" />{language === "ar" ? "باقة جديدة" : "New Package"}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingPkg ? (language === "ar" ? "تعديل الباقة" : "Edit Package") : (language === "ar" ? "باقة رعاية جديدة" : "New Sponsorship Package")}
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
      </div>

      <Tabs defaultValue="packages">
        <TabsList>
          <TabsTrigger value="packages">{language === "ar" ? "الباقات" : "Packages"}</TabsTrigger>
          <TabsTrigger value="invitations">
            {language === "ar" ? "الدعوات" : "Invitations"}
            {allInvitations?.filter(i => i.status === "pending").length ? (
              <Badge variant="secondary" className="ms-1.5 text-[10px] px-1.5">{allInvitations.filter(i => i.status === "pending").length}</Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="active">{language === "ar" ? "الرعايات النشطة" : "Active"}</TabsTrigger>
        </TabsList>

        {/* Packages Tab */}
        <TabsContent value="packages" className="space-y-4 mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {packages?.map(pkg => {
              const Icon = TIER_ICONS[pkg.tier] || Package;
              const benefits = Array.isArray(pkg.benefits) ? pkg.benefits : JSON.parse(pkg.benefits as string || "[]");
              return (
                <Card key={pkg.id} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge className={TIER_COLORS[pkg.tier] || ""}>
                        <Icon className="me-1 h-3 w-3" />
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
                    {pkg.price && <p className="text-lg font-bold text-primary">{toEnglishDigits(Number(pkg.price).toLocaleString())} SAR</p>}
                    {benefits.length > 0 && (
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        {(benefits as string[]).slice(0, 4).map((b, i) => (
                          <li key={i} className="flex items-start gap-1"><span className="text-primary">•</span> {b}</li>
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
        </TabsContent>

        {/* Invitations Tab */}
        <TabsContent value="invitations" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                {language === "ar" ? "دعوات الرعاية" : "Sponsorship Invitations"}
              </CardTitle>
              <CardDescription>
                {language === "ar" ? "تتبع جميع الدعوات المرسلة للرعاة" : "Track all invitations sent to sponsors"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {allInvitations?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === "ar" ? "الشركة" : "Company"}</TableHead>
                      <TableHead>{language === "ar" ? "العنوان" : "Title"}</TableHead>
                      <TableHead>{language === "ar" ? "المسابقة" : "Competition"}</TableHead>
                      <TableHead>{language === "ar" ? "النوع" : "Type"}</TableHead>
                      <TableHead>{language === "ar" ? "التاريخ" : "Date"}</TableHead>
                      <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allInvitations.map((inv: any) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">
                          {language === "ar" && inv.companies?.name_ar ? inv.companies.name_ar : inv.companies?.name}
                        </TableCell>
                        <TableCell>{language === "ar" && inv.title_ar ? inv.title_ar : inv.title}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {inv.competitions
                            ? (language === "ar" && inv.competitions.title_ar ? inv.competitions.title_ar : inv.competitions.title)
                            : "—"}
                        </TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{inv.invitation_type}</Badge></TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {inv.created_at ? format(new Date(inv.created_at), "yyyy-MM-dd") : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge className={invStatusColors[inv.status] || ""}>{inv.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {language === "ar" ? "لا توجد دعوات بعد" : "No invitations yet"}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Sponsorships Tab */}
        <TabsContent value="active" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                {language === "ar" ? "الرعايات النشطة" : "Active Sponsorships"}
              </CardTitle>
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
                          <Badge className={TIER_COLORS[s.tier] || ""}>{s.tier}</Badge>
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
        </TabsContent>
      </Tabs>

      {/* Send Invitation Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={(o) => { setInviteDialogOpen(o); if (!o) resetInviteForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{language === "ar" ? "إرسال دعوة رعاية" : "Send Sponsorship Invitation"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{language === "ar" ? "الشركة" : "Company"}</Label>
              <Select value={inviteForm.company_id} onValueChange={v => setInviteForm({ ...inviteForm, company_id: v })}>
                <SelectTrigger><SelectValue placeholder={language === "ar" ? "اختر شركة" : "Select company"} /></SelectTrigger>
                <SelectContent>
                  {sponsorCompanies?.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {language === "ar" && c.name_ar ? c.name_ar : c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{language === "ar" ? "المسابقة (اختياري)" : "Competition (optional)"}</Label>
              <Select value={inviteForm.competition_id} onValueChange={v => setInviteForm({ ...inviteForm, competition_id: v })}>
                <SelectTrigger><SelectValue placeholder={language === "ar" ? "اختر مسابقة" : "Select competition"} /></SelectTrigger>
                <SelectContent>
                  {competitionsList?.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {language === "ar" && c.title_ar ? c.title_ar : c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{language === "ar" ? "نوع الدعوة" : "Invitation Type"}</Label>
              <Select value={inviteForm.invitation_type} onValueChange={v => setInviteForm({ ...inviteForm, invitation_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sponsorship">{language === "ar" ? "رعاية كاملة" : "Full Sponsorship"}</SelectItem>
                  <SelectItem value="section_sponsor">{language === "ar" ? "رعاية قسم" : "Section Sponsor"}</SelectItem>
                  <SelectItem value="exhibition_sponsor">{language === "ar" ? "رعاية معرض" : "Exhibition Sponsor"}</SelectItem>
                  <SelectItem value="participation">{language === "ar" ? "مشاركة" : "Participation"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === "ar" ? "العنوان (EN)" : "Title (EN)"}</Label>
                <Input value={inviteForm.title} onChange={e => setInviteForm({ ...inviteForm, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{language === "ar" ? "العنوان (AR)" : "Title (AR)"}</Label>
                <Input value={inviteForm.title_ar} onChange={e => setInviteForm({ ...inviteForm, title_ar: e.target.value })} dir="rtl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{language === "ar" ? "الوصف" : "Description"}</Label>
              <Textarea value={inviteForm.description} onChange={e => setInviteForm({ ...inviteForm, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{language === "ar" ? "تاريخ الفعالية" : "Event Date"}</Label>
                <Input type="date" value={inviteForm.event_date} onChange={e => setInviteForm({ ...inviteForm, event_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{language === "ar" ? "ينتهي في" : "Expires At"}</Label>
                <Input type="date" value={inviteForm.expires_at} onChange={e => setInviteForm({ ...inviteForm, expires_at: e.target.value })} />
              </div>
            </div>
            <Button
              className="w-full"
              onClick={() => sendInviteMutation.mutate()}
              disabled={!inviteForm.company_id || !inviteForm.title || sendInviteMutation.isPending}
            >
              <Send className="me-2 h-4 w-4" />
              {language === "ar" ? "إرسال الدعوة" : "Send Invitation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
