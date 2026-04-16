import { ROUTES } from "@/config/routes";
import { useIsAr } from "@/hooks/useIsAr";
import { memo, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Target, ExternalLink, Monitor, Home, Newspaper, Trophy, Users, Layout, Search } from "lucide-react";
import type { AdPlacementRow } from "./types";
import type { LucideIcon } from "lucide-react";

const pageIcons: Record<string, LucideIcon> = {
  homepage: Home,
  articles: Newspaper,
  competitions: Trophy,
  community: Users,
  sidebar: Layout,
};

interface Props {
  placements: AdPlacementRow[];
  onToggle: (id: string, active: boolean) => void;
}

export const AdPlacementsTab = memo(function AdPlacementsTab({ placements, onToggle }: Props) {
  const isAr = useIsAr();
  const [searchQuery, setSearchQuery] = useState("");
  const [pageFilter, setPageFilter] = useState("all");

  const pageLocations = useMemo(() => {
    const pages = new Set(placements.map(p => p.page_location || "other"));
    return Array.from(pages);
  }, [placements]);

  const sortedPlacements = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return [...placements]
      .filter(p => {
        if (pageFilter !== "all" && (p.page_location || "other") !== pageFilter) return false;
        if (q) {
          const text = `${p.name || ""} ${p.name_ar || ""} ${p.slug || ""} ${p.placement_type || ""}`.toLowerCase();
          if (!text.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.is_active && !b.is_active) return -1;
        if (!a.is_active && b.is_active) return 1;
        if (a.is_premium && !b.is_premium) return -1;
        if (!a.is_premium && b.is_premium) return 1;
        return (a.sort_order || 999) - (b.sort_order || 999);
      });
  }, [placements, searchQuery, pageFilter]);

  // Group placements by page_location
  const grouped = sortedPlacements.reduce<Record<string, AdPlacementRow[]>>((acc, p) => {
    const page = p.page_location || "other";
    if (!acc[page]) acc[page] = [];
    acc[page].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {/* Quick links to pages */}
      <Card className="rounded-2xl border-primary/20 bg-primary/5">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold">{isAr ? "الربط مع الصفحات" : "Page Linking"}</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            {isAr
              ? "المواقع الإعلانية مرتبطة مباشرة بالصفحات التالية. تأكد من تفعيل المواقع المطلوبة."
              : "Ad placements are linked to the following pages. Ensure desired placements are enabled."}
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.keys(grouped).map(page => {
              const PageIcon = pageIcons[page] || Monitor;
              return (
                <Badge key={page} variant="secondary" className="gap-1 text-xs rounded-xl">
                  <PageIcon className="h-3 w-3" />
                  {page} ({grouped[page].length})
                </Badge>
              );
            })}
            <Button size="sm" variant="outline" className="h-6 text-xs rounded-xl gap-1" asChild>
              <Link to={ROUTES.adminDesignHomepage}>
                <Home className="h-3 w-3" />
                {isAr ? "تصميم الرئيسية" : "Homepage Design"}
                <ExternalLink className="h-2.5 w-2.5" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isAr ? "بحث في المواقع..." : "Search placements..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9"
          />
        </div>
        <Select value={pageFilter} onValueChange={setPageFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isAr ? "كل الصفحات" : "All Pages"}</SelectItem>
            {pageLocations.map(page => (
              <SelectItem key={page} value={page}>{page}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Placements table */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">{isAr ? "المواقع الإعلانية" : "Ad Placements"}</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {sortedPlacements.filter(p => p.is_active).length}/{sortedPlacements.length} {isAr ? "مفعل" : "active"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isAr ? "الموقع" : "Placement"}</TableHead>
                  <TableHead>{isAr ? "الصفحة" : "Page"}</TableHead>
                  <TableHead>{isAr ? "النوع" : "Type"}</TableHead>
                  <TableHead>{isAr ? "التنسيق" : "Format"}</TableHead>
                  <TableHead>{isAr ? "الأبعاد" : "Size"}</TableHead>
                  <TableHead>CPM</TableHead>
                  <TableHead>CPC</TableHead>
                  <TableHead>CPV</TableHead>
                  <TableHead>{isAr ? "الحد الأقصى" : "Max Ads"}</TableHead>
                  <TableHead>{isAr ? "مميز" : "Premium"}</TableHead>
                  <TableHead>{isAr ? "مفعل" : "Active"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPlacements.map((p) => (
                  <TableRow key={p.id} className={!p.is_active ? "opacity-50" : ""}>
                    <TableCell>
                      <div>
                        <span className="font-medium text-xs">{isAr ? p.name_ar || p.name : p.name}</span>
                        {p.description && <p className="text-xs text-muted-foreground truncate max-w-[180px]">{isAr ? p.description_ar || p.description : p.description}</p>}
                        <code className="text-xs text-muted-foreground font-mono">{p.slug}</code>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs gap-1">
                        {(() => { const I = pageIcons[p.page_location] || Monitor; return <I className="h-3 w-3" />; })()}
                        {p.page_location || "—"}
                      </Badge>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{p.placement_type}</Badge></TableCell>
                    <TableCell className="text-xs">{p.format}</TableCell>
                    <TableCell className="font-mono text-xs">{p.width && p.height ? `${p.width}×${p.height}` : "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{p.base_cpm || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{p.base_cpc || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{p.base_cpv || "—"}</TableCell>
                    <TableCell className="text-xs">{p.max_ads || "∞"}</TableCell>
                    <TableCell>{p.is_premium ? <Badge className="text-xs">Premium</Badge> : "—"}</TableCell>
                    <TableCell>
                      <Switch checked={p.is_active} onCheckedChange={(checked) => onToggle(p.id, checked)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
