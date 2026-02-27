import { memo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Ticket, Globe, Share2, Download, Bookmark, BookmarkCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Props {
  user: any;
  isFollowing: boolean;
  followPending: boolean;
  onFollow: () => void;
  registrationUrl?: string | null;
  websiteUrl?: string | null;
  hasEnded: boolean;
  isAr: boolean;
  exhibitionTitle?: string;
  isWatchlisted?: boolean;
  onToggleWatchlist?: () => void;
}

export const ExhibitionMobileActionBar = memo(function ExhibitionMobileActionBar({
  user, isFollowing, followPending, onFollow, registrationUrl, websiteUrl, hasEnded, isAr, exhibitionTitle, isWatchlisted, onToggleWatchlist,
}: Props) {
  const showRegistration = registrationUrl && !hasEnded;
  const showFollow = !!user;
  const showWebsite = !!websiteUrl;
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const handleShare = async () => {
    const shareData = {
      title: exhibitionTitle || (isAr ? "فعالية" : "Event"),
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: isAr ? "تم نسخ الرابط 📋" : "Link copied 📋" });
    }
  };

  if (!showRegistration && !showFollow && !showWebsite) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-card/95 backdrop-blur-lg px-3 py-2.5 lg:hidden safe-area-bottom">
      <div className="flex gap-2">
        {deferredPrompt && (
          <Button
            variant="outline"
            size="sm"
            className="h-10 w-10 rounded-xl p-0 shrink-0 active:scale-95 transition-transform"
            onClick={handleInstall}
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="h-10 w-10 rounded-xl p-0 shrink-0 active:scale-95 transition-transform"
          onClick={handleShare}
        >
          <Share2 className="h-4 w-4" />
        </Button>
        {user && onToggleWatchlist && (
          <Button
            variant="outline"
            size="sm"
            className="h-10 w-10 rounded-xl p-0 shrink-0 active:scale-95 transition-transform"
            onClick={onToggleWatchlist}
          >
            {isWatchlisted ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
          </Button>
        )}
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
