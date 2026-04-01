import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasChunkError: boolean;
}

class ChunkErrorBoundary extends Component<Props, State> {
  state: State = { hasChunkError: false };

  static getDerivedStateFromError(error: Error) {
    if (
      error.message.includes("Failed to fetch dynamically imported module") ||
      error.message.includes("Importing a module script failed") ||
      error.message.includes("error loading dynamically imported module")
    ) {
      return { hasChunkError: true };
    }
    throw error;
  }

  componentDidUpdate(_: Props, prevState: State) {
    if (this.state.hasChunkError && !prevState.hasChunkError) {
      const key = "chunk_reload_ts";
      const last = Number(sessionStorage.getItem(key) || 0);
      // Only auto-reload once per 30 seconds to avoid infinite loops
      if (Date.now() - last > 30_000) {
        sessionStorage.setItem(key, String(Date.now()));
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasChunkError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
          <div className="text-center space-y-4 p-8">
            <h2 className="text-xl font-semibold">App Updated</h2>
            <p className="text-muted-foreground">A new version is available.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ChunkErrorBoundary;
