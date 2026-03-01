import { forwardRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { FileText, Image, Music, Video, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MessageAttachmentsProps {
  urls: string[];
  names: string[];
  messageType: string;
  removable?: boolean;
  onRemove?: (index: number) => void;
}

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return Image;
  if (["mp3", "wav", "ogg", "m4a", "webm"].includes(ext)) return Music;
  if (["mp4", "mov", "avi"].includes(ext)) return Video;
  return FileText;
}

function isImageUrl(url: string, name: string, messageType: string): boolean {
  if (messageType === "image") return true;
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return true;
  // Check URL for common image patterns
  if (/\.(jpg|jpeg|png|gif|webp|svg)/i.test(url)) return true;
  return false;
}

function isAudioUrl(name: string, messageType: string): boolean {
  if (messageType === "audio") return true;
  const ext = name.split(".").pop()?.toLowerCase() || "";
  return ["mp3", "wav", "ogg", "m4a"].includes(ext);
}

function isVideoUrl(name: string, messageType: string): boolean {
  if (messageType === "video") return true;
  const ext = name.split(".").pop()?.toLowerCase() || "";
  return ["mp4", "mov", "avi", "webm"].includes(ext);
}

export const MessageAttachments = forwardRef<HTMLDivElement, MessageAttachmentsProps>(
  function MessageAttachments({ urls, names, messageType, removable, onRemove }, ref) {
    if (!urls || urls.length === 0) return null;

    return (
      <div ref={ref} className="space-y-1.5 mt-1">
        {urls.map((url, i) => {
          const name = names?.[i] || `file-${i + 1}`;
          const Icon = getFileIcon(name);
          const isImage = isImageUrl(url, name, messageType);
          const isAudio = isAudioUrl(name, messageType);
          const isVideo = isVideoUrl(name, messageType);

          return (
            <div key={i} className="rounded-xl border border-border/40 bg-background/50 overflow-hidden">
              {isImage && (
                <a href={url} target="_blank" rel="noopener noreferrer" className="block">
                  <img
                    src={url}
                    alt={name}
                    className="max-h-48 w-auto rounded-t-xl object-cover"
                    loading="lazy"
                    onError={(e) => {
                      // Hide broken images gracefully
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </a>
              )}
              {isAudio && (
                <audio controls className="w-full max-w-[260px] p-2" preload="none">
                  <source src={url} />
                </audio>
              )}
              {isVideo && (
                <video controls className="max-h-48 w-auto rounded-t-xl" preload="none">
                  <source src={url} />
                </video>
              )}
              <div className="flex items-center gap-2 px-2 py-1.5">
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-xs truncate flex-1">{name}</span>
                <a href={url} download={name} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="icon" className="h-6 w-6" type="button">
                    <Download className="h-3 w-3" />
                  </Button>
                </a>
                {removable && onRemove && (
                  <Button variant="ghost" size="icon" className="h-6 w-6" type="button" onClick={() => onRemove(i)}>
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
);
