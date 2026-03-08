import { useState, useRef, useEffect, memo } from "react";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoiceMessagePlayerProps {
  url: string;
  duration?: number;
  isMine?: boolean;
}

export const VoiceMessagePlayer = memo(function VoiceMessagePlayer({ url, duration, isMine }: VoiceMessagePlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => {
      setCurrentTime(audio.currentTime);
      setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
    };
    const onLoaded = () => {
      if (audio.duration && isFinite(audio.duration)) setTotalDuration(audio.duration);
    };
    const onEnded = () => {
      setPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Generate waveform bars (fake visual)
  const bars = Array.from({ length: 20 }, (_, i) => {
    const h = 20 + Math.sin(i * 0.7) * 60 + Math.cos(i * 1.3) * 20;
    return Math.max(15, Math.min(100, h));
  });

  return (
    <div className="flex items-center gap-2 min-w-[180px]">
      <audio ref={audioRef} src={url} preload="metadata" />
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-8 w-8 shrink-0 rounded-full", isMine ? "hover:bg-primary-foreground/20" : "hover:bg-accent")}
        onClick={toggle}
      >
        {playing ? (
          <Pause className={cn("h-4 w-4", isMine ? "text-primary-foreground" : "")} />
        ) : (
          <Play className={cn("h-4 w-4", isMine ? "text-primary-foreground" : "")} />
        )}
      </Button>

      {/* Waveform */}
      <div className="flex items-center gap-[2px] h-6 flex-1">
        {bars.map((h, i) => {
          const filled = progress > (i / bars.length) * 100;
          return (
            <div
              key={i}
              className={cn(
                "w-[3px] rounded-full transition-all duration-100",
                filled
                  ? isMine ? "bg-primary-foreground" : "bg-primary"
                  : isMine ? "bg-primary-foreground/30" : "bg-muted-foreground/30"
              )}
              style={{ height: `${h}%` }}
            />
          );
        })}
      </div>

      <span className={cn("text-[10px] tabular-nums shrink-0", isMine ? "text-primary-foreground/60" : "text-muted-foreground")}>
        {playing ? formatTime(currentTime) : formatTime(totalDuration)}
      </span>
    </div>
  );
}
