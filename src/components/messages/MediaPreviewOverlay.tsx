import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Download } from "lucide-react";

interface MediaPreviewOverlayProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  urls: string[];
  initialIndex?: number;
}

export function MediaPreviewOverlay({ open, onOpenChange, urls, initialIndex = 0 }: MediaPreviewOverlayProps) {
  const [index, setIndex] = useState(initialIndex);

  if (!urls.length) return null;

  const current = urls[index] || urls[0];
  const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(current);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 bg-background/95 backdrop-blur-xl border-none [&>button]:hidden">
        <div className="relative flex flex-col items-center justify-center min-h-[60vh]">
          {/* Close */}
          <Button variant="ghost" size="icon" className="absolute top-3 end-3 z-10 h-9 w-9 rounded-full bg-background/50 backdrop-blur" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>

          {/* Download */}
          <a href={current} download target="_blank" rel="noopener noreferrer" className="absolute top-3 start-3 z-10">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-background/50 backdrop-blur">
              <Download className="h-4 w-4" />
            </Button>
          </a>

          {/* Navigation */}
          {urls.length > 1 && (
            <>
              <Button
                variant="ghost" size="icon"
                className="absolute start-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/50 backdrop-blur"
                onClick={() => setIndex((i) => (i - 1 + urls.length) % urls.length)}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost" size="icon"
                className="absolute end-3 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/50 backdrop-blur"
                onClick={() => setIndex((i) => (i + 1) % urls.length)}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}

          {/* Content */}
          <div className="flex items-center justify-center p-8 max-h-[80vh] w-full">
            {isVideo ? (
              <video src={current} controls className="max-h-[70vh] max-w-full rounded-xl" />
            ) : (
              <img src={current} alt="" className="max-h-[70vh] max-w-full object-contain rounded-xl" />
            )}
          </div>

          {/* Counter */}
          {urls.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-background/60 backdrop-blur text-xs font-medium">
              {index + 1} / {urls.length}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
