import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { sendNotification } from "@/lib/notifications";
import { Building, Plus, Trash2, Crown, Award, Medal, Star, CheckCircle, XCircle, Clock } from "lucide-react";

interface CompetitionSponsorsPanelProps {
  competitionId: string;
  isOrganizer?: boolean;
}

const TIER_CONFIG = {
  platinum: { icon: Crown, color: "text-chart-3", bg: "bg-chart-3/10", label: "Platinum", labelAr: "بلاتيني" },
  gold: { icon: Star, color: "text-chart-4", bg: "bg-chart-4/10", label: "Gold", labelAr: "ذهبي" },
  silver: { icon: Medal, color: "text-muted-foreground", bg: "bg-muted", label: "Silver", labelAr: "فضي" },
  bronze: { icon: Award, color: "text-chart-2", bg: "bg-chart-2/10", label: "Bronze", labelAr: "برونزي" },
  custom: { icon: Star, color: "text-primary", bg: "bg-primary/10", label: "Custom", labelAr: "مخصص" },
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-chart-5/10 text-chart-5",
  pending: "bg-chart-4/10 text-chart-4",
  rejected: "bg-destructive/10 text-destructive",
};

export function CompetitionSponsorsPanel({ competitionId, isOrganizer }: CompetitionSponsorsPanelProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedPackage, setSelectedPackage] = useState("");
  const isAr = language === "ar";

  const { data: sponsors } = useQuery({
    queryKey: ["competition-sponsors", competitionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competition_sponsors")
        .select("*, companies(name, name_ar, logo_url), sponsorship_packages(name, name_ar, tier)")
        .eq("competition_id", competitionId)
        .order("tier");
      if (error) throw error;
      return data;
    },
  });

  const { data: companies } = useQuery({
    queryKey: ["sponsor-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, name_ar, logo_url, type")
        .in("type", ["sponsor", "partner"])
        .eq("status", "active");
      if (error) throw error;
      return data;
    },
    enabled: !!isOrganizer,
  });

  const { data: packages } = useQuery({
    queryKey: ["sponsorship-packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sponsorship_packages")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    enabled: !!isOrganizer,
  });

  const addSponsorMutation = useMutation({
    mutationFn: async () => {
      const pkg = packages?.find(p => p.id === selectedPackage);
      const { error } = await supabase
        .from("competition_sponsors")
        .insert({
          competition_id: competitionId,
          company_id: selectedCompany,
          package_id: selectedPackage || null,
          tier: (pkg?.tier as any) || "bronze",
          status: "active",
          created_by: user?.id,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competition-sponsors", competitionId] });
      setSelectedCompany("");
      setSelectedPackage("");
      toast({ title: isAr ? "تمت إضافة الراعي" : "Sponsor added" });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Error", description: err.message });
    },
  });

  const removeSponsorMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("competition_sponsors").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competition-sponsors", competitionId] });
      toast({ title: isAr ? "تمت إزالة الراعي" : "Sponsor removed" });
    },
  });

  // Approval / rejection of pending applications
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, companyId }: { id: string; status: string; companyId?: string }) => {
      const { error } = await supabase.from("competition_sponsors")
        .update({ status } as any)
        .eq("id", id);
      if (error) throw error;

      // Notify the company contacts
      if (companyId) {
        const { data: contacts } = await supabase
          .from("company_contacts")
          .select("user_id")
          .eq("company_id", companyId)
          .limit(5);
        if (contacts) {
          for (const contact of contacts) {
            sendNotification({
              userId: contact.user_id,
              title: status === "active" ? "Sponsorship Approved!" : "Sponsorship Application Update",
              titleAr: status === "active" ? "تمت الموافقة على الرعاية!" : "تحديث طلب الرعاية",
              body: status === "active"
                ? "Your sponsorship application has been approved. Welcome aboard!"
                : "Your sponsorship application status has been updated.",
              bodyAr: status === "active"
                ? "تمت الموافقة على طلب الرعاية الخاص بكم. أهلاً بكم!"
                : "تم تحديث حالة طلب الرعاية الخاص بكم.",
              type: status === "active" ? "success" : "warning",
              channels: ["in_app", "email"],
            });
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competition-sponsors", competitionId] });
      toast({ title: isAr ? "تم تحديث الحالة" : "Status updated" });
    },
  });

  const existingSponsorIds = sponsors?.map((s: any) => s.company_id) || [];
  const availableCompanies = companies?.filter(c => !existingSponsorIds.includes(c.id)) || [];
  const activeSponsors = sponsors?.filter((s: any) => s.status === "active") || [];
  const pendingSponsors = sponsors?.filter((s: any) => s.status === "pending") || [];

  // Marquee for public display
  const scrollRef = useRef<HTMLDivElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  useEffect(() => {
    if (activeSponsors.length > 2) setShouldScroll(true);
  }, [activeSponsors.length]);

  if (!sponsors || (sponsors.length === 0 && !isOrganizer)) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5 text-primary" />
          {isAr ? "رعاة المسابقة" : "Competition Sponsors"}
        </CardTitle>
        {isOrganizer && (
          <CardDescription>
            {isAr ? "إدارة رعاة ومموّلي هذه المسابقة" : "Manage sponsors for this competition"}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pending Applications (organizer only) */}
        {isOrganizer && pendingSponsors.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-chart-4" />
              {isAr ? "طلبات رعاية قيد المراجعة" : "Pending Sponsorship Applications"}
              <Badge variant="secondary" className="text-[10px]">{pendingSponsors.length}</Badge>
            </p>
            {pendingSponsors.map((sponsor: any) => {
              const companyName = isAr && sponsor.companies?.name_ar ? sponsor.companies.name_ar : sponsor.companies?.name;
              const tier = (sponsor.tier || "bronze") as keyof typeof TIER_CONFIG;
              const config = TIER_CONFIG[tier] || TIER_CONFIG.bronze;
              const Icon = config.icon;
              return (
                <div key={sponsor.id} className="flex items-center gap-3 rounded-lg border border-chart-4/30 bg-chart-4/5 p-3">
                  {sponsor.companies?.logo_url ? (
                    <img src={sponsor.companies.logo_url} alt={companyName} className="h-10 w-10 rounded-lg object-contain" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Building className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-sm">{companyName}</p>
                    <div className="flex items-center gap-1">
                      <Icon className={`h-3 w-3 ${config.color}`} />
                      <span className="text-xs text-muted-foreground">{isAr ? config.labelAr : config.label}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      onClick={() => updateStatusMutation.mutate({ id: sponsor.id, status: "active", companyId: sponsor.company_id })}
                    >
                      <CheckCircle className="me-1 h-3 w-3" /> {isAr ? "قبول" : "Approve"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatusMutation.mutate({ id: sponsor.id, status: "rejected", companyId: sponsor.company_id })}
                    >
                      <XCircle className="me-1 h-3 w-3" /> {isAr ? "رفض" : "Reject"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Sponsor Form (organizer only) */}
        {isOrganizer && (
          <div className="flex flex-wrap gap-2 rounded-lg border p-3">
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={isAr ? "اختر شركة" : "Select company"} />
              </SelectTrigger>
              <SelectContent>
                {availableCompanies.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {isAr && c.name_ar ? c.name_ar : c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedPackage} onValueChange={setSelectedPackage}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={isAr ? "اختر الباقة" : "Select package"} />
              </SelectTrigger>
              <SelectContent>
                {packages?.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {isAr && p.name_ar ? p.name_ar : p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={() => addSponsorMutation.mutate()}
              disabled={!selectedCompany || addSponsorMutation.isPending}
            >
              <Plus className="me-1 h-4 w-4" />
              {isAr ? "إضافة" : "Add"}
            </Button>
          </div>
        )}

        {/* Sponsors Display */}
        {activeSponsors.length > 0 ? (
          isOrganizer ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {activeSponsors.map((sponsor: any) => {
                const tier = (sponsor.tier || "bronze") as keyof typeof TIER_CONFIG;
                const config = TIER_CONFIG[tier] || TIER_CONFIG.bronze;
                const Icon = config.icon;
                const companyName = isAr && sponsor.companies?.name_ar
                  ? sponsor.companies.name_ar
                  : sponsor.companies?.name;
                return (
                  <div key={sponsor.id} className={`flex items-center gap-3 rounded-lg border p-3 ${config.bg}`}>
                    {sponsor.companies?.logo_url ? (
                      <img src={sponsor.companies.logo_url} alt={companyName} className="h-10 w-10 rounded-lg object-contain" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Building className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium text-sm">{companyName}</p>
                      <div className="flex items-center gap-1">
                        <Icon className={`h-3 w-3 ${config.color}`} />
                        <span className="text-xs text-muted-foreground">{isAr ? config.labelAr : config.label}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeSponsorMutation.mutate(sponsor.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Public tiered display */
            <div className="space-y-6">
              {(["platinum", "gold", "silver", "bronze", "custom"] as const).map(tierKey => {
                const tierSponsors = activeSponsors.filter((s: any) => (s.tier || "bronze") === tierKey);
                if (tierSponsors.length === 0) return null;
                const config = TIER_CONFIG[tierKey];
                const Icon = config.icon;
                return (
                  <div key={tierKey}>
                    <div className="mb-3 flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${config.color}`} />
                      <h4 className="text-sm font-bold uppercase tracking-wider">
                        {isAr ? config.labelAr : config.label} {isAr ? "الرعاة" : "Sponsors"}
                      </h4>
                    </div>
                    <div className={`grid gap-3 ${tierKey === "platinum" ? "sm:grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
                      {tierSponsors.map((sponsor: any) => {
                        const companyName = isAr && sponsor.companies?.name_ar ? sponsor.companies.name_ar : sponsor.companies?.name;
                        const isPlatinum = tierKey === "platinum";
                        return (
                          <a
                            key={sponsor.id}
                            href={`/companies/${sponsor.company_id}`}
                            className={`group flex items-center gap-4 rounded-xl border p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${config.bg} ${isPlatinum ? "border-chart-4/30" : "border-border/50"}`}
                          >
                            {sponsor.companies?.logo_url || sponsor.logo_url ? (
                              <img
                                src={sponsor.logo_url || sponsor.companies?.logo_url}
                                alt={companyName}
                                className={`rounded-xl object-contain transition-transform group-hover:scale-110 ${isPlatinum ? "h-16 w-16" : "h-12 w-12"}`}
                              />
                            ) : (
                              <div className={`flex items-center justify-center rounded-xl bg-muted ${isPlatinum ? "h-16 w-16" : "h-12 w-12"}`}>
                                <Building className={`text-muted-foreground ${isPlatinum ? "h-8 w-8" : "h-5 w-5"}`} />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className={`truncate font-semibold group-hover:text-primary transition-colors ${isPlatinum ? "text-base" : "text-sm"}`}>
                                {companyName}
                              </p>
                              <Badge variant="outline" className={`mt-1 text-[9px] uppercase tracking-wider ${config.color}`}>
                                <Icon className="me-1 h-2.5 w-2.5" />
                                {isAr ? config.labelAr : config.label}
                              </Badge>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {isAr ? "لا يوجد رعاة حتى الآن" : "No sponsors yet"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
