import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const isAr = document.documentElement.lang === "ar" ||
        localStorage.getItem("altoha-lang") === "ar";

      return (
        <div className="flex flex-col items-center justify-center gap-5 py-20 px-4 text-center animate-fade-in" role="alert">
          <div className="rounded-full bg-destructive/10 p-5 ring-4 ring-destructive/5">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">
              {isAr ? "حدث خطأ غير متوقع" : "Something went wrong"}
            </h2>
            <p className="max-w-md text-sm text-muted-foreground leading-relaxed">
              {isAr
                ? "نعتذر عن هذا الخطأ. يرجى تحديث الصفحة أو العودة للرئيسية."
                : "We apologize for the inconvenience. Please try refreshing the page or go back to the homepage."}
            </p>
            {this.state.error && process.env.NODE_ENV === "development" && (
              <details className="mt-3 text-start max-w-lg mx-auto">
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                  {isAr ? "تفاصيل الخطأ" : "Error details"}
                </summary>
                <pre className="mt-2 text-xs bg-muted/50 rounded-lg p-3 overflow-auto max-h-32 text-destructive font-mono">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                this.setState({ hasError: false, error: undefined });
                window.location.reload();
              }}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {isAr ? "تحديث الصفحة" : "Refresh"}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                this.setState({ hasError: false, error: undefined });
                window.location.href = "/";
              }}
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              {isAr ? "الرئيسية" : "Homepage"}
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
