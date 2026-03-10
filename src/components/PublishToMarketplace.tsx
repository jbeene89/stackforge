import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { usePublishTemplate, TIER_PRICES } from "@/hooks/useMarketplace";
import { Store, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  type: "module" | "stack" | "project";
  sourceId: string;
  sourceName: string;
  templateData: any;
}

const tiers = [
  { value: "small", label: "Small", price: TIER_PRICES.small, desc: "Simple configs, single-purpose" },
  { value: "medium", label: "Medium", price: TIER_PRICES.medium, desc: "Multi-step pipelines, detailed prompts" },
  { value: "large", label: "Large", price: TIER_PRICES.large, desc: "Full blueprints, production-ready" },
] as const;

const tierColors: Record<string, string> = {
  small: "border-forge-emerald/40 bg-forge-emerald/5",
  medium: "border-forge-amber/40 bg-forge-amber/5",
  large: "border-forge-rose/40 bg-forge-rose/5",
};

export default function PublishToMarketplace({ type, sourceId, sourceName, templateData }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(sourceName);
  const [description, setDescription] = useState("");
  const [tier, setTier] = useState<"small" | "medium" | "large">("small");
  const [tags, setTags] = useState("");
  const publish = usePublishTemplate();

  const handlePublish = () => {
    publish.mutate(
      {
        name,
        description,
        type,
        tier,
        source_id: sourceId,
        template_data: templateData,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      },
      { onSuccess: () => setOpen(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Store className="h-3.5 w-3.5" /> Sell on Marketplace
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" /> Publish to Marketplace
          </DialogTitle>
          <DialogDescription>
            Sell your {type} as a template. Other users can buy it with credits — you earn the full amount.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Template Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this template do? Who is it for?"
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Pricing Tier</Label>
            <div className="grid grid-cols-3 gap-2">
              {tiers.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTier(t.value)}
                  className={cn(
                    "rounded-lg border-2 p-3 text-left transition-all",
                    tier === t.value ? tierColors[t.value] + " ring-2 ring-primary/30" : "border-border hover:border-muted-foreground/30"
                  )}
                >
                  <div className="font-semibold text-sm">{t.label}</div>
                  <div className="text-lg font-bold flex items-center gap-1">
                    {t.price} <Coins className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags (comma-separated)</Label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. chatbot, customer-support, nlp" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handlePublish} disabled={!name.trim() || !description.trim() || publish.isPending}>
            {publish.isPending ? "Publishing…" : `Publish for ${TIER_PRICES[tier]} credits`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
