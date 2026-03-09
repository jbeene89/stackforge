import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Folder, Globe, Smartphone, Brain, Layers } from "lucide-react";
import { useProjects, useDeleteProject } from "@/hooks/useSupabaseData";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { ProjectType } from "@/types";

const typeIcons: Record<string, React.ElementType> = {
  web: Globe, android: Smartphone, module: Brain, stack: Layers, hybrid: Layers,
};

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { data: projects, isLoading } = useProjects();
  const deleteProject = useDeleteProject();

  return (
    <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">All Projects</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{projects?.length || 0} projects</p>
        </div>
        <Button className="gradient-primary text-primary-foreground w-full sm:w-auto" onClick={() => navigate("/onboarding")}>
          <Plus className="h-4 w-4 mr-2" /> New Project
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">Loading…</div>
      ) : !projects?.length ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 text-muted-foreground">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/5 flex items-center justify-center">
            <Folder className="h-8 w-8 opacity-40" />
          </div>
          <p className="text-sm font-medium">No projects yet</p>
          <p className="text-xs text-muted-foreground mt-1">Create your first project.</p>
        </motion.div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="glass rounded-xl overflow-hidden hidden md:block">
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
                {projects.map((p) => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="p-3"><Link to={`/projects/${p.id}`} className="font-medium hover:text-primary transition-colors">{p.name}</Link></td>
                    <td className="p-3"><Badge variant="outline" className="text-[10px] capitalize">{p.type}</Badge></td>
                    <td className="p-3"><Badge variant="secondary" className="text-[10px] capitalize">{p.status}</Badge></td>
                    <td className="p-3 text-muted-foreground">v{p.version_count}</td>
                    <td className="p-3 text-muted-foreground">{new Date(p.updated_at).toLocaleDateString()}</td>
                    <td className="p-3">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteProject.mutate(p.id)}>
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
            {projects.map((p, i) => {
              const Icon = typeIcons[p.type] || Layers;
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link to={`/projects/${p.id}`} className="glass-hover rounded-xl p-4 block">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-sm">{p.name}</span>
                      </div>
                      <Badge variant="secondary" className="text-[10px] capitalize">{p.status}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px] capitalize">{p.type}</Badge>
                      <span>v{p.version_count}</span>
                      <span className="ml-auto">{new Date(p.updated_at).toLocaleDateString()}</span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
