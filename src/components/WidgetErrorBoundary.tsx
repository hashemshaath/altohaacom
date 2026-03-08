import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  children: React.ReactNode;
  name?: string;
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

  render() {
    if (this.state.hasError) {
      const isAr = document.documentElement.lang === "ar" || localStorage.getItem("altoha-lang") === "ar";
      return (
        <Card className="rounded-2xl border-border/40 border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="rounded-xl bg-muted/60 p-3">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              {isAr ? "تعذّر تحميل هذا القسم" : "This section couldn't load"}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => this.setState({ hasError: false })}
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
