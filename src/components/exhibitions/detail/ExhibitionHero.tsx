import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import {
  Calendar, MapPin, ArrowLeft, Share2, Ticket, Building, Pencil,
  Users, Twitter, Facebook, Linkedin, Link2,
} from "lucide-react";
import { format } from "date-fns";

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

export function ExhibitionHero({
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

  return (
    <div className="relative overflow-hidden bg-background">
      <div className="relative aspect-[16/9] max-h-[520px] w-full overflow-hidden sm:aspect-[21/9] md:max-h-[480px]">
        {exhibition.cover_image_url ? (
          <img
            src={exhibition.cover_image_url}
            alt={title}
            className="h-full w-full object-cover"
            loading="eager"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/15 via-accent/8 to-background" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/20 to-transparent rtl:bg-gradient-to-l" />
        <div className="absolute inset-0 bg-black/15" />

        <div className="absolute inset-0 container flex flex-col justify-end pb-6 sm:pb-8 md:pb-16">
          <div className="max-w-4xl space-y-4 sm:space-y-6">
            <Button
              variant="ghost"
              size="sm"
              className="group -ms-2 w-fit text-white/90 hover:bg-white/10 hover:text-white backdrop-blur-sm"
              asChild
            >
              <Link to="/exhibitions">
                <ArrowLeft className="me-2 h-4 w-4" />
                {isAr ? "جميع الفعاليات" : "All Events"}
              </Link>
            </Button>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge
                  variant="secondary"
                  className="bg-primary/20 text-primary border-primary/30 backdrop-blur-md font-bold uppercase tracking-wider text-[10px] px-3 py-1"
                >
                  {isAr ? typeLabels[exhibition.type]?.ar : typeLabels[exhibition.type]?.en}
                </Badge>

                {isHappening && (
                  <Badge className="bg-chart-3 text-chart-3-foreground border-none shadow-lg shadow-chart-3/20 animate-pulse font-bold uppercase tracking-wider text-[10px] px-3 py-1">
                    {isAr ? "🔴 مباشر الآن" : "🔴 Live Now"}
                  </Badge>
                )}

                {isUpcoming && (
                  <Badge className="bg-primary text-primary-foreground border-none shadow-lg shadow-primary/20 font-bold uppercase tracking-wider text-[10px] px-3 py-1">
                    {isAr ? "قادم" : "Upcoming"}
                  </Badge>
                )}

                <Badge
                  variant="outline"
                  className="bg-white/10 text-white border-white/20 backdrop-blur-md font-bold text-[10px] px-3 py-1"
                >
                  <MapPin className="me-1.5 h-3 w-3" />
                  {exhibition.city}
                  {exhibition.country && `, ${exhibition.country}`}
                </Badge>
              </div>

              <h1 className="font-serif text-2xl font-bold leading-[1.1] tracking-tight sm:text-4xl md:text-5xl lg:text-6xl text-white drop-shadow-2xl">
                {title}{" "}
                <span className="text-primary italic">
                  {new Date(exhibition.start_date).getFullYear()}
                </span>
              </h1>

              <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm md:text-base text-white/90">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <span className="font-medium">
                    {format(start, "MMMM d")} – {format(end, "MMMM d, yyyy")}
                  </span>
                </div>

                {!exhibition.is_virtual && venue && (
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 backdrop-blur-md">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <span className="font-medium opacity-90">{venue}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Actions Bar */}
      <div className="border-y border-border/40 bg-card/80 backdrop-blur-md">
        <div className="container py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {organizer && (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/5 ring-1 ring-primary/10">
                    {organizerLogoUrl ? (
                      <img src={organizerLogoUrl} alt={organizer} className="h-8 w-8 object-contain" />
                    ) : (
                      <Building className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {isAr ? "المنظم" : "Organized by"}
                    </p>
                    <p className="text-sm font-bold text-foreground">{organizer}</p>
                  </div>
                </div>
              )}
              <Separator orientation="vertical" className="h-8 hidden sm:block" />
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {isAr ? "المتابعين" : "Followers"}
                  </p>
                  <p className="text-sm font-bold text-foreground">{followerCount}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {isAr ? "المسابقات" : "Competitions"}
                  </p>
                  <p className="text-sm font-bold text-foreground">{linkedCompetitionsCount}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 rounded-xl px-4 font-bold border-border/60 hover:bg-muted/80"
                  >
                    <Share2 className="me-2 h-4 w-4" />
                    {isAr ? "مشاركة" : "Share"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl border-border/40 p-2">
                  <DropdownMenuItem
                    className="cursor-pointer gap-3 rounded-lg py-2.5 font-medium"
                    onClick={() => {
                      const text = encodeURIComponent(
                        `${title} - ${isAr ? "فعالية على التوحاء" : "Event on Altoha"}`
                      );
                      const url = encodeURIComponent(window.location.href);
                      window.open(
                        `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
                        "_blank",
                        "width=600,height=400"
                      );
                    }}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5">
                      <Twitter className="h-4 w-4" />
                    </div>{" "}
                    Twitter / X
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer gap-3 rounded-lg py-2.5 font-medium"
                    onClick={() => {
                      window.open(
                        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
                        "_blank",
                        "width=600,height=400"
                      );
                    }}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Facebook className="h-4 w-4" />
                    </div>{" "}
                    Facebook
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer gap-3 rounded-lg py-2.5 font-medium"
                    onClick={() => {
                      window.open(
                        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`,
                        "_blank",
                        "width=600,height=400"
                      );
                    }}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Linkedin className="h-4 w-4" />
                    </div>{" "}
                    LinkedIn
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer gap-3 rounded-lg py-2.5 font-medium"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast({ title: isAr ? "تم نسخ الرابط!" : "Link copied!" });
                    }}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <Link2 className="h-4 w-4" />
                    </div>{" "}
                    {isAr ? "نسخ الرابط" : "Copy Link"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {isOwner && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 rounded-xl px-4 font-bold border-border/60 hover:bg-muted/80"
                  asChild
                >
                  <Link to={`/exhibitions/${exhibition.slug}/edit`}>
                    <Pencil className="me-2 h-4 w-4" />
                    {isAr ? "تعديل" : "Edit"}
                  </Link>
                </Button>
              )}

              {exhibition.registration_url && !hasEnded && (
                <Button className="h-10 rounded-xl px-6 font-bold shadow-lg shadow-primary/20" asChild>
                  <a href={exhibition.registration_url} target="_blank" rel="noopener noreferrer">
                    <Ticket className="me-2 h-4 w-4" />
                    {isAr ? "سجل الآن" : "Register Now"}
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
