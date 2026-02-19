import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Shield, Calendar } from "lucide-react";

export default function PrivacyPolicy() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const sections = isAr ? [
    { title: "١. مقدمة", content: "مرحباً بكم في منصة الطهاة (\"المنصة\"). نحن نلتزم بحماية خصوصيتكم وبياناتكم الشخصية وفقاً لنظام حماية البيانات الشخصية الصادر بالمرسوم الملكي رقم (م/19) بتاريخ 1443/02/09هـ ولائحته التنفيذية في المملكة العربية السعودية. توضح هذه السياسة كيفية جمع واستخدام وحماية ومشاركة بياناتكم الشخصية." },
    { title: "٢. البيانات التي نجمعها", content: "نقوم بجمع الأنواع التالية من البيانات:\n\n• بيانات التسجيل: الاسم الكامل، البريد الإلكتروني، رقم الهاتف، الجنسية، بلد الإقامة.\n• بيانات الملف المهني: المسمى الوظيفي، الخبرات، الشهادات، الصور الشخصية.\n• بيانات الاستخدام: سجل التصفح، التفاعلات، الأجهزة المستخدمة.\n• بيانات المعاملات: سجلات المشاركة في المسابقات والفعاليات.\n• بيانات التواصل: الرسائل المتبادلة عبر المنصة." },
    { title: "٣. أساس معالجة البيانات", content: "نعالج بياناتكم الشخصية استناداً إلى الأسس القانونية التالية وفقاً لنظام حماية البيانات الشخصية السعودي:\n\n• موافقتكم الصريحة عند التسجيل في المنصة.\n• تنفيذ العقد المبرم معكم لتقديم خدماتنا.\n• الامتثال للالتزامات النظامية.\n• المصلحة المشروعة لتحسين وتطوير خدماتنا." },
    { title: "٤. كيف نستخدم بياناتكم", content: "نستخدم بياناتكم للأغراض التالية:\n\n• إدارة حسابكم وتقديم خدمات المنصة.\n• تسجيلكم في المسابقات والفعاليات والمعارض.\n• إصدار الشهادات والتحقق منها.\n• التواصل معكم بشأن التحديثات والإشعارات.\n• تحسين تجربة المستخدم وتطوير المنصة.\n• الامتثال للمتطلبات النظامية والقانونية." },
    { title: "٥. مشاركة البيانات", content: "لا نبيع بياناتكم الشخصية لأي طرف ثالث. قد نشارك بياناتكم في الحالات التالية فقط:\n\n• مع منظمي المسابقات والفعاليات التي تشاركون فيها.\n• مع مزودي الخدمات التقنية الذين يساعدوننا في تشغيل المنصة.\n• عند الطلب من الجهات الحكومية المختصة وفقاً للأنظمة المعمول بها.\n• مع شركاء الأعمال بموافقتكم المسبقة." },
    { title: "٦. حماية البيانات", content: "نتخذ التدابير التقنية والتنظيمية اللازمة لحماية بياناتكم، تشمل:\n\n• التشفير أثناء النقل والتخزين.\n• أنظمة التحكم في الوصول والمصادقة المتعددة.\n• المراجعة الدورية لإجراءات الأمان.\n• تدريب الموظفين على حماية البيانات." },
    { title: "٧. حقوقكم", content: "وفقاً لنظام حماية البيانات الشخصية السعودي، لكم الحقوق التالية:\n\n• حق الوصول إلى بياناتكم الشخصية.\n• حق تصحيح البيانات غير الدقيقة.\n• حق حذف البيانات (حق النسيان).\n• حق الاعتراض على معالجة البيانات.\n• حق نقل البيانات.\n• حق سحب الموافقة في أي وقت.\n\nيمكنكم ممارسة هذه الحقوق عبر التواصل معنا على: info@altoha.com" },
    { title: "٨. الاحتفاظ بالبيانات", content: "نحتفظ ببياناتكم الشخصية طالما كان حسابكم نشطاً أو حسب الحاجة لتقديم خدماتنا. قد نحتفظ ببعض البيانات لفترات أطول عند الحاجة للامتثال للالتزامات القانونية أو حل النزاعات." },
    { title: "٩. ملفات تعريف الارتباط", content: "نستخدم ملفات تعريف الارتباط (الكوكيز) لتحسين تجربتكم على المنصة. يمكنكم التحكم في إعدادات الكوكيز من خلال متصفحكم، مع العلم أن تعطيلها قد يؤثر على بعض وظائف المنصة." },
    { title: "١٠. التعديلات على السياسة", content: "نحتفظ بحق تعديل هذه السياسة في أي وقت. سيتم إشعاركم بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعارات المنصة. يُعد استمراركم في استخدام المنصة بعد التعديل موافقة على السياسة المحدثة." },
    { title: "١١. التواصل", content: "لأي استفسارات تتعلق بسياسة الخصوصية أو لممارسة حقوقكم:\n\n• البريد الإلكتروني: info@altoha.com\n• الهاتف: +966569220777\n• الموقع: المملكة العربية السعودية" },
  ] : [
    { title: "1. Introduction", content: "Welcome to Altohaa (\"the Platform\"). We are committed to protecting your privacy and personal data in accordance with the Personal Data Protection Law (PDPL) issued by Royal Decree No. (M/19) dated 09/02/1443H and its implementing regulations in the Kingdom of Saudi Arabia. This policy explains how we collect, use, protect, and share your personal data." },
    { title: "2. Data We Collect", content: "We collect the following types of data:\n\n• Registration data: Full name, email address, phone number, nationality, country of residence.\n• Professional profile data: Job title, experience, certifications, profile photos.\n• Usage data: Browsing history, interactions, devices used.\n• Transaction data: Competition and event participation records.\n• Communication data: Messages exchanged through the Platform." },
    { title: "3. Legal Basis for Processing", content: "We process your personal data based on the following legal grounds under the Saudi PDPL:\n\n• Your explicit consent upon registration.\n• Performance of the contract with you to provide our services.\n• Compliance with legal obligations.\n• Legitimate interest in improving and developing our services." },
    { title: "4. How We Use Your Data", content: "We use your data for the following purposes:\n\n• Managing your account and providing Platform services.\n• Registering you for competitions, events, and exhibitions.\n• Issuing and verifying certificates.\n• Communicating updates and notifications.\n• Improving user experience and Platform development.\n• Compliance with regulatory and legal requirements." },
    { title: "5. Data Sharing", content: "We do not sell your personal data to any third party. We may share your data only in the following cases:\n\n• With organizers of competitions and events you participate in.\n• With technical service providers who help us operate the Platform.\n• When requested by competent government authorities in accordance with applicable regulations.\n• With business partners with your prior consent." },
    { title: "6. Data Protection", content: "We implement necessary technical and organizational measures to protect your data, including:\n\n• Encryption in transit and at rest.\n• Access control and multi-factor authentication systems.\n• Regular security audits.\n• Employee training on data protection." },
    { title: "7. Your Rights", content: "Under the Saudi Personal Data Protection Law, you have the following rights:\n\n• Right to access your personal data.\n• Right to correct inaccurate data.\n• Right to delete data (right to be forgotten).\n• Right to object to data processing.\n• Right to data portability.\n• Right to withdraw consent at any time.\n\nYou may exercise these rights by contacting us at: info@altoha.com" },
    { title: "8. Data Retention", content: "We retain your personal data as long as your account is active or as needed to provide our services. We may retain certain data for longer periods when necessary to comply with legal obligations or resolve disputes." },
    { title: "9. Cookies", content: "We use cookies to improve your experience on the Platform. You can control cookie settings through your browser, noting that disabling them may affect some Platform functions." },
    { title: "10. Policy Changes", content: "We reserve the right to modify this policy at any time. You will be notified of any material changes via email or Platform notifications. Your continued use of the Platform after modification constitutes acceptance of the updated policy." },
    { title: "11. Contact Us", content: "For any privacy policy inquiries or to exercise your rights:\n\n• Email: info@altoha.com\n• Phone: +966569220777\n• Location: Kingdom of Saudi Arabia" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background" dir={isAr ? "rtl" : "ltr"}>
      <SEOHead title={isAr ? "سياسة الخصوصية" : "Privacy Policy"} description={isAr ? "سياسة الخصوصية لمنصة الطهاة" : "Altohaa Privacy Policy"} />
      <Header />
      <main className="flex-1">
        <section className="border-b border-border/40 bg-gradient-to-b from-primary/5 to-background">
          <div className="container py-10 md:py-14 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">{isAr ? "سياسة الخصوصية" : "Privacy Policy"}</span>
            </div>
            <h1 className="font-serif text-3xl font-bold md:text-4xl">{isAr ? "سياسة الخصوصية وحماية البيانات" : "Privacy & Data Protection Policy"}</h1>
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
