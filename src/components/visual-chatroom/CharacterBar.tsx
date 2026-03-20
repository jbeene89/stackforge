import { motion } from "framer-motion";
import { CHARACTERS, ChatMessage } from "./types";

interface CharacterBarProps {
  currentSpeaker: number;
  messages: ChatMessage[];
  selectedDuo: [string, string] | null;
  onToggleDuo?: (id: string) => void;
}

export default function CharacterBar({ currentSpeaker, messages, selectedDuo, onToggleDuo }: CharacterBarProps) {
  return (
    <div className="flex justify-center items-end gap-2 sm:gap-4 py-4">
      {CHARACTERS.map((char, i) => {
        const isSpeaking = currentSpeaker === i;
        const hasSpoken = messages.some(m => m.characterId === char.id);
        const messageCount = messages.filter(m => m.characterId === char.id).length;
        const inDuo = selectedDuo?.includes(char.id);

        return (
          <motion.div
            key={char.id}
            className="flex flex-col items-center gap-1 cursor-pointer"
            animate={{ y: isSpeaking ? -6 : 0, scale: isSpeaking ? 1.1 : 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            onClick={() => onToggleDuo?.(char.id)}
          >
            {isSpeaking && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-0.5">
                {[0, 1, 2].map(j => (
                  <motion.div
                    key={j}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: char.color }}
                    animate={{ y: [0, -3, 0] }}
                    transition={{ repeat: Infinity, duration: 0.5, delay: j * 0.1 }}
                  />
                ))}
              </motion.div>
            )}
            <div
              className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-xl border-2 transition-all"
              style={{
                backgroundColor: hasSpoken || isSpeaking ? char.bgColor : "hsl(var(--muted) / 0.3)",
                borderColor: inDuo ? char.color : isSpeaking ? char.color : hasSpoken ? char.borderColor : "transparent",
                boxShadow: isSpeaking ? `0 0 16px ${char.color}` : inDuo ? `0 0 10px ${char.color}` : "none",
                opacity: hasSpoken || isSpeaking || inDuo ? 1 : 0.4,
              }}
            >
              {char.avatar}
              {messageCount > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center font-bold">
                  {messageCount}
                </div>
              )}
              {inDuo && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-accent text-accent-foreground text-[8px] flex items-center justify-center font-bold">
                  ⚔️
                </div>
              )}
            </div>
            <span className="text-[10px] font-bold font-display" style={{ color: hasSpoken || isSpeaking || inDuo ? char.color : "hsl(var(--muted-foreground))" }}>
              {char.name}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
