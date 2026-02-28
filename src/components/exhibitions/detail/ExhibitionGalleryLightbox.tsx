import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, ZoomIn, Download } from "lucide-react";

interface Props {
  images: string[];
  initialIndex: number;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ExhibitionGalleryLightbox({ images, initialIndex, title, isOpen, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => { setIndex(initialIndex); }, [initialIndex]);

  const next = useCallback(() => setIndex(i => (i + 1) % images.length), [images.length]);
  const prev = useCallback(() => setIndex(i => (i - 1 + images.length) % images.length), [images.length]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, next, prev, onClose]);

  if (!isOpen || images.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md" onClick={onClose}>
      <div className="absolute top-4 end-4 flex items-center gap-2 z-10">
        <span className="text-xs text-muted-foreground bg-muted/80 px-2 py-1 rounded-md">
          {index + 1} / {images.length}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full bg-muted/80 hover:bg-muted"
          onClick={(e) => { e.stopPropagation(); window.open(images[index], "_blank"); }}
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full bg-muted/80 hover:bg-muted"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {images.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute start-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-muted/80 hover:bg-muted z-10"
            onClick={(e) => { e.stopPropagation(); prev(); }}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute end-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-muted/80 hover:bg-muted z-10"
            onClick={(e) => { e.stopPropagation(); next(); }}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}

      <div className="max-w-[90vw] max-h-[85vh]" onClick={e => e.stopPropagation()}>
        <img
          src={images[index]}
          alt={`${title} ${index + 1}`}
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
        />
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 p-2 rounded-xl bg-muted/80 backdrop-blur-sm max-w-[80vw] overflow-x-auto scrollbar-none">
          {images.map((url, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setIndex(i); }}
              className={`shrink-0 h-12 w-16 rounded-md overflow-hidden transition-all ${
                i === index ? "ring-2 ring-primary scale-105" : "opacity-60 hover:opacity-90"
              }`}
            >
              <img src={url} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
