import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Zap, ArrowRight, BookOpen, Rocket } from "lucide-react";

export type SLMMode = "easy" | "expert";

interface SLMModePickerProps {
  onSelect: (mode: SLMMode) => void;
  onLoadSample?: () => void;
  sampleLoading?: boolean;
}

export function SLMModePicker({ onSelect, onLoadSample, sampleLoading }: SLMModePickerProps) {
  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full space-y-4 max-h-[90dvh] overflow-y-auto"
      >
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">How do you want to build?</h2>
        </div>

        {onLoadSample && <div className="text-center space-y-2">
          <Button onClick={onLoadSample} disabled={sampleLoading} className="max-w-full whitespace-normal h-auto min-h-11 py-3">
            <Sparkles className="h-4 w-4 mr-2 shrink-0" />{sampleLoading ? "Loading sample…" : "Load Sample Dataset"}
          </Button>
          <p className="text-xs text-muted-foreground">10 ready-made pairs · No credits used</p>
        </div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Easy Mode */}
          <Card
            className="border-2 border-transparent hover:border-primary/50 transition-all group"
          >
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-forge-emerald/10 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-forge-emerald" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Easy Mode</h3>
                  <Badge variant="outline" className="text-[10px] text-forge-emerald border-forge-emerald/30">Recommended</Badge>
                </div>
              </div>
              <Button onClick={() => onSelect("easy")} className="w-full gradient-primary text-primary-foreground group-hover:shadow-lg transition-shadow">
                Start Easy Mode <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>

          {/* Expert Mode */}
          <Card
            className="border-2 border-transparent hover:border-forge-amber/50 transition-all group"
          >
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-forge-amber/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-forge-amber" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Expert Mode</h3>
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">Power users</Badge>
                </div>
              </div>
              <Button onClick={() => onSelect("expert")} variant="outline" className="w-full group-hover:border-forge-amber/50 transition-colors">
                Start Expert Mode <Rocket className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
