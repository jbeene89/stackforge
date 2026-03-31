export type AnimationStyle = "breathe" | "ripple" | "drift" | "pulse" | "swirl" | "rain" | "fire" | "glitch";

export type ActionType = "laser" | "money" | "explosion" | "lightning" | "custom";

export interface FocalPoint {
  x: number;
  y: number;
}

export interface ActionEffect {
  type: ActionType;
  startTime: number;
  duration: number;
  params: ActionParams;
}

export interface ActionParams {
  color: string;
  secondaryColor?: string;
  particleCount: number;
  speed: number;
  spread: number;
  shape: "circle" | "line" | "star" | "rect";
  direction: "outward" | "upward" | "random";
  label?: string;
}

export const DEFAULT_ACTION_PARAMS: Record<Exclude<ActionType, "custom">, ActionParams> = {
  laser: {
    color: "#ff2222",
    secondaryColor: "#ff8800",
    particleCount: 1,
    speed: 3,
    spread: 0.1,
    shape: "line",
    direction: "outward",
  },
  money: {
    color: "#22cc44",
    secondaryColor: "#ffdd00",
    particleCount: 30,
    speed: 2,
    spread: Math.PI * 2,
    shape: "rect",
    direction: "outward",
    label: "$",
  },
  explosion: {
    color: "#ff6600",
    secondaryColor: "#ffcc00",
    particleCount: 50,
    speed: 5,
    spread: Math.PI * 2,
    shape: "circle",
    direction: "outward",
  },
  lightning: {
    color: "#aaccff",
    secondaryColor: "#ffffff",
    particleCount: 5,
    speed: 8,
    spread: Math.PI * 0.8,
    shape: "line",
    direction: "outward",
  },
};
