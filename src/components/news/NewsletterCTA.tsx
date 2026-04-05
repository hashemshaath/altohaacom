import { forwardRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Send, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  isAr: boolean;
}

export const NewsletterCTA = forwardRef<HTMLDivElement, Props>(function NewsletterCTA({ isAr }, ref) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    setSubmitted(true);
    toast({
      title: isAr ? "تم الاشتراك!" : "Subscribed!",
      description: isAr ? "ستصلك أحدث الأخبار على بريدك الإلكتروني" : "You'll receive the latest news in your inbox",
    });
  };

  return (
    <Card ref={ref} className="rounded-2xl border-primary/20 bg-gradient-to-br from-primary/[0.06] via-primary/[0.02] to-transparent overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold">{isAr ? "اشترك في النشرة" : "Stay Updated"}</h3>
            <p className="text-[11px] text-muted-foreground">{isAr ? "احصل على آخر الأخبار أسبوعياً" : "Get weekly culinary news digest"}</p>
          </div>
        </div>
        {submitted ? (
          <div className="flex items-center gap-2 rounded-xl bg-primary/10 p-3 text-sm text-primary">
            <CheckCircle2 className="h-4 w-4" />
            {isAr ? "شكراً لاشتراكك!" : "Thanks for subscribing!"}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              type="email"
              placeholder={isAr ? "بريدك الإلكتروني" : "your@email.com"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-9 rounded-xl border-border/40 bg-background/60 text-xs"
              required
            />
            <Button type="submit" size="sm" className="rounded-xl gap-1.5 shrink-0 h-9 px-3">
              <Send className="h-3 w-3" />
              {isAr ? "اشتراك" : "Subscribe"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
});
