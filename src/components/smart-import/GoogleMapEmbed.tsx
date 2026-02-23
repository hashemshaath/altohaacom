import { useLanguage } from "@/i18n/LanguageContext";

interface GoogleMapEmbedProps {
  latitude?: number | null;
  longitude?: number | null;
  name?: string | null;
  searchQuery?: string;
  location?: string;
  className?: string;
}

export function GoogleMapEmbed({ latitude, longitude, name, searchQuery, location, className = "" }: GoogleMapEmbedProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  // If we have coordinates, show the exact location
  // Otherwise, show the search query on the map (like Google Maps search)
  let src: string;

  if (latitude && longitude) {
    const q = name ? `${name}` : `${latitude},${longitude}`;
    src = `https://maps.google.com/maps?q=${encodeURIComponent(q)}&ll=${latitude},${longitude}&z=16&output=embed`;
  } else if (searchQuery) {
    const fullQuery = location ? `${searchQuery} ${location}` : searchQuery;
    src = `https://maps.google.com/maps?q=${encodeURIComponent(fullQuery)}&z=14&output=embed`;
  } else {
    return (
      <div className={`flex items-center justify-center rounded-xl border border-dashed bg-muted/30 text-muted-foreground text-sm p-8 ${className}`}>
        {isAr ? "ابحث لعرض النتائج على الخريطة" : "Search to display results on the map"}
      </div>
    );
  }

  return (
    <div className={`rounded-xl overflow-hidden border shadow-sm ${className}`}>
      <iframe
        src={src}
        width="100%"
        height="100%"
        style={{ border: 0, minHeight: 350 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title={name || searchQuery || "Location Map"}
      />
    </div>
  );
}
