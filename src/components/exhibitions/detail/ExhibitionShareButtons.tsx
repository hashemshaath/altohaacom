import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Share2, Copy, Check, MessageCircle, Send as SendIcon } from "lucide-react";

interface Props {
  title: string;
  description?: string;
  imageUrl?: string;
  isAr: boolean;
}

export function ExhibitionShareButtons({ title, description, imageUrl, isAr }: Props) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const url = window.location.href;
  const text = `${title}${description ? ` - ${description.slice(0, 100)}` : ""}`;

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: isAr ? "تم نسخ الرابط! 🔗" : "Link copied! 🔗" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: isAr ? "فشل في النسخ" : "Failed to copy", variant: "destructive" });
    }
  }, [url, isAr]);

  const nativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: description?.slice(0, 200), url });
      } catch {}
    } else {
      setExpanded(!expanded);
    }
  }, [title, description, url, expanded]);

  const shareLinks = [
    { name: "WhatsApp", icon: MessageCircle, color: "text-chart-3", href: `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}` },
    { name: "X", icon: () => <span className="text-xs font-bold">𝕏</span>, color: "text-foreground", href: `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}` },
    { name: "Telegram", icon: SendIcon, color: "text-chart-1", href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}` },
    { name: "LinkedIn", icon: () => <span className="text-xs font-bold">in</span>, color: "text-chart-2", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
  ];

  return (
    <Card className="overflow-hidden border-border/60">
      <CardContent className="p-0">
        <button
          onClick={nativeShare}
          className="flex w-full items-center gap-3 p-3.5 text-start transition-colors hover:bg-muted/50"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 shrink-0">
            <Share2 className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{isAr ? "مشاركة الحدث" : "Share Event"}</p>
            <p className="text-[10px] text-muted-foreground">{isAr ? "شارك مع أصدقائك" : "Share with friends & colleagues"}</p>
          </div>
          <Badge variant="secondary" className="text-[9px] shrink-0">{isAr ? "مشاركة" : "Share"}</Badge>
        </button>

        {expanded && (
          <div className="border-t border-border/40 px-3.5 pb-3.5 pt-2.5 space-y-2.5 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-4 gap-2">
              {shareLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.name}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-border/50 p-3 transition-all hover:bg-muted/50 hover:border-primary/20 active:scale-95"
                  >
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-muted/60 ${link.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-[9px] font-medium text-muted-foreground">{link.name}</span>
                  </a>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-9 rounded-xl text-xs"
              onClick={copyLink}
            >
              {copied ? <Check className="me-1.5 h-3.5 w-3.5 text-chart-3" /> : <Copy className="me-1.5 h-3.5 w-3.5" />}
              {copied ? (isAr ? "تم النسخ!" : "Copied!") : (isAr ? "نسخ الرابط" : "Copy Link")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
