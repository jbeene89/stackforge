import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useProjects, useDeleteProject } from "@/hooks/useSupabaseData";
import { mockProjects } from "@/data/mock-data";

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { data: dbProjects, isLoading } = useProjects();
  const deleteProject = useDeleteProject();

  const projects = dbProjects && dbProjects.length > 0 ? dbProjects : mockProjects.map(p => ({
    ...p, version_count: p.versionCount, updated_at: p.updatedAt,
  }));

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">All Projects</h1>
          <p className="text-sm text-muted-foreground">{projects.length} projects</p>
        </div>
        <Button className="gradient-primary text-primary-foreground" onClick={() => navigate("/onboarding")}>
          <Plus className="h-4 w-4 mr-2" /> New Project
        </Button>
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
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
            ) : projects.map((p: any) => (
              <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/30">
                <td className="p-3"><Link to={`/projects/${p.id}`} className="font-medium hover:text-primary transition-colors">{p.name}</Link></td>
                <td className="p-3"><Badge variant="outline" className="text-[10px] capitalize">{p.type}</Badge></td>
                <td className="p-3"><Badge variant="secondary" className="text-[10px] capitalize">{p.status}</Badge></td>
                <td className="p-3 text-muted-foreground">v{p.version_count || p.versionCount || 1}</td>
                <td className="p-3 text-muted-foreground">{new Date(p.updated_at || p.updatedAt).toLocaleDateString()}</td>
                <td className="p-3">
                  {dbProjects && dbProjects.length > 0 && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteProject.mutate(p.id)}>
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
