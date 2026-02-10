import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Building, Plus, Trash2, Crown, Award, Medal, Star } from "lucide-react";

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

export function CompetitionSponsorsPanel({ competitionId, isOrganizer }: CompetitionSponsorsPanelProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedPackage, setSelectedPackage] = useState("");

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
          created_by: user?.id,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competition-sponsors", competitionId] });
      setSelectedCompany("");
      setSelectedPackage("");
      toast({ title: language === "ar" ? "تمت إضافة الراعي" : "Sponsor added" });
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
      toast({ title: language === "ar" ? "تمت إزالة الراعي" : "Sponsor removed" });
    },
  });

  const existingSponsorIds = sponsors?.map((s: any) => s.company_id) || [];
  const availableCompanies = companies?.filter(c => !existingSponsorIds.includes(c.id)) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5 text-primary" />
          {language === "ar" ? "رعاة المسابقة" : "Competition Sponsors"}
        </CardTitle>
        <CardDescription>
          {language === "ar" ? "إدارة رعاة ومموّلي هذه المسابقة" : "Manage sponsors for this competition"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Sponsor Form (organizer only) */}
        {isOrganizer && (
          <div className="flex flex-wrap gap-2 rounded-lg border p-3">
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={language === "ar" ? "اختر شركة" : "Select company"} />
              </SelectTrigger>
              <SelectContent>
                {availableCompanies.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {language === "ar" && c.name_ar ? c.name_ar : c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedPackage} onValueChange={setSelectedPackage}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={language === "ar" ? "اختر الباقة" : "Select package"} />
              </SelectTrigger>
              <SelectContent>
                {packages?.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {language === "ar" && p.name_ar ? p.name_ar : p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={() => addSponsorMutation.mutate()}
              disabled={!selectedCompany || addSponsorMutation.isPending}
            >
              <Plus className="mr-1 h-4 w-4" />
              {language === "ar" ? "إضافة" : "Add"}
            </Button>
          </div>
        )}

        {/* Sponsors List */}
        {sponsors && sponsors.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {sponsors.map((sponsor: any) => {
              const tier = (sponsor.tier || "bronze") as keyof typeof TIER_CONFIG;
              const config = TIER_CONFIG[tier] || TIER_CONFIG.bronze;
              const Icon = config.icon;
              const companyName = language === "ar" && sponsor.companies?.name_ar
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
                      <span className="text-xs text-muted-foreground">
                        {language === "ar" ? config.labelAr : config.label}
                      </span>
                    </div>
                  </div>
                  {isOrganizer && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => removeSponsorMutation.mutate(sponsor.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {language === "ar" ? "لا يوجد رعاة حتى الآن" : "No sponsors yet"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
