import { useParams } from "react-router-dom";
import { mockModules } from "@/data/mock-data";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

export default function ModuleBuilderPage() {
  const { id } = useParams();
  const mod = mockModules.find((m) => m.id === id);

  if (!mod) {
    return <div className="p-6 text-muted-foreground">Module not found.</div>;
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{mod.name}</h1>
        <Badge variant="outline">{mod.type}</Badge>
        {mod.slmMode && <Badge className="bg-forge-cyan/15 text-forge-cyan">SLM Mode</Badge>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2"><Label>Name</Label><Input defaultValue={mod.name} /></div>
          <div className="space-y-2"><Label>Role</Label><Input defaultValue={mod.role} /></div>
          <div className="space-y-2"><Label>Goal</Label><Textarea defaultValue={mod.goal} rows={2} /></div>
          <div className="space-y-2"><Label>System Prompt</Label><Textarea defaultValue={mod.systemPrompt} rows={4} className="font-mono text-xs" /></div>
          <div className="space-y-2"><Label>Task Boundaries</Label><Textarea defaultValue={mod.taskBoundaries} rows={2} /></div>
          <div className="space-y-2"><Label>Output Format</Label><Input defaultValue={mod.outputFormat} /></div>
          <div className="space-y-2"><Label>Tone</Label><Input defaultValue={mod.tone} /></div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Temperature: {mod.temperature}</Label>
            <Slider defaultValue={[mod.temperature]} max={1} step={0.05} />
          </div>
          <div className="space-y-2">
            <Label>Max Tokens: {mod.maxTokens}</Label>
            <Slider defaultValue={[mod.maxTokens]} max={4000} step={100} />
          </div>
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <Label>SLM Mode</Label><Switch defaultChecked={mod.slmMode} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Deterministic</Label><Switch defaultChecked={mod.deterministicMode} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Low Context Window</Label><Switch defaultChecked={mod.lowContextWindow} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Concise Output</Label><Switch defaultChecked={mod.conciseOutput} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Memory</Label><Switch defaultChecked={mod.memoryEnabled} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Tool Access</Label><Switch defaultChecked={mod.toolAccessEnabled} />
            </div>
          </div>
          <div className="space-y-2 pt-4">
            <Label>Provider</Label><Input defaultValue={mod.provider} />
          </div>
          <div className="space-y-2">
            <Label>Model</Label><Input defaultValue={mod.model} />
          </div>
        </div>
      </div>
    </div>
  );
}
