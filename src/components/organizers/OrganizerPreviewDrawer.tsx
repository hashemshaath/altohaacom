import { memo, forwardRef } from "react";
import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Building2, MapPin, Globe, CheckCircle2, Star, Landmark,
  ArrowUpRight, Mail, Phone, Calendar, Eye, ExternalLink, Scale,
} from "lucide-react";

interface Props {
  org: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAr: boolean;
  onCompare?: (org: any) => void;
  isInCompare?: boolean;
}

export const OrganizerPreviewDrawer = memo(forwardRef<HTMLDivElement, Props>(function OrganizerPreviewDrawer({ org, open, onOpenChange, isAr, onCompare, isInCompare }, _ref) {
  if (!org) return null;

  const name = isAr && org.name_ar ? org.name_ar : org.name;
  const desc = isAr && org.description_ar ? org.description_ar : org.description;
  const services = isAr && org.services_ar ? org.services_ar : org.services;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isAr ? "left" : "right"} className="w-full sm:max-w-md overflow-y-auto p-0">
        {/* Cover */}
        <div className="relative h-36 bg-gradient-to-br from-primary/10 to-primary/5">
          {org.cover_image_url && (
            <img src={org.cover_image_url} alt={name} className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        </div>

        <div className="px-5 -mt-10 relative z-10">
          <SheetHeader className="text-start">
            <div className="flex items-start gap-3">
              <Avatar className="h-18 w-18 rounded-2xl border-[3px] border-background shadow-lg">
                {org.logo_url && <AvatarImage src={org.logo_url} />}
                <AvatarFallback className="rounded-2xl bg-primary/10 text-primary font-bold text-xl">{org.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="pt-6 flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <SheetTitle className="text-base truncate">{name}</SheetTitle>
                  {org.is_verified && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                </div>
                {org.city && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" />{org.city}{org.country ? `, ${org.country}` : ""}
                  </p>
                )}
              </div>
            </div>
          </SheetHeader>

          {/* Action buttons */}
          <div className="flex gap-2 mt-4">
            <Button asChild className="flex-1 rounded-xl h-9 text-xs">
              <Link to={`/organizers/${org.slug}`}>
                <ExternalLink className="h-3.5 w-3.5 me-1.5" />
                {isAr ? "عرض الملف الكامل" : "View Full Profile"}
              </Link>
            </Button>
            {onCompare && (
              <Button
                variant={isInCompare ? "secondary" : "outline"}
                className="rounded-xl h-9 text-xs gap-1"
                onClick={() => onCompare(org)}
              >
                <Scale className="h-3.5 w-3.5" />
                {isInCompare ? (isAr ? "تمت الإضافة" : "Added") : (isAr ? "قارن" : "Compare")}
              </Button>
            )}
          </div>

          <Separator className="my-4" />

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Landmark, value: org.total_exhibitions || 0, label: isAr ? "فعالية" : "Events", color: "text-emerald-500" },
              { icon: Star, value: org.average_rating ? org.average_rating.toFixed(1) : "—", label: isAr ? "تقييم" : "Rating", color: "text-amber-500" },
              { icon: Eye, value: (org.total_views || 0).toLocaleString(), label: isAr ? "مشاهدة" : "Views", color: "text-blue-500" },
            ].map(s => (
              <div key={s.label} className="text-center rounded-xl border border-border/30 bg-muted/30 py-3">
                <s.icon className={`h-4 w-4 mx-auto mb-1 ${s.color}`} />
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Description */}
          {desc && (
            <div className="mt-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                {isAr ? "نبذة" : "About"}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          )}

          {/* Categories */}
          {org.categories && org.categories.length > 0 && (
            <div className="mt-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                {isAr ? "التصنيفات" : "Categories"}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {org.categories.map((c: string) => (
                  <Badge key={c} variant="secondary" className="text-[10px] rounded-full">{c}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Services */}
          {services && services.length > 0 && (
            <div className="mt-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                {isAr ? "الخدمات" : "Services"}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {services.map((s: string) => (
                  <Badge key={s} variant="outline" className="text-[10px] rounded-full">{s}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Contact */}
          {(org.email || org.phone || org.website) && (
            <div className="mt-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {isAr ? "التواصل" : "Contact"}
              </h3>
              <div className="space-y-2">
                {org.website && (
                  <a href={org.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                    <Globe className="h-3.5 w-3.5" />{org.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
                {org.email && (
                  <a href={`mailto:${org.email}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                    <Mail className="h-3.5 w-3.5" />{org.email}
                  </a>
                )}
                {org.phone && (
                  <a href={`tel:${org.phone}`} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                    <Phone className="h-3.5 w-3.5" />{org.phone}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Founded */}
          {org.founded_year && (
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {isAr ? `تأسس عام ${org.founded_year}` : `Founded in ${org.founded_year}`}
            </div>
          )}

          <div className="h-6" />
        </div>
      </SheetContent>
    </Sheet>
  );
}));
