interface UnreadDividerProps {
  isAr: boolean;
  count: number;
}

export function UnreadDivider({ isAr, count }: UnreadDividerProps) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex-1 h-px bg-primary/30" />
      <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
        {isAr ? `${count} رسائل جديدة` : `${count} new message${count > 1 ? "s" : ""}`}
      </span>
      <div className="flex-1 h-px bg-primary/30" />
    </div>
  );
}
