import { useState, memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smile } from "lucide-react";

const EMOJI_LIST = [
  "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃",
  "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😋", "😛",
  "🤔", "🤗", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄",
  "👍", "👎", "👏", "🙌", "🤝", "🙏", "💪", "❤️", "🔥", "⭐",
  "✅", "❌", "🎉", "🎊", "🏆", "🥇", "🍽️", "👨‍🍳", "👩‍🍳", "🍴",
];

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

export const EmojiPicker = memo(function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" type="button">
          <Smile className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-2" align="end">
        <div className="grid grid-cols-10 gap-0.5">
          {EMOJI_LIST.map(emoji => (
            <button
              key={emoji}
              onClick={() => {
                onEmojiSelect(emoji);
                setOpen(false);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-md text-lg hover:bg-accent transition-colors"
              type="button"
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
