import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useParams, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useProject, useUpdateProject, useDeleteProject, useRuns, useProjectMessages, useAddProjectMessage, useClearProjectMessages } from "@/hooks/useSupabaseData";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import {
  Send, FolderTree, Eye, Database, Settings, Activity,
  Smartphone, Trash2, Save, CheckCircle2, MessageSquare, Loader2
} from "lucide-react";
import DiscussionThread from "@/components/DiscussionThread";
import ChatHistory from "@/components/ChatHistory";
import PublishToMarketplace from "@/components/PublishToMarketplace";
import { cn } from "@/lib/utils";

export default function ProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: project, isLoading } = useProject(id || "");
  const { data: runs } = useRuns();
  const { data: chatMessages, isLoading: chatLoading } = useProjectMessages(id || "");
  const addMessage = useAddProjectMessage();
  const clearMessages = useClearProjectMessages();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const [prompt, setPrompt] = useState("");
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [streamProgress, setStreamProgress] = useState(0);

  if (isLoading) {
    return <div className="p-6 space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-64 w-full rounded-xl" /></div>;
  }

  if (!project) {
    return <div className="p-6 text-muted-foreground">Project not found.</div>;
  }

  if (!initialized) {
    setEditName(project.name);
    setEditDesc(project.description || "");
    setInitialized(true);
  }

  const projectRuns = runs?.filter(r => r.target_id === project.id) || [];
  const isAndroid = project.type === "android";

  const handleSave = () => {
    updateProject.mutate({ id: project.id, name: editName, description: editDesc });
  };

  const handleDelete = () => {
    deleteProject.mutate(project.id, { onSuccess: () => navigate("/projects") });
  };

  const handleSendPrompt = async () => {
    if (!prompt.trim() || isProcessing) return;
    setIsProcessing(true);
    setStreamProgress(0);
    setPreviewContent("");
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`${supabaseUrl}/functions/v1/ai-generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token || supabaseKey}`,
          "apikey": supabaseKey,
        },
        body: JSON.stringify({
          messages: [
            { role: "user", content: `For a ${project.type} project called "${project.name}": ${prompt}` },
          ],
          mode: "code",
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || `Error ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let fullText = "";
      let chunksReceived = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunksReceived++;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const json = JSON.parse(line.slice(6));
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                fullText += content;
                setPreviewContent(fullText);
              }
            } catch { /* skip */ }
          }
        }

        // Progress: ramp up quickly at first, then slow down asymptotically toward 95%
        const progress = Math.min(95, 100 * (1 - Math.exp(-chunksReceived / 8)));
        setStreamProgress(Math.round(progress));
      }

      setStreamProgress(100);
      const userContent = prompt;
      const aiContent = fullText || "Prompt received! Your project has been updated.";
      if (!fullText) setPreviewContent(aiContent);
      
      // Save both messages to chat history
      addMessage.mutate({ project_id: project.id, role: "user", content: userContent });
      addMessage.mutate({ project_id: project.id, role: "assistant", content: aiContent });
      
      toast.success("Prompt processed successfully");
      setPrompt("");
    } catch (e: any) {
      toast.error(e.message || "Failed to process prompt");
      setStreamProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeploy = () => {
    updateProject.mutate(
      { id: project.id, status: "deployed" },
      {
        onSuccess: () => toast.success(`${project.name} marked as deployed!`),
        onError: () => toast.error("Failed to deploy"),
      }
    );
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          {isAndroid ? <Smartphone className="h-5 w-5 text-forge-emerald" /> : <FolderTree className="h-5 w-5 text-primary" />}
          <h1 className="text-lg font-bold">{project.name}</h1>
          <Badge variant="secondary" className="text-[10px]">{project.type}</Badge>
          <Badge variant="outline" className="text-[10px]">{project.status}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">v{project.version_count}</span>
          <PublishToMarketplace
            type="project"
            sourceId={project.id}
            sourceName={project.name}
            templateData={{ name: project.name, description: project.description, type: project.type, tags: project.tags }}
          />
          <Button size="sm" className="gradient-primary text-primary-foreground" onClick={handleDeploy} disabled={updateProject.isPending}>
            {updateProject.isPending ? "Deploying…" : "Deploy"}
          </Button>
        </div>
        {isProcessing && (
          <div className="mt-2 flex items-center gap-3">
            <Progress value={streamProgress} className="h-2 flex-1" />
            <span className="text-xs text-muted-foreground w-10 text-right">{streamProgress}%</span>
          </div>
        )}
      </div>

      {/* Prompt bar */}
      <div className="px-6 py-3 border-b border-border">
        <div className="flex gap-2">
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={isAndroid ? "Describe the screen or feature you want to build..." : "Describe what you want to build or change..."}
            className="h-9 text-sm"
            onKeyDown={(e) => { if (e.key === "Enter") handleSendPrompt(); }}
          />
          <Button size="sm" className="gradient-primary text-primary-foreground px-4" onClick={handleSendPrompt} disabled={isProcessing || !prompt.trim()}>
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Workspace */}
      <Tabs defaultValue="preview" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-6 mt-2 glass w-fit">
          <TabsTrigger value="preview"><Eye className="h-3 w-3 mr-1" /> Preview</TabsTrigger>
          <TabsTrigger value="runs"><Activity className="h-3 w-3 mr-1" /> Runs ({projectRuns.length})</TabsTrigger>
          <TabsTrigger value="chat"><MessageSquare className="h-3 w-3 mr-1" /> Chat ({chatMessages?.length || 0})</TabsTrigger>
          <TabsTrigger value="discussion"><MessageSquare className="h-3 w-3 mr-1" /> Discussion</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="h-3 w-3 mr-1" /> Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="flex-1 m-0 mt-2 px-6 pb-4">
          <div className="glass rounded-xl h-full flex items-center justify-center overflow-auto">
            <div className="text-center space-y-2 w-full max-w-2xl p-4">
              <div className="glass-strong rounded-xl p-8 mx-auto">
                <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-forge-rose" />
                  <div className="w-2.5 h-2.5 rounded-full bg-forge-amber" />
                  <div className="w-2.5 h-2.5 rounded-full bg-forge-emerald" />
                  <span className="text-[10px] text-muted-foreground ml-2">{project.name}</span>
                </div>
                <div className="text-left space-y-3">
                  {previewContent ? (
                    <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">{previewContent}</pre>
                  ) : (
                    <p className="text-sm text-muted-foreground">{project.description || "No description yet."}</p>
                  )}
                  <div className="flex gap-1.5 flex-wrap">
                    {(project.tags || []).map((t) => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {previewContent ? "AI-generated response shown above" : "Use the prompt bar above to iterate on this project"}
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="runs" className="flex-1 m-0 mt-2 px-6 pb-4">
          {projectRuns.length === 0 ? (
            <div className="glass rounded-xl p-6 flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center space-y-2">
                <Activity className="h-8 w-8 mx-auto opacity-40" />
                <p className="text-sm">No runs yet</p>
                <p className="text-[10px]">Deploy or test your project to see execution logs here</p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="space-y-2">
                {projectRuns.map((run) => (
                  <div key={run.id} className="glass rounded-lg px-4 py-3 flex items-center gap-3">
                    <CheckCircle2 className={cn("h-4 w-4", run.status === "success" ? "text-forge-emerald" : "text-destructive")} />
                    <div className="flex-1">
                      <span className="text-sm font-medium">{run.target_name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{(run.total_duration_ms / 1000).toFixed(1)}s</span>
                    </div>
                    <Badge variant="outline" className="text-[10px]">{run.status}</Badge>
                    <span className="text-[10px] text-muted-foreground">{new Date(run.started_at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="chat" className="flex-1 m-0 mt-2 px-6 pb-4 overflow-hidden">
          <div className="glass rounded-xl p-4 h-full overflow-hidden flex flex-col">
            <ChatHistory
              messages={chatMessages || []}
              isLoading={chatLoading}
              onClear={() => clearMessages.mutate(project.id)}
            />
          </div>
        </TabsContent>

        <TabsContent value="discussion" className="flex-1 m-0 mt-2 px-6 pb-4">
          <div className="max-w-2xl">
            <DiscussionThread targetType="project" targetId={project.id} targetName={project.name} />
          </div>
        </TabsContent>

        <TabsContent value="settings" className="flex-1 m-0 mt-2 px-6 pb-4">
          <div className="glass rounded-xl p-6 max-w-2xl space-y-4">
            <h2 className="font-semibold">Project Settings</h2>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Project Name</label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Description</label>
                <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="h-8 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Tags</label>
                <div className="flex gap-1.5 flex-wrap">
                  {(project.tags || []).map((t) => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
                  {!(project.tags || []).length && <span className="text-xs text-muted-foreground">No tags</span>}
                </div>
              </div>
            </div>
            <Separator />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={updateProject.isPending}>
                <Save className="h-3 w-3 mr-1" /> {updateProject.isPending ? "Saving…" : "Save Changes"}
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="h-3 w-3 mr-1" /> Delete Project
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
