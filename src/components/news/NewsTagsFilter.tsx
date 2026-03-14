import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContentTag {
  id: string;
  name: string;
  name_ar: string | null;
  slug: string;
}

interface Props {
  tags: ContentTag[];
  selectedTags: string[];
  onToggleTag: (tagId: string) => void;
  isAr: boolean;
}

export const NewsTagsFilter = memo(function NewsTagsFilter({ tags, selectedTags, onToggleTag, isAr }: Props) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Tag className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
      {tags.map((tag) => {
        const isSelected = selectedTags.includes(tag.id);
        return (
          <Badge
            key={tag.id}
            variant={isSelected ? "default" : "outline"}
            className={cn(
              "cursor-pointer rounded-lg text-[10px] transition-all",
              isSelected
                ? "bg-primary text-primary-foreground shadow-sm"
                : "border-border/40 hover:bg-primary/5 hover:border-primary/20"
            )}
            onClick={() => onToggleTag(tag.id)}
          >
            {isAr && tag.name_ar ? tag.name_ar : tag.name}
          </Badge>
        );
      })}
      {selectedTags.length > 0 && (
        <button
          onClick={() => selectedTags.forEach(onToggleTag)}
          className="text-[10px] text-muted-foreground hover:text-primary transition-colors underline underline-offset-2"
        >
          {isAr ? "مسح" : "Clear"}
        </button>
      )}
    </div>
  );
});
