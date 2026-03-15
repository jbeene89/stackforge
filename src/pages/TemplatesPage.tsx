import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMarketplaceTemplates } from "@/hooks/useMarketplace";
import { useCreateProject } from "@/hooks/useSupabaseData";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Globe, Smartphone, Brain, Layers, Search, Star,
  TrendingUp, Plus, ArrowRight, Sparkles, Eye,
  CheckCircle2, X, Rocket, Copy, Heart, Loader2
} from "lucide-react";

const categoryIcons: Record<string, React.ElementType> = {
  web: Globe,
  android: Smartphone,
  module: Brain,
  stack: Layers,
};

const categoryColors: Record<string, string> = {
  web: "bg-primary/10 text-primary border-primary/20",
  android: "bg-forge-emerald/10 text-forge-emerald border-forge-emerald/20",
  module: "bg-forge-amber/10 text-forge-amber border-forge-amber/20",
  stack: "bg-forge-cyan/10 text-forge-cyan border-forge-cyan/20",
};

const tabs = ["all", "web", "android", "module", "stack"] as const;

export default function TemplatesPage() {
  const navigate = useNavigate();
  const createProject = useCreateProject();
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"downloads" | "name">("downloads");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [creating, setCreating] = useState<string | null>(null);

  const { data: templates, isLoading } = useMarketplaceTemplates(filter === "all" ? undefined : filter);

  const filtered = (templates || [])
    .filter((t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      (t.tags || []).some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) =>
      sortBy === "downloads" ? b.downloads - a.downloads : a.name.localeCompare(b.name)
    );

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const createFromTemplate = (tpl: typeof filtered[0]) => {
    setCreating(tpl.id);
    const projectType = tpl.type === "web" ? "web" as const
      : tpl.type === "android" ? "android" as const
      : tpl.type === "module" ? "module" as const
      : "stack" as const;
    createProject.mutate(
      {
        name: tpl.name,
        description: tpl.description,
        type: projectType,
        tags: tpl.tags || [],
      },
      {
        onSuccess: (data) => {
          setCreating(null);
          setSelectedTemplate(null);
          toast.success(`Project created from "${tpl.name}"`, {
            description: "Redirecting to your new project…",
          });
          navigate(`/projects/${data.id}`);
        },
        onError: () => {
          setCreating(null);
          toast.error("Failed to create project from template");
        },
      }
    );
  };

  const selected = filtered.find((t) => t.id === selectedTemplate);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] animate-fade-in">
      {/* Main content */}
      <div className={cn("flex-1 flex flex-col transition-all", selectedTemplate && "mr-0")}>
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-bold">Templates Gallery</h1>
              <Badge variant="outline" className="text-[10px]">{filtered.length} templates</Badge>
            </div>
          </div>

          {/* Search + Filters */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search templates…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm glass"
              />
            </div>
            <div className="flex gap-1 p-1 rounded-lg bg-secondary/50">
              {tabs.map((t) => {
                const Icon = t !== "all" ? categoryIcons[t] : null;
                return (
                  <button
                    key={t}
                    onClick={() => setFilter(t)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize flex items-center gap-1.5",
                      filter === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {Icon && <Icon className="h-3 w-3" />}
                    {t}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-1 p-1 rounded-lg bg-secondary/50 ml-auto">
              <button
                onClick={() => setSortBy("downloads")}
                className={cn("px-2.5 py-1.5 text-[10px] rounded-md transition-colors flex items-center gap-1", sortBy === "downloads" ? "bg-background shadow-sm" : "text-muted-foreground")}
              >
                <TrendingUp className="h-3 w-3" /> Popular
              </button>
              <button
                onClick={() => setSortBy("name")}
                className={cn("px-2.5 py-1.5 text-[10px] rounded-md transition-colors", sortBy === "name" ? "bg-background shadow-sm" : "text-muted-foreground")}
              >
                A-Z
              </button>
            </div>
          </div>
        </div>

        {/* Grid */}
        <ScrollArea className="flex-1 px-6 pb-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {filtered.map((tpl, i) => {
                  const Icon = categoryIcons[tpl.type] || Brain;
                  const isActive = selectedTemplate === tpl.id;
                  const isFav = favorites.has(tpl.id);
                  return (
                    <motion.div
                      key={tpl.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.03 }}
                      whileHover={{ y: -2 }}
                      onClick={() => setSelectedTemplate(isActive ? null : tpl.id)}
                      className={cn(
                        "glass rounded-xl p-5 cursor-pointer transition-all group relative",
                        isActive ? "ring-2 ring-primary glow-primary" : "hover:border-primary/30"
                      )}
                    >
                      {/* Favorite */}
                      <button
                        onClick={(e) => toggleFavorite(tpl.id, e)}
                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Heart className={cn("h-4 w-4", isFav ? "fill-forge-rose text-forge-rose" : "text-muted-foreground")} />
                      </button>

                      <div className="flex items-start gap-3 mb-3">
                        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", categoryColors[tpl.type] || "bg-muted")}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm">{tpl.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{tpl.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex gap-1 flex-wrap">
                          {(tpl.tags || []).slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-[9px] px-1.5 py-0">{tag}</Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Star className="h-3 w-3 fill-forge-amber text-forge-amber" />
                          {tpl.downloads}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No templates found. Publish one from your modules or stacks!</p>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 380, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="border-l border-border bg-muted/30 flex flex-col overflow-hidden"
          >
            <div className="min-w-[380px]">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-semibold">Template Details</h3>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setSelectedTemplate(null)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>

              <ScrollArea className="h-[calc(100vh-8rem)]">
                <div className="p-5 space-y-5">
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", categoryColors[selected.type] || "bg-muted")}>
                      {(() => { const Icon = categoryIcons[selected.type] || Brain; return <Icon className="h-5 w-5" />; })()}
                    </div>
                    <div>
                      <h2 className="font-bold text-lg">{selected.name}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={cn("text-[10px] capitalize", categoryColors[selected.type] || "bg-muted")}>{selected.type}</Badge>
                        <Badge variant="outline" className="text-[10px]">{selected.price_credits} credits</Badge>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">{selected.description}</p>

                  {/* Stats */}
                  <div className="glass rounded-lg p-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Downloads</span>
                    <span className="text-xs font-bold">{selected.downloads}</span>
                  </div>

                  {selected.creator_name && (
                    <div className="glass rounded-lg p-3 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Created by</span>
                      <span className="text-xs font-medium">{selected.creator_name}</span>
                    </div>
                  )}

                  {/* Tags */}
                  {(selected.tags || []).length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tags</h4>
                      <div className="flex gap-1.5 flex-wrap">
                        {selected.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Create button */}
                  <div className="pt-2 space-y-2">
                    <Button
                      className="w-full gradient-primary text-primary-foreground"
                      disabled={creating === selected.id}
                      onClick={() => createFromTemplate(selected)}
                    >
                      {creating === selected.id ? (
                        <><Rocket className="h-4 w-4 mr-2 animate-bounce" /> Creating project…</>
                      ) : (
                        <><Plus className="h-4 w-4 mr-2" /> Create Project from Template</>
                      )}
                    </Button>
                    <Button variant="outline" className="w-full text-xs" onClick={() => setSelectedTemplate(null)}>
                      <Eye className="h-3.5 w-3.5 mr-1.5" /> Back to Gallery
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
