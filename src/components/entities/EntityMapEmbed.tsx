import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, ExternalLink, Navigation } from "lucide-react";

interface Props {
  latitude?: number | null;
  longitude?: number | null;
  name?: string;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  googleMapsUrl?: string | null;
  isAr: boolean;
}

export function EntityMapEmbed({ latitude, longitude, name, address, city, country, googleMapsUrl, isAr }: Props) {
  // Build embed URL from coordinates or fallback to search by name+city
  let embedUrl: string | null = null;
  
  if (latitude && longitude) {
    const q = name ? encodeURIComponent(name) : `${latitude},${longitude}`;
    embedUrl = `https://maps.google.com/maps?q=${q}&ll=${latitude},${longitude}&z=16&output=embed`;
  } else if (googleMapsUrl) {
    const coordMatch = googleMapsUrl.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (coordMatch) {
      embedUrl = `https://maps.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}&z=15&output=embed`;
    } else {
      const placeMatch = googleMapsUrl.match(/place\/([^/]+)/);
      if (placeMatch) {
        const placeName = decodeURIComponent(placeMatch[1]).replace(/\+/g, " ");
        embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(placeName)}&z=15&output=embed`;
      }
    }
  } else if (name && city) {
    embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(`${name} ${city}`)}&z=14&output=embed`;
  }

  const locationLabel = [city, country].filter(Boolean).join(", ");
  const mapsLink = googleMapsUrl || (latitude && longitude ? `https://www.google.com/maps?q=${latitude},${longitude}` : null);

  if (!embedUrl && !address && !locationLabel) return null;

  return (
    <Card className="overflow-hidden">
      <div className="border-b bg-muted/30 px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-chart-1/10">
            <MapPin className="h-3.5 w-3.5 text-chart-1" />
          </div>
          {isAr ? "الموقع على الخريطة" : "Location Map"}
        </h3>
      </div>
      <CardContent className="p-0">
        {embedUrl ? (
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
            <iframe
              src={embedUrl}
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

        <div className="p-4 space-y-3">
          {(address || locationLabel) && (
            <div className="flex items-start gap-2.5">
              <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                {address && <p className="text-sm font-semibold">{address}</p>}
                {locationLabel && <p className="text-xs text-muted-foreground">{locationLabel}</p>}
              </div>
            </div>
          )}

          {mapsLink && (
            <Button variant="outline" size="sm" className="w-full" asChild>
              <a href={mapsLink} target="_blank" rel="noopener noreferrer">
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
