import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LucideIcon } from "lucide-react";

export interface RadialAction {
  label: string;
  description?: string;
  icon: LucideIcon;
  onClick: () => void;
  color?: string;
}

interface RadialActionRingProps {
  actions: RadialAction[];
  isOpen: boolean;
  onClose: () => void;
  radius?: number;
}

export function RadialActionRing({ actions, isOpen, onClose, radius = 180 }: RadialActionRingProps) {
  const count = actions.length;
  const angleStep = (2 * Math.PI) / count;
  const startAngle = -Math.PI / 2;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with radial vignette */}
          <motion.div
            className="fixed inset-0 z-[70]"
            style={{
              background: "radial-gradient(circle at 50% 50%, hsl(var(--background) / 0.4) 0%, hsl(var(--background) / 0.85) 70%)",
              backdropFilter: "blur(12px)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />

          {/* Ring container */}
          <div className="fixed inset-0 z-[71] flex items-center justify-center pointer-events-none">

            {/* Outer pulse ring */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width: radius * 2 + 60,
                height: radius * 2 + 60,
                border: "1px solid hsl(var(--forge-cyan) / 0.15)",
                boxShadow: "0 0 40px hsl(var(--forge-cyan) / 0.08), inset 0 0 40px hsl(var(--forge-cyan) / 0.04)",
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.08, 1], opacity: [0, 0.6, 0.4] }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />

            {/* Main ring */}
            <motion.div
              className="absolute rounded-full"
              style={{
                width: radius * 2,
                height: radius * 2,
                border: "1.5px solid hsl(var(--primary) / 0.3)",
                boxShadow: `
                  0 0 30px hsl(var(--primary) / 0.15),
                  0 0 60px hsl(var(--forge-cyan) / 0.08),
                  inset 0 0 30px hsl(var(--primary) / 0.05)
                `,
              }}
              initial={{ scale: 0, opacity: 0, rotate: -90 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0, rotate: 90 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            />

            {/* Center core */}
            <motion.div
              className="absolute flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 15 }}
            >
              {/* Core glow */}
              <motion.div
                className="absolute w-16 h-16 rounded-full"
                style={{
                  background: "radial-gradient(circle, hsl(var(--primary) / 0.4) 0%, transparent 70%)",
                }}
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.6, 0.9, 0.6],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              {/* Core dot */}
              <div
                className="w-5 h-5 rounded-full"
                style={{
                  background: "hsl(var(--primary))",
                  boxShadow: "0 0 20px hsl(var(--primary) / 0.6), 0 0 40px hsl(var(--forge-cyan) / 0.3)",
                }}
              />
            </motion.div>

            {/* Connecting lines from center to each button */}
            {actions.map((_, i) => {
              const angle = startAngle + i * angleStep;
              const length = radius - 20;
              const rotation = (angle * 180) / Math.PI;

              return (
                <motion.div
                  key={`line-${i}`}
                  className="absolute"
                  style={{
                    width: length,
                    height: 1,
                    left: "50%",
                    top: "50%",
                    transformOrigin: "0% 50%",
                    rotate: rotation,
                    background: `linear-gradient(90deg, hsl(var(--primary) / 0.3) 0%, hsl(var(--primary) / 0.08) 100%)`,
                  }}
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  exit={{ scaleX: 0, opacity: 0 }}
                  transition={{ delay: i * 0.04 + 0.15, duration: 0.3 }}
                />
              );
            })}

            {/* Action buttons */}
            {actions.map((action, i) => {
              const angle = startAngle + i * angleStep;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;

              return (
                <motion.button
                  key={action.label}
                  className="absolute pointer-events-auto flex flex-col items-center gap-2 group focus:outline-none"
                  style={{
                    left: `calc(50% + ${x}px - 32px)`,
                    top: `calc(50% + ${y}px - 32px)`,
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{
                    delay: i * 0.06 + 0.1,
                    duration: 0.35,
                    type: "spring",
                    stiffness: 350,
                    damping: 18,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick();
                    onClose();
                  }}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {/* Button glow on hover */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -m-1"
                    style={{
                      background: "radial-gradient(circle, hsl(var(--primary) / 0.25) 0%, transparent 70%)",
                      filter: "blur(8px)",
                    }}
                  />

                  {/* Icon container */}
                  <div
                    className={`relative w-16 h-16 rounded-2xl bg-card/90 backdrop-blur-sm border border-border/60 flex items-center justify-center
                      group-hover:border-primary/60 transition-all duration-300
                      ${action.color || "text-foreground"}`}
                    style={{
                      boxShadow: "0 4px 20px hsl(var(--background) / 0.5)",
                    }}
                  >
                    <action.icon className="h-7 w-7 relative z-10" />

                    {/* Inner glow on hover */}
                    <div
                      className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{
                        background: "radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.12) 0%, transparent 70%)",
                      }}
                    />
                  </div>

                  {/* Label */}
                  <span className="text-[11px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors whitespace-nowrap relative z-10">
                    {action.label}
                  </span>

                  {/* Hit ripple on hover */}
                  <motion.div
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-16 rounded-2xl border-2 border-primary/30 opacity-0 group-hover:opacity-100"
                    animate={{ scale: [1, 1.3], opacity: [0.4, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                </motion.button>
              );
            })}
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
