import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, ExternalLink, Navigation, Compass } from "lucide-react";

interface Props {
  mapUrl?: string | null;
  venue?: string | null;
  city?: string | null;
  country?: string | null;
  address?: string | null;
  isAr: boolean;
}

function extractEmbedUrl(mapUrl: string): string | null {
  const coordMatch = mapUrl.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (coordMatch) {
    return `https://maps.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}&z=15&output=embed`;
  }
  const placeMatch = mapUrl.match(/place\/([^/@]+)/);
  if (placeMatch) {
    const placeName = decodeURIComponent(placeMatch[1]).replace(/\+/g, " ");
    return `https://maps.google.com/maps?q=${encodeURIComponent(placeName)}&z=15&output=embed`;
  }
  const queryMatch = mapUrl.match(/[?&]q=([^&]+)/);
  if (queryMatch) {
    return `https://maps.google.com/maps?q=${queryMatch[1]}&z=15&output=embed`;
  }
  return null;
}

function buildFallbackEmbedUrl(venue?: string | null, city?: string | null, country?: string | null): string | null {
  const query = [venue, city, country].filter(Boolean).join(", ");
  if (!query) return null;
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=14&output=embed`;
}

export const ExhibitionMapEmbed = memo(function ExhibitionMapEmbed({ mapUrl, venue, city, country, address, isAr }: Props) {
  const embedUrl = mapUrl ? extractEmbedUrl(mapUrl) : null;
  const fallbackEmbed = !embedUrl ? buildFallbackEmbedUrl(venue, city, country) : null;
  const finalEmbedUrl = embedUrl || fallbackEmbed;
  const locationLabel = [venue, city, country].filter(Boolean).join(", ");

  if (!mapUrl && !venue) return null;

  return (
    <Card className="overflow-hidden border-border/60 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-border/40 bg-gradient-to-r from-chart-1/8 via-transparent to-transparent px-4 py-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-chart-1/10">
          <Compass className="h-3.5 w-3.5 text-chart-1" />
        </div>
        <h3 className="text-sm font-semibold">{isAr ? "الموقع على الخريطة" : "Location Map"}</h3>
      </div>

      <CardContent className="p-0">
        {/* Map embed */}
        {finalEmbedUrl ? (
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
            <iframe
              src={finalEmbedUrl}
              className="h-full w-full border-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={isAr ? "خريطة الموقع" : "Location Map"}
            />
          </div>
        ) : (
          <div className="flex aspect-[2/1] items-center justify-center bg-gradient-to-br from-muted/40 to-muted/10">
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60">
                <Navigation className="h-6 w-6 text-muted-foreground/30" />
              </div>
              <p className="text-xs text-muted-foreground/60">{isAr ? "لا تتوفر خريطة" : "Map not available"}</p>
            </div>
          </div>
        )}

        {/* Location details */}
        <div className="p-4 space-y-3">
          {locationLabel && (
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <MapPin className="h-3 w-3 text-primary" />
              </div>
              <div>
                {venue && <p className="text-sm font-semibold text-foreground">{venue}</p>}
                {(city || country) && (
                  <p className="text-xs text-muted-foreground">{[city, country].filter(Boolean).join(", ")}</p>
                )}
                {address && <p className="text-[11px] text-muted-foreground/70 mt-0.5">{address}</p>}
              </div>
            </div>
          )}

          {mapUrl && (
            <Button variant="outline" size="sm" className="w-full rounded-xl h-9 border-border/60" asChild>
              <a href={mapUrl} target="_blank" rel="noopener noreferrer">
                <Navigation className="me-2 h-3.5 w-3.5 text-primary" />
                <span className="flex-1 text-start">{isAr ? "فتح في خرائط جوجل" : "Open in Google Maps"}</span>
                <ExternalLink className="ms-2 h-3 w-3 text-muted-foreground/50" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
