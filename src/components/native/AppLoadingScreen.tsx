import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

export function AppLoadingScreen() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background text-foreground px-6">
      <div className="text-center max-w-xs space-y-5">
        <Sparkles aria-hidden="true" className="h-10 w-10 text-primary mx-auto" />
        <div role="status" aria-live="polite">
          <p className="text-lg font-semibold">Opening your workspace</p>
          <p className="mt-2 text-sm text-muted-foreground">Getting your tools ready.</p>
        </div>
        <Link to="/launchpad" className="inline-flex min-h-11 items-center px-4 text-sm underline underline-offset-4">Back to home</Link>
      </div>
    </div>
  );
}
