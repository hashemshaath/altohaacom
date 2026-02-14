import { useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageLightboxProps {
  images: { url: string; title?: string }[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function ImageLightbox({ images, currentIndex, onClose, onNavigate }: ImageLightboxProps) {
  const current = images[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowLeft" && hasPrev) onNavigate(currentIndex - 1);
    if (e.key === "ArrowRight" && hasNext) onNavigate(currentIndex + 1);
  }, [onClose, onNavigate, currentIndex, hasPrev, hasNext]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  if (!current) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm touch-none" onClick={onClose} role="dialog" aria-modal="true" aria-label={current.title || "Image viewer"}>
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 end-4 z-50 h-10 w-10 rounded-full bg-muted/80 hover:bg-muted"
        onClick={onClose}
      >
        <X className="h-5 w-5" />
      </Button>

      {/* Navigation */}
      {hasPrev && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute start-4 top-1/2 -translate-y-1/2 z-50 h-10 w-10 rounded-full bg-muted/80 hover:bg-muted"
          onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex - 1); }}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      )}
      {hasNext && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute end-4 top-1/2 -translate-y-1/2 z-50 h-10 w-10 rounded-full bg-muted/80 hover:bg-muted"
          onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex + 1); }}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      )}

      {/* Image */}
      <div className="max-h-[90vh] max-w-[90vw] flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
        <img
          src={current.url}
          alt={current.title || ""}
          className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
        />
        {current.title && (
          <p className="text-sm font-medium text-foreground/80">{current.title}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {currentIndex + 1} / {images.length}
        </p>
      </div>
    </div>
  );
}
