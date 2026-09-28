import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorFallback } from "./ErrorFallback";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Global error boundary — Frontend-01 talabi. Router'dan TASHQARIDAGI
 * (provider'lar) render xatolarini ushlaydi. Sahifa ichidagi xatolarni
 * React Router o'zi ushlaydi — ular uchun `RouteErrorPage` (router.tsx).
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled render error:", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.error) {
      return <ErrorFallback onAction={this.handleReset} />;
    }
    return this.props.children;
  }
}
