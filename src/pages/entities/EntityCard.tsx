import { memo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2, Globe, MapPin, Users, ShieldCheck, Bell, BellOff,
  Mail, GraduationCap, Briefcase, Landmark, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type EntityType = Database["public"]["Enums"]["entity_type"];
type EntityScope = Database["public"]["Enums"]["entity_scope"];

export const typeLabels: Record<EntityType, { en: string; ar: string; icon: typeof Building2 }> = {
  culinary_association: { en: "Culinary Association", ar: "جمعية طهي", icon: Users },
  government_entity: { en: "Government Entity", ar: "جهة حكومية", icon: Landmark },
  private_association: { en: "Private Association", ar: "جمعية خاصة", icon: Briefcase },
  culinary_academy: { en: "Culinary Academy", ar: "أكاديمية طهي", icon: GraduationCap },
  industry_body: { en: "Industry Body", ar: "هيئة صناعية", icon: Building2 },
  university: { en: "University", ar: "جامعة", icon: GraduationCap },
  college: { en: "College", ar: "كلية", icon: GraduationCap },
  training_center: { en: "Training Center", ar: "مركز تدريب", icon: GraduationCap },
};

export const scopeLabels: Record<EntityScope, { en: string; ar: string }> = {
  local: { en: "Local", ar: "محلي" },
  national: { en: "National", ar: "وطني" },
  regional: { en: "Regional", ar: "إقليمي" },
  international: { en: "International", ar: "دولي" },
};

interface EntityCardProps {
  entity: any;
  isAr: boolean;
  isFollowing: boolean;
  onToggleFollow: (id: string) => void;
  canFollow: boolean;
  featured?: boolean;
}

export const EntityCard = memo(function EntityCard({
  entity, isAr, isFollowing, onToggleFollow, canFollow, featured,
}: EntityCardProps) {
  const name = isAr && entity.name_ar ? entity.name_ar : entity.name;
  const description = isAr && entity.description_ar ? entity.description_ar : entity.description;
  const tLabel = typeLabels[entity.type as EntityType];
  const sLabel = scopeLabels[entity.scope as EntityScope];
  const TypeIcon = tLabel?.icon || Building2;
  const followerCount = entity.entity_followers?.length || 0;

  return (
    <Card className={cn(
      "group overflow-hidden border-border/30 transition-all duration-300",
      "hover:shadow-xl hover:-translate-y-1 hover:border-primary/20",
      "rounded-2xl",
      featured && "ring-1 ring-primary/15 shadow-md"
    )}>
      {/* Cover */}
      <div className={cn("relative overflow-hidden", featured ? "h-36" : "h-28")}>
        {entity.cover_image_url ? (
          <img
            src={entity.cover_image_url}
            alt={entity.name || ""}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/8 via-accent/4 to-primary/4">
            <TypeIcon className="h-10 w-10 text-primary/10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />

        {/* Logo */}
        <div className="absolute -bottom-5 start-4">
          {entity.logo_url ? (
            <img
              src={entity.logo_url}
              alt={name}
              loading="lazy"
              decoding="async"
              className={cn(
                "rounded-xl border-2 border-background bg-background object-cover shadow-lg ring-1 ring-border/10",
                featured ? "h-14 w-14" : "h-11 w-11"
              )}
            />
          ) : (
            <div className={cn(
              "flex items-center justify-center rounded-xl border-2 border-background bg-background shadow-lg ring-1 ring-border/10",
              featured ? "h-14 w-14" : "h-11 w-11"
            )}>
              <TypeIcon className={cn("text-primary", featured ? "h-7 w-7" : "h-5 w-5")} />
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="absolute end-2.5 top-2.5 flex gap-1.5">
          {featured && (
            <Badge className="bg-primary/90 text-primary-foreground backdrop-blur-md border-0 text-[0.625rem] px-2 py-0.5 rounded-lg shadow-sm font-bold">
              ★ {isAr ? "مميز" : "Featured"}
            </Badge>
          )}
          <Badge variant="secondary" className="text-[0.625rem] backdrop-blur-md bg-background/70 border-0 font-bold px-2 py-0.5 rounded-lg shadow-sm">
            {isAr ? tLabel?.ar : tLabel?.en}
          </Badge>
          {entity.is_verified && (
            <Badge className="bg-chart-3/20 text-chart-3 backdrop-blur-md border-0 text-[0.625rem] px-1.5 py-0.5 rounded-lg shadow-sm">
              <ShieldCheck className="h-2.5 w-2.5" />
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="pt-7 pb-4 px-4 space-y-2.5">
        {/* Name + scope */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className={cn(
              "font-bold leading-tight truncate group-hover:text-primary transition-colors",
              featured ? "text-base" : "text-sm"
            )}>{name}</h3>
            {entity.abbreviation && (
              <p className="text-[0.6875rem] text-muted-foreground/60 mt-0.5 font-medium">({entity.abbreviation})</p>
            )}
          </div>
          {sLabel && (
            <Badge variant="outline" className="shrink-0 text-[0.625rem] rounded-lg border-border/30 font-bold px-2 py-0.5">
              {isAr ? sLabel.ar : sLabel.en}
            </Badge>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed">{description}</p>
        )}

        {/* Meta info */}
        <div className="space-y-1">
          {entity.city && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0 text-primary/50" />
              <span className="truncate">{entity.city}{entity.country ? `, ${entity.country}` : ""}</span>
            </div>
          )}
          {entity.email && (
            <div className="flex items-center gap-2 text-xs">
              <Mail className="h-3 w-3 shrink-0 text-primary/50" />
              <a href={`mailto:${entity.email}`} className="text-primary hover:underline truncate text-[0.6875rem]">{entity.email}</a>
            </div>
          )}
          {entity.website && (
            <div className="flex items-center gap-2 text-xs">
              <Globe className="h-3 w-3 shrink-0 text-primary/50" />
              <a href={entity.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate text-[0.6875rem]">
                {entity.website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          )}
        </div>

        {/* Specializations */}
        {entity.specializations && (entity.specializations as string[]).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {(entity.specializations as string[]).slice(0, 3).map(s => (
              <Badge key={s} variant="secondary" className="text-[0.625rem] rounded-md px-1.5 py-0 font-medium">{s}</Badge>
            ))}
            {(entity.specializations as string[]).length > 3 && (
              <Badge variant="secondary" className="text-[0.625rem] rounded-md px-1.5 py-0">
                +{(entity.specializations as string[]).length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2.5 border-t border-border/15">
          <div className="flex items-center gap-1.5 text-[0.6875rem] text-muted-foreground">
            <Users className="h-3 w-3" />
            <span className="font-medium tabular-nums">{followerCount}</span>
            <span>{isAr ? "متابع" : "followers"}</span>
            {entity.member_count != null && entity.member_count > 0 && (
              <>
                <span className="text-border">•</span>
                <span className="font-medium tabular-nums">{entity.member_count}</span>
                <span>{isAr ? "عضو" : "members"}</span>
              </>
            )}
          </div>
          {entity.founded_year && (
            <span className="text-[0.625rem] text-muted-foreground/50 font-medium tabular-nums">
              {isAr ? "تأسست" : "Est."} {entity.founded_year}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-9 rounded-xl text-xs font-bold gap-1.5 hover:bg-primary/5 hover:text-primary hover:border-primary/30 active:scale-[0.98] transition-all"
            asChild
          >
            <Link to={`/entities/${entity.slug}`}>
              {isAr ? "عرض التفاصيل" : "View Details"}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
          {canFollow && (
            <Button
              variant={isFollowing ? "ghost" : "secondary"}
              size="icon"
              className={cn(
                "h-9 w-9 rounded-xl shrink-0 active:scale-[0.95] transition-all",
                isFollowing && "text-primary"
              )}
              onClick={() => onToggleFollow(entity.id)}
            >
              {isFollowing ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
