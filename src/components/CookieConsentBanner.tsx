import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";
import { Link } from "react-router-dom";

const CONSENT_KEY = "cookie-consent";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) setVisible(true);
  }, []);

  const respond = (accepted: boolean) => {
    localStorage.setItem(CONSENT_KEY, accepted ? "accepted" : "declined");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 glass-strong rounded-xl border border-border p-5 shadow-lg"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Cookie className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">We use cookies</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We use essential cookies for authentication and analytics cookies to improve your experience.{" "}
                <Link to="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </p>
              <div className="flex gap-2 pt-1">
                <Button size="sm" className="h-7 text-xs gradient-primary text-primary-foreground" onClick={() => respond(true)}>
                  Accept All
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => respond(false)}>
                  Decline
                </Button>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 -mt-1 -mr-1" onClick={() => respond(false)}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
