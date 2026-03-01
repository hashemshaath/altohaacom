import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyAccess } from "@/hooks/useCompanyAccess";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { sendNotification } from "@/lib/notifications";
import { toEnglishDigits } from "@/lib/formatNumber";
import {
  Crown, Trophy, Calendar, MapPin, Building2, CheckCircle, XCircle, Clock,
  Send, Star, Medal, Award, ArrowRight, Sparkles, Package, Eye
} from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

const TIER_CONFIG: Record<string, { icon: any; color: string; label: string; labelAr: string }> = {
  platinum: { icon: Crown, color: "text-chart-3", label: "Platinum", labelAr: "بلاتيني" },
  gold: { icon: Star, color: "text-chart-4", label: "Gold", labelAr: "ذهبي" },
  silver: { icon: Medal, color: "text-muted-foreground", label: "Silver", labelAr: "فضي" },
  bronze: { icon: Award, color: "text-chart-2", label: "Bronze", labelAr: "برونزي" },
  custom: { icon: Package, color: "text-primary", label: "Custom", labelAr: "مخصص" },
};

const STATUS_CONFIG: Record<string, { color: string; label: string; labelAr: string }> = {
  pending: { color: "bg-chart-4/10 text-chart-4 border-chart-4/30", label: "Pending", labelAr: "قيد المراجعة" },
  approved: { color: "bg-chart-5/10 text-chart-5 border-chart-5/30", label: "Approved", labelAr: "مقبول" },
  active: { color: "bg-chart-5/10 text-chart-5 border-chart-5/30", label: "Active", labelAr: "نشط" },
  rejected: { color: "bg-destructive/10 text-destructive border-destructive/30", label: "Rejected", labelAr: "مرفوض" },
  expired: { color: "bg-muted text-muted-foreground border-border", label: "Expired", labelAr: "منتهي" },
};

