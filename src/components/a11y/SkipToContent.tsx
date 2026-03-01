import { useLanguage } from "@/i18n/LanguageContext";

export function SkipToContent() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:start-2 focus:z-[100] focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {isAr ? "انتقل إلى المحتوى" : "Skip to content"}
      </a>
      <a
        href="#site-footer"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:start-44 focus:z-[100] focus:rounded-xl focus:bg-secondary focus:px-4 focus:py-2 focus:text-secondary-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {isAr ? "انتقل إلى التذييل" : "Skip to footer"}
      </a>
    </>
  );
}
