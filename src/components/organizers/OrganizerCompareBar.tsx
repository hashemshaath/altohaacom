import { memo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Scale, Landmark, Star, Eye, Globe, MapPin, Calendar, CheckCircle2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";

interface Props {
  items: any[];
  onRemove: (id: string) => void;
  onClear: () => void;
  isAr: boolean;
}

export const OrganizerCompareBar = memo(function OrganizerCompareBar({ items, onRemove, onClear, isAr }: Props) {
  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 inset-x-0 z-40 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-primary/30 bg-card/95 backdrop-blur-md shadow-xl px-4 py-3 max-w-lg w-full">
        <Scale className="h-5 w-5 text-primary shrink-0" />

        <div className="flex items-center gap-2 flex-1 min-w-0 overflow-x-auto scrollbar-none">
          {items.map(org => (
            <div key={org.id} className="flex items-center gap-1.5 shrink-0 rounded-xl border border-border/40 bg-muted/50 px-2 py-1">
              <Avatar className="h-6 w-6 rounded-lg">
                {org.logo_url && <AvatarImage src={org.logo_url} />}
                <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-[12px] font-bold">{org.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-[12px] font-medium max-w-[80px] truncate">{org.name}</span>
              <button onClick={() => onRemove(org.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-1.5 shrink-0">
          <Button variant="ghost" size="sm" className="h-8 text-xs rounded-xl" onClick={onClear}>
            {isAr ? "مسح" : "Clear"}
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 text-xs rounded-xl gap-1" disabled={items.length < 2}>
                <Scale className="h-3.5 w-3.5" />
                {isAr ? "قارن" : "Compare"} ({items.length})
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" />
                  {isAr ? "مقارنة المنظمين" : "Compare Organizers"}
                </DialogTitle>
              </DialogHeader>
              <CompareTable items={items} isAr={isAr} />
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
});

function CompareTable({ items, isAr }: { items: any[]; isAr: boolean }) {
  const rows: { label: string; labelAr: string; icon: typeof Landmark; render: (org) => React.ReactNode }[] = [
    {
      label: "Name", labelAr: "الاسم", icon: CheckCircle2,
      render: (org) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-10 w-10 rounded-xl border border-border/30">
            {org.logo_url && <AvatarImage src={org.logo_url} />}
            <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold">{org.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">{isAr && org.name_ar ? org.name_ar : org.name}</p>
            {org.is_verified && <Badge variant="secondary" className="text-[12px] mt-0.5"><CheckCircle2 className="h-2.5 w-2.5 me-0.5" />{isAr ? "موثق" : "Verified"}</Badge>}
          </div>
        </div>
      ),
    },
    {
      label: "Location", labelAr: "الموقع", icon: MapPin,
      render: (org) => <span className="text-sm">{org.city}{org.country ? `, ${org.country}` : ""}</span>,
    },
    {
      label: "Events", labelAr: "الفعاليات", icon: Landmark,
      render: (org) => <span className="text-lg font-bold">{org.total_exhibitions || 0}</span>,
    },
    {
      label: "Rating", labelAr: "التقييم", icon: Star,
      render: (org) => (
        <span className="text-lg font-bold flex items-center gap-1">
          {org.average_rating ? org.average_rating.toFixed(1) : "—"}
          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
        </span>
      ),
    },
    {
      label: "Views", labelAr: "المشاهدات", icon: Eye,
      render: (org) => <span className="text-lg font-bold">{(org.total_views || 0).toLocaleString()}</span>,
    },
    {
      label: "Founded", labelAr: "سنة التأسيس", icon: Calendar,
      render: (org) => <span className="text-sm">{org.founded_year || "—"}</span>,
    },
    {
      label: "Website", labelAr: "الموقع الإلكتروني", icon: Globe,
      render: (org) => org.website ? (
        <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate block max-w-[150px]">
          {org.website.replace(/^https?:\/\//, "")}
        </a>
      ) : <span className="text-muted-foreground">—</span>,
    },
    {
      label: "Categories", labelAr: "التصنيفات", icon: Landmark,
      render: (org) => (
        <div className="flex flex-wrap gap-1">
          {(org.categories || []).map((c: string) => (
            <Badge key={c} variant="outline" className="text-[12px] rounded-full">{c}</Badge>
          ))}
          {(!org.categories || org.categories.length === 0) && <span className="text-muted-foreground">—</span>}
        </div>
      ),
    },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-start">
        <thead>
          <tr>
            <th className="p-2 w-28" />
            {items.map(org => (
              <th key={org.id} className="p-2 text-center min-w-[140px]" />
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.label} className="border-t border-border/30">
              <td className="p-3 text-xs font-medium text-muted-foreground whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <row.icon className="h-3 w-3" />
                  {isAr ? row.labelAr : row.label}
                </div>
              </td>
              {items.map(org => (
                <td key={org.id} className="p-3 text-center">
                  {row.render(org)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
