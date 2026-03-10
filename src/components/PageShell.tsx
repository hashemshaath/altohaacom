import { ReactNode, memo } from "react";
import { useLocation } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { RelatedPages } from "@/components/seo/RelatedPages";
import { BackToTop } from "@/components/ui/back-to-top";
import { cn } from "@/lib/utils";

interface PageShellProps {
  /** SEO title - will be suffixed with site name */
  title: string;
  /** SEO description */
  description?: string;
  /** Additional SEOHead props */
  seoProps?: Record<string, any>;
  /** Page content */
  children: ReactNode;
  /** Whether to show Header (default: true) */
  header?: boolean;
  /** Whether to show Footer (default: true) */
  footer?: boolean;
  /** Extra className for the main content wrapper */
  className?: string;
  /** Whether to use container class (default: true) */
  container?: boolean;
  /** Vertical padding preset */
  padding?: "none" | "sm" | "md" | "lg";
  /** Whether to show related pages section for internal linking (default: true) */
  relatedPages?: boolean;
}

const paddingMap = {
  none: "",
  sm: "py-4",
  md: "py-6 md:py-8",
  lg: "py-8 md:py-12",
};

/**
 * Unified page layout shell that provides consistent Header, Footer, SEO, 
 * and page-enter animation. Reduces boilerplate across all pages.
 */
export const PageShell = memo(function PageShell({
  title,
  description,
  seoProps,
  children,
  header = true,
  footer = true,
  className,
  container = true,
  padding = "md",
  relatedPages = true,
}: PageShellProps) {
  const location = useLocation();
  const showRelated = relatedPages && !seoProps?.noIndex;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SEOHead title={title} description={description} {...seoProps} />
      {header && <Header />}
      <main
        className={cn(
          "flex-1 animate-fade-in",
          container && "container",
          paddingMap[padding],
          className
        )}
      >
        {children}
        {showRelated && (
          <div className={cn(!container && "container")}>
            <RelatedPages currentPath={location.pathname} />
          </div>
        )}
      </main>
      {footer && <Footer />}
      <BackToTop />
    </div>
  );
});
