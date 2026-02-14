import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Cookie, Calendar } from "lucide-react";

export default function CookiePolicy() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const sections = isAr ? [
    { title: "١. ما هي ملفات تعريف الارتباط؟", content: "ملفات تعريف الارتباط (الكوكيز) هي ملفات نصية صغيرة يتم تخزينها على جهازكم عند زيارة المنصة. تساعدنا هذه الملفات في تحسين تجربتكم وتقديم خدمات أفضل." },
    { title: "٢. أنواع الكوكيز المستخدمة", content: "• كوكيز ضرورية: لازمة لتشغيل المنصة وتأمين حسابكم.\n• كوكيز الأداء: لتحليل كيفية استخدام المنصة وتحسينها.\n• كوكيز الوظائف: لتذكر تفضيلاتكم مثل اللغة والإعدادات.\n• كوكيز التحليلات: لفهم سلوك المستخدمين وتحسين الخدمات." },
    { title: "٣. إدارة الكوكيز", content: "يمكنكم التحكم في ملفات تعريف الارتباط من خلال إعدادات متصفحكم. يرجى ملاحظة أن تعطيل بعض الكوكيز قد يؤثر على وظائف المنصة." },
    { title: "٤. التواصل", content: "لأي استفسارات حول سياسة ملفات تعريف الارتباط:\n\n• البريد الإلكتروني: info@altohaa.com\n• الهاتف: +966569220777" },
  ] : [
    { title: "1. What Are Cookies?", content: "Cookies are small text files stored on your device when you visit the Platform. They help us improve your experience and provide better services." },
    { title: "2. Types of Cookies Used", content: "• Essential cookies: Required for Platform operation and account security.\n• Performance cookies: To analyze how the Platform is used and improve it.\n• Functionality cookies: To remember your preferences such as language and settings.\n• Analytics cookies: To understand user behavior and improve services." },
    { title: "3. Managing Cookies", content: "You can control cookies through your browser settings. Please note that disabling some cookies may affect Platform functionality." },
    { title: "4. Contact Us", content: "For any inquiries about our Cookie Policy:\n\n• Email: info@altohaa.com\n• Phone: +966569220777" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background" dir={isAr ? "rtl" : "ltr"}>
      <SEOHead title={isAr ? "سياسة ملفات تعريف الارتباط" : "Cookie Policy"} description={isAr ? "سياسة الكوكيز لمنصة الطهاة" : "Altohaa Cookie Policy"} />
      <Header />
      <main className="flex-1">
        <section className="border-b border-border/40 bg-gradient-to-b from-primary/5 to-background">
          <div className="container py-10 md:py-14 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
              <Cookie className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">{isAr ? "سياسة الكوكيز" : "Cookie Policy"}</span>
            </div>
            <h1 className="font-serif text-3xl font-bold md:text-4xl">{isAr ? "سياسة ملفات تعريف الارتباط" : "Cookie Policy"}</h1>
            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>{isAr ? "آخر تحديث: فبراير ٢٠٢٦" : "Last updated: February 2026"}</span>
            </div>
          </div>
        </section>
        <div className="container py-8 md:py-12">
          <Card>
            <CardContent className="py-8 space-y-8">
              {sections.map((section, i) => (
                <div key={i}>
                  <h2 className="text-lg font-bold mb-3">{section.title}</h2>
                  <p className="text-sm leading-7 text-muted-foreground whitespace-pre-line">{section.content}</p>
                  {i < sections.length - 1 && <Separator className="mt-8" />}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
