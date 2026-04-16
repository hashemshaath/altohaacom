import { useIsAr } from "@/hooks/useIsAr";
import { PanelTop, PanelBottom, Sparkles } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { HeaderFooterSettings } from "@/components/admin/settings/HeaderFooterSettings";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * TYPOGRAPHY POLICY — ALTOHA DESIGN SYSTEM
 * Minimum font size: 11px (0.6875rem) desktop / 13px (0.8125rem) mobile.
 * Do NOT use `text-xs` on body text — only on badges & labels.
 * Scale: display(48) h1(36) h2(28) h3(22) h4(18) body-lg(18) body(16) body-sm(14) caption(13) label(12) overline(11).
 * IBM Plex Arabic required on all text.
 * See src/styles/typography.css for the complete policy.
 */

export default function HeaderFooterPage() {
  const isAr = useIsAr();
  const { settings, isLoading, saveSetting } = useSiteSettings();

  const handleSave = (key: string, value: Record<string, any>, category?: string) => {
    saveSetting.mutate({ key, value, category });
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={PanelTop}
        title={isAr ? "الرأس والتذييل" : "Header & Footer"}
        description={isAr ? "التحكم في مكونات الرأس والتذييل وروابط التواصل الاجتماعي" : "Control header & footer components and social media links"}
      />

      {/* Visual summary badges */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { icon: PanelTop, label: isAr ? "الرأس" : "Header", color: "bg-primary/10 text-primary" },
          { icon: PanelBottom, label: isAr ? "التذييل" : "Footer", color: "bg-accent/60 text-accent-foreground" },
          { icon: Sparkles, label: isAr ? "التواصل الاجتماعي" : "Social Links", color: "bg-muted text-muted-foreground" },
        ].map((badge) => (
          <span key={badge.label} className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium ${badge.color}`}>
            <badge.icon className="h-3.5 w-3.5" />
            {badge.label}
          </span>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      ) : (
        <HeaderFooterSettings settings={settings} onSave={handleSave} isPending={saveSetting.isPending} />
      )}
    </div>
  );
}
