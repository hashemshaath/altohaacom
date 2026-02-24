import { memo } from "react";
import { ImageIcon } from "lucide-react";

interface Props {
  galleryUrls: string[];
  title: string;
  onLightboxOpen: (i: number) => void;
}

export const ExhibitionGalleryTab = memo(function ExhibitionGalleryTab({ galleryUrls, title, onLightboxOpen }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {galleryUrls.map((url, i) => (
        <button key={i} onClick={() => onLightboxOpen(i)} className="relative aspect-video rounded-xl overflow-hidden shadow-sm group cursor-pointer active:scale-[0.98] transition-transform">
          <img src={url} alt={`${title} ${i + 1}`} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" decoding="async" />
          <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-colors flex items-center justify-center">
            <ImageIcon className="h-6 w-6 text-foreground opacity-0 group-hover:opacity-70 transition-opacity" />
          </div>
        </button>
      ))}
    </div>
  );
});
