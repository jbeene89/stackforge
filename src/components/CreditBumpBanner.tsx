import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Sparkles, X } from "lucide-react";

const STORAGE_KEY = "credit_bump_banner_dismissed_v1";

export function CreditBumpBanner() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user) return;
    const key = `${STORAGE_KEY}_${user.id}`;
    if (!localStorage.getItem(key)) setVisible(true);
  }, [user]);

  const dismiss = () => {
    if (user) localStorage.setItem(`${STORAGE_KEY}_${user.id}`, "1");
    setVisible(false);
  };

  if (!visible || !user) return null;

  return (
    <div
      style={{
        position: "relative",
        background: "linear-gradient(90deg, hsl(185 100% 42% / 0.15), hsl(185 100% 42% / 0.05))",
        borderBottom: "1px solid hsl(185 100% 42% / 0.4)",
        padding: "10px 48px 10px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        fontFamily: "Space Mono, monospace",
        fontSize: 12,
        color: "hsl(var(--foreground))",
      }}
    >
      <Sparkles style={{ width: 16, height: 16, color: "hsl(185 100% 42%)", flexShrink: 0 }} />
      <span style={{ flex: 1, lineHeight: 1.5 }}>
        <strong style={{ color: "hsl(185 100% 42%)", letterSpacing: "0.05em" }}>CREDITS BUMPED →</strong>{" "}
        Every existing account is now topped up to a <strong>100-credit floor</strong>. Thanks for being early. Check your balance — it's already there.
      </span>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        style={{
          position: "absolute",
          right: 12,
          top: "50%",
          transform: "translateY(-50%)",
          background: "transparent",
          border: "none",
          color: "hsl(var(--muted-foreground))",
          cursor: "pointer",
          padding: 4,
          display: "flex",
          alignItems: "center",
        }}
      >
        <X style={{ width: 14, height: 14 }} />
      </button>
    </div>
  );
}
