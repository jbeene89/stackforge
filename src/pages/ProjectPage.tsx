import { useParams } from "react-router-dom";
import { mockProjects } from "@/data/mock-data";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ProjectPage() {
  const { id } = useParams();
  const project = mockProjects.find((p) => p.id === id);

  if (!project) {
    return <div className="p-6 text-muted-foreground">Project not found.</div>;
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <Badge variant="secondary">{project.type}</Badge>
        <Badge variant="outline">{project.status}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">{project.description}</p>

      <Tabs defaultValue="preview" className="w-full">
        <TabsList className="glass">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="runs">Runs</TabsTrigger>
        </TabsList>
        <TabsContent value="preview" className="mt-6">
          <div className="glass rounded-xl h-96 flex items-center justify-center text-muted-foreground">
            Live preview will render here
          </div>
        </TabsContent>
        <TabsContent value="code" className="mt-6">
          <div className="glass rounded-xl h-96 flex items-center justify-center text-muted-foreground font-mono text-sm">
            Code editor — coming soon
          </div>
        </TabsContent>
        <TabsContent value="components" className="mt-6">
          <div className="glass rounded-xl h-96 flex items-center justify-center text-muted-foreground">
            Component library — coming soon
          </div>
        </TabsContent>
        <TabsContent value="database" className="mt-6">
          <div className="glass rounded-xl h-96 flex items-center justify-center text-muted-foreground">
            Schema builder — coming soon
          </div>
        </TabsContent>
        <TabsContent value="settings" className="mt-6">
          <div className="glass rounded-xl h-96 flex items-center justify-center text-muted-foreground">
            Project settings — coming soon
          </div>
        </TabsContent>
        <TabsContent value="runs" className="mt-6">
          <div className="glass rounded-xl h-96 flex items-center justify-center text-muted-foreground">
            Execution runs — coming soon
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
