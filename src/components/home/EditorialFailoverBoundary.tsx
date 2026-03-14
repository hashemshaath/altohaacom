import React from "react";

interface EditorialFailoverBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
  onError?: () => void;
}

interface EditorialFailoverBoundaryState {
  hasError: boolean;
}

export class EditorialFailoverBoundary extends React.Component<
  EditorialFailoverBoundaryProps,
  EditorialFailoverBoundaryState
> {
  state: EditorialFailoverBoundaryState = { hasError: false };

  static getDerivedStateFromError(): EditorialFailoverBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Editorial homepage failed, switching to classic layout", error, info.componentStack);
    this.props.onError?.();
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}
