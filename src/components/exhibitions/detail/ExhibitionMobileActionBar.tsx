import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Ticket, Globe } from "lucide-react";

interface Props {
  user: any;
  isFollowing: boolean;
  followPending: boolean;
  onFollow: () => void;
  registrationUrl?: string | null;
  websiteUrl?: string | null;
  hasEnded: boolean;
  isAr: boolean;
}

export const ExhibitionMobileActionBar = memo(function ExhibitionMobileActionBar({
  user, isFollowing, followPending, onFollow, registrationUrl, websiteUrl, hasEnded, isAr,
}: Props) {
  const showRegistration = registrationUrl && !hasEnded;
  const showFollow = !!user;
  const showWebsite = !!websiteUrl;

  if (!showRegistration && !showFollow && !showWebsite) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-card/95 backdrop-blur-lg px-3 py-2.5 lg:hidden safe-area-bottom">
      <div className="flex gap-2">
        {showFollow && (
          <Button
            variant={isFollowing ? "outline" : "secondary"}
            size="sm"
            className="h-10 flex-1 rounded-xl text-xs font-semibold active:scale-95 transition-transform"
            onClick={onFollow}
            disabled={followPending}
          >
            {isFollowing ? (
              <><BellOff className="me-1.5 h-3.5 w-3.5" />{isAr ? "إلغاء" : "Unfollow"}</>
            ) : (
              <><Bell className="me-1.5 h-3.5 w-3.5" />{isAr ? "متابعة" : "Follow"}</>
            )}
          </Button>
        )}
        {showWebsite && (
          <Button variant="outline" size="sm" className="h-10 rounded-xl text-xs active:scale-95 transition-transform" asChild>
            <a href={websiteUrl!} target="_blank" rel="noopener noreferrer">
              <Globe className="me-1.5 h-3.5 w-3.5" />
              {isAr ? "الموقع" : "Site"}
            </a>
          </Button>
        )}
        {showRegistration && (
          <Button size="sm" className="h-10 flex-1 rounded-xl text-xs font-semibold shadow-md active:scale-95 transition-transform" asChild>
            <a href={registrationUrl!} target="_blank" rel="noopener noreferrer">
              <Ticket className="me-1.5 h-3.5 w-3.5" />
              {isAr ? "سجل الآن" : "Register"}
            </a>
          </Button>
        )}
      </div>
    </div>
  );
});
