import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Sparkles } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { cn } from "@/lib/utils";

export function NewsletterSignup() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { ref, isVisible } = useScrollReveal();

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
        toast({ title: isAr ? "تم الاشتراك!" : "Subscribed!", description: isAr ? "شكراً لاشتراكك في نشرتنا الإخبارية" : "Thank you for subscribing to our newsletter" });
        setEmail("");
      }
    } catch {
      toast({ variant: "destructive", title: isAr ? "خطأ" : "Error", description: isAr ? "حدث خطأ، حاول مرة أخرى" : "Something went wrong, try again" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section ref={ref} className="relative border-y overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-card/80 to-accent/5" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.06),transparent_70%)]" />

      <div className="container relative py-12 md:py-16">
        <div
          className={cn(
            "mx-auto max-w-xl text-center transition-all duration-700",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15 shadow-lg shadow-primary/5">
            <Mail className="h-7 w-7 text-primary" />
          </div>
          <div className="mb-1 flex items-center justify-center gap-1.5 text-xs text-primary font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            {isAr ? "ابقَ على اطلاع" : "Stay Updated"}
          </div>
          <h2 className="font-serif text-xl font-bold sm:text-2xl">
            {isAr ? "اشترك في النشرة الإخبارية" : "Subscribe to Our Newsletter"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {isAr ? "احصل على آخر الأخبار والمسابقات والمقالات مباشرة" : "Get the latest news, competitions, and articles delivered to you"}
          </p>
          <form onSubmit={handleSubmit} className="mt-6 flex gap-2 sm:mx-auto sm:max-w-md">
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
          <p className="mt-3 text-[11px] text-muted-foreground/60">
            {isAr ? "لا رسائل مزعجة. يمكنك إلغاء الاشتراك في أي وقت." : "No spam. Unsubscribe anytime."}
          </p>
        </div>
      </div>
    </section>
  );
}
