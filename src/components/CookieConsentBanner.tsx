import { useState, useEffect, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";
import { Link } from "react-router-dom";
import { initializeConsentedAnalytics, readCookieConsent, saveCookieConsent } from "@/lib/analytics-consent";
import { isNativeApp } from "@/lib/native-navigation";

export const CookieConsentBanner = forwardRef<HTMLDivElement>(function CookieConsentBanner(_props, ref) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = readCookieConsent();
    if (!stored) {
      const timer = setTimeout(() => setVisible(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const respond = (accepted: boolean) => {
    const saved = saveCookieConsent(accepted ? "accepted" : "declined");
    if (accepted && saved) initializeConsentedAnalytics();
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          ref={ref}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          role="region"
          aria-label="Cookie preferences"
          style={isNativeApp() ? { bottom: "calc(76px + var(--safe-area-bottom, 0px) + 12px)" } : undefined}
          className="fixed bottom-[calc(88px+var(--safe-area-bottom,0px))] sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 glass-strong rounded-xl border border-border p-4 shadow-lg"
        >
          <div className="flex items-start gap-3">
            <div className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Cookie className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-sm font-medium text-foreground">We use cookies</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Essential cookies support sign-in. With your permission, analytics and advertising cookies help us understand usage and measure ads.{" "}
                <Link to="/privacy" className="inline-flex min-h-11 items-center text-primary hover:underline">
                  Privacy Policy
                </Link>
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" className="h-11 min-h-11 min-w-11 text-sm gradient-primary text-primary-foreground" onClick={() => respond(true)}>
                  Accept All
                </Button>
                <Button size="sm" variant="outline" className="h-11 min-h-11 min-w-11 text-sm" onClick={() => respond(false)}>
                  Decline
                </Button>
              </div>
            </div>
            <Button variant="ghost" size="icon" aria-label="Decline optional cookies and close" className="h-11 w-11 min-h-11 min-w-11 shrink-0 -mt-1 -mr-1" onClick={() => respond(false)}>
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
