import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Sparkles, Loader2, Coins, Hammer, Heart, Zap, RotateCcw, LogIn,
} from "lucide-react";
import { Link } from "react-router-dom";

const PERSPECTIVES = [
  { id: "builder", name: "Axiom", role: "Structure", icon: Hammer, color: "text-forge-cyan" },
  { id: "empath", name: "Lyra", role: "Emotion", icon: Heart, color: "text-forge-rose" },
  { id: "frame_breaker", name: "Flux", role: "Vision", icon: Zap, color: "text-forge-amber" },
];

export function PhotoTransform() {
  const { user } = useAuth();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [steps, setSteps] = useState<{ image: string; name: string; id: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sliderContainerRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10MB"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      setOriginalImage(reader.result as string);
      setSteps([]);
      setCurrentStep(-1);
      setSliderPos(50);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file?.type.startsWith("image/")) { toast.error("Please drop an image"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10MB"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      setOriginalImage(reader.result as string);
      setSteps([]);
      setCurrentStep(-1);
      setSliderPos(50);
    };
    reader.readAsDataURL(file);
  }, []);

  const runTransform = async () => {
    if (!originalImage || !user) return;
    setIsProcessing(true);
    setSteps([]);
    setCurrentStep(0);

    let currentImage = originalImage;
    const newSteps: typeof steps = [];

    for (let i = 0; i < 3; i++) {
      setCurrentStep(i);
      try {
        const { data, error } = await supabase.functions.invoke("transform-photo", {
          body: { image: currentImage, perspectiveIndex: i },
        });

        if (error) {
          toast.error("Transform failed — credit refunded if charged");
          break;
        }
        if (data?.error) {
          if (data.error === "Insufficient credits") {
            toast.error("Not enough credits (need 1)");
          } else {
            toast.error(data.error);
          }
          break;
        }

        if (data?.image) {
          currentImage = data.image;
          newSteps.push({ image: data.image, name: data.perspectiveName, id: data.perspectiveId });
          setSteps([...newSteps]);
        }
      } catch {
        toast.error("Something went wrong");
        break;
      }
    }

    setCurrentStep(-1);
    setIsProcessing(false);
  };

  const reset = () => {
    setOriginalImage(null);
    setSteps([]);
    setCurrentStep(-1);
    setSliderPos(50);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSliderMove = useCallback((clientX: number) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos((x / rect.width) * 100);
  }, []);

  const finalImage = steps.length > 0 ? steps[steps.length - 1].image : null;
  const showSlider = originalImage && finalImage && !isProcessing;

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <Badge variant="outline" className="text-[10px] mb-4 border-forge-gold/30 text-forge-gold font-semibold">
            <Coins className="h-3 w-3 mr-1" /> 1 Credit
          </Badge>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-bold tracking-wide">
            Transform <span className="gradient-text">YOUR</span> Photo
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-lg mx-auto">
            Upload any photo and watch 3 AI perspectives reimagine it — structure, emotion, and creative vision.
          </p>
        </motion.div>

        {/* Perspective progress */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-6">
          {PERSPECTIVES.map((p, i) => {
            const Icon = p.icon;
            const isDone = i < steps.length;
            const isActive = i === currentStep;
            return (
              <motion.div
                key={p.id}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isDone ? "bg-primary/20 text-primary border border-primary/30" :
                  isActive ? "bg-forge-gold/20 text-forge-gold border border-forge-gold/30 animate-pulse" :
                  "bg-muted/30 text-muted-foreground border border-border/30"
                }`}
                animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                {isActive ? <Loader2 className="h-3 w-3 animate-spin" /> : <Icon className={`h-3 w-3 ${isDone ? "text-primary" : ""}`} />}
                <span className="hidden sm:inline">{p.name}</span>
                <span className="sm:hidden">{p.role}</span>
              </motion.div>
            );
          })}
        </div>

        <div className="relative">
          {/* Upload area or result */}
          {!originalImage ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="border-2 border-dashed border-primary/20 rounded-2xl p-12 text-center cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => user ? fileInputRef.current?.click() : null}
              onDragOver={(e) => e.preventDefault()}
              onDrop={user ? handleDrop : undefined}
            >
              {user ? (
                <>
                  <Upload className="h-10 w-10 mx-auto mb-3 text-primary/50" />
                  <p className="text-sm font-medium text-foreground/80">Drop your photo here or click to upload</p>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP — up to 10MB</p>
                </>
              ) : (
                <>
                  <LogIn className="h-10 w-10 mx-auto mb-3 text-primary/50" />
                  <p className="text-sm font-medium text-foreground/80">Sign up free to try it</p>
                  <p className="text-xs text-muted-foreground mt-1 mb-4">Get 50 free credits — this costs just 1</p>
                  <Link to="/signup">
                    <Button size="sm" className="gradient-primary text-primary-foreground">
                      Start Free <Sparkles className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </Link>
                </>
              )}
            </motion.div>
          ) : showSlider ? (
            /* Before/After slider */
            <div className="space-y-4">
              <div
                ref={sliderContainerRef}
                className="relative rounded-2xl overflow-hidden border border-primary/20 cursor-col-resize select-none aspect-[16/10]"
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
                onMouseMove={(e) => isDragging && handleSliderMove(e.clientX)}
                onTouchStart={() => setIsDragging(true)}
                onTouchEnd={() => setIsDragging(false)}
                onTouchMove={(e) => handleSliderMove(e.touches[0].clientX)}
              >
                {/* After (full background) */}
                <img src={finalImage} alt="Transformed" className="absolute inset-0 w-full h-full object-cover" />

                {/* Before (clipped) */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${sliderPos}%` }}
                >
                  <img
                    src={originalImage}
                    alt="Original"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ width: `${100 / (sliderPos / 100)}%`, maxWidth: "none" }}
                  />
                </div>

                {/* Slider line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white/80 shadow-lg z-10"
                  style={{ left: `${sliderPos}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white/90 shadow-lg flex items-center justify-center">
                    <div className="flex gap-0.5">
                      <div className="w-0.5 h-3 bg-muted-foreground/60 rounded-full" />
                      <div className="w-0.5 h-3 bg-muted-foreground/60 rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Labels */}
                <div className="absolute top-3 left-3 px-2 py-1 rounded-md bg-background/70 backdrop-blur-sm text-[10px] font-semibold z-10">
                  Original
                </div>
                <div className="absolute top-3 right-3 px-2 py-1 rounded-md bg-background/70 backdrop-blur-sm text-[10px] font-semibold text-forge-gold z-10">
                  ✨ Transformed
                </div>
              </div>

              {/* Step thumbnails */}
              <div className="flex items-center gap-3 justify-center">
                {steps.map((s, i) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                  >
                    <img
                      src={s.image}
                      alt={s.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover border border-primary/20"
                    />
                    <div className="text-[10px] font-semibold mt-1 text-muted-foreground">{s.name}</div>
                  </motion.div>
                ))}
              </div>

              <div className="flex justify-center">
                <Button variant="outline" size="sm" onClick={reset} className="text-xs">
                  <RotateCcw className="h-3 w-3 mr-1" /> Try another photo
                </Button>
              </div>
            </div>
          ) : (
            /* Processing / preview state */
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden border border-primary/20 aspect-[16/10]">
                <img
                  src={steps.length > 0 ? steps[steps.length - 1].image : originalImage}
                  alt="Processing"
                  className="w-full h-full object-cover"
                />
                {isProcessing && (
                  <div className="absolute inset-0 bg-background/30 backdrop-blur-[2px] flex items-center justify-center">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm border border-primary/20">
                      <Loader2 className="h-4 w-4 animate-spin text-forge-gold" />
                      <span className="text-sm font-semibold">
                        {PERSPECTIVES[currentStep]?.name || "Processing"}...
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {!isProcessing && steps.length === 0 && (
                <div className="flex justify-center gap-3">
                  <Button onClick={runTransform} className="gradient-primary text-primary-foreground">
                    <Sparkles className="h-4 w-4 mr-2" /> Transform — 1 Credit
                  </Button>
                  <Button variant="outline" onClick={reset}>
                    <RotateCcw className="h-4 w-4 mr-1" /> Change
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
    </section>
  );
}
