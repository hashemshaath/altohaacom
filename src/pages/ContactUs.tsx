import { useIsAr } from "@/hooks/useIsAr";
import { useState, useMemo } from "react";
import { PageShell } from "@/components/PageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, Clock, MessageSquare, Globe, Send, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FormField, FormErrorSummary, SubmitButton } from "@/components/form";
import { useFormValidation, rules } from "@/hooks/useFormValidation";

const socialLinks = [
  { name: "Instagram", handle: "@altohacom", url: "https://instagram.com/altohacom" },
  { name: "X (Twitter)", handle: "@altohacom", url: "https://x.com/altohacom" },
  { name: "TikTok", handle: "@altohacom", url: "https://tiktok.com/@altohacom" },
  { name: "Snapchat", handle: "@altohacom", url: "https://snapchat.com/add/altohacom" },
  { name: "LinkedIn", handle: "altohacom", url: "https://linkedin.com/company/altohacom" },
  { name: "YouTube", handle: "@altohacom", url: "https://youtube.com/@altohacom" },
  { name: "Facebook", handle: "altohacom", url: "https://facebook.com/altohacom" },
];

export default function ContactUs() {
  const isAr = useIsAr();
  const { toast } = useToast();

  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const fieldConfig = useMemo(() => ({
    name: { rules: [rules.required(isAr ? "الاسم" : "Name", "الاسم"), rules.maxLength(100)] },
    email: { rules: [rules.required(isAr ? "البريد" : "Email", "البريد"), rules.email()] },
    subject: { rules: [rules.maxLength(200)] },
    message: { rules: [rules.required(isAr ? "الرسالة" : "Message", "الرسالة"), rules.minLength(10), rules.maxLength(1000)] },
  }), [isAr]);

  const { errors, errorList, onBlur, onChange, validateAll, resetErrors, getError } = useFormValidation({
    fields: fieldConfig,
    isAr,
  });

  const contactInfo = [
    { icon: Phone, label: isAr ? "الهاتف" : "Phone", value: "+966 56 922 0777", href: "tel:+966569220777" },
    { icon: Mail, label: isAr ? "البريد الإلكتروني" : "Email", value: "info@altoha.com", href: "mailto:info@altoha.com" },
    { icon: MapPin, label: isAr ? "الموقع" : "Location", value: isAr ? "المملكة العربية السعودية" : "Kingdom of Saudi Arabia", href: null },
    { icon: Clock, label: isAr ? "ساعات العمل" : "Working Hours", value: isAr ? "الأحد - الخميس: ٩ ص - ٦ م" : "Sun - Thu: 9 AM - 6 PM", href: null },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll(form)) return;

    setSending(true);
    try {
      const id = crypto.randomUUID();

      await supabase.from("notifications").insert({
        user_id: "00000000-0000-0000-0000-000000000000",
        title: `📩 Contact: ${form.name}`,
        title_ar: `📩 تواصل: ${form.name}`,
        body: `${form.email}: ${form.subject ? form.subject + " — " : ""}${form.message}`,
        body_ar: `${form.email}: ${form.subject ? form.subject + " — " : ""}${form.message}`,
        type: "contact_form",
        metadata: { id, sender_name: form.name, sender_email: form.email, subject: form.subject, message: form.message } as Record<string, string>,
      });

      await supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "contact-confirmation",
          recipientEmail: form.email,
          idempotencyKey: `contact-confirm-${id}`,
          templateData: { name: form.name },
        },
      });

      setSent(true);
      setForm({ name: "", email: "", subject: "", message: "" });
      resetErrors();
      toast({
        title: isAr ? "تم إرسال رسالتك بنجاح! ✉️" : "Message sent successfully! ✉️",
        description: isAr ? "سنتواصل معك قريباً" : "We'll get back to you soon",
      });
    } catch {
      toast({
        variant: "destructive",
        title: isAr ? "حدث خطأ" : "Something went wrong",
        description: isAr ? "يرجى المحاولة مرة أخرى" : "Please try again",
      });
    } finally {
      setSending(false);
    }
  };

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    onChange(field);
  };

  return (
    <PageShell title={isAr ? "اتصل بنا" : "Contact Us"} description={isAr ? "تواصل مع فريق منصة الطهاة للدعم والاستفسارات" : "Get in touch with the Altoha team for support and inquiries"} seoProps={{ keywords: isAr ? "اتصل بنا, دعم فني, تواصل, استفسارات" : "contact us, support, get in touch, inquiries" }} container={false}>
      <section className="border-b border-border/40 bg-gradient-to-b from-primary/5 to-background">
        <div className="container py-10 md:py-14 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">{isAr ? "تواصل معنا" : "Get in Touch"}</span>
          </div>
          <h1 className="font-serif text-3xl font-bold md:text-4xl">{isAr ? "اتصل بنا" : "Contact Us"}</h1>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            {isAr ? "نسعد بتواصلكم معنا. فريقنا جاهز لمساعدتكم والإجابة على جميع استفساراتكم." : "We'd love to hear from you. Our team is ready to help and answer all your questions."}
          </p>
        </div>
      </section>

      <div className="container py-8 md:py-12">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Contact Form */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">{isAr ? "أرسل لنا رسالة" : "Send Us a Message"}</h2>
            <Card>
              <CardContent className="py-5">
                {sent ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                    <CheckCircle2 className="h-12 w-12 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">
                      {isAr ? "تم إرسال رسالتك!" : "Message Sent!"}
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      {isAr ? "شكراً لتواصلك معنا. سنرد عليك في أقرب وقت ممكن. تحقق من بريدك الإلكتروني للتأكيد." : "Thank you for reaching out. We'll get back to you soon. Check your email for confirmation."}
                    </p>
                    <Button variant="outline" className="mt-2 rounded-xl" onClick={() => setSent(false)}>
                      {isAr ? "إرسال رسالة أخرى" : "Send Another Message"}
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                    <FormErrorSummary errors={errorList} />

                    <FormField label={isAr ? "الاسم" : "Name"} htmlFor="name" required error={getError("name")}>
                      <Input
                        id="name"
                        value={form.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        onBlur={() => onBlur("name", form.name)}
                        state={errors.name ? "error" : "default"}
                        placeholder={isAr ? "اسمك الكامل" : "Your full name"}
                        maxCharacters={100}
                        className="rounded-xl"
                      />
                    </FormField>

                    <FormField label={isAr ? "البريد الإلكتروني" : "Email"} htmlFor="email" required error={getError("email")}>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        onBlur={() => onBlur("email", form.email)}
                        state={errors.email ? "error" : "default"}
                        placeholder={isAr ? "بريدك الإلكتروني" : "Your email address"}
                        dir="ltr"
                        className="rounded-xl"
                      />
                    </FormField>

                    <FormField label={isAr ? "الموضوع" : "Subject"} htmlFor="subject" error={getError("subject")}>
                      <Input
                        id="subject"
                        value={form.subject}
                        onChange={(e) => handleChange("subject", e.target.value)}
                        onBlur={() => onBlur("subject", form.subject)}
                        state={errors.subject ? "error" : "default"}
                        placeholder={isAr ? "موضوع الرسالة" : "Message subject"}
                        maxCharacters={200}
                        className="rounded-xl"
                      />
                    </FormField>

                    <FormField label={isAr ? "الرسالة" : "Message"} htmlFor="message" required error={getError("message")}>
                      <Textarea
                        id="message"
                        value={form.message}
                        onChange={(e) => handleChange("message", e.target.value)}
                        onBlur={() => onBlur("message", form.message)}
                        state={errors.message ? "error" : "default"}
                        placeholder={isAr ? "اكتب رسالتك هنا..." : "Write your message here..."}
                        rows={4}
                        maxCharacters={1000}
                        className="rounded-xl resize-none"
                      />
                    </FormField>

                    <SubmitButton
                      loading={sending}
                      loadingText={isAr ? "جارِ الإرسال..." : "Sending..."}
                      icon={<Send className="h-4 w-4" />}
                      className="w-full rounded-xl"
                    >
                      {isAr ? "إرسال الرسالة" : "Send Message"}
                    </SubmitButton>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Contact Info & Social */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">{isAr ? "معلومات التواصل" : "Contact Information"}</h2>
              {contactInfo.map((item, i) => (
                <Card key={i}>
                  <CardContent className="flex items-start gap-4 py-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                      {item.href ? (
                        <a href={item.href} className="text-sm font-semibold hover:text-primary transition-colors" dir="ltr">{item.value}</a>
                      ) : (
                        <p className="text-sm font-semibold">{item.value}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold">{isAr ? "تابعنا على وسائل التواصل" : "Follow Us on Social Media"}</h2>
              <Card>
                <CardContent className="py-5 space-y-3">
                  {socialLinks.map((social, i) => (
                    <a key={i} href={social.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-xl p-2.5 transition-colors hover:bg-accent group">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                          <Globe className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{social.name}</p>
                          <p className="text-xs text-muted-foreground" dir="ltr">{social.handle}</p>
                        </div>
                      </div>
                    </a>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
