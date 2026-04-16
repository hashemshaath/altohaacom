import { ROUTES } from "@/config/routes";
import { memo } from "react";
import { Link } from "react-router-dom";
import { AddToCalendarButton } from "@/components/ui/AddToCalendarButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import {
  Calendar, MapPin, ArrowLeft, Share2, Ticket, Building, Pencil,
  Twitter, Facebook, Linkedin, Link2, Users, Trophy,
} from "lucide-react";
import { format } from "date-fns";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { useCoverSettings } from "@/hooks/useCoverSettings";

/**
 * TYPOGRAPHY POLICY — ALTOHA DESIGN SYSTEM
 * Min font: 11px desktop / 13px mobile.
 * Scale: display(48) h1(36) h2(28) h3(22) h4(18) body(16) body-sm(14) caption(13).
 * IBM Plex Arabic on all text. See src/styles/typography.css.
 */

interface Props {
  exhibition: any;
  title: string;
  venue: string | null;
  organizer: string | null;
  organizerLogoUrl: string | null;
  isHappening: boolean;
  isUpcoming: boolean;
  hasEnded: boolean;
  isOwner: boolean;
  followerCount: number;
  linkedCompetitionsCount: number;
  isAr: boolean;
}

export const ExhibitionHeroPremium = memo(function ExhibitionHeroPremium({
  exhibition, title, venue, organizer, organizerLogoUrl,
  isHappening, isUpcoming, hasEnded, isOwner,
  followerCount, linkedCompetitionsCount, isAr,
}: Props) {
  const start = new Date(exhibition.start_date);
  const end = new Date(exhibition.end_date);
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const { isVisible } = useCoverSettings("exhibition-detail");

  const typeLabels: Record<string, { en: string; ar: string }> = {
    exhibition: { en: "Exhibition", ar: "معرض" },
    conference: { en: "Conference", ar: "مؤتمر" },
    summit: { en: "Summit", ar: "قمة" },
    workshop: { en: "Workshop", ar: "ورشة عمل" },
    food_festival: { en: "Food Festival", ar: "مهرجان طعام" },
    trade_show: { en: "Trade Show", ar: "معرض تجاري" },
    competition_event: { en: "Competition Event", ar: "حدث تنافسي" },
  };

  return (
    <section className="relative w-full">
      {/* === Layer 1: Cover image with cinematic gradient === */}
      <div className="relative w-full overflow-hidden">
        <div className="relative aspect-[21/9] w-full max-h-[560px] min-h-[320px]">
          {isVisible && exhibition.cover_image_url ? (
            <img
              src={exhibition.cover_image_url}
              alt={title}
              className="absolute inset-0 h-full w-full object-cover scale-105"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/20 to-background" />
          )}

          {/* Cinematic vignette + bottom fade */}
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/10 via-foreground/30 to-background" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

          {/* Top bar — Back + Status */}
          <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4 sm:p-6">
            <Button
              variant="ghost"
              size="sm"
              className="h-10 rounded-full border border-white/20 bg-white/10 px-4 text-sm font-medium text-white backdrop-blur-xl hover:bg-white/20 hover:text-white"
              asChild
            >
              <Link to={ROUTES.exhibitions}>
                <ArrowLeft className="me-1.5 h-4 w-4 rtl:rotate-180" />
                {isAr ? "الفعاليات" : "Events"}
              </Link>
            </Button>

            <div className="flex items-center gap-2">
              {isHappening && (
                <Badge className="border-0 bg-red-500/90 px-3 py-1.5 text-[0.6875rem] font-bold uppercase tracking-wider text-white shadow-lg backdrop-blur-md">
                  <span className="me-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                  {isAr ? "مباشر" : "Live"}
                </Badge>
              )}
              {isUpcoming && (
                <Badge className="border border-white/30 bg-white/15 px-3 py-1.5 text-[0.6875rem] font-bold uppercase tracking-wider text-white backdrop-blur-xl">
                  {isAr ? "قادم" : "Upcoming"}
                </Badge>
              )}
              {hasEnded && (
                <Badge className="border border-white/20 bg-foreground/40 px-3 py-1.5 text-[0.6875rem] font-bold uppercase tracking-wider text-white backdrop-blur-xl">
                  {isAr ? "انتهى" : "Ended"}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* === Layer 2: Floating glass info card === */}
      <div className="relative z-10 -mt-32 sm:-mt-40 lg:-mt-48 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="mx-auto max-w-6xl">
          <div className="overflow-hidden rounded-3xl border border-border/40 bg-card/70 shadow-[0_20px_60px_-20px_hsl(var(--foreground)/0.25)] backdrop-blur-2xl supports-[backdrop-filter]:bg-card/60">
            <div className="p-6 sm:p-8 lg:p-10">

              {/* Top meta chips */}
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <Badge className="border border-primary/20 bg-primary/10 px-3 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-primary hover:bg-primary/15">
                  {isAr ? typeLabels[exhibition.type]?.ar : typeLabels[exhibition.type]?.en}
                </Badge>
                {exhibition.exhibition_number && (
                  <Badge variant="secondary" className="rounded-md px-2 py-1 text-[0.6875rem] font-mono">
                    {exhibition.exhibition_number}
                  </Badge>
                )}
                {(exhibition.city || exhibition.country) && (
                  <span className="inline-flex items-center gap-1.5 text-[0.8125rem] text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {[exhibition.city, exhibition.country].filter(Boolean).join(", ")}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="mb-4 text-2xl font-bold leading-[1.15] tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl">
                {title}
              </h1>

              {/* Date + Venue line */}
              <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.875rem] sm:text-[0.9375rem] text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/8">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                  </span>
                  <span className="font-medium text-foreground">
                    {format(start, "MMM d")} – {format(end, "MMM d, yyyy")}
                  </span>
                </span>
                {!exhibition.is_virtual && venue && (
                  <span className="inline-flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/8">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                    </span>
                    <span className="font-medium text-foreground">{venue}</span>
                  </span>
                )}
              </div>

              {/* Divider */}
              <div className="my-6 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

              {/* Bottom row: organizer | stats | actions */}
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                {/* Organizer */}
                {organizer && (
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-background/80 shadow-sm backdrop-blur-md">
                      {organizerLogoUrl ? (
                        <img src={organizerLogoUrl} alt={organizer} className="h-7 w-7 object-contain" loading="lazy" />
                      ) : (
                        <Building className="h-4.5 w-4.5 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[0.6875rem] font-medium uppercase tracking-wider text-muted-foreground">
                        {isAr ? "المنظم" : "Organizer"}
                      </p>
                      <p className="truncate text-sm font-semibold text-foreground">{organizer}</p>
                    </div>
                  </div>
                )}

                {/* Stats pills */}
                <div className="flex items-center gap-3 sm:gap-4">
                  <StatPill icon={Users} value={followerCount} label={isAr ? "متابع" : "Followers"} />
                  {linkedCompetitionsCount > 0 && (
                    <StatPill icon={Trophy} value={linkedCompetitionsCount} label={isAr ? "مسابقة" : "Competitions"} />
                  )}
                </div>

                {/* Actions */}
                <div className="hidden sm:flex items-center gap-2">
                  <AddToCalendarButton
                    title={title}
                    startDate={exhibition.start_date}
                    endDate={exhibition.end_date}
                    description={exhibition.description?.slice(0, 200)}
                    location={[venue, exhibition.city, exhibition.country].filter(Boolean).join(", ")}
                    url={shareUrl}
                    variant="outline"
                    size="sm"
                    className="h-10 rounded-full border-border/60 bg-background/60 px-4 text-sm backdrop-blur-md hover:bg-background"
                  />
                  <ShareDropdown isAr={isAr} title={title} shareUrl={shareUrl} />
                  {isOwner && (
                    <Button variant="outline" size="sm" className="h-10 rounded-full border-border/60 bg-background/60 px-4 text-sm backdrop-blur-md" asChild>
                      <Link to={`/exhibitions/${exhibition.slug}/edit`}>
                        <Pencil className="me-1.5 h-3.5 w-3.5" />
                        {isAr ? "تعديل" : "Edit"}
                      </Link>
                    </Button>
                  )}
                  {exhibition.registration_url && !hasEnded && (
                    <Button size="sm" className="h-10 rounded-full px-5 text-sm font-semibold shadow-md hover:shadow-lg transition-shadow" asChild>
                      <a href={exhibition.registration_url} target="_blank" rel="noopener noreferrer">
                        <Ticket className="me-1.5 h-4 w-4" />
                        {isAr ? "سجل الآن" : "Register"}
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              {/* Mobile actions */}
              <div className="mt-5 flex items-center gap-2 sm:hidden">
                <ShareDropdown isAr={isAr} title={title} shareUrl={shareUrl} mobile />
                {exhibition.registration_url && !hasEnded && (
                  <Button size="sm" className="h-11 flex-1 rounded-full text-sm font-semibold shadow-md" asChild>
                    <a href={exhibition.registration_url} target="_blank" rel="noopener noreferrer">
                      <Ticket className="me-1.5 h-4 w-4" />
                      {isAr ? "سجل الآن" : "Register"}
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

/* ---------- StatPill ---------- */
function StatPill({ icon: Icon, value, label }: { icon: any; value: number; label: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-full border border-border/50 bg-background/50 px-3.5 py-1.5 backdrop-blur-md">
      <Icon className="h-3.5 w-3.5 text-primary" />
      <span className="text-sm font-bold text-foreground">
        <AnimatedCounter value={value} />
      </span>
      <span className="text-[0.75rem] text-muted-foreground">{label}</span>
    </div>
  );
}

/* ---------- ShareDropdown ---------- */
function ShareDropdown({ isAr, title, shareUrl, mobile }: { isAr: boolean; title: string; shareUrl: string; mobile?: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={mobile
            ? "h-11 w-11 shrink-0 rounded-full border-border/60 bg-background/60 p-0 backdrop-blur-md"
            : "h-10 rounded-full border-border/60 bg-background/60 px-4 text-sm backdrop-blur-md hover:bg-background"
          }
        >
          <Share2 className={mobile ? "h-4 w-4" : "me-1.5 h-3.5 w-3.5"} />
          {!mobile && <span>{isAr ? "مشاركة" : "Share"}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-2xl border-border/40 bg-card/95 p-1.5 backdrop-blur-xl">
        <DropdownMenuItem
          className="cursor-pointer gap-2.5 rounded-lg py-2.5 text-sm"
          onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`, "_blank", "noopener,noreferrer,width=600,height=400")}
        >
          <Twitter className="h-4 w-4" /> Twitter / X
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer gap-2.5 rounded-lg py-2.5 text-sm"
          onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank", "noopener,noreferrer,width=600,height=400")}
        >
          <Facebook className="h-4 w-4" /> Facebook
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer gap-2.5 rounded-lg py-2.5 text-sm"
          onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, "_blank", "noopener,noreferrer,width=600,height=400")}
        >
          <Linkedin className="h-4 w-4" /> LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer gap-2.5 rounded-lg py-2.5 text-sm"
          onClick={() => {
            navigator.clipboard.writeText(shareUrl).then(null, () => {});
            toast({ title: isAr ? "تم نسخ الرابط!" : "Link copied!" });
          }}
        >
          <Link2 className="h-4 w-4" /> {isAr ? "نسخ الرابط" : "Copy Link"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
