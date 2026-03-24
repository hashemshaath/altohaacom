import { memo, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Copy protection layer for article content.
 * Shows a citation tooltip when users try to copy text.
 */
export const ArticleCopyProtect = memo(function ArticleCopyProtect({
  articleTitle,
  articleUrl,
  isAr,
}: {
  articleTitle: string;
  articleUrl: string;
  isAr: boolean;
}) {
  const [showToast, setShowToast] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      const selection = window.getSelection()?.toString() || "";
      if (!selection.trim()) return;

      // Append citation to copied text
      const citation = isAr
        ? `\n\n— المصدر: ${articleTitle} | ${articleUrl}`
        : `\n\n— Source: ${articleTitle} | ${articleUrl}`;

      e.preventDefault();
      const enrichedText = selection + citation;

      // Also add HTML version
      const htmlContent = `${selection}<br><br><small style="color:#888;">— <a href="${articleUrl}">${articleTitle}</a> via Altoha</small>`;

      e.clipboardData?.setData("text/plain", enrichedText);
      e.clipboardData?.setData("text/html", htmlContent);

      // Show citation toast
      setShowToast(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setShowToast(false), 3000);
    };

    document.addEventListener("copy", handleCopy);
    return () => {
      document.removeEventListener("copy", handleCopy);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [articleTitle, articleUrl, isAr]);

  return (
    <div
      className={cn(
        "fixed bottom-20 start-1/2 -translate-x-1/2 z-50 transition-all duration-300",
        showToast ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}
    >
      <div className="rounded-xl bg-card border border-border/60 shadow-2xl px-4 py-2.5 flex items-center gap-2 text-xs">
        <span className="text-primary font-semibold">✓</span>
        <span>{isAr ? "تم نسخ النص مع ذكر المصدر" : "Copied with source citation"}</span>
      </div>
    </div>
  );
});
