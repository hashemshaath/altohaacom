import React from "react";
import { WifiOff, ShieldAlert, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppError, ErrorCode } from "@/lib/AppError";

/* ─── Types ─── */

interface Props {
  children: React.ReactNode;
  /** Compact = inline card, full = centered large fallback */
  variant?: "compact" | "full";
  /** Section name for logging */
  name?: string;
}

interface State {
  hasError: boolean;
  error?: AppError;
}

/* ─── Error-type config ─── */

interface ErrorUIConfig {
  icon: React.ReactNode;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  retryable: boolean;
}

const ERROR_UI: Record<string, ErrorUIConfig> = {
  [ErrorCode.NETWORK]: {
    icon: <WifiOff className="h-6 w-6" />,
    title: "Connection problem",
    titleAr: "مشكلة في الاتصال",
    description: "Please check your internet connection and try again.",
    descriptionAr: "يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.",
    retryable: true,
  },
  [ErrorCode.AUTH]: {
    icon: <ShieldAlert className="h-6 w-6" />,
    title: "Access denied",
    titleAr: "تم رفض الوصول",
    description: "You may need to sign in again to view this section.",
    descriptionAr: "قد تحتاج إلى تسجيل الدخول مرة أخرى لعرض هذا القسم.",
    retryable: false,
  },
  [ErrorCode.SERVER]: {
    icon: <AlertTriangle className="h-6 w-6" />,
    title: "Server error",
    titleAr: "خطأ في الخادم",
    description: "Something went wrong on our end. Please try again later.",
    descriptionAr: "حدث خطأ في الخادم. يرجى المحاولة لاحقاً.",
    retryable: true,
  },
  fallback: {
    icon: <AlertTriangle className="h-6 w-6" />,
    title: "Something went wrong",
    titleAr: "حدث خطأ",
    description: "This section couldn't load. Please try again.",
    descriptionAr: "تعذّر تحميل هذا القسم. يرجى المحاولة مرة أخرى.",
    retryable: true,
  },
};

function getIsAr(): boolean {
  try {
    return (
      document.documentElement.lang === "ar" ||
      localStorage.getItem("altoha-lang") === "ar"
    );
  } catch {
    return false;
  }
}

/**
 * Section-level error boundary.
 * Catches errors inside a page section and renders an error-type-aware fallback
 * without crashing the rest of the page.
 *
 * ```tsx
 * <SectionErrorBoundary name="competitions">
 *   <CompetitionsGrid />
 * </SectionErrorBoundary>
 * ```
 */
export class SectionErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: AppError.from(error) };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error(
        `[SectionErrorBoundary:${this.props.name ?? "unnamed"}]`,
        error,
        info.componentStack,
      );
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const code = this.state.error?.code ?? "UNKNOWN";
    const config = ERROR_UI[code] ?? ERROR_UI.fallback;
    const isAr = getIsAr();
    const compact = this.props.variant === "compact";

    return (
      <div
        className={`flex flex-col items-center justify-center gap-3 text-center ${
          compact ? "py-8 px-4" : "py-16 px-6"
        }`}
        role="alert"
      >
        <div className="rounded-full bg-destructive/10 p-3 text-destructive">
          {config.icon}
        </div>
        <h3 className={`font-semibold text-foreground ${compact ? "text-sm" : "text-base"}`}>
          {isAr ? config.titleAr : config.title}
        </h3>
        <p className={`max-w-sm text-muted-foreground leading-relaxed ${compact ? "text-xs" : "text-sm"}`}>
          {isAr ? config.descriptionAr : config.description}
        </p>

        {config.retryable && (
          <Button variant="outline" size="sm" onClick={this.handleRetry} className="gap-2 mt-1">
            <RefreshCw className="h-3.5 w-3.5" />
            {isAr ? "إعادة المحاولة" : "Retry"}
          </Button>
        )}

        {this.state.error && import.meta.env.DEV && (
          <details className="mt-2 text-start max-w-md mx-auto">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
              {isAr ? "تفاصيل تقنية" : "Technical details"}
            </summary>
            <pre className="mt-1 text-xs bg-muted/50 rounded-lg p-2 overflow-auto max-h-24 text-destructive font-mono">
              [{code}] {this.state.error.message}
            </pre>
          </details>
        )}
      </div>
    );
  }
}
