import { Component } from "react";
import { ErrorState } from "./StateViews";
import { reportError } from "@/lib/monitoring";

// A render throw anywhere below an unguarded tree unmounts the whole app and
// leaves a blank page. Wrapping the routes individually means a failure in
// checkout cannot take the header and navigation down with it.
export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    reportError(error, { componentStack: info?.componentStack, boundary: this.props.name });
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;

    if (this.props.fallback) {
      return this.props.fallback({ error: this.state.error, reset: this.reset });
    }

    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <ErrorState
          title={this.props.title ?? "This page hit a problem"}
          description={
            this.props.description ??
            "Nothing you did caused this and nothing has been charged. Try again, or reload the page."
          }
          onRetry={this.reset}
        />
      </div>
    );
  }
}
