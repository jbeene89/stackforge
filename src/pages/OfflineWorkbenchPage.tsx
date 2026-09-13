import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Boxes, Database, HardDriveDownload, Layers3, ShieldCheck, Wifi, WifiOff, Wrench } from "lucide-react";
import { toast } from "sonner";
import { SEOHead } from "@/components/SEOHead";
import { LocalTrainingNotebook } from "@/components/native/LocalTrainingNotebook";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cacheDelete, cacheGetAll, cachePut } from "@/lib/offlineCache";
import { isNativeApp } from "@/lib/native-navigation";

// Recovered from OfflineWorkbenchPage-DoM6JGVd.js in APK 10001.
// Demo writes remain local cache operations. They never enter the sync queue.
const DEMO_PREFIX = "offline-demo";
const LOCAL_USER_ID = "offline-local-user";
const STORES = [
  { key: "projects", label: "Projects", singular: "project", icon: Boxes },
  { key: "modules", label: "Modules", singular: "module", icon: Wrench },
  { key: "stacks", label: "Stacks", singular: "stack", icon: Layers3 },
  { key: "training_datasets", label: "Datasets", singular: "dataset", icon: Database },
  { key: "training_jobs", label: "Training jobs", singular: "job", icon: ShieldCheck },
] as const;

type WorkbenchStore = (typeof STORES)[number]["key"];
interface CachedRecord {
  id: string;
  user_id?: string;
  name: string;
  updated_at?: string;
  status?: string;
  type?: string;
  sample_count?: number;
}
type Snapshot = Record<WorkbenchStore, CachedRecord[]>;

const EMPTY_SNAPSHOT: Snapshot = {
  projects: [], modules: [], stacks: [], training_datasets: [], training_jobs: [],
};

function newestFirst<T extends { updated_at?: string }>(records: T[]): T[] {
  return [...records].sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""));
}

function demoId(kind: string): string {
  return `${DEMO_PREFIX}-${kind}-${crypto.randomUUID()}`;
}

function isDemoRecord(record: CachedRecord): boolean {
  return typeof record.id === "string" && record.id.startsWith(`${DEMO_PREFIX}-`) && record.user_id === LOCAL_USER_ID;
}

async function readSnapshot(): Promise<Snapshot> {
  const [projects, modules, stacks, datasets, jobs] = await Promise.all([
    cacheGetAll<CachedRecord>("projects"),
    cacheGetAll<CachedRecord>("modules"),
    cacheGetAll<CachedRecord>("stacks"),
    cacheGetAll<CachedRecord>("training_datasets"),
    cacheGetAll<CachedRecord>("training_jobs"),
  ]);
  return {
    // This route is public: signed-in users' caches must never be displayed here.
    projects: newestFirst(projects.filter(isDemoRecord)), modules: newestFirst(modules.filter(isDemoRecord)), stacks: newestFirst(stacks.filter(isDemoRecord)),
    training_datasets: newestFirst(datasets.filter(isDemoRecord)), training_jobs: newestFirst(jobs.filter(isDemoRecord)),
  };
}

