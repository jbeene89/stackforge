import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, Play, Pause, SkipForward, RotateCcw, Download, Maximize2,
  Hammer, Heart, Zap, ShieldAlert, Settings2, Sparkles,
} from "lucide-react";

const CHARACTERS = [
  { id: "builder", name: "Axiom", role: "Builder", icon: Hammer, color: "hsl(var(--forge-cyan))", bgColor: "hsl(var(--forge-cyan) / 0.15)", borderColor: "hsl(var(--forge-cyan) / 0.3)", avatar: "\u2692\uFE0F" },
  { id: "empath", name: "Lyra", role: "Empath", icon: Heart, color: "hsl(var(--forge-rose))", bgColor: "hsl(var(--forge-rose) / 0.15)", borderColor: "hsl(var(--forge-rose) / 0.3)", avatar: "\uD83C\uDF19" },
  { id: "frame_breaker", name: "Flux", role: "Frame Breaker", icon: Zap, color: "hsl(var(--forge-amber))", bgColor: "hsl(var(--forge-amber) / 0.15)", borderColor: "hsl(var(--forge-amber) / 0.3)", avatar: "\u26A1" },
  { id: "red_team", name: "Sentinel", role: "Red Team", icon: ShieldAlert, color: "hsl(var(--forge-emerald))", bgColor: "hsl(var(--forge-emerald) / 0.15)", borderColor: "hsl(var(--forge-emerald) / 0.3)", avatar: "\uD83D\uDEE1\uFE0F" },
  { id: "systems", name: "Prism", role: "Systems", icon: Settings2, color: "hsl(var(--forge-violet))", bgColor: "hsl(var(--forge-violet) / 0.15)", borderColor: "hsl(var(--forge-violet) / 0.3)", avatar: "\uD83D\uDD2E" },
];

interface ChatMessage {
  characterId: string;
  image: string | null;
  text?: string;
  round: number;
}

