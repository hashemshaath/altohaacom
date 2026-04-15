import { WifiOff, AlertTriangle, ShieldAlert, RefreshCw, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsAr } from "@/hooks/useIsAr";

type ErrorVariant = "network" | "auth" | "empty" | "unknown";

interface DataErrorFallbackProps {
  /** The type of error to display */
  variant?: ErrorVariant;
  /** Custom title override */
  title?: string;
  titleAr?: string;
  /** Custom description override */
  description?: string;
  descriptionAr?: string;
  /** Called when the user clicks retry */
  onRetry?: () => void;
  /** Compact mode for inline sections */
  compact?: boolean;
}

const VARIANT_CONFIG: Record<
  ErrorVariant,
  {
    icon: React.ReactNode;
    title: string;
    titleAr: string;
    description: string;
    descriptionAr: string;
  }
> = {
  network: {
    icon: <WifiOff className="h-6 w-6" />,
    title: "Couldn't load data",
    titleAr: "تعذّر تحميل البيانات",
    description: "Please check your connection and try again.",
    descriptionAr: "يرجى التحقق من الاتصال والمحاولة مرة أخرى.",
  },
  auth: {
    icon: <ShieldAlert className="h-6 w-6" />,
    title: "Access denied",
    titleAr: "تم رفض الوصول",
    description: "Please sign in to view this content.",
    descriptionAr: "يرجى تسجيل الدخول لعرض هذا المحتوى.",
  },
  empty: {
    icon: <Database className="h-6 w-6" />,
    title: "No data found",
    titleAr: "لا توجد بيانات",
    description: "There's nothing to display here yet.",
    descriptionAr: "لا يوجد شيء لعرضه بعد.",
  },
  unknown: {
    icon: <AlertTriangle className="h-6 w-6" />,
    title: "Failed to load",
    titleAr: "فشل التحميل",
    description: "Something went wrong. Please try again.",
    descriptionAr: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
  },
};

/**
 * Reusable fallback for data-loading failures.
 * Drop in anywhere data fetching can fail.
 *
 * ```tsx
 * if (isError) return <DataErrorFallback variant="network" onRetry={refetch} />;
 * ```
 */
export function DataErrorFallback({
  variant = "unknown",
  title,
  titleAr,
  description,
  descriptionAr,
  onRetry,
  compact = false,
}: DataErrorFallbackProps) {
  const isAr = useIsAr();
  const config = VARIANT_CONFIG[variant];

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 text-center ${
        compact ? "py-6 px-3" : "py-14 px-6"
      }`}
      role="alert"
    >
      <div className="rounded-full bg-destructive/10 p-3 text-destructive">
        {config.icon}
      </div>
      <h3 className={`font-semibold text-foreground ${compact ? "text-sm" : "text-base"}`}>
        {isAr ? (titleAr ?? config.titleAr) : (title ?? config.title)}
      </h3>
      <p className={`max-w-sm text-muted-foreground leading-relaxed ${compact ? "text-xs" : "text-sm"}`}>
        {isAr ? (descriptionAr ?? config.descriptionAr) : (description ?? config.description)}
      </p>

      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2 mt-1">
          <RefreshCw className="h-3.5 w-3.5" />
          {isAr ? "إعادة المحاولة" : "Retry"}
        </Button>
      )}
    </div>
  );
}
