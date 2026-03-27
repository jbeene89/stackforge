import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Zap, ArrowRight, BookOpen, Rocket } from "lucide-react";

export type SLMMode = "easy" | "expert";

interface SLMModePickerProps {
  onSelect: (mode: SLMMode) => void;
}

export function SLMModePicker({ onSelect }: SLMModePickerProps) {
  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">How do you want to build?</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Choose your experience. You can switch anytime from the top bar.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Easy Mode */}
          <Card
            className="cursor-pointer border-2 border-transparent hover:border-primary/50 transition-all group"
            onClick={() => onSelect("easy")}
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
              <p className="text-sm text-muted-foreground leading-relaxed">
                Step-by-step wizard walks you through everything. Perfect if this is your first time training an AI model.
              </p>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2"><ArrowRight className="h-3 w-3 text-forge-emerald" /> Guided walkthrough</li>
                <li className="flex items-center gap-2"><ArrowRight className="h-3 w-3 text-forge-emerald" /> Preset datasets available</li>
                <li className="flex items-center gap-2"><ArrowRight className="h-3 w-3 text-forge-emerald" /> One step at a time</li>
              </ul>
              <Button className="w-full gradient-primary text-primary-foreground group-hover:shadow-lg transition-shadow">
                Start Easy Mode <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>

          {/* Expert Mode */}
          <Card
            className="cursor-pointer border-2 border-transparent hover:border-forge-amber/50 transition-all group"
            onClick={() => onSelect("expert")}
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
              <p className="text-sm text-muted-foreground leading-relaxed">
                Jump between any tool freely. Full access to all stations, terminals, and advanced pipeline modes.
              </p>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-center gap-2"><ArrowRight className="h-3 w-3 text-forge-amber" /> Non-linear navigation</li>
                <li className="flex items-center gap-2"><ArrowRight className="h-3 w-3 text-forge-amber" /> All tools unlocked</li>
                <li className="flex items-center gap-2"><ArrowRight className="h-3 w-3 text-forge-amber" /> Terminal & advanced modes</li>
              </ul>
              <Button variant="outline" className="w-full group-hover:border-forge-amber/50 transition-colors">
                Start Expert Mode <Rocket className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
