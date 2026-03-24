import { memo, useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Pause, Play, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  text: string;
  isAr?: boolean;
}

export const ArticleTextToSpeech = memo(function ArticleTextToSpeech({ text, isAr }: Props) {
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [rate, setRate] = useState(1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  const stop = useCallback(() => {
    speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
  }, []);

  useEffect(() => () => { speechSynthesis.cancel(); }, []);

  const speak = useCallback(() => {
    if (!supported) return;
    stop();
    const clean = text
      .replace(/[#*_`~\[\]()>|]/g, "")
      .replace(/!\[.*?\]\(.*?\)/g, "")
      .replace(/\n{2,}/g, ". ")
      .replace(/\n/g, " ")
      .trim();

    const utt = new SpeechSynthesisUtterance(clean);
    utt.lang = isAr ? "ar-SA" : "en-US";
    utt.rate = rate;
    utt.onend = () => { setSpeaking(false); setPaused(false); };
    utt.onerror = () => { setSpeaking(false); setPaused(false); };
    utteranceRef.current = utt;
    speechSynthesis.speak(utt);
    setSpeaking(true);
    setPaused(false);
  }, [text, isAr, rate, supported, stop]);

  const togglePause = useCallback(() => {
    if (paused) {
      speechSynthesis.resume();
      setPaused(false);
    } else {
      speechSynthesis.pause();
      setPaused(true);
    }
  }, [paused]);

  if (!supported) return null;

  return (
    <div className="flex items-center gap-0.5">
      {speaking ? (
        <>
          <Button
            variant="ghost" size="sm"
            className="rounded-xl h-8 w-8 p-0 hover:bg-muted/80 shrink-0 text-primary"
            onClick={togglePause}
            title={paused ? (isAr ? "استئناف" : "Resume") : (isAr ? "إيقاف مؤقت" : "Pause")}
          >
            {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          </Button>
          <Button
            variant="ghost" size="sm"
            className="rounded-xl h-8 w-8 p-0 hover:bg-muted/80 shrink-0 text-destructive"
            onClick={stop}
            title={isAr ? "إيقاف" : "Stop"}
          >
            <VolumeX className="h-3.5 w-3.5" />
          </Button>
        </>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost" size="sm"
              className="rounded-xl h-8 px-2.5 gap-1 text-xs shrink-0 hover:bg-muted/80"
              title={isAr ? "استمع للمقال" : "Listen to article"}
            >
              <Volume2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{isAr ? "استمع" : "Listen"}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40 rounded-xl">
            {[0.75, 1, 1.25, 1.5, 2].map((r) => (
              <DropdownMenuItem
                key={r}
                onClick={() => { setRate(r); setTimeout(() => { setRate(r); speak(); }, 50); }}
                className={cn("cursor-pointer rounded-lg text-xs gap-2", rate === r && "text-primary font-semibold")}
              >
                <SkipForward className="h-3 w-3" />
                {r}x {r === 1 ? (isAr ? "(عادي)" : "(Normal)") : r >= 1.5 ? (isAr ? "(سريع)" : "(Fast)") : (isAr ? "(بطيء)" : "(Slow)")}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
});
