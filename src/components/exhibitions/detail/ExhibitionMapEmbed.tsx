import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, ExternalLink, Navigation } from "lucide-react";

interface Props {
  mapUrl?: string | null;
  venue?: string | null;
  city?: string | null;
  country?: string | null;
  address?: string | null;
  isAr: boolean;
}

function extractEmbedUrl(mapUrl: string): string | null {
  // Try to extract lat/lng from Google Maps URL for embed
  const coordMatch = mapUrl.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (coordMatch) {
    const lat = coordMatch[1];
    const lng = coordMatch[2];
    return `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
  }
  // Try place ID format
  const placeMatch = mapUrl.match(/place\/([^/@]+)/);
  if (placeMatch) {
    const placeName = decodeURIComponent(placeMatch[1]).replace(/\+/g, " ");
    return `https://maps.google.com/maps?q=${encodeURIComponent(placeName)}&z=15&output=embed`;
  }
  // Try query parameter
  const queryMatch = mapUrl.match(/[?&]q=([^&]+)/);
  if (queryMatch) {
    return `https://maps.google.com/maps?q=${queryMatch[1]}&z=15&output=embed`;
  }
  // Fallback: use venue/city/country as search query
  return null;
}

function buildFallbackEmbedUrl(venue?: string | null, city?: string | null, country?: string | null): string | null {
  const query = [venue, city, country].filter(Boolean).join(", ");
  if (!query) return null;
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=14&output=embed`;
}

export function ExhibitionMapEmbed({ mapUrl, venue, city, country, address, isAr }: Props) {
  const embedUrl = mapUrl ? extractEmbedUrl(mapUrl) : null;
  const fallbackEmbed = !embedUrl ? buildFallbackEmbedUrl(venue, city, country) : null;
  const finalEmbedUrl = embedUrl || fallbackEmbed;
  const locationLabel = [venue, city, country].filter(Boolean).join(", ");

  if (!mapUrl && !venue) return null;

  return (
    <Card className="overflow-hidden border-primary/10">
      <div className="border-b bg-gradient-to-r from-chart-1/10 via-transparent to-transparent px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-chart-1/10">
            <MapPin className="h-3.5 w-3.5 text-chart-1" />
          </div>
          {isAr ? "الموقع على الخريطة" : "Location Map"}
        </h3>
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
          <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-muted/50 to-muted/20">
            <div className="text-center space-y-2">
              <Navigation className="h-10 w-10 text-muted-foreground/30 mx-auto" />
              <p className="text-xs text-muted-foreground">{isAr ? "لا تتوفر خريطة" : "Map not available"}</p>
            </div>
          </div>
        )}

        {/* Location details */}
        <div className="p-4 space-y-3">
          {locationLabel && (
            <div className="flex items-start gap-2.5">
              <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">{venue}</p>
                {(city || country) && (
                  <p className="text-xs text-muted-foreground">
                    {[city, country].filter(Boolean).join(", ")}
                  </p>
                )}
                {address && (
                  <p className="text-xs text-muted-foreground mt-0.5">{address}</p>
                )}
              </div>
            </div>
          )}

          {mapUrl && (
            <Button variant="outline" size="sm" className="w-full" asChild>
              <a href={mapUrl} target="_blank" rel="noopener noreferrer">
                <Navigation className="me-2 h-3.5 w-3.5" />
                {isAr ? "فتح في خرائط جوجل" : "Open in Google Maps"}
                <ExternalLink className="ms-auto h-3 w-3 text-muted-foreground" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
