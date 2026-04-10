import { memo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageIcon, ChevronLeft, ChevronRight, ExternalLink, X } from "lucide-react";

interface PortfolioItem {
  name: string;
  url: string;
}

interface ProfilePortfolioGalleryProps {
  userId: string;
  isAr: boolean;
}

export const ProfilePortfolioGallery = memo(function ProfilePortfolioGallery({ userId, isAr }: ProfilePortfolioGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const { data: mediaFiles = [] } = useQuery({
    queryKey: ["user-portfolio-gallery", userId],
    queryFn: async () => {
      const { data } = await supabase.storage.from("user-media").list(`${userId}`, { limit: 30 });
      return (data || [])
        .filter(f => f.name !== ".emptyFolderPlaceholder")
        .map(f => {
          const { data: urlData } = supabase.storage.from("user-media").getPublicUrl(`${userId}/${f.name}`);
          return { name: f.name, url: urlData.publicUrl } as PortfolioItem;
        });
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 3,
  });

  if (mediaFiles.length === 0) return null;

  const navigate = (dir: 1 | -1) => {
    if (selectedIndex === null) return;
    const next = selectedIndex + dir;
    if (next >= 0 && next < mediaFiles.length) setSelectedIndex(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-chart-1/10">
            <ImageIcon className="h-3.5 w-3.5 text-chart-1" />
          </div>
          <h3 className="text-sm font-bold">{isAr ? "معرض الأعمال" : "Portfolio"}</h3>
          <Badge variant="outline" className="text-[12px] h-5 rounded-full">{mediaFiles.length}</Badge>
        </div>
      </div>

      {/* Masonry-style grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {mediaFiles.slice(0, 9).map((file, i) => (
          <button
            key={file.name}
            onClick={() => setSelectedIndex(i)}
            className={`relative overflow-hidden rounded-xl group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
              i === 0 ? "col-span-2 row-span-2 aspect-[4/3]" : "aspect-square"
            }`}
          >
            <img loading="lazy"
              src={file.url}
              alt={file.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            {i === 8 && mediaFiles.length > 9 && (
              <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
                <span className="text-background text-lg font-bold">+{mediaFiles.length - 9}</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      <Dialog open={selectedIndex !== null} onOpenChange={() => setSelectedIndex(null)}>
        <DialogContent className="max-w-4xl p-0 rounded-2xl overflow-hidden border-0 bg-foreground/95 backdrop-blur-xl">
          {selectedIndex !== null && mediaFiles[selectedIndex] && (
            <div className="relative">
              <img loading="lazy"
                src={mediaFiles[selectedIndex].url}
                alt={mediaFiles[selectedIndex].name}
                className="w-full max-h-[80vh] object-contain"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedIndex(null)}
                className="absolute top-3 end-3 text-background/80 hover:text-background hover:bg-background/20 rounded-full h-9 w-9"
              >
                <X className="h-5 w-5" />
              </Button>
              {selectedIndex > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="absolute start-3 top-1/2 -translate-y-1/2 text-background/80 hover:text-background hover:bg-background/20 rounded-full h-10 w-10"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              )}
              {selectedIndex < mediaFiles.length - 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(1)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-background/80 hover:text-background hover:bg-background/20 rounded-full h-10 w-10"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              )}
              <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-foreground/80 to-transparent">
                <p className="text-background/80 text-xs text-center">
                  {selectedIndex + 1} / {mediaFiles.length}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
});
