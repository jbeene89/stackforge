import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Download } from "lucide-react";
import {
  useCustomModels,
  useCreateCustomModel,
  useDeleteCustomModel,
  type CustomModel,
} from "@/hooks/useTrainingData";

interface ImportModelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ImportModelDialog({ open, onOpenChange }: ImportModelDialogProps) {
  const { data: models, isLoading } = useCustomModels();
  const createModel = useCreateCustomModel();
  const deleteModel = useDeleteCustomModel();

  const [name, setName] = useState("");
  const [source, setSource] = useState("huggingface");
  const [sourceUrl, setSourceUrl] = useState("");
  const [modelFamily, setModelFamily] = useState("llama");
  const [paramCount, setParamCount] = useState("");
  const [format, setFormat] = useState("safetensors");
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    setName("");
    setSource("huggingface");
    setSourceUrl("");
    setModelFamily("llama");
    setParamCount("");
    setFormat("safetensors");
    setNotes("");
  };

  const handleCreate = () => {
    if (!name.trim()) return;
    createModel.mutate({
      name: name.trim(),
      source,
      source_url: sourceUrl.trim(),
      model_family: modelFamily,
      parameter_count: paramCount.trim(),
      format,
      notes: notes.trim(),
    });
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-[hsl(var(--forge-cyan))]" />
            Import Model
          </DialogTitle>
          <DialogDescription>
            Register a model from HuggingFace, a local path, or a custom URL to use for training.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Existing imported models */}
          {(models ?? []).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Your Imported Models</p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {models!.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-2 rounded-lg border p-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{m.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant="outline" className="text-[9px] h-4">
                          {m.source}
                        </Badge>
                        {m.parameter_count && (
                          <span className="text-[10px] text-muted-foreground">
                            {m.parameter_count}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground">{m.format}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => deleteModel.mutate(m.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Import form */}
          <div className="border-t pt-4 space-y-3">
            <p className="text-xs font-medium">Add New Model</p>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Model Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. my-llama-3.2-1b-finetuned"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Source</label>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="huggingface">HuggingFace</SelectItem>
                    <SelectItem value="local">Local Path</SelectItem>
                    <SelectItem value="url">Custom URL</SelectItem>
                    <SelectItem value="ollama">Ollama</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Model Family</label>
                <Select value={modelFamily} onValueChange={setModelFamily}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="llama">Llama</SelectItem>
                    <SelectItem value="mistral">Mistral</SelectItem>
                    <SelectItem value="phi">Phi</SelectItem>
                    <SelectItem value="qwen">Qwen</SelectItem>
                    <SelectItem value="gemma">Gemma</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">
                {source === "huggingface"
                  ? "HuggingFace Model ID"
                  : source === "local"
                  ? "Local Path"
                  : source === "ollama"
                  ? "Ollama Model Name"
                  : "Download URL"}
              </label>
              <Input
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder={
                  source === "huggingface"
                    ? "meta-llama/Llama-3.2-1B"
                    : source === "local"
                    ? "/models/my-model"
                    : source === "ollama"
                    ? "llama3.2:1b"
                    : "https://..."
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Parameters</label>
                <Input
                  value={paramCount}
                  onChange={(e) => setParamCount(e.target.value)}
                  placeholder="e.g. 1B, 3B, 7B"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Format</label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="safetensors">Safetensors</SelectItem>
                    <SelectItem value="gguf">GGUF</SelectItem>
                    <SelectItem value="ggml">GGML</SelectItem>
                    <SelectItem value="pytorch">PyTorch</SelectItem>
                    <SelectItem value="onnx">ONNX</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Notes (optional)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional info about this model..."
                className="min-h-[60px]"
              />
            </div>

            <Button
              className="w-full"
              onClick={handleCreate}
              disabled={!name.trim() || createModel.isPending}
            >
              {createModel.isPending ? "Importing…" : "Import Model"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
