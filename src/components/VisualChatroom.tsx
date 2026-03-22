import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, Play, Pause, SkipForward, RotateCcw, Upload, ImagePlus, Swords, Coins, Share2,
} from "lucide-react";
import { CHARACTERS, ChatMessage } from "./visual-chatroom/types";
import CharacterBar from "./visual-chatroom/CharacterBar";
import MessageCard from "./visual-chatroom/MessageCard";
import ImageLightbox from "./visual-chatroom/ImageLightbox";
import { useCreditsGate } from "@/hooks/useCreditsGate";
import { useQueryClient } from "@tanstack/react-query";

type Mode = "council" | "duo";

const processDrop = (file: File, onSuccess: (base64: string) => void) => {
  if (!file.type.startsWith("image/")) { toast.error("Please drop an image file"); return; }
  if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10MB"); return; }
  const reader = new FileReader();
  reader.onload = () => onSuccess(reader.result as string);
  reader.readAsDataURL(file);
};

export default function VisualChatroom() {
  const { hasCredits, balance, requireCredits } = useCreditsGate(3);
  const queryClient = useQueryClient();
  const [seedPrompt, setSeedPrompt] = useState("");
  const [seedImage, setSeedImage] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<number>(-1);
  const [round, setRound] = useState(0);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("council");
  const [duoPair, setDuoPair] = useState<[string, string] | null>(null);
  const [duoRounds, setDuoRounds] = useState(5);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef(false);
  const pauseRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const seedImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { pauseRef.current = isPaused; }, [isPaused]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentSpeaker]);

  const generateTurn = async (charIndex: number, currentRound: number, allMessages: ChatMessage[]): Promise<ChatMessage | null> => {
    const char = CHARACTERS[charIndex];
    const previousImages = allMessages.filter(m => m.image).map(m => m.image!);
    const isFirst = allMessages.length === 0;

    try {
      const { data, error } = await supabase.functions.invoke("visual-chatroom", {
        body: {
          characterId: char.id,
          seedPrompt: isFirst ? (seedPrompt || null) : null,
          seedImage: isFirst ? seedImage : null,
          previousImages,
          imageModel: "google/gemini-3.1-flash-image-preview",
        },
      });
      if (error) {
        // Check for 402 insufficient credits
        if (error.message?.includes("402") || error.message?.includes("Insufficient")) {
          toast.error("Out of credits! Upgrade your plan to continue.", {
            action: { label: "Upgrade", onClick: () => window.location.href = "/pricing" },
          });
          abortRef.current = true;
          queryClient.invalidateQueries({ queryKey: ["user-credits"] });
          return null;
        }
        throw error;
      }
      if (data?.error) {
        if (data.error.includes("Insufficient")) {
          toast.error("Out of credits!", {
            action: { label: "Upgrade", onClick: () => window.location.href = "/pricing" },
          });
          abortRef.current = true;
          queryClient.invalidateQueries({ queryKey: ["user-credits"] });
          return null;
        }
        throw new Error(data.error);
      }
      // Refresh credit balance after successful generation
      queryClient.invalidateQueries({ queryKey: ["user-credits"] });
      return { characterId: char.id, image: data.image, text: data.text, round: currentRound };
    } catch (e: any) {
      toast.error(`${char.name} failed: ${e.message}`);
      return null;
    }
  };

  const waitWhilePaused = async () => {
    while (pauseRef.current && !abortRef.current) {
      await new Promise(res => setTimeout(res, 200));
    }
  };

  // === Council mode (all 5, 3 rounds) ===
  const startCouncil = async () => {
    if (!seedPrompt.trim() && !seedImage) { toast.error("Give the council a starting theme or image"); return; }
    setIsRunning(true); setIsPaused(false); abortRef.current = false;
    setMessages([]); setRound(1);

    let allMessages: ChatMessage[] = [];
    for (let r = 0; r < 3 && !abortRef.current; r++) {
      setRound(r + 1);
      for (let i = 0; i < CHARACTERS.length && !abortRef.current; i++) {
        await waitWhilePaused();
        if (abortRef.current) break;
        setCurrentSpeaker(i);
        const msg = await generateTurn(i, r + 1, allMessages);
        if (msg) { allMessages = [...allMessages, msg]; setMessages([...allMessages]); }
        if (!abortRef.current) await new Promise(res => setTimeout(res, 600));
      }
    }
    setCurrentSpeaker(-1); setIsRunning(false);
    if (!abortRef.current) toast.success("Visual conversation complete!");
  };

  // === Duo mode (2 characters, N rounds) ===
  const startDuo = async () => {
    if (!duoPair) { toast.error("Click two characters above to pick your duo"); return; }
    if (!seedPrompt.trim() && !seedImage) { toast.error("Give the duo a starting theme or image"); return; }

    const charA = CHARACTERS.find(c => c.id === duoPair[0])!;
    const charB = CHARACTERS.find(c => c.id === duoPair[1])!;
    const idxA = CHARACTERS.indexOf(charA);
    const idxB = CHARACTERS.indexOf(charB);

    setIsRunning(true); setIsPaused(false); abortRef.current = false;
    setMessages([]); setRound(1);

    let allMessages: ChatMessage[] = [];
    for (let r = 0; r < duoRounds && !abortRef.current; r++) {
      setRound(r + 1);
      for (const idx of [idxA, idxB]) {
        await waitWhilePaused();
        if (abortRef.current) break;
        setCurrentSpeaker(idx);
        const msg = await generateTurn(idx, r + 1, allMessages);
        if (msg) { allMessages = [...allMessages, msg]; setMessages([...allMessages]); }
        if (!abortRef.current) await new Promise(res => setTimeout(res, 600));
      }
    }
    setCurrentSpeaker(-1); setIsRunning(false);
    if (!abortRef.current) toast.success(`${charA.name} × ${charB.name} finished ${duoRounds} rounds of madness!`);
  };

  const toggleDuoMember = useCallback((id: string) => {
    if (isRunning) return;
    setMode("duo");
    setDuoPair(prev => {
      if (!prev) return [id, id] as any;
      if (prev.includes(id)) {
        const remaining = prev.filter(x => x !== id);
        return remaining.length === 0 ? null : null;
      }
      return [prev[0], id] as [string, string];
    });
  }, [isRunning]);

  // === Image injection ===
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const injection: ChatMessage = {
        characterId: "user",
        image: base64,
        text: "User injected image",
        round: round || 1,
        isUserInjection: true,
      };
      setMessages(prev => [...prev, injection]);
      toast.success("Image injected! Next AI turn will respond to it.");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [round]);

  const stepForward = async () => {
    if (messages.length === 0 && !seedPrompt.trim() && !seedImage) { toast.error("Enter a starting theme or upload an image first"); return; }
    const nextIndex = messages.filter(m => !m.isUserInjection).length % CHARACTERS.length;
    const currentRound = Math.floor(messages.filter(m => !m.isUserInjection).length / CHARACTERS.length) + 1;
    setIsRunning(true); setCurrentSpeaker(nextIndex);
    const msg = await generateTurn(nextIndex, currentRound, messages);
    if (msg) setMessages(prev => [...prev, msg]);
    setCurrentSpeaker(-1); setIsRunning(false);
  };

  const stop = () => { abortRef.current = true; setIsRunning(false); setCurrentSpeaker(-1); };
  const reset = () => { stop(); setMessages([]); setRound(0); setSeedImage(null); };

  const handleShare = useCallback(async () => {
    const aiMessages = messages.filter(m => m.image && !m.isUserInjection);
    if (aiMessages.length === 0) { toast.error("No images to share"); return; }

    // Try native share API first (mobile), fall back to clipboard
    const shareText = `🎨 Visual Chatroom session on Soupy\n\nTheme: "${seedPrompt}"\n${aiMessages.length} AI-generated images across ${round} rounds\n\nTry it: ${window.location.origin}/image-forge`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "Soupy Visual Chatroom", text: shareText, url: `${window.location.origin}/image-forge` });
        toast.success("Shared!");
        return;
      } catch { /* user cancelled or unsupported */ }
    }

    await navigator.clipboard.writeText(shareText);
    toast.success("Session link copied to clipboard!");
  }, [messages, seedPrompt, round]);

  const wrappedStartConversation = () => requireCredits(() => {
    const fn = mode === "duo" && duoPair ? startDuo : startCouncil;
    fn();
  });
  const wrappedStepForward = () => requireCredits(stepForward);
  const canStart = (seedPrompt.trim() || seedImage) && (mode === "council" || (mode === "duo" && duoPair && duoPair[0] !== duoPair[1]));

  const handleSeedImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processDrop(file, (base64) => setSeedImage(base64));
    e.target.value = "";
  }, []);

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isRunning) setIsDragging(true);
  }, [isRunning]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isRunning) return;
    const file = e.dataTransfer.files?.[0];
    if (file) processDrop(file, (base64) => {
      if (messages.length > 0) {
        // Mid-conversation injection
        const injection: ChatMessage = { characterId: "user", image: base64, text: "User dropped image", round: round || 1, isUserInjection: true };
        setMessages(prev => [...prev, injection]);
        toast.success("Image injected!");
      } else {
        setSeedImage(base64);
        toast.success("Seed image set!");
      }
    });
  }, [isRunning, messages, round]);

  return (
    <div
      className={`space-y-4 relative ${isDragging ? 'ring-2 ring-primary/50 rounded-xl' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drop overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-primary/10 backdrop-blur-sm rounded-xl border-2 border-dashed border-primary/40 flex items-center justify-center pointer-events-none"
          >
            <div className="text-center">
              <Upload className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-sm font-display font-bold text-primary">Drop image here</p>
              <p className="text-xs text-muted-foreground">{messages.length > 0 ? "Inject into conversation" : "Use as seed image"}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Mode toggle */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant={mode === "council" ? "default" : "outline"}
          size="sm"
          onClick={() => { setMode("council"); setDuoPair(null); }}
          className="text-xs font-display"
        >
          <Play className="h-3 w-3 mr-1" /> Council (5 × 3)
        </Button>
        <Button
          variant={mode === "duo" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("duo")}
          className="text-xs font-display"
        >
          <Swords className="h-3 w-3 mr-1" /> Duo Jam
        </Button>
      </div>

      {mode === "duo" && (
        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            {duoPair && duoPair[0] !== duoPair[1]
              ? `${CHARACTERS.find(c => c.id === duoPair[0])?.name} × ${CHARACTERS.find(c => c.id === duoPair[1])?.name} selected`
              : "Click two different characters to pair them up"}
          </p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-xs text-muted-foreground">Rounds:</span>
            <Slider
              value={[duoRounds]}
              onValueChange={v => setDuoRounds(v[0])}
              min={2}
              max={20}
              step={1}
              className="w-32"
            />
            <Badge variant="secondary" className="text-xs font-mono">{duoRounds}</Badge>
          </div>
        </div>
      )}

      <CharacterBar
        currentSpeaker={currentSpeaker}
        messages={messages}
        selectedDuo={mode === "duo" ? duoPair : null}
        onToggleDuo={mode === "duo" ? toggleDuoMember : undefined}
      />

      {/* Chat Area */}
      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardContent className="p-0">
          <div className="min-h-[300px] max-h-[500px] overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && !isRunning && (
              <div className="flex items-center justify-center h-[260px] text-muted-foreground">
                <div className="text-center space-y-2">
                  <p className="text-lg">Visual Chatroom</p>
                  <p className="text-xs">
                    {mode === "duo"
                      ? "Pick two characters for a visual jam session — watch them riff off each other"
                      : "The council will cross-talk using images instead of words"}
                  </p>
                   <p className="text-xs">You can start with text, an image, or both</p>
                </div>
              </div>
            )}

            <div className="grid gap-4">
              {messages.map((msg, i) => (
                <MessageCard key={i} msg={msg} onExpand={setExpandedImage} />
              ))}
            </div>

            <AnimatePresence>
              {isRunning && currentSpeaker >= 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-3 items-center">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm border"
                    style={{ backgroundColor: CHARACTERS[currentSpeaker].bgColor, borderColor: CHARACTERS[currentSpeaker].borderColor }}
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
            {/* Seed image preview */}
            {seedImage && (
              <div className="relative group shrink-0">
                <img src={seedImage} alt="Seed" className="h-10 w-10 rounded-md object-cover border border-border" />
                <button
                  onClick={() => setSeedImage(null)}
                  className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-4 h-4 text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={isRunning}
                >×</button>
              </div>
            )}
            <div className="flex-1">
              <Input
                placeholder={seedImage ? "Optional: add a text theme too..." : "Starting theme... (e.g. 'fire and ice colliding in space')"}
                value={seedPrompt}
                onChange={e => setSeedPrompt(e.target.value)}
                disabled={isRunning}
                className="bg-background/60"
                onKeyDown={e => { if (e.key === "Enter" && !isRunning && canStart) wrappedStartConversation(); }}
              />
            </div>
            <div className="flex gap-2">
              {/* Seed image upload */}
              <input ref={seedImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleSeedImageUpload} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => seedImageInputRef.current?.click()}
                title="Start with an image"
                disabled={isRunning}
              >
                <Upload className="h-3 w-3" />
              </Button>

              {/* Mid-conversation image injection */}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                title="Inject your own image into the conversation"
                disabled={messages.length === 0 && !isRunning}
              >
                <ImagePlus className="h-3 w-3" />
              </Button>

              {!isRunning ? (
                <>
                  <Button
                    onClick={wrappedStartConversation}
                    disabled={!canStart}
                    className="gradient-primary glow-primary text-primary-foreground font-display text-xs tracking-wider"
                    title={mode === "duo" ? `Costs ~${duoRounds * 2 * 3} credits` : "Costs ~45 credits"}
                  >
                    <Coins className="h-3 w-3 mr-1" />
                    {mode === "duo" ? `Duo · ${duoRounds * 2 * 3}cr` : "Start · 45cr"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={wrappedStepForward} disabled={!seedPrompt.trim()} title="Generate one turn">
                    <SkipForward className="h-3 w-3" />
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={() => setIsPaused(p => !p)}>
                    {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                  </Button>
                  <Button variant="destructive" size="sm" onClick={stop}>Stop</Button>
                </>
              )}
              {messages.length > 0 && !isRunning && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={handleShare} title="Share session">
                    <Share2 className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={reset}><RotateCcw className="h-3 w-3" /></Button>
                </div>
              )}
            </div>
          </div>
          {(messages.length > 0 || true) && (
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Coins className="h-3 w-3 text-primary" />
                <span className={balance < 10 ? "text-destructive font-bold" : ""}>{balance} credits</span>
              </div>
              {messages.length > 0 && (
                <>
                  <span>|</span>
                  <span>{messages.filter(m => !m.isUserInjection).length} AI images</span>
                  <span>|</span>
                  <span>{messages.filter(m => m.isUserInjection).length} injected</span>
                  <span>|</span>
                  <span>Round {round}</span>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <ImageLightbox image={expandedImage} onClose={() => setExpandedImage(null)} />
    </div>
  );
}
