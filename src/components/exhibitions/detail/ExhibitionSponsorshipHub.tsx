import { useState, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Star, Award, Building, Crown, Gem, Medal, Send, CheckCircle, ExternalLink } from "lucide-react";
import { AnimatedCounter } from "@/components/ui/animated-counter";

interface Props { exhibitionId: string; isAr: boolean; }

const TIER_ICONS: Record<string, any> = {
  platinum: Crown, gold: Award, silver: Medal, bronze: Star, partner: Gem, patron: Crown,
};
const TIER_COLORS: Record<string, string> = {
  platinum: "from-chart-3/20 to-chart-3/5 border-chart-3/30",
  gold: "from-chart-4/20 to-chart-4/5 border-chart-4/30",
  silver: "from-muted-foreground/20 to-muted-foreground/5 border-muted-foreground/30",
  bronze: "from-chart-2/20 to-chart-2/5 border-chart-2/30",
  partner: "from-primary/20 to-primary/5 border-primary/30",
  patron: "from-chart-5/20 to-chart-5/5 border-chart-5/30",
};

export default memo(function ExhibitionSponsorshipHub({ exhibitionId, isAr }: Props) {
  const t = (en: string, ar: string) => isAr ? ar : en;
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [applyOpen, setApplyOpen] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<any>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", companyName: "", message: "", logoUrl: "", websiteUrl: "" });

  // Fetch sponsor packages
  const { data: packages = [] } = useQuery({
    queryKey: ["sponsor-packages", exhibitionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("exhibition_sponsor_packages")
        .select("*")
        .eq("exhibition_id", exhibitionId)
        .eq("is_active", true)
        .order("sort_order");
      return data || [];
    },
  });

  // Fetch existing sponsors
  const { data: sponsors = [] } = useQuery({
    queryKey: ["exhibition-sponsors-db", exhibitionId],
    queryFn: async () => {
      const { data } = await supabase
        .from("exhibition_sponsors")
        .select("*")
        .eq("exhibition_id", exhibitionId)
        .eq("is_active", true)
        .order("sort_order");
      return data || [];
    },
  });

  // Submit application
  const applyMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("exhibition_sponsor_applications").insert({
        exhibition_id: exhibitionId,
        package_id: selectedPkg?.id || null,
        applicant_name: form.name,
        applicant_email: form.email,
        applicant_phone: form.phone,
        company_name: form.companyName,
        logo_url: form.logoUrl || null,
        website_url: form.websiteUrl || null,
        message: form.message,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: t("Sponsorship application submitted! ✅", "تم إرسال طلب الرعاية! ✅") });
      setApplyOpen(false);
      setForm({ name: "", email: "", phone: "", companyName: "", message: "", logoUrl: "", websiteUrl: "" });
    },
    onError: () => toast({ title: t("Submission failed", "فشل الإرسال"), variant: "destructive" }),
  });

  // Group sponsors by tier
  const sponsorsByTier = sponsors.reduce<Record<string, any[]>>((acc, s: any) => {
    const tier = s.tier || "partner";
    if (!acc[tier]) acc[tier] = [];
    acc[tier].push(s);
    return acc;
  }, {});

  const tierOrder = ["patron", "platinum", "gold", "silver", "bronze", "partner"];

  return (
    <div className="space-y-6">
      {/* Current Sponsors Display */}
      {tierOrder.filter(t => sponsorsByTier[t]?.length > 0).map(tier => {
        const Icon = TIER_ICONS[tier] || Star;
        const color = TIER_COLORS[tier] || TIER_COLORS.partner;
        const tierLabel = tier === "patron" ? t("Patron", "راعي رسمي") : tier === "platinum" ? t("Platinum", "بلاتيني") : tier === "gold" ? t("Gold", "ذهبي") : tier === "silver" ? t("Silver", "فضي") : tier === "bronze" ? t("Bronze", "برونزي") : t("Partner", "شريك");

        return (
          <section key={tier}>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
              <div className={`flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              {tierLabel}
              <Badge variant="outline" className="text-[9px]">{sponsorsByTier[tier].length}</Badge>
            </h3>
            <div className={`grid gap-3 ${tier === "patron" || tier === "platinum" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"}`}>
              {sponsorsByTier[tier].map((sponsor: any) => (
                <Card key={sponsor.id} className={`overflow-hidden border-2 bg-gradient-to-br ${color} transition-all hover:shadow-lg hover:-translate-y-0.5`}>
                  <CardContent className={`flex items-center gap-3 ${tier === "patron" || tier === "platinum" ? "p-5" : "p-3"}`}>
                    {sponsor.logo_url ? (
                      <img src={sponsor.logo_url} alt={sponsor.name} className={`${tier === "patron" || tier === "platinum" ? "h-16 w-16" : "h-10 w-10"} rounded-xl object-contain bg-background/50 p-1`} loading="lazy" />
                    ) : (
                      <div className={`${tier === "patron" || tier === "platinum" ? "h-16 w-16" : "h-10 w-10"} flex items-center justify-center rounded-xl bg-background/50`}>
                        <Building className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={`font-semibold truncate ${tier === "patron" || tier === "platinum" ? "text-base" : "text-xs"}`}>
                        {isAr && sponsor.name_ar ? sponsor.name_ar : sponsor.name}
                      </p>
                      {sponsor.website_url && (
                        <a href={sponsor.website_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline flex items-center gap-0.5 mt-0.5">
                          <ExternalLink className="h-2.5 w-2.5" /> {t("Visit", "زيارة")}
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        );
      })}

      {/* Sponsor Packages */}
      {packages.length > 0 && (
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Gem className="h-4 w-4 text-primary" />
              {t("Sponsorship Packages", "باقات الرعاية")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {packages.map((pkg: any) => {
                const Icon = TIER_ICONS[pkg.tier] || Star;
                const color = TIER_COLORS[pkg.tier] || TIER_COLORS.partner;
                const benefits = Array.isArray(pkg.benefits) ? pkg.benefits : [];
                return (
                  <Card key={pkg.id} className={`border-2 bg-gradient-to-br ${color} transition-all hover:shadow-lg`}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5" />
                          <span className="font-bold text-sm">{isAr && pkg.name_ar ? pkg.name_ar : pkg.name}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs capitalize">{pkg.tier}</Badge>
                      </div>
                      <p className="text-lg font-bold text-primary">
                        {pkg.price > 0 ? <><AnimatedCounter value={Math.round(pkg.price)} className="inline" /> {pkg.currency}</> : t("Contact us", "تواصل معنا")}
                      </p>
                      {benefits.length > 0 && (
                        <ul className="space-y-1">
                          {benefits.slice(0, 5).map((b: string, i: number) => (
                            <li key={i} className="flex items-start gap-1.5 text-[11px]">
                              <CheckCircle className="h-3 w-3 mt-0.5 text-chart-3 shrink-0" />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <Button size="sm" className="w-full" onClick={() => { setSelectedPkg(pkg); setApplyOpen(true); }}>
                        <Send className="me-2 h-3.5 w-3.5" />
                        {t("Apply", "تقديم طلب")}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Become a Sponsor CTA */}
      {!packages.length && (
        <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
          <CardContent className="p-6 text-center">
            <Gem className="mx-auto mb-3 h-10 w-10 text-primary/40" />
            <h3 className="font-bold mb-1">{t("Become a Sponsor", "كن راعياً")}</h3>
            <p className="text-xs text-muted-foreground mb-4">{t("Partner with this exhibition to reach a wider audience", "شارك في رعاية هذا المعرض للوصول إلى جمهور أوسع")}</p>
            <Button onClick={() => setApplyOpen(true)}>
              <Send className="me-2 h-4 w-4" /> {t("Apply for Sponsorship", "تقديم طلب رعاية")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Application Dialog */}
      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Sponsorship Application", "طلب رعاية")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {selectedPkg && (
              <Badge variant="secondary" className="text-xs capitalize">{selectedPkg.name} — {selectedPkg.tier}</Badge>
            )}
            <Input placeholder={t("Your Name *", "اسمك *")} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input placeholder={t("Email *", "البريد الإلكتروني *")} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <Input placeholder={t("Phone", "الهاتف")} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            <Input placeholder={t("Company Name", "اسم الشركة")} value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} />
            <Input placeholder={t("Website URL", "رابط الموقع")} value={form.websiteUrl} onChange={e => setForm(f => ({ ...f, websiteUrl: e.target.value }))} />
            <Textarea placeholder={t("Message (optional)", "رسالة (اختياري)")} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={3} />
            <Button className="w-full" onClick={() => applyMutation.mutate()} disabled={!form.name || !form.email || applyMutation.isPending}>
              <Send className="me-2 h-4 w-4" /> {t("Submit Application", "إرسال الطلب")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});
