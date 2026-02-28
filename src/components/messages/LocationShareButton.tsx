import { useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface LocationShareButtonProps {
  isAr: boolean;
  onShare: (location: { lat: number; lng: number; label: string }) => void;
  disabled?: boolean;
}

export function LocationShareButton({ isAr, onShare, disabled }: LocationShareButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleShare = async () => {
    if (!navigator.geolocation) {
      toast({ variant: "destructive", title: isAr ? "غير مدعوم" : "Not supported", description: isAr ? "المتصفح لا يدعم تحديد الموقع" : "Browser doesn't support geolocation" });
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        onShare({
          lat: latitude,
          lng: longitude,
          label: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
        });
        setLoading(false);
      },
      (err) => {
        toast({ variant: "destructive", title: isAr ? "فشل تحديد الموقع" : "Location failed", description: err.message });
        setLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-md hover:bg-primary/5 hover:text-primary transition-colors" type="button" onClick={handleShare} disabled={disabled || loading} title={isAr ? "مشاركة الموقع" : "Share Location"}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
    </Button>
  );
}

/** Render location bubble from metadata */
export function LocationBubble({ lat, lng, label, isMine }: { lat: number; lng: number; label: string; isMine: boolean }) {
  const mapUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`;
  return (
    <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="block">
      <div className={`rounded-lg overflow-hidden border ${isMine ? "border-primary-foreground/20" : "border-border/40"}`}>
        <img
          src={`https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=14&size=280x150&markers=${lat},${lng},lightblue`}
          alt="Location"
          className="w-full h-[120px] object-cover"
          loading="lazy"
        />
        <div className={`flex items-center gap-1.5 px-2 py-1.5 text-[11px] ${isMine ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{label}</span>
        </div>
      </div>
    </a>
  );
}
