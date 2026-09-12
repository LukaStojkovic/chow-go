import { Component } from "react";

import { BoundaryFallback } from "./BoundaryFallback";
import { reportError } from "@/lib/monitoring";

// A render throw anywhere below an unguarded tree unmounts the whole app and
// leaves a blank page. Wrapping the routes individually means a failure in
// checkout cannot take the header and navigation down with it.
//
// Copy comes from `BoundaryFallback` rather than from props: a class cannot
// call `useTranslation`, so a heading passed in as a string would be frozen in
// whichever language was active when the route rendered. Callers pass a key.
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

    // `variant="startup"` is the boundary above the router, where a failure
    // means the app never mounted rather than that one screen broke.
    const isStartup = this.props.variant === "startup";

    return (
      <BoundaryFallback
        titleKey={this.props.titleKey ?? (isStartup ? "error.startupTitle" : undefined)}
        descriptionKey={
          this.props.descriptionKey ?? (isStartup ? "error.startupDescription" : undefined)
        }
        onRetry={this.reset}
      />
    );
  }
}
