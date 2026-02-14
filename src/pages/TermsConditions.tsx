import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { FileText, Calendar } from "lucide-react";

export default function TermsConditions() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const sections = isAr ? [
    { title: "١. التعريفات", content: "• \"المنصة\": منصة الطهاة الإلكترونية المتاحة عبر الموقع والتطبيقات المرتبطة بها.\n• \"المستخدم\": كل شخص طبيعي أو اعتباري يستخدم المنصة.\n• \"الخدمات\": جميع الخدمات المقدمة عبر المنصة بما في ذلك المسابقات والمعارض والدورات والتواصل المهني.\n• \"المحتوى\": أي نصوص أو صور أو فيديوهات أو بيانات يتم نشرها على المنصة." },
    { title: "٢. القبول بالشروط", content: "باستخدامكم للمنصة أو التسجيل فيها، فإنكم توافقون على الالتزام بهذه الشروط والأحكام. إذا لم توافقوا على أي من هذه الشروط، يُرجى عدم استخدام المنصة. تسري هذه الشروط وفقاً لأنظمة المملكة العربية السعودية." },
    { title: "٣. الأهلية", content: "يجب أن يكون عمر المستخدم ١٨ عاماً على الأقل لاستخدام المنصة. بالتسجيل، تؤكدون أنكم تستوفون هذا الشرط وأن المعلومات المقدمة صحيحة ودقيقة." },
    { title: "٤. حسابات المستخدمين", content: "• يلتزم المستخدم بالحفاظ على سرية بيانات حسابه وكلمة المرور.\n• يتحمل المستخدم المسؤولية الكاملة عن جميع الأنشطة التي تتم من خلال حسابه.\n• يحق للمنصة تعليق أو إلغاء أي حساب يخالف الشروط.\n• يجب أن تكون المعلومات المقدمة صحيحة ومحدثة." },
    { title: "٥. الاستخدام المقبول", content: "يلتزم المستخدم بعدم:\n\n• نشر محتوى مخالف للشريعة الإسلامية أو الأنظمة السعودية.\n• الإساءة أو التحرش أو التمييز ضد المستخدمين الآخرين.\n• نشر معلومات كاذبة أو مضللة.\n• استخدام المنصة لأغراض غير قانونية.\n• محاولة الوصول غير المصرح به لأنظمة المنصة.\n• نسخ أو توزيع محتوى المنصة بدون إذن.\n• استخدام برامج آلية أو روبوتات للتفاعل مع المنصة." },
    { title: "٦. المسابقات والفعاليات", content: "• تخضع المشاركة في المسابقات للوائح والشروط الخاصة بكل مسابقة.\n• قرارات لجان التحكيم نهائية وغير قابلة للطعن.\n• يحق للمنصة إلغاء أو تعديل أي مسابقة مع إشعار المشاركين.\n• الشهادات والجوائز الممنوحة تخضع لسياسة المنصة." },
    { title: "٧. الملكية الفكرية", content: "• جميع حقوق الملكية الفكرية للمنصة ومحتواها محفوظة لمنصة الطهاة.\n• يمنح المستخدم المنصة ترخيصاً غير حصري لاستخدام المحتوى الذي ينشره.\n• يحتفظ المستخدم بحقوق ملكيته الفكرية على محتواه الأصلي.\n• يُحظر استخدام العلامات التجارية للمنصة بدون إذن كتابي مسبق." },
    { title: "٨. المسؤولية والضمانات", content: "• تُقدم المنصة خدماتها \"كما هي\" دون أي ضمانات صريحة أو ضمنية.\n• لا تتحمل المنصة المسؤولية عن أي أضرار مباشرة أو غير مباشرة ناتجة عن استخدام المنصة.\n• لا تتحمل المنصة المسؤولية عن محتوى المستخدمين أو تعاملاتهم فيما بينهم.\n• تقتصر مسؤولية المنصة على الحد الأقصى المسموح به وفقاً للأنظمة السعودية." },
    { title: "٩. التعديلات والإنهاء", content: "• يحق للمنصة تعديل هذه الشروط في أي وقت مع إشعار المستخدمين.\n• يحق للمستخدم حذف حسابه في أي وقت.\n• يحق للمنصة إنهاء أو تعليق حساب أي مستخدم يخالف الشروط.\n• تظل الأحكام المتعلقة بالملكية الفكرية والمسؤولية سارية بعد الإنهاء." },
    { title: "١٠. القانون الحاكم وحل النزاعات", content: "• تخضع هذه الشروط لأنظمة المملكة العربية السعودية.\n• يتم حل أي نزاع ودياً في المقام الأول.\n• في حال عدم التوصل لحل ودي، تختص المحاكم المختصة في المملكة العربية السعودية بالنظر في النزاع.\n• يُطبق نظام التجارة الإلكترونية ونظام حماية البيانات الشخصية السعودي." },
    { title: "١١. التواصل", content: "لأي استفسارات حول هذه الشروط والأحكام:\n\n• البريد الإلكتروني: info@altohaa.com\n• الهاتف: +966569220777\n• الموقع: المملكة العربية السعودية" },
  ] : [
    { title: "1. Definitions", content: "• \"Platform\": The Altohaa electronic platform accessible via the website and associated applications.\n• \"User\": Any natural or legal person who uses the Platform.\n• \"Services\": All services provided through the Platform including competitions, exhibitions, courses, and professional networking.\n• \"Content\": Any text, images, videos, or data published on the Platform." },
    { title: "2. Acceptance of Terms", content: "By using or registering on the Platform, you agree to be bound by these Terms and Conditions. If you do not agree to any of these terms, please do not use the Platform. These terms are governed by the laws of the Kingdom of Saudi Arabia." },
    { title: "3. Eligibility", content: "Users must be at least 18 years old to use the Platform. By registering, you confirm that you meet this requirement and that the information provided is true and accurate." },
    { title: "4. User Accounts", content: "• Users must maintain the confidentiality of their account credentials and password.\n• Users bear full responsibility for all activities conducted through their account.\n• The Platform reserves the right to suspend or cancel any account that violates these terms.\n• Information provided must be accurate and up to date." },
    { title: "5. Acceptable Use", content: "Users must not:\n\n• Publish content that violates Islamic Sharia or Saudi regulations.\n• Harass, abuse, or discriminate against other users.\n• Publish false or misleading information.\n• Use the Platform for illegal purposes.\n• Attempt unauthorized access to Platform systems.\n• Copy or distribute Platform content without permission.\n• Use automated software or bots to interact with the Platform." },
    { title: "6. Competitions and Events", content: "• Participation in competitions is subject to the specific rules and conditions of each competition.\n• Judging panel decisions are final and non-appealable.\n• The Platform reserves the right to cancel or modify any competition with notice to participants.\n• Certificates and awards granted are subject to Platform policy." },
    { title: "7. Intellectual Property", content: "• All intellectual property rights of the Platform and its content are reserved for Altohaa.\n• Users grant the Platform a non-exclusive license to use content they publish.\n• Users retain their intellectual property rights over their original content.\n• Use of Platform trademarks without prior written permission is prohibited." },
    { title: "8. Liability and Warranties", content: "• The Platform provides its services \"as is\" without any express or implied warranties.\n• The Platform is not liable for any direct or indirect damages resulting from Platform use.\n• The Platform is not responsible for user content or their interactions with each other.\n• Platform liability is limited to the maximum extent permitted under Saudi regulations." },
    { title: "9. Modifications and Termination", content: "• The Platform reserves the right to modify these terms at any time with notice to users.\n• Users may delete their account at any time.\n• The Platform may terminate or suspend any user account that violates these terms.\n• Provisions relating to intellectual property and liability survive termination." },
    { title: "10. Governing Law and Dispute Resolution", content: "• These terms are governed by the laws of the Kingdom of Saudi Arabia.\n• Any dispute shall be resolved amicably in the first instance.\n• If no amicable resolution is reached, the competent courts in the Kingdom of Saudi Arabia shall have jurisdiction.\n• The Saudi E-Commerce Law and Personal Data Protection Law apply." },
    { title: "11. Contact Us", content: "For any inquiries about these Terms and Conditions:\n\n• Email: info@altohaa.com\n• Phone: +966569220777\n• Location: Kingdom of Saudi Arabia" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background" dir={isAr ? "rtl" : "ltr"}>
      <SEOHead title={isAr ? "الشروط والأحكام" : "Terms & Conditions"} description={isAr ? "شروط وأحكام استخدام منصة الطهاة" : "Altohaa Terms and Conditions"} />
      <Header />
      <main className="flex-1">
        <section className="border-b border-border/40 bg-gradient-to-b from-primary/5 to-background">
          <div className="container py-10 md:py-14 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
              <FileText className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">{isAr ? "الشروط والأحكام" : "Terms & Conditions"}</span>
            </div>
            <h1 className="font-serif text-3xl font-bold md:text-4xl">{isAr ? "الشروط والأحكام" : "Terms & Conditions"}</h1>
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
