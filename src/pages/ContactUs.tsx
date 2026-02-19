import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, MapPin, Clock, MessageSquare, Globe } from "lucide-react";

const socialLinks = [
  { name: "Instagram", handle: "@altohaacom", url: "https://instagram.com/altohaacom" },
  { name: "X (Twitter)", handle: "@altohaacom", url: "https://x.com/altohaacom" },
  { name: "TikTok", handle: "@altohaacom", url: "https://tiktok.com/@altohaacom" },
  { name: "Snapchat", handle: "@altohaacom", url: "https://snapchat.com/add/altohaacom" },
  { name: "LinkedIn", handle: "altohaacom", url: "https://linkedin.com/company/altohaacom" },
  { name: "YouTube", handle: "@altohaacom", url: "https://youtube.com/@altohaacom" },
  { name: "Facebook", handle: "altohaacom", url: "https://facebook.com/altohaacom" },
];

export default function ContactUs() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const contactInfo = [
    { icon: Phone, label: isAr ? "الهاتف" : "Phone", value: "+966 56 922 0777", href: "tel:+966569220777" },
    { icon: Mail, label: isAr ? "البريد الإلكتروني" : "Email", value: "info@altoha.com", href: "mailto:info@altoha.com" },
    { icon: MapPin, label: isAr ? "الموقع" : "Location", value: isAr ? "المملكة العربية السعودية" : "Kingdom of Saudi Arabia", href: null },
    { icon: Clock, label: isAr ? "ساعات العمل" : "Working Hours", value: isAr ? "الأحد - الخميس: ٩ ص - ٦ م" : "Sun - Thu: 9 AM - 6 PM", href: null },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background" dir={isAr ? "rtl" : "ltr"}>
      <SEOHead title={isAr ? "اتصل بنا" : "Contact Us"} description={isAr ? "تواصل مع فريق الطهاة" : "Get in touch with the Altohaa team"} />
      <Header />
      <main className="flex-1">
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
            {/* Contact Info */}
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

            {/* Social Media */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">{isAr ? "تابعنا على وسائل التواصل" : "Follow Us on Social Media"}</h2>
              <Card>
                <CardContent className="py-5 space-y-3">
                  {socialLinks.map((social, i) => (
                    <a
                      key={i}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-lg p-2.5 transition-colors hover:bg-accent group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
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
      </main>
      <Footer />
    </div>
  );
}