export default function VisualChatroom() {
  const [seedPrompt, setSeedPrompt] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<number>(-1);
  const [round, setRound] = useState(0);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentSpeaker]);

  const generateTurn = async (charIndex: number, currentRound: number, allMessages: ChatMessage[]): Promise<ChatMessage | null> => {
    const char = CHARACTERS[charIndex];
    const previousImages = allMessages
      .filter(m => m.image)
      .map(m => m.image!);

    const isFirst = allMessages.length === 0;

    try {
      const { data, error } = await supabase.functions.invoke("visual-chatroom", {
        body: {
          characterId: char.id,
          seedPrompt: isFirst ? seedPrompt : null,
          previousImages,
          imageModel: "google/gemini-3.1-flash-image-preview",
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return {
        characterId: char.id,
        image: data.image,
        text: data.text,
        round: currentRound,
      };
    } catch (e: any) {
      toast.error(`${char.name} failed: ${e.message}`);
      return null;
    }
  };

  const startConversation = async () => {
    if (!seedPrompt.trim()) { toast.error("Give the council a starting theme"); return; }
    setIsRunning(true);
    setIsPaused(false);
    abortRef.current = false;
    setMessages([]);
    setRound(1);

    let allMessages: ChatMessage[] = [];
    let currentRound = 1;

    // Run 3 rounds of all 5 characters
    for (let r = 0; r < 3 && !abortRef.current; r++) {
      currentRound = r + 1;
      setRound(currentRound);

      for (let i = 0; i < CHARACTERS.length && !abortRef.current; i++) {
        // Wait while paused
        while (isPaused && !abortRef.current) {
          await new Promise(res => setTimeout(res, 200));
        }
        if (abortRef.current) break;

        setCurrentSpeaker(i);
        const msg = await generateTurn(i, currentRound, allMessages);

        if (msg) {
          allMessages = [...allMessages, msg];
          setMessages([...allMessages]);
        }

        // Small delay between turns
        if (!abortRef.current) await new Promise(res => setTimeout(res, 600));
      }
    }

    setCurrentSpeaker(-1);
    setIsRunning(false);
    if (!abortRef.current) toast.success("Visual conversation complete!");
  };

  const stepForward = async () => {
    if (messages.length === 0 && !seedPrompt.trim()) {
      toast.error("Enter a starting theme first");
      return;
    }

    const nextIndex = messages.length % CHARACTERS.length;
    const currentRound = Math.floor(messages.length / CHARACTERS.length) + 1;

    setIsRunning(true);
    setCurrentSpeaker(nextIndex);

    const msg = await generateTurn(nextIndex, currentRound, messages);
    if (msg) {
      setMessages(prev => [...prev, msg]);
    }

    setCurrentSpeaker(-1);
    setIsRunning(false);
  };

  const stop = () => {
    abortRef.current = true;
    setIsRunning(false);
    setCurrentSpeaker(-1);
  };

  const reset = () => {
    stop();
    setMessages([]);
    setRound(0);
  };

  return (
    <div className="space-y-4">
      {/* Character Bar */}
      <div className="flex justify-center items-end gap-2 sm:gap-4 py-4">
        {CHARACTERS.map((char, i) => {
          const isSpeaking = currentSpeaker === i;
          const hasSpoken = messages.some(m => m.characterId === char.id);
          const messageCount = messages.filter(m => m.characterId === char.id).length;

          return (
            <motion.div
              key={char.id}
              className="flex flex-col items-center gap-1"
              animate={{ y: isSpeaking ? -6 : 0, scale: isSpeaking ? 1.1 : 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {isSpeaking && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-0.5"
                >
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
                  borderColor: isSpeaking ? char.color : hasSpoken ? char.borderColor : "transparent",
                  boxShadow: isSpeaking ? `0 0 16px ${char.color}` : "none",
                  opacity: hasSpoken || isSpeaking ? 1 : 0.4,
                }}
              >
                {char.avatar}
                {messageCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center font-bold">
                    {messageCount}
                  </div>
                )}
              </div>
              <span className="text-[10px] font-bold font-display" style={{ color: hasSpoken || isSpeaking ? char.color : "hsl(var(--muted-foreground))" }}>
                {char.name}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Chat Area — Image Gallery */}
      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardContent className="p-0">
          <div className="min-h-[300px] max-h-[500px] overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && !isRunning && (
              <div className="flex items-center justify-center h-[260px] text-muted-foreground">
                <div className="text-center space-y-2">
                  <p className="text-lg">Visual Chatroom</p>
                  <p className="text-xs">The council will cross-talk using images instead of words</p>
                  <p className="text-xs">Each mind sees the previous images and responds visually</p>
                </div>
              </div>
            )}

            {/* Messages as image cards */}
            <div className="grid gap-4">
              {messages.map((msg, i) => {
                const char = CHARACTERS.find(c => c.id === msg.characterId)!;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="flex gap-3"
                  >
                    {/* Avatar */}
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

                    {/* Image */}
                    <div className="flex-1 min-w-0">
                      {msg.image ? (
                        <div
                          className="rounded-xl overflow-hidden border cursor-pointer group relative"
                          style={{ borderColor: char.borderColor }}
                          onClick={() => setExpandedImage(msg.image)}
                        >
                          <img
                            src={msg.image}
                            alt={`${char.name}'s visual response`}
                            className="w-full max-h-[300px] object-contain bg-black/5 dark:bg-white/5"
                          />
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="sm" variant="secondary" className="h-6 w-6 p-0 backdrop-blur bg-background/80">
                              <Maximize2 className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="absolute bottom-2 left-2">
                            <Badge
                              className="text-[10px] backdrop-blur"
                              style={{ backgroundColor: char.bgColor, color: char.color, borderColor: char.borderColor }}
                            >
                              {char.role} — Round {msg.round}
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="rounded-xl p-3 border text-sm text-muted-foreground italic"
                          style={{ backgroundColor: char.bgColor, borderColor: char.borderColor }}
                        >
                          {msg.text || "(could not generate image)"}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Currently generating indicator */}
            <AnimatePresence>
              {isRunning && currentSpeaker >= 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex gap-3 items-center"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm border"
                    style={{
                      backgroundColor: CHARACTERS[currentSpeaker].bgColor,
                      borderColor: CHARACTERS[currentSpeaker].borderColor,
                    }}
                  >
                    {CHARACTERS[currentSpeaker].avatar}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" style={{ color: CHARACTERS[currentSpeaker].color }} />
                    <span className="font-display" style={{ color: CHARACTERS[currentSpeaker].color }}>
                      {CHARACTERS[currentSpeaker].name}
                    </span>
                    is sketching a response...
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={chatEndRef} />
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardContent className="p-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Input
                placeholder="Starting theme... (e.g. 'fire and ice colliding in space')"
                value={seedPrompt}
                onChange={e => setSeedPrompt(e.target.value)}
                disabled={isRunning}
                className="bg-background/60"
                onKeyDown={e => {
                  if (e.key === "Enter" && !isRunning) startConversation();
                }}
              />
            </div>
            <div className="flex gap-2">
              {!isRunning ? (
                <>
                  <Button onClick={startConversation} disabled={!seedPrompt.trim()} className="gradient-primary glow-primary text-primary-foreground font-display text-xs tracking-wider">
                    <Play className="h-3 w-3 mr-1" /> Start (3 rounds)
                  </Button>
                  <Button variant="outline" size="sm" onClick={stepForward} disabled={!seedPrompt.trim()} title="Generate one turn">
                    <SkipForward className="h-3 w-3" />
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={() => setIsPaused(p => !p)}>
                    {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                  </Button>
                  <Button variant="destructive" size="sm" onClick={stop}>
                    Stop
                  </Button>
                </>
              )}
              {messages.length > 0 && !isRunning && (
                <Button variant="ghost" size="sm" onClick={reset}>
                  <RotateCcw className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          {messages.length > 0 && (
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span>{messages.length} images</span>
              <span>|</span>
              <span>Round {round}</span>
              <span>|</span>
              <span>{messages.filter(m => m.image).length} successful</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lightbox */}
      <AnimatePresence>
        {expandedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setExpandedImage(null)}
          >
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              src={expandedImage}
              alt="Expanded view"
              className="max-w-full max-h-full object-contain rounded-xl"
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="backdrop-blur"
                onClick={(e) => {
                  e.stopPropagation();
                  const link = document.createElement("a");
                  link.href = expandedImage;
                  link.download = `chatroom-${Date.now()}.png`;
                  link.click();
                }}
              >
                <Download className="h-4 w-4 mr-1" /> Save
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
