import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { mockProjects } from "@/data/mock-data";

export default function ProjectsPage() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">All Projects</h1>
          <p className="text-sm text-muted-foreground">{mockProjects.length} projects</p>
        </div>
        <Button className="gradient-primary text-primary-foreground"><Plus className="h-4 w-4 mr-2" /> New Project</Button>
      </div>
      <div className="glass rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="p-3">Name</th>
              <th className="p-3">Type</th>
              <th className="p-3">Status</th>
              <th className="p-3">Versions</th>
              <th className="p-3">Updated</th>
            </tr>
          </thead>
          <tbody>
            {mockProjects.map((p) => (
              <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/30">
                <td className="p-3"><Link to={`/projects/${p.id}`} className="font-medium hover:text-primary transition-colors">{p.name}</Link></td>
                <td className="p-3"><Badge variant="outline" className="text-[10px] capitalize">{p.type}</Badge></td>
                <td className="p-3"><Badge variant="secondary" className="text-[10px] capitalize">{p.status}</Badge></td>
                <td className="p-3 text-muted-foreground">v{p.versionCount}</td>
                <td className="p-3 text-muted-foreground">{new Date(p.updatedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
