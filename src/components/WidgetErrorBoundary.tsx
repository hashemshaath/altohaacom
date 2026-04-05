import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import React from "react";

interface Props {
  children: React.ReactNode;
  name?: string;
  /** Optional compact mode for inline widgets */
  compact?: boolean;
}

interface State {
  hasError: boolean;
}

/**
 * Lightweight error boundary for individual widgets/sections.
 * Prevents one broken widget from crashing the whole page.
 */
export class WidgetErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.warn(`[WidgetError${this.props.name ? ` - ${this.props.name}` : ""}]`, error.message, info.componentStack);
  }

  private handleRetry = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) {
      const isAr = document.documentElement.lang === "ar" || localStorage.getItem("altoha-lang") === "ar";

      if (this.props.compact) {
        return (
          <div className="flex items-center gap-2 rounded-xl bg-muted/30 border border-border/30 border-dashed px-3 py-2">
            <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground">{isAr ? "خطأ" : "Error"}</span>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs rounded-lg ms-auto" onClick={this.handleRetry}>
              {isAr ? "إعادة" : "Retry"}
            </Button>
          </div>
        );
      }

      return (
        <Card className="rounded-2xl border-border/40 border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="rounded-xl bg-muted/60 p-3">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              {isAr ? "تعذّر تحميل هذا القسم" : "This section couldn't load"}
            </p>
            {this.props.name && (
              <p className="text-[10px] text-muted-foreground/50">{this.props.name}</p>
            )}
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={this.handleRetry}
            >
              {isAr ? "إعادة المحاولة" : "Retry"}
            </Button>
          </CardContent>
        </Card>
      );
    }
    return this.props.children;
  }
}
