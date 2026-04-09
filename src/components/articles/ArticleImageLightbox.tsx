import { memo, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Download, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  title?: string;
}

export const ArticleImageLightbox = memo(function ArticleImageLightbox({
  images, currentIndex, onClose, onNavigate, title,
}: Props) {
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowLeft" && hasPrev) onNavigate(currentIndex - 1);
    if (e.key === "ArrowRight" && hasNext) onNavigate(currentIndex + 1);
  }, [onClose, onNavigate, currentIndex, hasPrev, hasNext]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [handleKey]);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = images[currentIndex];
    link.download = `image-${currentIndex + 1}`;
    link.click();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 z-10 flex items-center justify-between px-4 py-3">
        <span className="text-white/70 text-xs tabular-nums">
          {currentIndex + 1} / {images.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleDownload(); }}
            className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white/80"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white/80"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Image */}
      <img
        src={images[currentIndex]}
        alt={title ? `${title} - ${currentIndex + 1}` : `Image ${currentIndex + 1}`}
        className="max-h-[85vh] max-w-[92vw] object-contain rounded-lg select-none"
        onClick={(e) => e.stopPropagation()}
        draggable={false}
      />

      {/* Nav arrows */}
      {hasPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex - 1); }}
          className="absolute start-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-2xl bg-white/10 hover:bg-white/25 flex items-center justify-center transition-all text-white active:scale-90"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex + 1); }}
          className="absolute end-3 top-1/2 -translate-y-1/2 h-11 w-11 rounded-2xl bg-white/10 hover:bg-white/25 flex items-center justify-center transition-all text-white active:scale-90"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="absolute bottom-4 inset-x-0 flex justify-center gap-2 px-4">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); onNavigate(i); }}
              className={cn(
                "h-12 w-16 rounded-lg overflow-hidden border-2 transition-all shrink-0",
                i === currentIndex ? "border-white scale-110 shadow-lg" : "border-transparent opacity-50 hover:opacity-80"
              )}
            >
              <img loading="lazy" decoding="async" src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

export { ZoomIn };
