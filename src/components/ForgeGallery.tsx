import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import {
  Image as ImageIcon, Trash2, Download, X, Clock, Users, MessageSquare, ChevronDown,
} from "lucide-react";
import { getGalleryItems, deleteGalleryItem, clearGallery, ForgeGalleryItem } from "@/lib/forgeGallery";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface ForgeGalleryProps {
  onSelect?: (item: ForgeGalleryItem) => void;
  onClose: () => void;
}

export default function ForgeGallery({ onSelect, onClose }: ForgeGalleryProps) {
  const [items, setItems] = useState<ForgeGalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ForgeGalleryItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getGalleryItems(200);
      setItems(data);
    } catch {
      toast.error("Failed to load gallery");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteGalleryItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
    if (selected?.id === id) setSelected(null);
    toast.success("Removed from gallery");
  };

  const handleClearAll = async () => {
    if (!confirm("Clear all saved images? This can't be undone.")) return;
    await clearGallery();
    setItems([]);
    setSelected(null);
    toast.success("Gallery cleared");
  };

  const handleDownload = (item: ForgeGalleryItem) => {
    const link = document.createElement("a");
    link.href = item.image;
    link.download = `forge-${item.mode}-${Date.now()}.png`;
    link.click();
  };

  const modeIcon = (mode: string) => mode === "chatroom" || mode === "free"
    ? <MessageSquare className="h-3 w-3" />
    : <Users className="h-3 w-3" />;

  const modeLabel = (mode: string) => mode === "chatroom" || mode === "free" ? "Free Mode" : "Council";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
    >
      <Card className="border-border/50 overflow-hidden">
        <div className="p-3 border-b border-border/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg gradient-primary flex items-center justify-center">
              <ImageIcon className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-display">Forge Gallery</h3>
              <p className="text-[10px] text-muted-foreground">
                {items.length} saved image{items.length !== 1 ? "s" : ""} — auto-saved from all sessions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {items.length > 0 && (
              <Button size="sm" variant="ghost" onClick={handleClearAll} className="text-xs text-destructive h-7">
                <Trash2 className="h-3 w-3 mr-1" /> Clear All
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={onClose} className="h-7 w-7 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Lightbox preview */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="border-b border-border/30"
            >
              <div className="relative">
                <img
                  src={selected.image}
                  alt="Gallery preview"
                  className="w-full max-h-[400px] object-contain bg-black/5 dark:bg-white/5"
                />
                <div className="absolute top-2 right-2 flex gap-1.5">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleDownload(selected)}
                    className="h-7 text-xs backdrop-blur bg-background/80"
                  >
                    <Download className="h-3 w-3 mr-1" /> Save
                  </Button>
                  {onSelect && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => { onSelect(selected); onClose(); }}
                      className="h-7 text-xs backdrop-blur bg-background/80"
                    >
                      Use This
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setSelected(null)}
                    className="h-7 w-7 p-0 backdrop-blur bg-background/80"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="absolute bottom-2 left-2">
                  <Badge variant="secondary" className="backdrop-blur bg-background/80 text-[10px] gap-1">
                    {modeIcon(selected.mode)} {modeLabel(selected.mode)}
                    {selected.characterName && ` · ${selected.characterName}`}
                  </Badge>
                </div>
              </div>
              {selected.prompt && (
                <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/30">
                  <span className="font-bold text-foreground">Prompt:</span> {selected.prompt}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <CardContent className="p-3">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
              Loading gallery...
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm gap-2">
              <ImageIcon className="h-8 w-8 opacity-40" />
              <p>No images saved yet</p>
              <p className="text-xs">Images are auto-saved every time you generate</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {items.map(item => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => setSelected(item)}
                  className={`
                    relative group cursor-pointer rounded-lg overflow-hidden border-2 aspect-square
                    transition-colors
                    ${selected?.id === item.id ? "border-primary" : "border-transparent hover:border-border"}
                  `}
                >
                  <img
                    src={item.image}
                    alt={item.prompt || "Forge image"}
                    className="w-full h-full object-cover"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end">
                    <div className="w-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-[8px] px-1 py-0 bg-background/80">
                          {modeLabel(item.mode)}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => handleDelete(item.id, e)}
                          className="h-5 w-5 p-0 text-white hover:text-destructive hover:bg-transparent"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Time badge */}
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Badge variant="secondary" className="text-[7px] px-1 py-0 bg-background/80 gap-0.5">
                      <Clock className="h-2 w-2" />
                      {formatDistanceToNow(new Date(item.created_at), { addSuffix: false })}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
