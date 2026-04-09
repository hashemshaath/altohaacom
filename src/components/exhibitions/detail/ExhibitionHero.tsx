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
  Twitter, Facebook, Linkedin, Link2,
} from "lucide-react";
import { format } from "date-fns";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { useCoverSettings } from "@/hooks/useCoverSettings";

interface ExhibitionHeroProps {
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

export const ExhibitionHero = memo(function ExhibitionHero({
  exhibition,
  title,
  venue,
  organizer,
  organizerLogoUrl,
  isHappening,
  isUpcoming,
  hasEnded,
  isOwner,
  followerCount,
  linkedCompetitionsCount,
  isAr,
}: ExhibitionHeroProps) {
  const start = new Date(exhibition.start_date);
  const end = new Date(exhibition.end_date);

  const typeLabels: Record<string, { en: string; ar: string }> = {
    exhibition: { en: "Exhibition", ar: "معرض" },
    conference: { en: "Conference", ar: "مؤتمر" },
    summit: { en: "Summit", ar: "قمة" },
    workshop: { en: "Workshop", ar: "ورشة عمل" },
    food_festival: { en: "Food Festival", ar: "مهرجان طعام" },
    trade_show: { en: "Trade Show", ar: "معرض تجاري" },
    competition_event: { en: "Competition Event", ar: "حدث تنافسي" },
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const { height, isVisible, gradientOverlay } = useCoverSettings("exhibition-detail");

  return (
    <div className="relative bg-background transition-colors duration-300">
      {/* Cover Image */}
      {isVisible && (
      <div className="relative w-full overflow-hidden" style={{ maxHeight: height ? `${height}px` : "380px" }}>
        <div className="aspect-[21/9] w-full">
          {exhibition.cover_image_url ? (
            <img
              src={exhibition.cover_image_url}
              alt={title}
              className="h-full w-full object-cover"
              loading="eager"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/20 via-accent/10 to-background" />
          )}
        </div>
        {gradientOverlay && (
          <div className="absolute inset-0" style={{ background: gradientOverlay }} />
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />

        {/* Back button */}
        <div className="absolute top-3 start-3 sm:top-4 sm:start-4">
          <Button
            variant="secondary"
            size="sm"
            className="h-9 sm:h-10 rounded-xl bg-background/80 backdrop-blur-sm text-foreground shadow-sm hover:bg-background/90 text-sm font-medium"
            asChild
          >
            <Link to="/exhibitions">
              <ArrowLeft className="me-1.5 h-4 w-4 rtl:rotate-180" />
              {isAr ? "جميع الفعاليات" : "All Events"}
            </Link>
          </Button>
        </div>

        {/* Status badges */}
        <div className="absolute top-3 end-3 sm:top-4 sm:end-4 flex items-center gap-2">
          {isHappening && (
            <Badge className="bg-destructive text-destructive-foreground border-none shadow-md text-xs font-bold uppercase tracking-wider px-3 py-1.5 animate-pulse">
              {isAr ? "🔴 مباشر" : "🔴 Live"}
            </Badge>
          )}
          {isUpcoming && (
            <Badge className="bg-primary text-primary-foreground border-none shadow-md text-xs font-bold uppercase tracking-wider px-3 py-1.5">
              {isAr ? "قادم" : "Upcoming"}
            </Badge>
          )}
          {hasEnded && (
            <Badge variant="secondary" className="shadow-md text-xs font-bold uppercase tracking-wider px-3 py-1.5">
              {isAr ? "انتهى" : "Ended"}
            </Badge>
          )}
        </div>
      </div>
      )}

      {/* Content bar */}
      <div className="border-b border-border/50 bg-gradient-to-b from-card to-card/80">
        <div className="container py-4 sm:py-6 space-y-3 sm:space-y-4">
          {/* Title row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2.5 min-w-0 flex-1">
              {/* Type + Location chips */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs font-bold uppercase tracking-wider border-primary/30 text-primary px-2.5 py-1">
                  {isAr ? typeLabels[exhibition.type]?.ar : typeLabels[exhibition.type]?.en}
                </Badge>
                {exhibition.exhibition_number && (
                  <Badge variant="secondary" className="text-xs font-mono px-2 py-1">
                    {exhibition.exhibition_number}
                  </Badge>
                )}
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {exhibition.city}{exhibition.country && `, ${exhibition.country}`}
                </span>
              </div>

              {/* Title */}
              <h1 className={`text-xl font-bold leading-tight tracking-tight sm:text-2xl md:text-3xl lg:text-4xl text-foreground ${isAr ? "" : "font-serif"}`}>
                {title}
              </h1>

              {/* Date + Venue */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm sm:text-base text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-primary/60" />
                  {format(start, "MMM d")} – {format(end, "MMM d, yyyy")}
                </span>
                {!exhibition.is_virtual && venue && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary/60" />
                    {venue}
                  </span>
                )}
              </div>
            </div>

            {/* Desktop actions */}
            <div className="hidden sm:flex items-center gap-2 shrink-0 pt-1">
              <AddToCalendarButton
                title={title}
                startDate={exhibition.start_date}
                endDate={exhibition.end_date}
                description={exhibition.description?.slice(0, 200)}
                location={[venue, exhibition.city, exhibition.country].filter(Boolean).join(", ")}
                url={shareUrl}
                variant="outline"
                size="sm"
                className="h-10 rounded-xl text-sm"
              />
              <ShareDropdown isAr={isAr} title={title} shareUrl={shareUrl} />

              {isOwner && (
                <Button variant="outline" size="sm" className="h-10 rounded-xl text-sm" asChild>
                  <Link to={`/exhibitions/${exhibition.slug}/edit`}>
                    <Pencil className="me-1.5 h-4 w-4" />
                    {isAr ? "تعديل" : "Edit"}
                  </Link>
                </Button>
              )}

              {exhibition.registration_url && !hasEnded && (
                <Button size="sm" className="h-10 rounded-xl shadow-sm text-sm font-semibold" asChild>
                  <a href={exhibition.registration_url} target="_blank" rel="noopener noreferrer">
                    <Ticket className="me-1.5 h-4 w-4" />
                    {isAr ? "سجل الآن" : "Register"}
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* Info strip — organizer + stats */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-muted-foreground pt-2 border-t border-border/20">
            {organizer && (
              <div className="flex items-center gap-2.5 pt-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/5 ring-1 ring-primary/10">
                  {organizerLogoUrl ? (
                    <img src={organizerLogoUrl} alt={organizer} className="h-6 w-6 object-contain" loading="lazy" />
                  ) : (
                    <Building className="h-4 w-4 text-primary" />
                  )}
                </div>
                <span className="font-medium text-foreground text-sm">{organizer}</span>
              </div>
            )}
            <div className="flex items-center gap-4 pt-2 ms-auto text-sm">
              <span>
                <span className="font-bold text-foreground"><AnimatedCounter value={followerCount} /></span>{" "}
                {isAr ? "متابع" : "followers"}
              </span>
              <span>
                <span className="font-bold text-foreground"><AnimatedCounter value={linkedCompetitionsCount} /></span>{" "}
                {isAr ? "مسابقة" : "competitions"}
              </span>
            </div>
          </div>

          {/* Mobile actions */}
          <div className="flex items-center gap-2 sm:hidden">
            <ShareDropdown isAr={isAr} title={title} shareUrl={shareUrl} />
            {isOwner && (
              <Button variant="outline" size="sm" className="h-11 rounded-xl text-sm flex-1 active:scale-[0.98] transition-transform" asChild>
                <Link to={`/exhibitions/${exhibition.slug}/edit`}>
                  <Pencil className="me-1.5 h-4 w-4" />
                  {isAr ? "تعديل" : "Edit"}
                </Link>
              </Button>
            )}
            {exhibition.registration_url && !hasEnded && (
              <Button size="sm" className="h-11 rounded-xl text-sm flex-1 font-semibold active:scale-[0.98] transition-transform" asChild>
                <a href={exhibition.registration_url} target="_blank" rel="noopener noreferrer">
                  <Ticket className="me-1.5 h-4 w-4" />
                  {isAr ? "سجل" : "Register"}
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

/* ---------- Share dropdown ---------- */
function ShareDropdown({ isAr, title, shareUrl }: { isAr: boolean; title: string; shareUrl: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 sm:h-10 rounded-xl">
          <Share2 className="me-1.5 h-4 w-4" />
          <span className="hidden sm:inline">{isAr ? "مشاركة" : "Share"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5">
        <DropdownMenuItem
          className="cursor-pointer gap-2.5 rounded-md py-2.5 text-sm"
          onClick={() => {
            const text = encodeURIComponent(title);
            const url = encodeURIComponent(shareUrl);
            window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, "_blank", "width=600,height=400");
          }}
        >
          <Twitter className="h-4 w-4" /> Twitter / X
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer gap-2.5 rounded-md py-2.5 text-sm"
          onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank", "width=600,height=400")}
        >
          <Facebook className="h-4 w-4" /> Facebook
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer gap-2.5 rounded-md py-2.5 text-sm"
          onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, "_blank", "width=600,height=400")}
        >
          <Linkedin className="h-4 w-4" /> LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer gap-2.5 rounded-md py-2.5 text-sm"
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
