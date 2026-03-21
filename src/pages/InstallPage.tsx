import { useState, useEffect } from "react";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Download, Smartphone, Monitor, Share2, MoreVertical,
  Plus, ChevronRight, CheckCircle2, Sparkles, Zap,
  Wifi, WifiOff, Bell, Shield
} from "lucide-react";
import logo from "@/assets/soupyforge-logo.png";

type Platform = "ios" | "android" | "desktop" | "unknown";

function detectPlatform(): Platform {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "desktop";
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const features = [
  { icon: Zap, label: "Lightning fast", desc: "Native-like performance with instant load times" },
  { icon: WifiOff, label: "Works offline", desc: "Access your projects even without internet" },
  { icon: Bell, label: "Push notifications", desc: "Stay updated on builds and deployments" },
  { icon: Shield, label: "Secure & private", desc: "Your data stays on your device" },
];

export default function InstallPage() {
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setPlatform(detectPlatform());
    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true
    );

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const appInstalled = () => setInstalled(true);
    window.addEventListener("appinstalled", appInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", appInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  };

  if (isStandalone || installed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4 max-w-md"
        >
          <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">You're all set!</h1>
          <p className="text-muted-foreground">
            SoupyForge is installed on your device. Open it from your home screen anytime.
          </p>
          <Button onClick={() => window.location.href = "/dashboard"} className="gradient-primary text-primary-foreground">
            Open SoupyForge
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Install StackForge App" description="Install StackForge as a native app on your phone or desktop. Works on iOS, Android, and desktop browsers with offline support." />
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="relative max-w-2xl mx-auto px-6 pt-16 pb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="flex justify-center">
              <img src={logo} alt="SoupyForge" className="h-20 w-20 rounded-2xl shadow-lg" />
            </div>

            <div>
              <Badge variant="secondary" className="mb-4 text-xs">
                <Sparkles className="h-3 w-3 mr-1" /> Free to install
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight mb-3">
                Install SoupyForge
              </h1>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                Get the full app experience. Add SoupyForge to your home screen for instant access.
              </p>
            </div>

            {/* Native install button (Chrome/Edge on Android & Desktop) */}
            {deferredPrompt && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Button
                  size="lg"
                  onClick={handleInstallClick}
                  className="gradient-primary text-primary-foreground text-lg px-10 h-14 shadow-lg"
                >
                  <Download className="h-5 w-5 mr-2" /> Install Now
                </Button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-2xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-2 gap-4 mb-12">
          {features.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i + 0.4 }}
              className="glass rounded-xl p-4 space-y-2"
            >
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <f.icon className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold">{f.label}</h3>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Platform-specific instructions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="space-y-6"
        >
          <h2 className="text-xl font-bold text-center">How to install</h2>

          {(platform === "ios" || platform === "unknown") && (
            <InstructionCard
              title="iPhone & iPad (Safari)"
              icon={<Smartphone className="h-5 w-5 text-primary" />}
              steps={[
                { icon: <Share2 className="h-4 w-4" />, text: "Tap the Share button in Safari's toolbar" },
                { icon: <Plus className="h-4 w-4" />, text: 'Scroll down and tap "Add to Home Screen"' },
                { icon: <CheckCircle2 className="h-4 w-4" />, text: 'Tap "Add" to confirm' },
              ]}
            />
          )}

          {(platform === "android" || platform === "unknown") && (
            <InstructionCard
              title="Android (Chrome)"
              icon={<Smartphone className="h-5 w-5 text-primary" />}
              steps={[
                { icon: <MoreVertical className="h-4 w-4" />, text: "Tap the three-dot menu in Chrome" },
                { icon: <Download className="h-4 w-4" />, text: 'Tap "Install app" or "Add to Home screen"' },
                { icon: <CheckCircle2 className="h-4 w-4" />, text: 'Tap "Install" to confirm' },
              ]}
            />
          )}

          {(platform === "desktop" || platform === "unknown") && (
            <InstructionCard
              title="Desktop (Chrome / Edge)"
              icon={<Monitor className="h-5 w-5 text-primary" />}
              steps={[
                { icon: <Download className="h-4 w-4" />, text: "Click the install icon in the address bar" },
                { icon: <CheckCircle2 className="h-4 w-4" />, text: 'Click "Install" in the popup' },
              ]}
            />
          )}
        </motion.div>

        {/* Footer CTA */}
        <div className="mt-12 text-center">
          <p className="text-xs text-muted-foreground mb-3">
            Or continue in your browser
          </p>
          <Button variant="ghost" onClick={() => window.location.href = "/"}>
            Go to SoupyForge <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function InstructionCard({
  title,
  icon,
  steps,
}: {
  title: string;
  icon: React.ReactNode;
  steps: { icon: React.ReactNode; text: string }[];
}) {
  return (
    <div className="glass rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <div className="space-y-3">
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-xs font-bold text-primary">{i + 1}</span>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-muted-foreground">{step.icon}</span>
              <span className="text-sm">{step.text}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
