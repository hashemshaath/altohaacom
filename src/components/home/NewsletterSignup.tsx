import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

export function NewsletterSignup() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

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
    <section className="border-y bg-card/80">
      <div className="container py-10 md:py-14">
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/15">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h2 className="font-serif text-xl font-bold sm:text-2xl">
            {isAr ? "اشترك في النشرة الإخبارية" : "Subscribe to Our Newsletter"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {isAr ? "احصل على آخر الأخبار والمسابقات والمقالات مباشرة" : "Get the latest news, competitions, and articles delivered to you"}
          </p>
          <form onSubmit={handleSubmit} className="mt-5 flex gap-2 sm:mx-auto sm:max-w-md">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isAr ? "بريدك الإلكتروني" : "Your email address"}
              required
              className="flex-1"
            />
            <Button type="submit" disabled={loading}>
              {loading ? (isAr ? "..." : "...") : (isAr ? "اشتراك" : "Subscribe")}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
