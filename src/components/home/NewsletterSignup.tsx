import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Sparkles, Shield, Send } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { cn } from "@/lib/utils";

export const NewsletterSignup = function NewsletterSignup() {
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
    <section ref={scrollRef} className="relative overflow-hidden" aria-label={isAr ? "النشرة الإخبارية" : "Newsletter signup"} dir={isAr ? "rtl" : "ltr"}>
      <div className="container relative">
        <div
          className={cn(
            "mx-auto max-w-3xl text-center transition-all duration-700",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15 shadow-lg shadow-primary/5">
            <Mail className="h-7 w-7 text-primary" />
          </div>
          <Badge variant="secondary" className="mb-3 gap-1">
            <Sparkles className="h-3 w-3" />
            {isAr ? "لا تفوّت الجديد" : "Stay in the Loop"}
          </Badge>
          <h2 className={cn("text-xl font-bold sm:text-2xl md:text-3xl tracking-tight", !isAr && "font-serif")}>
            {isAr ? "اشترك في نشرتنا الإخبارية" : "Subscribe to Our Newsletter"}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
            {isAr
              ? "كن أول من يعرف عن المسابقات القادمة والمقالات الحصرية والفرص المميزة."
              : "Be the first to know about upcoming competitions, exclusive articles & special opportunities."}
          </p>
          <form onSubmit={handleSubmit} className="mt-6 flex gap-2.5 sm:mx-auto sm:max-w-lg">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isAr ? "بريدك الإلكتروني" : "Your email address"}
              required
              className="flex-1 h-12 text-base sm:text-sm rounded-xl border-border/50 bg-white/80 dark:bg-background/80 backdrop-blur-sm"
            />
            <Button type="submit" disabled={loading} className="h-12 px-6 rounded-xl text-sm gap-2 shadow-md shadow-primary/15 touch-manipulation">
              <Send className="h-4 w-4" />
              {loading ? "..." : (isAr ? "اشتراك" : "Subscribe")}
            </Button>
          </form>
          <div className="mt-4 flex items-center justify-center gap-1.5 text-[12px] text-muted-foreground/60">
            <Shield className="h-3 w-3" />
            {isAr ? "بدون إزعاج. يمكنك إلغاء الاشتراك في أي وقت." : "No spam ever. Unsubscribe anytime."}
          </div>
        </div>
      </div>
    </section>
  );
};
