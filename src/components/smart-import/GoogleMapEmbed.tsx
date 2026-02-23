import { useEffect, useRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";

interface GoogleMapEmbedProps {
  latitude?: number;
  longitude?: number;
  name?: string;
  className?: string;
}

export function GoogleMapEmbed({ latitude, longitude, name, className = "" }: GoogleMapEmbedProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";

  if (!latitude || !longitude) {
    return (
      <div className={`flex items-center justify-center rounded-xl border border-dashed bg-muted/30 text-muted-foreground text-sm ${className}`}>
        {isAr ? "لا توجد إحداثيات لعرض الخريطة" : "No coordinates available for map"}
      </div>
    );
  }

  const q = name ? `${name} @${latitude},${longitude}` : `${latitude},${longitude}`;
  const src = `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=16&output=embed`;

  return (
    <div className={`rounded-xl overflow-hidden border shadow-sm ${className}`}>
      <iframe
        src={src}
        width="100%"
        height="100%"
        style={{ border: 0, minHeight: 300 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title={name || "Location Map"}
      />
    </div>
  );
}
