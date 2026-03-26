import { loadFont } from "@remotion/google-fonts/SpaceGrotesk";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "700"],
  subsets: ["latin"],
});

export const FONT = fontFamily;

export const COLORS = {
  void: "#0a0e1a",
  voidLight: "#111827",
  gold: "#f5a623",
  cyan: "#00d4ff",
  rose: "#e94560",
  violet: "#7c3aed",
  emerald: "#10b981",
  white: "#f0ece4",
  dimWhite: "#9ca3af",
};