export default function OfflineWorkbenchPage() {
  const [snapshot, setSnapshot] = useState<Snapshot>(EMPTY_SNAPSHOT);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [installed, setInstalled] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => setSnapshot(await readSnapshot()), []);

  useEffect(() => {
    setInstalled(isNativeApp() || window.matchMedia("(display-mode: standalone)").matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true);
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    refresh().catch((error) => {
      console.error("[OfflineWorkbench] Failed to load snapshot", error);
      toast.error("Could not read offline workspace");
    });
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [refresh]);

  async function runAction(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
      await refresh();
    } catch (error) {
      console.error("[OfflineWorkbench] Action failed", error);
      toast.error("That offline action did not finish cleanly");
    } finally {
      setBusy(false);
    }
  }

  function seedWorkspace() {
    return runAction(async () => {
      const now = new Date().toISOString();
      const common = { user_id: LOCAL_USER_ID, created_at: now, updated_at: now };
      const projectId = demoId("project");
      const moduleId = demoId("module");
      const stackId = demoId("stack");
      const datasetId = demoId("dataset");
      const jobId = demoId("job");
      await Promise.all([
        cachePut("projects", {
          ...common, id: projectId, name: "Field Ops Android Pilot",
          description: "Offline-first inspection app with local queueing and photo-ready workflows.",
          type: "android", status: "testing", tags: ["offline", "android", "demo"], version_count: 1,
        }),
        cachePut("modules", {
          ...common, id: moduleId, name: "Offline Incident Triage",
          role: "Summarizes field notes without a live connection", type: "specialist",
          system_prompt: "Turn field notes into a short action plan.",
          goal: "Help testers validate the app while fully offline.",
        }),
        cachePut("stacks", {
          ...common, id: stackId, name: "Capture -> Review -> Sync",
          description: "A local-first flow for field capture and later reconciliation.",
          nodes: [], edges: [], tags: ["offline", "sync"], version_count: 1,
        }),
        cachePut("training_datasets", {
          ...common, id: datasetId, name: "Site Safety Notes",
          description: "Practice dataset for offline QA and tagging.", domain: "operations", format: "instruction", sample_count: 12, status: "draft",
        }),
        cachePut("training_jobs", {
          ...common, id: jobId, dataset_id: datasetId, name: "Tiny Local Classifier", base_model: "phi-3-mini", method: "lora",
          hyperparameters: { epochs: 3, batch_size: 4, learning_rate: 0.0002 }, status: "paused", metrics: { note: "Offline demo job" },
        }),
      ]);
      toast.success("Offline workspace seeded");
    });
  }

  function addLocal(store: WorkbenchStore) {
    return runAction(async () => {
      const now = new Date().toISOString();
      const common = { user_id: LOCAL_USER_ID, created_at: now, updated_at: now };
      const nextNumber = snapshot[store].length + 1;
      switch (store) {
        case "projects":
          await cachePut(store, {
            ...common, id: demoId("project"), name: `Offline Project ${nextNumber}`,
            description: "Created locally from the offline workbench.", type: "android", status: "draft", tags: ["offline", "quick-add"], version_count: 1,
          });
          break;
        case "modules":
          await cachePut(store, {
            ...common, id: demoId("module"), name: `Local Module ${nextNumber}`, role: "Offline helper", type: "specialist",
            system_prompt: "Stay local, concise, and useful.", goal: "Validate that module records survive airplane mode.",
          });
          break;
        case "stacks":
          await cachePut(store, {
            ...common, id: demoId("stack"), name: `Edge Stack ${nextNumber}`, description: "A local orchestration stub for testing.",
            nodes: [], edges: [], tags: ["offline"], version_count: 1,
          });
          break;
        case "training_datasets":
          await cachePut(store, {
            ...common, id: demoId("dataset"), name: `Offline Dataset ${nextNumber}`, description: "Local-only dataset for smoke testing.",
            domain: "general", format: "instruction", sample_count: 0, status: "draft",
          });
          break;
        case "training_jobs":
          await cachePut(store, {
            ...common, id: demoId("job"), dataset_id: snapshot.training_datasets[0]?.id || demoId("dataset-link"),
            name: `Offline Job ${nextNumber}`, base_model: "phi-3-mini", method: "lora",
            hyperparameters: { epochs: 1, batch_size: 2 }, status: "draft", metrics: {},
          });
          break;
      }
      toast.success("Saved locally to IndexedDB");
    });
  }

  function clearDemoWorkspace() {
    return runAction(async () => {
      await Promise.all(STORES.map(async ({ key }) => {
        const records = await cacheGetAll<CachedRecord>(key);
        await Promise.all(records.filter(isDemoRecord).map((record) => cacheDelete(key, record.id)));
      }));
      toast.success("Offline demo data cleared");
    });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead title="Offline Workbench" description="Write and export your own training examples on this device, even without a connection." />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Button variant="ghost" asChild><Link to="/launchpad"><ArrowLeft className="mr-2 h-4 w-4" />Launchpad</Link></Button>
          <Badge variant="outline" className="gap-2">{offline ? <WifiOff className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}{offline ? "Offline" : "Online"}</Badge>
        </div>
        <LocalTrainingNotebook />
        <details className="rounded-2xl border border-border/60 bg-card/50 p-4 sm:p-6">
          <summary className="cursor-pointer text-base font-semibold">Offline storage check</summary>
          <div className="mt-6 flex flex-col gap-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-card/80 p-6 shadow-[0_30px_120px_rgba(15,23,42,0.16)] backdrop-blur">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(34,197,94,0.14),transparent_28%)]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="gap-1 rounded-full px-3 py-1">{offline ? <WifiOff className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}{offline ? "Offline now" : "Online now"}</Badge>
                <Badge variant="outline" className="rounded-full px-3 py-1">{installed ? "Installed app shell" : "Browser test mode"}</Badge>
                <Badge variant="outline" className="rounded-full px-3 py-1">Demo records only</Badge>
              </div>
              <div><h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Check local storage</h2>
                <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">Add example records, turn on airplane mode, and check that they are still here. These are storage demonstrations; they do not train a model or contain a real dataset.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={seedWorkspace} disabled={busy}>Add demo records</Button>
              <Button variant="outline" onClick={() => runAction(async () => undefined)} disabled={busy}>Refresh snapshot</Button>
              <Button variant="ghost" asChild><Link to="/install">Install guide<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            </div>
          </div>
        </section>
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {STORES.map(({ key, label, singular, icon: Icon }) => (
            <Card key={key} className="border-border/60 bg-card/70">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between"><div className="rounded-2xl border border-border/60 bg-background/70 p-2"><Icon className="h-4 w-4" /></div><Badge variant="outline">{snapshot[key].length}</Badge></div>
                <CardTitle className="text-lg">{key === "training_jobs" ? "Jobs" : label}</CardTitle><CardDescription>Cached locally for offline testing.</CardDescription>
              </CardHeader>
              <CardContent><Button variant="outline" className="w-full" onClick={() => addLocal(key)} disabled={busy}>Add local {singular}</Button></CardContent>
            </Card>
          ))}
        </section>
        <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-border/60 bg-card/70">
            <CardHeader><CardTitle>Demo records at a glance</CardTitle><CardDescription>Only example records created by this storage check are shown here.</CardDescription></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {STORES.map(({ key, label }) => (
                <div key={key} className="rounded-2xl border border-border/60 bg-background/60 p-4">
                  <div className="mb-3 flex items-center justify-between"><p className="text-sm font-medium">{label}</p><Badge variant="secondary">{snapshot[key].length}</Badge></div>
                  <div className="space-y-2">
                    {snapshot[key].slice(0, 3).map((record) => (
                      <div key={record.id} className="rounded-xl border border-border/50 px-3 py-2">
                        <p className="text-sm font-medium">{record.name}</p>
                        {record.status ? <p className="text-xs text-muted-foreground">{record.status}</p> : null}
                        {record.type ? <p className="text-xs text-muted-foreground">{record.type}</p> : null}
                        {typeof record.sample_count === "number" ? <p className="text-xs text-muted-foreground">Example sample count: {record.sample_count} (metadata only)</p> : null}
                      </div>
                    ))}
                    {snapshot[key].length === 0 ? <p className="text-sm text-muted-foreground">No cached records yet. Seed the workspace or create a quick local item.</p> : null}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <div className="grid gap-4">
            <Card className="border-border/60 bg-card/70">
              <CardHeader><CardTitle>How to test</CardTitle><CardDescription>Fastest path to a believable airplane-mode check.</CardDescription></CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>1. Open this workbench. In a browser, first open it online so the page can be cached.</p>
                <p>2. Add a few demo records with the button above.</p>
                <p>3. Turn on airplane mode, relaunch the app, and come back here.</p>
                <p>4. Confirm the cards, counts, and local adds still work without network.</p>
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-card/70">
              <CardHeader><CardTitle>Good offline routes</CardTitle><CardDescription>Pages that remain useful even when the backend is unavailable.</CardDescription></CardHeader>
              <CardContent className="grid gap-3">
                <Button variant="outline" asChild className="justify-between"><Link to="/demo/module-builder">Demo module builder<ArrowRight className="h-4 w-4" /></Link></Button>
                <Button variant="outline" asChild className="justify-between"><Link to="/offline-llm">Offline LLM guide<ArrowRight className="h-4 w-4" /></Link></Button>
                <Button variant="outline" asChild className="justify-between"><Link to="/install">Install and app-shell guide<ArrowRight className="h-4 w-4" /></Link></Button>
                <Button variant="ghost" asChild className="justify-between"><Link to="/login">Return to login<ArrowRight className="h-4 w-4" /></Link></Button>
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-card/70">
              <CardHeader><CardTitle>Cleanup</CardTitle><CardDescription>Removes only records created by this offline workbench.</CardDescription></CardHeader>
              <CardContent className="space-y-3">
                <Button variant="destructive" className="w-full" onClick={clearDemoWorkspace} disabled={busy}>Clear demo workspace</Button>
                <p className="text-xs text-muted-foreground">This only removes storage-check examples. Your notebook and account data are kept.</p>
              </CardContent>
            </Card>
          </div>
        </section>
        <section className="rounded-[1.75rem] border border-border/60 bg-card/60 p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl border border-border/60 bg-background/70 p-2"><HardDriveDownload className="h-4 w-4" /></div>
            <div><p className="text-sm font-medium">Stored on this device</p><p className="mt-1 text-sm text-muted-foreground">These examples stay local and are never sent for training. Account sign-in and cloud generation need a connection.</p></div>
          </div>
        </section>
          </div>
        </details>
      </div>
    </div>
  );
}
