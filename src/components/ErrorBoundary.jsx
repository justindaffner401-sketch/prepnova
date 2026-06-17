import { Component } from "react";

// Catches render/lifecycle/effect errors anywhere below it and shows a friendly
// fallback instead of unmounting the tree to a blank screen. The navbar + footer
// live outside this boundary, so the chrome stays put. Keyed by route in App so
// navigating away clears a crashed page.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Surface details in the console for debugging; no PII is logged.
    console.error("ErrorBoundary caught:", error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container-pn flex min-h-[60vh] flex-col items-center justify-center gap-4 py-20 text-center">
          <h1 className="font-display text-2xl font-extrabold text-white">Something went wrong</h1>
          <p className="max-w-md text-sm leading-relaxed text-slate-400">
            That part of the app hit an unexpected error. The rest of the site is
            fine — try again, or reload the page.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="btn-ghost"
            >
              Try again
            </button>
            <button type="button" onClick={() => window.location.reload()} className="btn-primary">
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
