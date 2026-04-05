import { memo } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Key, ShieldCheck, ExternalLink, Info } from "lucide-react";

const KNOWN_SECRETS = [
  {
    key: "GOOGLE_SERVICE_ACCOUNT_JSON",
    labelEn: "Google Service Account",
    labelAr: "حساب خدمة جوجل",
    descEn: "Used for GSC sync, Indexing API, and Google integrations",
    descAr: "يُستخدم لمزامنة GSC وواجهة الفهرسة وتكاملات جوجل",
    docsUrl: "https://console.cloud.google.com/iam-admin/serviceaccounts",
  },
  {
    key: "OPENAI_API_KEY",
    labelEn: "OpenAI API Key",
    labelAr: "مفتاح OpenAI",
    descEn: "For AI-powered features (content generation, moderation)",
    descAr: "للميزات المدعومة بالذكاء الاصطناعي",
    docsUrl: "https://platform.openai.com/api-keys",
  },
  {
    key: "RESEND_API_KEY",
    labelEn: "Resend Email API Key",
    labelAr: "مفتاح Resend للبريد",
    descEn: "Transactional email delivery service",
    descAr: "خدمة إرسال البريد الإلكتروني",
    docsUrl: "https://resend.com/api-keys",
  },
  {
    key: "STRIPE_SECRET_KEY",
    labelEn: "Stripe Secret Key",
    labelAr: "مفتاح Stripe السري",
    descEn: "Payment processing (server-side only)",
    descAr: "معالجة المدفوعات (جانب الخادم فقط)",
    docsUrl: "https://dashboard.stripe.com/apikeys",
  },
];

const SETUP_STEPS_EN = [
  "Navigate to the service provider's dashboard (links provided below).",
  "Generate or copy your API key / credentials.",
  "Ask Lovable to securely store it as a backend secret.",
  "Lovable will prompt you to enter the value — it's encrypted and never exposed in code.",
  "The secret becomes available in backend functions automatically.",
];

const SETUP_STEPS_AR = [
  "انتقل إلى لوحة تحكم مزود الخدمة (الروابط أدناه).",
  "أنشئ أو انسخ مفتاح API / بيانات الاعتماد.",
  "اطلب من Lovable تخزينه بأمان كسر في الخلفية.",
  "سيطلب منك Lovable إدخال القيمة — مشفرة ولا تظهر في الكود.",
  "يصبح السر متاحاً في وظائف الخلفية تلقائياً.",
];

export const IntegrationsSecretsPanel = memo(function IntegrationsSecretsPanel() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="space-y-6">
      {/* How It Works */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4.5 w-4.5 text-primary" />
            {isAr ? "كيف تعمل الأسرار والتكاملات" : "How Secrets & Integrations Work"}
          </CardTitle>
          <CardDescription className="text-xs">
            {isAr
              ? "الأسرار مثل مفاتيح API تُخزن بشكل مشفر ولا تظهر أبداً في الكود. يمكن الوصول إليها فقط من وظائف الخلفية."
              : "Secrets like API keys are stored encrypted and never appear in code. They're only accessible from backend functions."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2">
            {(isAr ? SETUP_STEPS_AR : SETUP_STEPS_EN).map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px] shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <span className="text-muted-foreground">{step}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Known Integrations */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Key className="h-4.5 w-4.5 text-primary" />
            {isAr ? "التكاملات المعروفة" : "Known Integrations"}
          </CardTitle>
          <CardDescription className="text-xs">
            {isAr
              ? "قائمة بالأسرار التي يمكن تكوينها لتفعيل ميزات إضافية. اطلب من Lovable إضافة أي منها."
              : "List of secrets that can be configured to enable additional features. Ask Lovable to add any of these."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-0 divide-y divide-border/40">
          {KNOWN_SECRETS.map((secret) => (
            <div key={secret.key} className="py-3.5 px-1 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold font-mono">{secret.key}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isAr ? secret.descAr : secret.descEn}
                </p>
              </div>
              <a
                href={secret.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] text-primary hover:underline shrink-0 mt-0.5"
              >
                {isAr ? "احصل عليه" : "Get Key"}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="p-4 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">
              {isAr ? "ملاحظة أمنية" : "Security Notice"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isAr
                ? "لا يمكن عرض أو تعديل قيم الأسرار من واجهة الإدارة لأسباب أمنية. لتحديث سر موجود، اطلب من Lovable تحديثه. الأسرار مشفرة ومتاحة فقط في وظائف الخلفية."
                : "Secret values cannot be viewed or edited from the admin UI for security reasons. To update an existing secret, ask Lovable to update it. Secrets are encrypted and only available in backend functions."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
