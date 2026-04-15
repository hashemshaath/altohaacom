import { memo } from "react";

interface UnreadDividerProps {
  isAr: boolean;
  count: number;
}

export const UnreadDivider = memo(function UnreadDivider({ isAr, count }: UnreadDividerProps) {
  return (
    <div className="flex items-center gap-3 py-3 animate-in fade-in-50 duration-300">
      <div className="flex-1 h-px bg-primary/30" />
      <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
        {isAr ? `${count} رسائل جديدة` : `${count} new message${count > 1 ? "s" : ""}`}
      </span>
      <div className="flex-1 h-px bg-primary/30" />
    </div>
  );
});
