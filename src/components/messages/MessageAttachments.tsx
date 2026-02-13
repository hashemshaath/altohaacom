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

const FILE_ICONS: Record<string, React.ElementType> = {
  image: Image,
  audio: Music,
  video: Video,
};

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return Image;
  if (["mp3", "wav", "ogg", "m4a"].includes(ext)) return Music;
  if (["mp4", "mov", "avi", "webm"].includes(ext)) return Video;
  return FileText;
}

function formatFileSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

export function MessageAttachments({ urls, names, messageType, removable, onRemove }: MessageAttachmentsProps) {
  const { language } = useLanguage();

  if (!urls || urls.length === 0) return null;

  return (
    <div className="space-y-1.5 mt-1">
      {urls.map((url, i) => {
        const name = names?.[i] || `file-${i + 1}`;
        const Icon = getFileIcon(name);
        const ext = name.split(".").pop()?.toLowerCase() || "";
        const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext);
        const isAudio = ["mp3", "wav", "ogg", "m4a"].includes(ext);
        const isVideo = ["mp4", "mov", "avi", "webm"].includes(ext);

        return (
          <div key={i} className="rounded-lg border bg-background/50 overflow-hidden">
            {isImage && (
              <a href={url} target="_blank" rel="noopener noreferrer">
                <img src={url} alt={name} className="max-h-48 w-auto rounded-t-lg object-cover" loading="lazy" />
              </a>
            )}
            {isAudio && (
              <audio controls className="w-full max-w-[260px] p-2" preload="none">
                <source src={url} />
              </audio>
            )}
            {isVideo && (
              <video controls className="max-h-48 w-auto rounded-t-lg" preload="none">
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
