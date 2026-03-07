import { useState, useCallback, useRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";

interface Props {
  onResult: (transcript: string) => void;
  className?: string;
}

export function VoiceSearchButton({ onResult, className }: Props) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const hasSupport = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const toggle = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = isAr ? "ar-SA" : "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  }, [isListening, isAr, onResult]);

  if (!hasSupport) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      type="button"
      className={`h-9 w-9 rounded-full shrink-0 ${isListening ? "bg-destructive/10 text-destructive animate-pulse" : ""} ${className || ""}`}
      onClick={toggle}
      title={isAr ? "بحث صوتي" : "Voice search"}
    >
      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </Button>
  );
}
