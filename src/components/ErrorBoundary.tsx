import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/home";
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-copper/10 flex items-center justify-center mb-5">
          <span className="text-3xl">·</span>
        </div>
        <h1 className="text-foreground text-xl font-bold mb-2">
          Etwas ist schiefgelaufen · Something went wrong
        </h1>
        <p className="text-muted-foreground text-sm mb-6 max-w-xs">
          Wir konnten den Bildschirm nicht laden. Bitte erneut versuchen.
          <br />
          We couldn't load this screen. Please try again.
        </p>
        <button
          onClick={this.handleReload}
          className="px-6 py-3 rounded-full bg-copper text-bg-base font-semibold text-sm active:scale-95 transition-transform"
        >
          Zurück · Back home
        </button>
      </div>
    );
  }
}
