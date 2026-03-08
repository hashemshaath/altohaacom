import { memo, useMemo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, LayoutGrid, Eye, MousePointerClick, ExternalLink } from "lucide-react";
import { statusColors } from "./statusColors";

interface Props {
  creatives: any[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onToggleActive: (id: string, active: boolean) => void;
}

export const AdCreativesTab = memo(function AdCreativesTab({ creatives, onApprove, onReject, onToggleActive }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const sortedCreatives = useMemo(() => 
    [...creatives].sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }), [creatives]
  );

  if (creatives.length === 0) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
            <LayoutGrid className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">{isAr ? "لا توجد مواد إعلانية" : "No creatives yet"}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {creatives.map((cr: any) => (
        <Card key={cr.id} className="rounded-2xl overflow-hidden group transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
          {cr.image_url && (
            <div className="aspect-video bg-muted relative overflow-hidden">
              <img src={cr.image_url} alt={cr.title || "Ad"} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
              <Badge className={`absolute top-2 end-2 ${statusColors[cr.status] || ""}`}>{cr.status}</Badge>
            </div>
          )}
          <CardContent className="p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-sm truncate">{cr.title || (isAr ? "بدون عنوان" : "Untitled")}</h3>
                <p className="text-[10px] text-muted-foreground">{isAr ? cr.ad_placements?.name_ar : cr.ad_placements?.name}</p>
              </div>
              {!cr.image_url && <Badge className={statusColors[cr.status] || ""}>{cr.status}</Badge>}
            </div>

            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {(cr.impressions || 0).toLocaleString()}</span>
              <span className="flex items-center gap-1"><MousePointerClick className="h-3 w-3" /> {(cr.clicks || 0).toLocaleString()}</span>
              {cr.destination_url && (
                <a href={cr.destination_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-0.5 text-primary hover:underline">
                  <ExternalLink className="h-3 w-3" /> URL
                </a>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch checked={cr.is_active} onCheckedChange={(checked) => onToggleActive(cr.id, checked)} />
                <Label className="text-[10px]">{isAr ? "مفعل" : "Active"}</Label>
              </div>
            </div>

            {cr.status === "pending" && (
              <div className="flex gap-2 pt-1">
                <Button size="sm" className="flex-1 h-8 rounded-xl text-xs" onClick={() => onApprove(cr.id)}>
                  <CheckCircle className="h-3.5 w-3.5 me-1" />{isAr ? "موافقة" : "Approve"}
                </Button>
                <Button size="sm" variant="destructive" className="flex-1 h-8 rounded-xl text-xs" onClick={() => onReject(cr.id)}>
                  <XCircle className="h-3.5 w-3.5 me-1" />{isAr ? "رفض" : "Reject"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
});
