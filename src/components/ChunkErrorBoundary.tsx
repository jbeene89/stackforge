import { Component, ReactNode } from "react";
import { appHref } from "@/lib/native-navigation";

interface Props {
  children: ReactNode;
}

interface State {
  hasChunkError: boolean;
}

class ChunkErrorBoundary extends Component<Props, State> {
  state: State = { hasChunkError: false };

  static getDerivedStateFromError() {
    // Keep runtime and loading failures recoverable without automatic reload loops.
    return { hasChunkError: true };
  }

  render() {
    if (this.state.hasChunkError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
          <div className="text-center space-y-4 p-8">
            <h2 className="text-xl font-semibold">Couldn't open this tool</h2>
            <p className="text-muted-foreground">Try opening it again, or return to your workspace.</p>
            <button
              onClick={() => window.location.reload()}
              className="min-h-11 px-5 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition"
            >
              Try again
            </button>
            <a href={appHref("/launchpad")} className="block min-h-11 px-4 py-3 underline underline-offset-4">Back to home</a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ChunkErrorBoundary;