export default function CompanySponsorships() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { companyId } = useCompanyAccess();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAr = language === "ar";
  const [applyDialog, setApplyDialog] = useState<any>(null);
  const [selectedPackage, setSelectedPackage] = useState("");
  const [applicationNote, setApplicationNote] = useState("");
  const [detailDialog, setDetailDialog] = useState<any>(null);

  // Fetch available opportunities (competitions seeking sponsors)
  const { data: opportunities = [] } = useQuery({
    queryKey: ["company-sponsorship-opportunities", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("competitions")
        .select("id, title, title_ar, cover_image_url, status, competition_start, competition_end, city, country, is_virtual, max_participants")
        .in("status", ["registration_open", "upcoming", "in_progress"])
        .order("competition_start", { ascending: true })
        .limit(20);
      return data || [];
    },
    enabled: !!companyId,
  });

  // Fetch current sponsorships for this company
  const { data: mySponsors = [] } = useQuery({
    queryKey: ["my-company-sponsorships", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("competition_sponsors")
        .select("*, competitions(id, title, title_ar, competition_start, status), sponsorship_packages(name, name_ar, tier, price)")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!companyId,
  });

  // Fetch invitations
  const { data: invitations = [] } = useQuery({
    queryKey: ["my-sponsor-invitations", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("company_invitations")
        .select("*, competitions(id, title, title_ar)")
        .eq("company_id", companyId!)
        .in("invitation_type", ["sponsorship", "exhibition_sponsor", "section_sponsor"])
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!companyId,
  });

  // Fetch packages
  const { data: packages = [] } = useQuery({
    queryKey: ["sponsorship-packages-company"],
    queryFn: async () => {
      const { data } = await supabase
        .from("sponsorship_packages")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      return data || [];
    },
  });

  // Apply for sponsorship
  const applyMutation = useMutation({
    mutationFn: async () => {
      if (!companyId || !applyDialog || !user) throw new Error("Missing data");
      const pkg = packages.find(p => p.id === selectedPackage);
      const { error } = await supabase.from("competition_sponsors").insert({
        competition_id: applyDialog.id,
        company_id: companyId,
        package_id: selectedPackage || null,
        tier: (pkg?.tier as any) || "bronze",
        status: "pending",
        created_by: user.id,
      });
      if (error) throw error;

      // Notify competition organizer
      const { data: comp } = await supabase
        .from("competitions")
        .select("organizer_id, title")
        .eq("id", applyDialog.id)
        .single();
      if (comp?.organizer_id) {
        sendNotification({
          userId: comp.organizer_id,
          title: `New sponsorship application for ${comp.title}`,
          titleAr: `طلب رعاية جديد لـ ${comp.title}`,
          body: `A company has applied to sponsor your competition. Review and approve the application.`,
          bodyAr: `تقدمت شركة لرعاية مسابقتك. راجع الطلب وقم بالموافقة عليه.`,
          type: "info",
          channels: ["in_app", "email"],
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-company-sponsorships"] });
      setApplyDialog(null);
      setSelectedPackage("");
      setApplicationNote("");
      toast({ title: isAr ? "تم تقديم طلب الرعاية بنجاح!" : "Sponsorship application submitted!" });
    },
    onError: (e: Error) => toast({ variant: "destructive", title: "Error", description: e.message }),
  });

  // Respond to invitation
  const respondMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "accepted" | "declined" }) => {
      const { error } = await supabase.from("company_invitations")
        .update({ status, responded_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-sponsor-invitations"] });
      toast({ title: isAr ? "تم تحديث الرد" : "Response updated" });
    },
  });

  const alreadySponsoredIds = mySponsors.map((s: any) => s.competition_id);
  const availableOpportunities = opportunities.filter(c => !alreadySponsoredIds.includes(c.id));
  const pendingInvitations = invitations.filter((i: any) => i.status === "pending");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-chart-3/20 via-chart-4/10 to-primary/10 p-6 md:p-8">
        <div className="absolute -end-10 -top-10 h-40 w-40 rounded-full bg-chart-3/10 blur-3xl" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background/80 backdrop-blur-sm shadow-sm">
            <Crown className="h-7 w-7 text-chart-3" />
          </div>
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">
              {isAr ? "فرص الرعاية" : "Sponsorship Opportunities"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isAr ? "استعرض فرص الرعاية وتقدم لرعاية المسابقات" : "Browse and apply for competition sponsorships"}
            </p>
          </div>
        </div>
        {/* Quick stats */}
        <div className="relative z-10 mt-4 flex flex-wrap gap-4">
          <div className="rounded-xl bg-background/60 px-4 py-2 backdrop-blur-sm">
            <p className="text-xs text-muted-foreground">{isAr ? "الرعايات النشطة" : "Active"}</p>
            <p className="text-xl font-bold">{mySponsors.filter((s: any) => s.status === "active").length}</p>
          </div>
          <div className="rounded-xl bg-background/60 px-4 py-2 backdrop-blur-sm">
            <p className="text-xs text-muted-foreground">{isAr ? "قيد المراجعة" : "Pending"}</p>
            <p className="text-xl font-bold text-chart-4">{mySponsors.filter((s: any) => s.status === "pending").length}</p>
          </div>
          <div className="rounded-xl bg-background/60 px-4 py-2 backdrop-blur-sm">
            <p className="text-xs text-muted-foreground">{isAr ? "دعوات جديدة" : "Invitations"}</p>
            <p className="text-xl font-bold text-primary">{pendingInvitations.length}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="opportunities">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="opportunities" className="gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            {isAr ? "الفرص المتاحة" : "Opportunities"}
            {availableOpportunities.length > 0 && (
              <Badge variant="secondary" className="ms-1 text-[10px] px-1.5">{availableOpportunities.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="my-sponsorships" className="gap-1.5">
            <Crown className="h-3.5 w-3.5" />
            {isAr ? "رعاياتي" : "My Sponsorships"}
          </TabsTrigger>
          <TabsTrigger value="invitations" className="gap-1.5">
            <Send className="h-3.5 w-3.5" />
            {isAr ? "الدعوات" : "Invitations"}
            {pendingInvitations.length > 0 && (
              <Badge variant="destructive" className="ms-1 text-[10px] px-1.5">{pendingInvitations.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="packages" className="gap-1.5">
            <Package className="h-3.5 w-3.5" />
            {isAr ? "الباقات" : "Packages"}
          </TabsTrigger>
        </TabsList>

        {/* Opportunities */}
        <TabsContent value="opportunities" className="mt-4 space-y-4">
          {availableOpportunities.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
                <p className="text-muted-foreground">{isAr ? "لا توجد فرص رعاية متاحة حالياً" : "No sponsorship opportunities available right now"}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {availableOpportunities.map((comp: any) => {
                const title = isAr && comp.title_ar ? comp.title_ar : comp.title;
                return (
                  <Card key={comp.id} className="overflow-hidden transition-all hover:shadow-md">
                    <div className="flex">
                      <div className="relative w-32 shrink-0 bg-muted">
                        {comp.cover_image_url ? (
                          <img src={comp.cover_image_url} alt={title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Trophy className="h-8 w-8 text-muted-foreground/20" />
                          </div>
                        )}
                      </div>
                      <CardContent className="flex-1 p-4">
                        <h3 className="mb-1 font-semibold line-clamp-2">{title}</h3>
                        <div className="mb-3 space-y-1 text-xs text-muted-foreground">
                          {comp.competition_start && (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(comp.competition_start), "MMM d, yyyy")}
                            </div>
                          )}
                          {comp.city && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3 w-3" />
                              {comp.city}{comp.country ? `, ${comp.country}` : ""}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => setApplyDialog(comp)}>
                            <Crown className="me-1 h-3 w-3" />
                            {isAr ? "تقدم للرعاية" : "Apply"}
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/competitions/${comp.id}`}>
                              <Eye className="me-1 h-3 w-3" />
                              {isAr ? "التفاصيل" : "Details"}
                            </Link>
                          </Button>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* My Sponsorships */}
        <TabsContent value="my-sponsorships" className="mt-4 space-y-3">
          {mySponsors.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Crown className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
                <p className="text-muted-foreground">{isAr ? "لا توجد رعايات حالياً" : "No sponsorships yet"}</p>
              </CardContent>
            </Card>
          ) : (
            mySponsors.map((sponsor: any) => {
              const comp = sponsor.competitions;
              const pkg = sponsor.sponsorship_packages;
              const tier = TIER_CONFIG[sponsor.tier] || TIER_CONFIG.bronze;
              const TierIcon = tier.icon;
              const st = STATUS_CONFIG[sponsor.status] || STATUS_CONFIG.pending;

              return (
                <Card key={sponsor.id} className="transition-all hover:shadow-sm">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted`}>
                      <TierIcon className={`h-6 w-6 ${tier.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {isAr && comp?.title_ar ? comp.title_ar : comp?.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="outline" className={st.color}>
                          {isAr ? st.labelAr : st.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {isAr ? tier.labelAr : tier.label}
                          {pkg?.price ? ` · ${toEnglishDigits(Number(pkg.price).toLocaleString())} SAR` : ""}
                        </span>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" asChild>
                      <Link to={`/competitions/${comp?.id}`}>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Invitations */}
        <TabsContent value="invitations" className="mt-4 space-y-3">
          {invitations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Send className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
                <p className="text-muted-foreground">{isAr ? "لا توجد دعوات" : "No invitations yet"}</p>
              </CardContent>
            </Card>
          ) : (
            invitations.map((inv: any) => {
              const st = STATUS_CONFIG[inv.status] || STATUS_CONFIG.pending;
              return (
                <Card key={inv.id}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <Send className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{isAr && inv.title_ar ? inv.title_ar : inv.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {inv.competitions && (isAr && inv.competitions.title_ar ? inv.competitions.title_ar : inv.competitions.title)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={st.color}>
                        {isAr ? st.labelAr : st.label}
                      </Badge>
                      {inv.status === "pending" && (
                        <div className="flex gap-1">
                          <Button size="icon" className="h-8 w-8" onClick={() => respondMutation.mutate({ id: inv.id, status: "accepted" })}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => respondMutation.mutate({ id: inv.id, status: "declined" })}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Packages */}
        <TabsContent value="packages" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {packages.map((pkg: any) => {
              const tier = TIER_CONFIG[pkg.tier] || TIER_CONFIG.bronze;
              const TierIcon = tier.icon;
              const benefits = Array.isArray(pkg.benefits) ? pkg.benefits : JSON.parse(pkg.benefits || "[]");
              return (
                <Card key={pkg.id} className={`relative ${pkg.tier === "gold" ? "border-chart-4 shadow-md ring-1 ring-chart-4/20" : ""}`}>
                  {pkg.tier === "gold" && <div className="absolute top-0 inset-x-0 h-1 bg-chart-4" />}
                  <CardHeader className="pb-2 text-center">
                    <div className={`mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full ${pkg.tier === "platinum" ? "bg-chart-3/10" : pkg.tier === "gold" ? "bg-chart-4/10" : "bg-muted"}`}>
                      <TierIcon className={`h-6 w-6 ${tier.color}`} />
                    </div>
                    <CardTitle className="text-lg">
                      {isAr && pkg.name_ar ? pkg.name_ar : pkg.name}
                    </CardTitle>
                    {pkg.price && (
                      <p className="text-2xl font-bold text-primary mt-1">
                        {toEnglishDigits(Number(pkg.price).toLocaleString())} <span className="text-sm">{pkg.currency || "SAR"}</span>
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    {benefits.length > 0 && (
                      <ul className="space-y-2 text-sm">
                        {(benefits as string[]).map((b, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {pkg.logo_on_certificates && (
                      <Badge variant="outline" className="mt-3 text-[10px]">
                        📜 {isAr ? "على الشهادات" : "On Certificates"}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Apply Dialog */}
      <Dialog open={!!applyDialog} onOpenChange={(o) => !o && setApplyDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isAr ? "تقدم لرعاية المسابقة" : "Apply for Sponsorship"}
            </DialogTitle>
          </DialogHeader>
          {applyDialog && (
            <div className="space-y-4">
              <div className="rounded-xl border p-3">
                <p className="font-medium">{isAr && applyDialog.title_ar ? applyDialog.title_ar : applyDialog.title}</p>
                {applyDialog.competition_start && (
                  <p className="text-xs text-muted-foreground mt-1">
                    <Calendar className="inline me-1 h-3 w-3" />
                    {format(new Date(applyDialog.competition_start), "MMM d, yyyy")}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "باقة الرعاية" : "Sponsorship Package"}</Label>
                <Select value={selectedPackage} onValueChange={setSelectedPackage}>
                  <SelectTrigger>
                    <SelectValue placeholder={isAr ? "اختر الباقة" : "Select package"} />
                  </SelectTrigger>
                  <SelectContent>
                    {packages.map((pkg: any) => (
                      <SelectItem key={pkg.id} value={pkg.id}>
                        {isAr && pkg.name_ar ? pkg.name_ar : pkg.name}
                        {pkg.price ? ` - ${toEnglishDigits(Number(pkg.price).toLocaleString())} SAR` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{isAr ? "ملاحظات إضافية" : "Additional Notes"}</Label>
                <Textarea
                  value={applicationNote}
                  onChange={e => setApplicationNote(e.target.value)}
                  placeholder={isAr ? "أي تفاصيل إضافية..." : "Any additional details..."}
                  rows={3}
                />
              </div>
              <div className="rounded-xl bg-chart-4/5 border border-chart-4/20 p-3">
                <p className="text-xs text-muted-foreground">
                  <Clock className="inline me-1 h-3 w-3" />
                  {isAr
                    ? "سيتم مراجعة طلبك من قبل منظم المسابقة. ستتلقى إشعاراً عند الموافقة أو الرفض."
                    : "Your application will be reviewed by the competition organizer. You'll be notified once approved or declined."}
                </p>
              </div>
              <Button
                className="w-full"
                onClick={() => applyMutation.mutate()}
                disabled={!selectedPackage || applyMutation.isPending}
              >
                <Send className="me-2 h-4 w-4" />
                {isAr ? "إرسال طلب الرعاية" : "Submit Application"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
