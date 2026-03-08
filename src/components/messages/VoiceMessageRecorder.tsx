import { useState, useRef, useCallback, useEffect, memo } from "react";
import { Mic, Square, Send, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

interface VoiceMessageRecorderProps {
  onSend: (blob: Blob, duration: number) => void;
  disabled?: boolean;
}

export const VoiceMessageRecorder = memo(function VoiceMessageRecorder({ onSend, disabled }: VoiceMessageRecorderProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch {
      // Permission denied or not available
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const discardRecording = useCallback(() => {
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setDuration(0);
  }, [audioUrl]);

  const handleSend = useCallback(() => {
    if (audioBlob) {
      onSend(audioBlob, duration);
      discardRecording();
    }
  }, [audioBlob, duration, onSend, discardRecording]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Preview mode after recording
  if (audioBlob && audioUrl) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2">
        <audio src={audioUrl} controls className="h-8 flex-1 max-w-[200px]" />
        <span className="text-xs text-muted-foreground tabular-nums">{formatTime(duration)}</span>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={discardRecording}>
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button size="icon" className="h-8 w-8" onClick={handleSend} disabled={disabled}>
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  // Recording mode
  if (recording) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2 animate-pulse">
        <div className="h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" />
        <span className="text-sm font-medium text-destructive tabular-nums">{formatTime(duration)}</span>
        <span className="text-xs text-muted-foreground flex-1">
          {isAr ? "جارٍ التسجيل..." : "Recording..."}
        </span>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={stopRecording}>
          <Square className="h-4 w-4 text-destructive fill-destructive" />
        </Button>
      </div>
    );
  }

  // Default mic button
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 shrink-0"
      type="button"
      onClick={startRecording}
      disabled={disabled}
      title={isAr ? "رسالة صوتية" : "Voice message"}
    >
      <Mic className="h-4 w-4 text-muted-foreground" />
    </Button>
  );
}
