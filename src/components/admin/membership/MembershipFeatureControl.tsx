import { useState, memo, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAllMembershipFeatures } from "@/hooks/useMembershipFeatures";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { Loader2, Search, Shield, Zap, Star, Crown, Layout, MessageCircle, CheckCircle2, XCircle } from "lucide-react";

const TIERS = ["basic", "professional", "enterprise"] as const;

const TIER_CONFIG = {
  basic: { icon: Zap, color: "text-muted-foreground" },
  professional: { icon: Star, color: "text-primary" },
  enterprise: { icon: Crown, color: "text-chart-2" },
};

const CATEGORY_CONFIG: Record<string, { icon: any; label: string; labelAr: string }> = {
  profile_tab: { icon: Layout, label: "Profile Tabs", labelAr: "تبويبات الملف" },
  profile_header: { icon: Shield, label: "Profile Features", labelAr: "مميزات الملف" },
  community: { icon: MessageCircle, label: "Community", labelAr: "المجتمع" },
};

const MembershipFeatureControl = memo(function MembershipFeatureControl() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const queryClient = useQueryClient();
  const { data: features, isLoading } = useAllMembershipFeatures();
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  // KPI stats
  const stats = useMemo(() => {
    if (!features) return { total: 0, active: 0, inactive: 0, tierCoverage: { basic: 0, professional: 0, enterprise: 0 } };
    const total = features.length;
    const active = features.filter(f => f.is_active).length;
    const tierCoverage = { basic: 0, professional: 0, enterprise: 0 };

    for (const f of features) {
      if (!f.is_active) continue;
      const mappings = (f as any).membership_feature_tiers || [];
      for (const tier of TIERS) {
        if (mappings.some((m) => m.tier === tier && m.is_enabled)) {
          tierCoverage[tier]++;
        }
      }
    }

    return { total, active, inactive: total - active, tierCoverage };
  }, [features]);

  const handleToggle = async (featureId: string, tier: string, currentEnabled: boolean) => {
    const key = `${featureId}-${tier}`;
    setUpdating(key);

    try {
      const { data: existing } = await supabase
        .from("membership_feature_tiers")
        .select("id")
        .eq("feature_id", featureId)
        .eq("tier", tier)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("membership_feature_tiers")
          .update({ is_enabled: !currentEnabled })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("membership_feature_tiers")
          .insert({ feature_id: featureId, tier, is_enabled: !currentEnabled });
        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ["allMembershipFeatures"] });
      queryClient.invalidateQueries({ queryKey: ["userAllFeatures"] });
      queryClient.invalidateQueries({ queryKey: ["userFeatureAccess"] });
      toast.success(isAr ? "تم التحديث" : "Updated");
    } catch (err) {
      toast.error(isAr ? "فشل التحديث" : "Update failed");
    } finally {
      setUpdating(null);
    }
  };

  const handleToggleActive = async (featureId: string, currentActive: boolean) => {
    setUpdating(featureId);
    try {
      const { error } = await supabase
        .from("membership_features")
        .update({ is_active: !currentActive })
        .eq("id", featureId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["allMembershipFeatures"] });
      toast.success(isAr ? "تم التحديث" : "Updated");
    } catch {
      toast.error(isAr ? "فشل التحديث" : "Update failed");
    } finally {
      setUpdating(null);
    }
  };

  // Bulk enable all features for a tier
  const handleBulkTierToggle = async (tier: string, enable: boolean) => {
    if (!features) return;
    setUpdating(`bulk-${tier}`);
    try {
      const activeFeatures = features.filter(f => f.is_active);
      for (const f of activeFeatures) {
        const { data: existing } = await supabase
          .from("membership_feature_tiers")
          .select("id")
          .eq("feature_id", f.id)
          .eq("tier", tier)
          .maybeSingle();

        if (existing) {
          await supabase.from("membership_feature_tiers").update({ is_enabled: enable }).eq("id", existing.id);
        } else if (enable) {
          await supabase.from("membership_feature_tiers").insert({ feature_id: f.id, tier, is_enabled: true });
        }
      }
      queryClient.invalidateQueries({ queryKey: ["allMembershipFeatures"] });
      queryClient.invalidateQueries({ queryKey: ["userAllFeatures"] });
      toast.success(isAr ? `تم تحديث جميع المميزات لـ ${tier}` : `All features ${enable ? "enabled" : "disabled"} for ${tier}`);
    } catch {
      toast.error(isAr ? "فشل التحديث الجماعي" : "Bulk update failed");
    } finally {
      setUpdating(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const categories = [...new Set(features?.map(f => f.category) || [])];
  const filteredFeatures = features?.filter(f => {
    if (!search) return true;
    const s = search.toLowerCase();
    return f.name.toLowerCase().includes(s) || f.name_ar?.toLowerCase().includes(s) || f.code.toLowerCase().includes(s);
  });

  const kpiCards = [
    { icon: Shield, label: isAr ? "إجمالي المميزات" : "Total Features", value: stats.total, color: "text-primary" },
    { icon: CheckCircle2, label: isAr ? "مفعّلة" : "Active", value: stats.active, color: "text-chart-2" },
    { icon: XCircle, label: isAr ? "معطّلة" : "Inactive", value: stats.inactive, color: "text-destructive" },
    { icon: Crown, label: isAr ? "تغطية Enterprise" : "Enterprise Coverage", value: stats.active > 0 ? Math.round((stats.tierCoverage.enterprise / stats.active) * 100) : 0, suffix: "%", color: "text-chart-4" },
  ];

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {kpiCards.map(card => (
          <Card key={card.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <card.icon className={`h-4 w-4 ${card.color}`} />
                <span className="text-xs font-medium text-muted-foreground">{card.label}</span>
              </div>
              <AnimatedCounter value={card.value} className="text-2xl" suffix={(card as any).suffix} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + Bulk Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={isAr ? "بحث عن ميزة..." : "Search features..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{isAr ? "تفعيل كل المميزات:" : "Enable all for:"}</span>
          {TIERS.map(tier => {
            const cfg = TIER_CONFIG[tier];
            const isBulkUpdating = updating === `bulk-${tier}`;
            return (
              <Button
                key={tier}
                variant="outline"
                size="sm"
                className="gap-1 h-7 text-xs px-2"
                disabled={!!updating}
                onClick={() => handleBulkTierToggle(tier, true)}
              >
                {isBulkUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : <cfg.icon className={`h-3 w-3 ${cfg.color}`} />}
                {tier === "basic" ? (isAr ? "أساسي" : "Basic") :
                 tier === "professional" ? (isAr ? "احترافي" : "Pro") :
                 (isAr ? "مؤسسي" : "Ent")}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {TIERS.map(tier => {
          const cfg = TIER_CONFIG[tier];
          return (
            <Badge key={tier} variant="outline" className="gap-1">
              <cfg.icon className={`h-3 w-3 ${cfg.color}`} />
              {tier === "basic" ? (isAr ? "الأساسي" : "Basic") :
               tier === "professional" ? (isAr ? "الاحترافي" : "Professional") :
               (isAr ? "المؤسسي" : "Enterprise")}
              <span className="text-muted-foreground ms-1">{stats.tierCoverage[tier]}/{stats.active}</span>
            </Badge>
          );
        })}
      </div>

      {/* Feature categories */}
      <Tabs defaultValue={categories[0] || "profile_tab"}>
        <TabsList className="h-8 gap-1">
          {categories.map(cat => {
            const cfg = CATEGORY_CONFIG[cat] || { icon: Layout, label: cat, labelAr: cat };
            const catCount = filteredFeatures?.filter(f => f.category === cat).length || 0;
            return (
              <TabsTrigger key={cat} value={cat} className="gap-1 text-xs h-7 px-2">
                <cfg.icon className="h-3 w-3" />
                {isAr ? cfg.labelAr : cfg.label}
                <Badge variant="secondary" className="text-[9px] h-4 px-1 ms-0.5">{catCount}</Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {categories.map(cat => (
          <TabsContent key={cat} value={cat} className="mt-4">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-start py-3 px-4 text-xs font-medium text-muted-foreground w-8">
                          {isAr ? "فعّال" : "Active"}
                        </th>
                        <th className="text-start py-3 px-4 text-xs font-medium text-muted-foreground">
                          {isAr ? "الميزة" : "Feature"}
                        </th>
                        {TIERS.map(tier => {
                          const cfg = TIER_CONFIG[tier];
                          return (
                            <th key={tier} className="text-center py-3 px-4 text-xs font-medium">
                              <div className="flex items-center justify-center gap-1">
                                <cfg.icon className={`h-3 w-3 ${cfg.color}`} />
                                <span className={cfg.color}>
                                  {tier === "basic" ? (isAr ? "أساسي" : "Basic") :
                                   tier === "professional" ? (isAr ? "احترافي" : "Pro") :
                                   (isAr ? "مؤسسي" : "Enterprise")}
                                </span>
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFeatures
                        ?.filter(f => f.category === cat)
                        .map(feature => {
                          const tierMappings = (feature as any).membership_feature_tiers || [];
                          return (
                            <tr key={feature.id} className={`border-b last:border-0 ${!feature.is_active ? "opacity-50" : ""}`}>
                              <td className="py-3 px-4">
                                <Switch
                                  checked={feature.is_active}
                                  onCheckedChange={() => handleToggleActive(feature.id, feature.is_active)}
                                  disabled={updating === feature.id}
                                  className="scale-75"
                                />
                              </td>
                              <td className="py-3 px-4">
                                <div>
                                  <p className="text-sm font-medium">{isAr ? (feature.name_ar || feature.name) : feature.name}</p>
                                  <p className="text-xs text-muted-foreground font-mono">{feature.code}</p>
                                </div>
                              </td>
                              {TIERS.map(tier => {
                                const mapping = tierMappings.find((m) => m.tier === tier);
                                const isEnabled = mapping?.is_enabled ?? false;
                                const key = `${feature.id}-${tier}`;
                                return (
                                  <td key={tier} className="text-center py-3 px-4">
                                    <Switch
                                      checked={isEnabled}
                                      onCheckedChange={() => handleToggle(feature.id, tier, isEnabled)}
                                      disabled={!feature.is_active || updating === key}
                                      className="scale-75"
                                    />
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
});

export default MembershipFeatureControl;