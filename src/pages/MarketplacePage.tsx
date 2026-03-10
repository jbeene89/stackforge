import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import {
  useMarketplaceTemplates,
  useMyListings,
  useMyPurchases,
  usePurchaseTemplate,
  TIER_PRICES,
  type MarketplaceTemplate,
} from "@/hooks/useMarketplace";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Search, ShoppingBag, Store, Package, Brain, Layers,
  FolderOpen, Download, Coins, Star, TrendingUp, User,
  Tag, ArrowRight, Sparkles,
} from "lucide-react";

const typeIcons: Record<string, React.ElementType> = {
  module: Brain,
  stack: Layers,
  project: FolderOpen,
};

const typeColors: Record<string, string> = {
  module: "bg-forge-amber/10 text-forge-amber border-forge-amber/20",
  stack: "bg-forge-cyan/10 text-forge-cyan border-forge-cyan/20",
  project: "bg-primary/10 text-primary border-primary/20",
};

const tierBadgeColors: Record<string, string> = {
  small: "bg-forge-emerald/10 text-forge-emerald border-forge-emerald/30",
  medium: "bg-forge-amber/10 text-forge-amber border-forge-amber/30",
  large: "bg-forge-rose/10 text-forge-rose border-forge-rose/30",
};

function TemplateCard({
  template,
  purchased,
  isOwn,
  onBuy,
  buying,
}: {
  template: MarketplaceTemplate;
  purchased: boolean;
  isOwn: boolean;
  onBuy: () => void;
  buying: boolean;
}) {
  const Icon = typeIcons[template.type] || Package;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-4 space-y-3 hover:ring-1 hover:ring-primary/20 transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("p-2 rounded-lg", typeColors[template.type])}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{template.name}</h3>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <User className="h-2.5 w-2.5" /> {template.creator_name}
            </p>
          </div>
        </div>
        <Badge variant="outline" className={cn("text-[10px]", tierBadgeColors[template.tier])}>
          {template.tier} · {template.price_credits} <Coins className="h-2.5 w-2.5 ml-0.5 inline" />
        </Badge>
      </div>

      <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>

      <div className="flex gap-1 flex-wrap">
        {(template.tags || []).slice(0, 4).map((t) => (
          <Badge key={t} variant="outline" className="text-[9px] px-1.5 py-0">
            {t}
          </Badge>
        ))}
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Download className="h-3 w-3" /> {template.downloads}
          </span>
          <Badge variant="secondary" className="text-[9px]">{template.type}</Badge>
        </div>

        {isOwn ? (
          <Badge variant="secondary" className="text-[10px]">Your listing</Badge>
        ) : purchased ? (
          <Badge className="bg-forge-emerald/15 text-forge-emerald text-[10px]">Owned</Badge>
        ) : (
          <Button size="sm" className="h-7 text-xs gradient-primary text-primary-foreground" onClick={onBuy} disabled={buying}>
            <ShoppingBag className="h-3 w-3 mr-1" /> {buying ? "Buying…" : `Buy · ${template.price_credits}`}
            <Coins className="h-3 w-3 ml-0.5" />
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export default function MarketplacePage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("browse");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: templates, isLoading } = useMarketplaceTemplates(typeFilter);
  const { data: myListings } = useMyListings();
  const { data: myPurchases } = useMyPurchases();
  const purchaseTemplate = usePurchaseTemplate();

  const purchasedIds = new Set(myPurchases?.map((p: any) => p.template_id) || []);

  const filtered = (templates || []).filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      (t.tags || []).some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col animate-fade-in">
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Store className="h-6 w-6 text-primary" /> Marketplace
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Buy & sell templates — modules, stacks, and projects built by the community
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Sparkles className="h-3 w-3" />
              Small: {TIER_PRICES.small}cr · Medium: {TIER_PRICES.medium}cr · Large: {TIER_PRICES.large}cr
            </Badge>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="px-6 pt-3">
          <TabsList className="glass">
            <TabsTrigger value="browse"><Store className="h-3 w-3 mr-1" /> Browse</TabsTrigger>
            <TabsTrigger value="my-listings"><Package className="h-3 w-3 mr-1" /> My Listings ({myListings?.length || 0})</TabsTrigger>
            <TabsTrigger value="purchased"><ShoppingBag className="h-3 w-3 mr-1" /> Purchased ({myPurchases?.length || 0})</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="browse" className="flex-1 overflow-hidden m-0 mt-2 px-6 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates…"
                className="pl-9 h-9"
              />
            </div>
            <div className="flex gap-1">
              {["all", "module", "stack", "project"].map((t) => (
                <Button
                  key={t}
                  variant={typeFilter === t ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs capitalize"
                  onClick={() => setTypeFilter(t)}
                >
                  {t === "all" ? "All" : t}
                </Button>
              ))}
            </div>
          </div>

          <ScrollArea className="h-[calc(100%-3rem)]">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground text-sm">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <Store className="h-10 w-10 mx-auto opacity-30" />
                <p className="text-muted-foreground text-sm">No templates yet</p>
                <p className="text-muted-foreground text-xs">Be the first to publish one from your modules, stacks, or projects!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((t) => (
                  <TemplateCard
                    key={t.id}
                    template={t}
                    purchased={purchasedIds.has(t.id)}
                    isOwn={t.creator_id === user?.id}
                    onBuy={() => purchaseTemplate.mutate(t.id)}
                    buying={purchaseTemplate.isPending}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="my-listings" className="flex-1 overflow-hidden m-0 mt-2 px-6 pb-4">
          <ScrollArea className="h-full">
            {!myListings?.length ? (
              <div className="text-center py-12 space-y-2">
                <Package className="h-10 w-10 mx-auto opacity-30" />
                <p className="text-muted-foreground text-sm">You haven't listed any templates yet</p>
                <p className="text-muted-foreground text-xs">Go to a module, stack, or project and click "Publish to Marketplace"</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myListings.map((t) => (
                  <TemplateCard
                    key={t.id}
                    template={t as MarketplaceTemplate}
                    purchased={false}
                    isOwn={true}
                    onBuy={() => {}}
                    buying={false}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="purchased" className="flex-1 overflow-hidden m-0 mt-2 px-6 pb-4">
          <ScrollArea className="h-full">
            {!myPurchases?.length ? (
              <div className="text-center py-12 space-y-2">
                <ShoppingBag className="h-10 w-10 mx-auto opacity-30" />
                <p className="text-muted-foreground text-sm">No purchases yet</p>
                <p className="text-muted-foreground text-xs">Browse the marketplace to find templates to buy</p>
              </div>
            ) : (
              <div className="space-y-2">
                {myPurchases.map((p: any) => (
                  <div key={p.id} className="glass rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">Template Purchase</span>
                      <span className="text-xs text-muted-foreground ml-2">{p.credits_paid} credits</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
