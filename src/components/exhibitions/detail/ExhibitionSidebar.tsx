import { lazy, Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import {
  Bell, BellOff, Calendar, Clock, ExternalLink, Globe, MapPin,
  Tag, Ticket, Timer, Users,
} from "lucide-react";
import { toEnglishDigits } from "@/lib/formatNumber";
import { QRCodeDisplay } from "@/components/qr/QRCodeDisplay";
import { ExhibitionRegistrationStatus } from "./ExhibitionRegistrationStatus";
import { ExhibitionTicketBooking } from "./ExhibitionTicketBooking";
import { ExhibitionDayIndicator } from "./ExhibitionDayIndicator";
import { CountdownTimer } from "./CountdownTimer";

const ExhibitionStats = lazy(() => import("./ExhibitionStats").then(m => ({ default: m.ExhibitionStats })));
const ExhibitionNotificationPrompt = lazy(() => import("./ExhibitionNotificationPrompt").then(m => ({ default: m.ExhibitionNotificationPrompt })));
const ExhibitionContactCard = lazy(() => import("./ExhibitionContactCard").then(m => ({ default: m.ExhibitionContactCard })));
const ExhibitionMapEmbed = lazy(() => import("./ExhibitionMapEmbed").then(m => ({ default: m.ExhibitionMapEmbed })));
const ExhibitionSocialLinks = lazy(() => import("./ExhibitionSocialLinks").then(m => ({ default: m.ExhibitionSocialLinks })));
const ExhibitionDocuments = lazy(() => import("./ExhibitionDocuments").then(m => ({ default: m.ExhibitionDocuments })));
const ExhibitionShareButtons = lazy(() => import("./ExhibitionShareButtons").then(m => ({ default: m.ExhibitionShareButtons })));
const ExhibitionInviteLink = lazy(() => import("./ExhibitionInviteLink").then(m => ({ default: m.ExhibitionInviteLink })));
const ExhibitionVolunteerRegistration = lazy(() => import("./ExhibitionVolunteerRegistration").then(m => ({ default: m.ExhibitionVolunteerRegistration })));

interface Props {
  exhibition: any;
  title: string;
  description: string | null;
  venue: string | null;
  organizer: string | null;
  organizerLogoUrl: string | null;
  isHappening: boolean;
  isUpcoming: boolean;
  hasEnded: boolean;
  isFollowing: boolean;
  followerCount: number;
  user: any;
  isAr: boolean;
  countryFlag: string;
  tags: string[];
  exhibitionQrCode: any;
  onFollow: () => void;
  followPending: boolean;
}

export function ExhibitionSidebar({
  exhibition, title, description, venue, organizer, organizerLogoUrl,
  isHappening, isUpcoming, hasEnded,
  isFollowing, followerCount, user, isAr, countryFlag, tags,
  exhibitionQrCode, onFollow, followPending,
}: Props) {
  const start = new Date(exhibition.start_date);
  const end = new Date(exhibition.end_date);

  return (
    <div className="hidden space-y-5 lg:block">
      {(isUpcoming || isHappening) && (
        <Card className="relative overflow-hidden shadow-md border-primary/15">
          <div className="absolute -top-12 -end-12 h-32 w-32 rounded-full bg-primary/5 blur-[40px]" />
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 py-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10"><Timer className="h-3.5 w-3.5 text-primary" /></div>
              {isHappening ? (isAr ? "ينتهي خلال" : "Ends In") : (isAr ? "يبدأ خلال" : "Starts In")}
            </h3>
          </div>
          <CardContent className="py-4 px-3"><CountdownTimer targetDate={isHappening ? end : start} isAr={isAr} compact /></CardContent>
        </Card>
      )}

      <ExhibitionRegistrationStatus registrationDeadline={exhibition.registration_deadline} registrationUrl={exhibition.registration_url} maxAttendees={exhibition.max_attendees} isFree={exhibition.is_free} ticketPrice={exhibition.ticket_price} ticketPriceAr={exhibition.ticket_price_ar} startDate={exhibition.start_date} endDate={exhibition.end_date} isAr={isAr} />
      <ExhibitionTicketBooking exhibitionId={exhibition.id} exhibitionTitle={title} isFree={exhibition.is_free} ticketPrice={exhibition.ticket_price} hasEnded={hasEnded} isAr={isAr} />
      <ExhibitionDayIndicator startDate={exhibition.start_date} endDate={exhibition.end_date} isAr={isAr} />

      <Suspense fallback={null}>
        <ExhibitionStats exhibitionId={exhibition.id} isAr={isAr} />
        <ExhibitionShareButtons title={title} description={description || undefined} imageUrl={exhibition.cover_image_url} isAr={isAr} />
        <ExhibitionInviteLink exhibitionId={exhibition.id} exhibitionSlug={exhibition.slug} isAr={isAr} />
        <ExhibitionNotificationPrompt exhibitionId={exhibition.id} exhibitionName={title} isAr={isAr} isFollowing={isFollowing} />
      </Suspense>

      {/* Actions */}
      <Card className="relative overflow-hidden shadow-md border-primary/15">
        <div className="absolute -top-12 -end-12 h-32 w-32 rounded-full bg-primary/5 blur-[40px]" />
        <div className="border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 py-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10"><Ticket className="h-3.5 w-3.5 text-primary" /></div>
            {isAr ? "إجراءات" : "Actions"}
          </h3>
        </div>
        <CardContent className="space-y-3 p-4">
          {exhibition.registration_url && !hasEnded && (
            <Button className="w-full" asChild>
              <a href={exhibition.registration_url} target="_blank" rel="noopener noreferrer"><Ticket className="me-2 h-4 w-4" />{isAr ? "سجل الآن" : "Register Now"}</a>
            </Button>
          )}
          {user && (
            <Button variant={isFollowing ? "outline" : "secondary"} className="w-full" onClick={onFollow} disabled={followPending}>
              {isFollowing ? (<><BellOff className="me-2 h-4 w-4" />{isAr ? "إلغاء المتابعة" : "Unfollow"}</>) : (<><Bell className="me-2 h-4 w-4" />{isAr ? "تابع للإشعارات" : "Follow for Updates"}</>)}
            </Button>
          )}
          {exhibition.website_url && (
            <Button variant="outline" className="w-full" asChild>
              <a href={exhibition.website_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="me-2 h-4 w-4" />{isAr ? "الموقع الرسمي" : "Official Website"}</a>
            </Button>
          )}
          <p className="text-center text-xs text-muted-foreground"><Users className="mb-0.5 me-1 inline h-3 w-3" />{followerCount} {isAr ? "متابع" : "followers"}</p>
        </CardContent>
      </Card>

      <Suspense fallback={null}>
        <ExhibitionContactCard organizerName={organizer} organizerLogo={organizerLogoUrl} email={exhibition.organizer_email} phone={exhibition.organizer_phone} website={exhibition.organizer_website} isAr={isAr} />
        {!exhibition.is_virtual && <ExhibitionMapEmbed mapUrl={exhibition.map_url} venue={venue} city={exhibition.city} country={exhibition.country} address={(exhibition as any).address || null} isAr={isAr} />}
        <ExhibitionSocialLinks socialLinks={exhibition.social_links as any} websiteUrl={exhibition.website_url} isAr={isAr} />
        <ExhibitionDocuments documents={(exhibition as any).documents} isAr={isAr} />
      </Suspense>

      {/* Event Details */}
      <Card className="overflow-hidden transition-all hover:shadow-sm">
        <div className="border-b bg-muted/30 px-4 py-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/10"><Calendar className="h-3.5 w-3.5 text-accent-foreground" /></div>
            {isAr ? "تفاصيل الحدث" : "Event Details"}
          </h3>
        </div>
        <CardContent className="p-0">
          <div className="flex items-center gap-3 px-4 py-3">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{isAr ? "التاريخ" : "Date"}</p>
              <p className="text-sm font-medium">{format(start, "MMM d")} – {format(end, "MMM d, yyyy")}</p>
            </div>
          </div>
          <Separator />
          {exhibition.registration_deadline && (
            <>
              <div className="flex items-center gap-3 px-4 py-3">
                <Clock className="h-4 w-4 text-destructive shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{isAr ? "آخر موعد للتسجيل" : "Registration Deadline"}</p>
                  <p className="text-sm font-medium">{format(new Date(exhibition.registration_deadline), "MMM d, yyyy")}</p>
                </div>
              </div>
              <Separator />
            </>
          )}
          {exhibition.is_virtual ? (
            <>
              <div className="flex items-center gap-3 px-4 py-3">
                <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{isAr ? "الموقع" : "Location"}</p>
                  <p className="text-sm font-medium">{isAr ? "حدث افتراضي" : "Virtual Event"}</p>
                  {exhibition.virtual_link && !hasEnded && <a href={exhibition.virtual_link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">{isAr ? "رابط الدخول" : "Join Link"}</a>}
                </div>
              </div>
              <Separator />
            </>
          ) : venue ? (
            <>
              <div className="flex items-center gap-3 px-4 py-3">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{isAr ? "الموقع" : "Location"}</p>
                  <p className="text-sm font-medium">{countryFlag} {venue}{exhibition.city && <><br />{exhibition.city}</>}{exhibition.country && `, ${exhibition.country}`}</p>
                </div>
              </div>
              <Separator />
            </>
          ) : null}
          <div className="flex items-center gap-3 px-4 py-3">
            <Ticket className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{isAr ? "التذاكر" : "Tickets"}</p>
              <p className="text-sm font-medium">{exhibition.is_free ? (isAr ? "دخول مجاني" : "Free Entry") : (isAr && exhibition.ticket_price_ar ? exhibition.ticket_price_ar : exhibition.ticket_price || (isAr ? "راجع الموقع" : "See website"))}</p>
            </div>
          </div>
          {exhibition.max_attendees && (
            <>
              <Separator />
              <div className="flex items-center gap-3 px-4 py-3">
                <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{isAr ? "السعة" : "Capacity"}</p>
                  <p className="text-sm font-medium">{toEnglishDigits(exhibition.max_attendees.toLocaleString())} {isAr ? "مقعد" : "attendees"}</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {exhibitionQrCode && <QRCodeDisplay code={exhibitionQrCode.code} label={isAr ? "رمز QR للفعالية" : "Exhibition QR Code"} size={140} compact={false} />}

      {/* Volunteer Registration */}
      <Suspense fallback={null}>
        <ExhibitionVolunteerRegistration exhibitionId={exhibition.id} isAr={isAr} />
      </Suspense>

      {tags.length > 0 && (
        <Card className="overflow-hidden transition-all hover:shadow-sm">
          <div className="border-b bg-muted/30 px-4 py-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/10"><Tag className="h-3.5 w-3.5 text-accent-foreground" /></div>
              {isAr ? "الوسوم" : "Tags"}
            </h3>
          </div>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-1.5">{tags.map((tag) => <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>)}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
