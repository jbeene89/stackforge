import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Maximize2, Upload } from "lucide-react";
import { CHARACTERS, ChatMessage } from "./types";

interface MessageCardProps {
  msg: ChatMessage;
  onExpand: (image: string | null) => void;
}

export default function MessageCard({ msg, onExpand }: MessageCardProps) {
  if (msg.isUserInjection) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex gap-3"
      >
        <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm border bg-primary/15 border-primary/30">
            <Upload className="h-4 w-4 text-primary" />
          </div>
          <span className="text-[9px] font-bold text-primary">You</span>
          <Badge variant="outline" className="text-[8px] px-1 py-0">inject</Badge>
        </div>
        <div className="flex-1 min-w-0">
          {msg.image && (
            <div
              className="rounded-xl overflow-hidden border border-primary/30 cursor-pointer group relative"
              onClick={() => onExpand(msg.image)}
            >
              <img src={msg.image} alt="Your injected image" className="w-full max-h-[300px] object-contain bg-black/5 dark:bg-white/5" />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" variant="secondary" className="h-6 w-6 p-0 backdrop-blur bg-background/80">
                  <Maximize2 className="h-3 w-3" />
                </Button>
              </div>
              <div className="absolute bottom-2 left-2">
                <Badge className="text-[10px] backdrop-blur bg-primary/20 text-primary border-primary/30">
                  Your Image — Injected
                </Badge>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  const char = CHARACTERS.find(c => c.id === msg.characterId)!;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex gap-3"
    >
      <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-1">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-sm border"
          style={{ backgroundColor: char.bgColor, borderColor: char.borderColor }}
        >
          {char.avatar}
        </div>
        <span className="text-[9px] font-bold" style={{ color: char.color }}>{char.name}</span>
        <Badge variant="outline" className="text-[8px] px-1 py-0">R{msg.round}</Badge>
      </div>
      <div className="flex-1 min-w-0">
        {msg.image ? (
          <div
            className="rounded-xl overflow-hidden border cursor-pointer group relative"
            style={{ borderColor: char.borderColor }}
            onClick={() => onExpand(msg.image)}
          >
            <img src={msg.image} alt={`${char.name}'s visual response`} className="w-full max-h-[300px] object-contain bg-black/5 dark:bg-white/5" />
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="sm" variant="secondary" className="h-6 w-6 p-0 backdrop-blur bg-background/80">
                <Maximize2 className="h-3 w-3" />
              </Button>
            </div>
            <div className="absolute bottom-2 left-2">
              <Badge className="text-[10px] backdrop-blur" style={{ backgroundColor: char.bgColor, color: char.color, borderColor: char.borderColor }}>
                {char.role} — Round {msg.round}
              </Badge>
            </div>
          </div>
        ) : (
          <div className="rounded-xl p-3 border text-sm text-muted-foreground italic" style={{ backgroundColor: char.bgColor, borderColor: char.borderColor }}>
            {msg.text || "(could not generate image)"}
          </div>
        )}
      </div>
    </motion.div>
  );
}
