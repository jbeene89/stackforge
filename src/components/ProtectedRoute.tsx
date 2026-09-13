import { useAuth } from "@/hooks/useAuth";
import { Navigate, useLocation } from "react-router-dom";
import { isNativeApp } from "@/lib/native-navigation";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-label="Checking your session">
        <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    const destination = !navigator.onLine ? "/offline-workbench" : isNativeApp() ? "/launchpad" : "/login";
    return <Navigate to={destination} state={{ from: `${location.pathname}${location.search}${location.hash}` }} replace />;
  }
  return <>{children}</>;
}
