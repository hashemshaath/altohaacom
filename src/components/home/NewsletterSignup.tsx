import { useState, forwardRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Sparkles, Shield } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { cn } from "@/lib/utils";

export const NewsletterSignup = forwardRef<HTMLElement>(function NewsletterSignup(_props, outerRef) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { ref: scrollRef, isVisible } = useScrollReveal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email: email.trim() });
      if (error) {
        if (error.code === "23505") {
          toast({ title: isAr ? "مشترك بالفعل" : "Already Subscribed", description: isAr ? "هذا البريد مسجل مسبقاً" : "This email is already registered" });
        } else {
          throw error;
        }
      } else {
        toast({ title: isAr ? "تم الاشتراك!" : "Subscribed!", description: isAr ? "شكراً لانضمامك! سنرسل لك أحدث الأخبار." : "Thanks for joining! We'll send you the latest updates." });
        setEmail("");
      }
    } catch {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: isAr ? "حدث خطأ، حاول مرة أخرى" : "Something went wrong, try again" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section ref={scrollRef} className="relative border-y overflow-hidden" aria-label={isAr ? "النشرة الإخبارية" : "Newsletter signup"} dir={isAr ? "rtl" : "ltr"}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-card/80 to-accent/8" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.08),transparent_70%)]" />

      <div className="container relative py-8 md:py-12">
        <div
          className={cn(
            "mx-auto max-w-xl text-center transition-all duration-700",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15 shadow-lg shadow-primary/5">
            <Mail className="h-7 w-7 text-primary" />
          </div>
          <Badge variant="secondary" className="mb-2 gap-1">
            <Sparkles className="h-3 w-3" />
            {isAr ? "لا تفوّت الجديد" : "Stay in the Loop"}
          </Badge>
          <h2 className={cn("text-xl font-bold sm:text-2xl tracking-tight", !isAr && "font-serif")}>
            {isAr ? "اشترك في نشرتنا الإخبارية" : "Subscribe to Our Newsletter"}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
            {isAr
              ? "كن أول من يعرف عن المسابقات القادمة والمقالات الحصرية والفرص المميزة."
              : "Be the first to know about upcoming competitions, exclusive articles & special opportunities."}
          </p>
          <form onSubmit={handleSubmit} className="mt-5 flex gap-2 sm:mx-auto sm:max-w-md">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isAr ? "بريدك الإلكتروني" : "Your email address"}
              required
              className="flex-1 h-11"
            />
            <Button type="submit" disabled={loading} className="h-11 px-6 shadow-sm shadow-primary/15">
              {loading ? "..." : (isAr ? "اشتراك" : "Subscribe")}
            </Button>
          </form>
          <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/60">
            <Shield className="h-3 w-3" />
            {isAr ? "بدون إزعاج. يمكنك إلغاء الاشتراك في أي وقت." : "No spam ever. Unsubscribe anytime."}
          </div>
        </div>
      </div>
    </section>
  );
});
