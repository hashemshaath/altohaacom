import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ImageIcon, ChevronLeft, ChevronRight, X, Layers, Grid3X3 } from "lucide-react";

interface MediaFile {
  name: string;
  url: string;
}

interface PublicProfileGalleryProps {
  mediaFiles: MediaFile[];
  isAr: boolean;
}

// Group files by prefix (e.g., "event-name_photo1.jpg" groups by "event-name")
function groupMediaFiles(files: MediaFile[]) {
  const groups: Record<string, MediaFile[]> = {};
  const ungrouped: MediaFile[] = [];

  files.forEach((file) => {
    const parts = file.name.split("_");
    if (parts.length > 1) {
      const groupKey = parts[0];
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(file);
    } else {
      ungrouped.push(file);
    }
  });

  // Only keep groups with 2+ images; move singles to ungrouped
  const validGroups: { name: string; files: MediaFile[] }[] = [];
  Object.entries(groups).forEach(([name, gFiles]) => {
    if (gFiles.length >= 2) {
      validGroups.push({ name: name.replace(/-/g, " "), files: gFiles });
    } else {
      ungrouped.push(...gFiles);
    }
  });

  return { groups: validGroups, ungrouped };
}

export function PublicProfileGallery({ mediaFiles, isAr }: PublicProfileGalleryProps) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "grouped">("grid");

  const allFiles = useMemo(() => mediaFiles, [mediaFiles]);
  const { groups, ungrouped } = useMemo(() => groupMediaFiles(mediaFiles), [mediaFiles]);
  const hasGroups = groups.length > 0;

  const openLightbox = (idx: number) => setLightboxIdx(idx);
  const closeLightbox = () => setLightboxIdx(null);
  const nextImg = () => setLightboxIdx((prev) => prev !== null ? (prev + 1) % allFiles.length : null);
  const prevImg = () => setLightboxIdx((prev) => prev !== null ? (prev - 1 + allFiles.length) % allFiles.length : null);

  if (mediaFiles.length === 0) return null;

  return (
    <>
      {/* Header with view toggle */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
            <ImageIcon className="h-4 w-4 text-primary" />
          </div>
          <h2 className="font-serif text-base font-bold">{isAr ? "الألبوم" : "Gallery"}</h2>
          <Badge variant="secondary" className="text-[10px] h-5">{mediaFiles.length}</Badge>
          <div className="flex-1 h-px bg-border/40" />
        </div>
        {hasGroups && (
          <div className="flex gap-1 bg-muted/50 rounded-lg p-0.5">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 w-7 p-0 rounded-md"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === "grouped" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 w-7 p-0 rounded-md"
              onClick={() => setViewMode("grouped")}
            >
              <Layers className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {viewMode === "grid" || !hasGroups ? (
        /* Flat Grid View */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {allFiles.map((file, idx) => (
            <GalleryThumb key={file.name} file={file} onClick={() => openLightbox(idx)} />
          ))}
        </div>
      ) : (
        /* Grouped View */
        <div className="space-y-5">
          {groups.map((group) => (
            <Card key={group.name} className="rounded-2xl border-border/30 overflow-hidden">
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm capitalize mb-3 flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5 text-primary" />
                  {group.name}
                  <Badge variant="outline" className="text-[9px] h-4">{group.files.length}</Badge>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {group.files.map((file) => {
                    const globalIdx = allFiles.findIndex((f) => f.name === file.name);
                    return <GalleryThumb key={file.name} file={file} onClick={() => openLightbox(globalIdx)} />;
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
          {ungrouped.length > 0 && (
            <div>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2 text-muted-foreground">
                <ImageIcon className="h-3.5 w-3.5" />
                {isAr ? "صور أخرى" : "Other Photos"}
                <Badge variant="outline" className="text-[9px] h-4">{ungrouped.length}</Badge>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {ungrouped.map((file) => {
                  const globalIdx = allFiles.findIndex((f) => f.name === file.name);
                  return <GalleryThumb key={file.name} file={file} onClick={() => openLightbox(globalIdx)} />;
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Lightbox */}
      <Dialog open={lightboxIdx !== null} onOpenChange={closeLightbox}>
        <DialogContent className="max-w-5xl p-0 bg-background/95 backdrop-blur-xl border-border/20 rounded-2xl overflow-hidden">
          {lightboxIdx !== null && allFiles[lightboxIdx] && (
            <div className="relative">
              <img
                src={allFiles[lightboxIdx].url}
                alt={allFiles[lightboxIdx].name}
                className="w-full max-h-[80vh] object-contain"
              />
              {/* Navigation */}
              {allFiles.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute start-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full p-0 bg-background/80 backdrop-blur-sm shadow-lg"
                    onClick={prevImg}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute end-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full p-0 bg-background/80 backdrop-blur-sm shadow-lg"
                    onClick={nextImg}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </>
              )}
              {/* Caption bar */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background/90 to-transparent p-4 pt-10">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-foreground/80 truncate max-w-[70%]">
                    {allFiles[lightboxIdx].name.replace(/[-_]/g, " ").replace(/\.[^.]+$/, "")}
                  </p>
                  <Badge variant="secondary" className="text-[10px]">
                    {lightboxIdx + 1} / {allFiles.length}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function GalleryThumb({ file, onClick }: { file: MediaFile; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="aspect-square rounded-xl overflow-hidden border border-border/30 bg-muted/50 hover:opacity-90 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] group relative"
    >
      <img src={file.url} alt={file.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </button>
  );
}
