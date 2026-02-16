import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Ticket, Clock, Users, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { isPast, isFuture, differenceInDays, format } from "date-fns";

interface Props {
  registrationDeadline?: string | null;
  registrationUrl?: string | null;
  maxAttendees?: number | null;
  isFree?: boolean | null;
  ticketPrice?: string | null;
  ticketPriceAr?: string | null;
  startDate: string;
  endDate: string;
  isAr: boolean;
}

export function ExhibitionRegistrationStatus({
  registrationDeadline,
  registrationUrl,
  maxAttendees,
  isFree,
  ticketPrice,
  ticketPriceAr,
  startDate,
  endDate,
  isAr,
}: Props) {
  const now = new Date();
  const hasEnded = isPast(new Date(endDate));
  const deadlinePast = registrationDeadline ? isPast(new Date(registrationDeadline)) : false;
  const daysUntilDeadline = registrationDeadline
    ? differenceInDays(new Date(registrationDeadline), now)
    : null;

  const isOpen = !hasEnded && !deadlinePast && !!registrationUrl;
  const isClosingSoon = isOpen && daysUntilDeadline !== null && daysUntilDeadline <= 7 && daysUntilDeadline >= 0;

  return (
    <Card className={`overflow-hidden transition-all ${isOpen ? "border-chart-3/30 shadow-md" : ""}`}>
      <div className={`border-b px-4 py-3 ${isOpen ? "bg-gradient-to-r from-chart-3/10 via-chart-3/5 to-transparent" : "bg-muted/30"}`}>
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <div className={`flex h-6 w-6 items-center justify-center rounded-md ${isOpen ? "bg-chart-3/15" : "bg-muted"}`}>
            <Ticket className={`h-3.5 w-3.5 ${isOpen ? "text-chart-3" : "text-muted-foreground"}`} />
          </div>
          {isAr ? "حالة التسجيل" : "Registration Status"}
        </h3>
      </div>
      <CardContent className="p-4 space-y-3">
        {/* Status badge */}
        <div className="flex items-center gap-2">
          {isOpen ? (
            <Badge className="bg-chart-3/15 text-chart-3 border-chart-3/20 gap-1.5">
              <CheckCircle2 className="h-3 w-3" />
              {isAr ? "التسجيل مفتوح" : "Registration Open"}
            </Badge>
          ) : hasEnded ? (
            <Badge className="bg-muted text-muted-foreground gap-1.5">
              <XCircle className="h-3 w-3" />
              {isAr ? "انتهى الحدث" : "Event Ended"}
            </Badge>
          ) : deadlinePast ? (
            <Badge className="bg-destructive/15 text-destructive border-destructive/20 gap-1.5">
              <XCircle className="h-3 w-3" />
              {isAr ? "التسجيل مغلق" : "Registration Closed"}
            </Badge>
          ) : (
            <Badge className="bg-muted text-muted-foreground gap-1.5">
              {isAr ? "التسجيل غير متاح" : "Registration Unavailable"}
            </Badge>
          )}
        </div>

        {/* Closing soon warning */}
        {isClosingSoon && (
          <div className="flex items-center gap-2 rounded-lg bg-chart-4/10 p-2.5 text-xs font-medium text-chart-4">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            {isAr
              ? `يغلق التسجيل خلال ${daysUntilDeadline} ${daysUntilDeadline === 1 ? "يوم" : "أيام"}`
              : `Registration closes in ${daysUntilDeadline} day${daysUntilDeadline === 1 ? "" : "s"}`}
          </div>
        )}

        {/* Details */}
        <div className="space-y-2 text-sm">
          {registrationDeadline && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>
                {isAr ? "آخر موعد: " : "Deadline: "}
                <span className="font-medium text-foreground">
                  {format(new Date(registrationDeadline), "MMM d, yyyy")}
                </span>
              </span>
            </div>
          )}
          {maxAttendees && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-3.5 w-3.5 shrink-0" />
              <span>
                {isAr ? "الحد الأقصى: " : "Max capacity: "}
                <span className="font-medium text-foreground">{maxAttendees.toLocaleString()}</span>
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Ticket className="h-3.5 w-3.5 shrink-0" />
            <span className="font-medium text-foreground">
              {isFree
                ? isAr ? "دخول مجاني" : "Free Entry"
                : isAr && ticketPriceAr
                  ? ticketPriceAr
                  : ticketPrice || (isAr ? "راجع الموقع" : "See website")}
            </span>
          </div>
        </div>

        {/* CTA */}
        {isOpen && registrationUrl && (
          <Button className="w-full shadow-lg shadow-primary/20" asChild>
            <a href={registrationUrl} target="_blank" rel="noopener noreferrer">
              <Ticket className="me-2 h-4 w-4" />
              {isAr ? "سجل الآن" : "Register Now"}
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
