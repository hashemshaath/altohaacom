import { forwardRef, memo, type HTMLAttributes } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface MentionTextProps extends HTMLAttributes<HTMLSpanElement> {
  content: string;
}

/**
 * Renders post content with clickable @mentions and #hashtags.
 */
const MentionTextComponent = forwardRef<HTMLSpanElement, MentionTextProps>(function MentionText(
  { content, className, ...rest }: MentionTextProps,
  ref
) {
  const parts = content.split(/(@[\w\u0600-\u06FF]+|#[\w\u0600-\u06FF_]+)/g);

  return (
    <span ref={ref} className={cn(className)} {...rest}>
      {parts.map((part, i) => {
        if (part.startsWith("@")) {
          const username = part.slice(1);
          return (
            <Link
              key={i}
              to={`/${username}`}
              className="font-semibold text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </Link>
          );
        }

        if (part.startsWith("#")) {
          return (
            <Link
              key={i}
              to={`/community?tag=${encodeURIComponent(part.slice(1))}`}
              className="font-semibold text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </Link>
          );
        }

        return <span key={i}>{part}</span>;
      })}
    </span>
  );
});

MentionTextComponent.displayName = "MentionText";

export const MentionText = memo(MentionTextComponent);
MentionText.displayName = "MentionText";
