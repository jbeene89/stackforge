import { useState } from "react";
import { ExportToDialog } from "@/components/ExportToDialog";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Search, Star, ShoppingCart, CheckCircle2, X, Plus,
  ArrowRight, ChevronRight, Download, Workflow,
  Database, GitBranch, Gauge, Clock, Shield, Zap,
  FileInput, FileOutput, RefreshCw, Filter, Combine,
  SplitSquareHorizontal, BarChart3, Eye
} from "lucide-react";

interface Pipeline {
  id: string;
  name: string;
  description: string;
  category: "etl" | "streaming" | "ml-ops" | "data-quality" | "orchestration" | "integration";
  nodes: { name: string; type: "source" | "transform" | "sink" | "branch" | "validate" }[];
  throughput: string;
  latency: string;
  scalability: string;
  connectors: string[];
  formats: string[];
  tags: string[];
  rating: number;
  deployments: number;
  license: string;
  features: string[];
}

const pipelineCatalog: Pipeline[] = [
  {
    id: "p-01", name: "Lakehouse ETL Pipeline", description: "Production-grade ETL from raw data lakes into curated Delta/Iceberg tables. Handles schema evolution, deduplication, SCD Type-2, and incremental processing with exactly-once semantics.",
    category: "etl", throughput: "2.4M rows/sec", latency: "Sub-minute batch", scalability: "Petabyte-scale",
    nodes: [
      { name: "S3/GCS Ingest", type: "source" }, { name: "Schema Validator", type: "validate" },
      { name: "Dedup Engine", type: "transform" }, { name: "SCD-2 Merge", type: "transform" },
      { name: "Delta Lake Write", type: "sink" }
    ],
    connectors: ["S3", "GCS", "Azure Blob", "Kafka", "PostgreSQL", "Snowflake"],
    formats: ["Parquet", "Avro", "JSON", "CSV", "Delta", "Iceberg"],
    tags: ["lakehouse", "delta", "incremental", "scd"], rating: 4.9, deployments: 12400, license: "Apache 2.0",
    features: ["Schema evolution handling", "Exactly-once processing", "Time-travel queries", "Automatic compaction", "Partition pruning"]
  },
  {
    id: "p-02", name: "Real-Time Event Processor", description: "Low-latency streaming pipeline for event-driven architectures. Windowed aggregations, CEP pattern matching, stateful processing with RocksDB state backend.",
    category: "streaming", throughput: "1.2M events/sec", latency: "<100ms p99", scalability: "Horizontal auto-scale",
    nodes: [
      { name: "Kafka Consumer", type: "source" }, { name: "Event Router", type: "branch" },
      { name: "Window Aggregator", type: "transform" }, { name: "Pattern Matcher (CEP)", type: "transform" },
      { name: "Alert Dispatcher", type: "sink" }, { name: "TimescaleDB Sink", type: "sink" }
    ],
    connectors: ["Kafka", "Pulsar", "Kinesis", "Redis Streams", "WebSocket"],
    formats: ["Avro", "Protobuf", "JSON", "MessagePack"],
    tags: ["streaming", "cep", "real-time", "windowing"], rating: 4.8, deployments: 8900, license: "Apache 2.0",
    features: ["Tumbling/sliding/session windows", "Exactly-once state", "Watermark handling", "Dead letter queue", "Backpressure management"]
  },
  {
    id: "p-03", name: "ML Feature Store Pipeline", description: "End-to-end feature engineering pipeline that computes, stores, and serves features for ML models. Point-in-time correct joins prevent data leakage.",
    category: "ml-ops", throughput: "500K features/sec", latency: "<10ms serving", scalability: "Multi-TB feature storage",
    nodes: [
      { name: "Raw Data Source", type: "source" }, { name: "Feature Transform", type: "transform" },
      { name: "PIT Join Engine", type: "transform" }, { name: "Online Store (Redis)", type: "sink" },
      { name: "Offline Store (Parquet)", type: "sink" }
    ],
    connectors: ["PostgreSQL", "BigQuery", "Snowflake", "Redis", "DynamoDB", "S3"],
    formats: ["Parquet", "Arrow", "Protobuf", "JSON"],
    tags: ["features", "ml", "serving", "training"], rating: 4.7, deployments: 5600, license: "Apache 2.0",
    features: ["Point-in-time correctness", "Feature versioning", "Online/offline sync", "Feature monitoring", "Drift detection"]
  },
  {
    id: "p-04", name: "Data Quality Gate", description: "Automated data quality validation pipeline with statistical profiling, anomaly detection, and schema contract enforcement. Blocks bad data from propagating.",
    category: "data-quality", throughput: "800K rows/sec validation", latency: "2-5s per table scan", scalability: "Distributed validation",
    nodes: [
      { name: "Table Scanner", type: "source" }, { name: "Schema Contract Check", type: "validate" },
      { name: "Statistical Profiler", type: "transform" }, { name: "Anomaly Detector", type: "validate" },
      { name: "Quality Report Sink", type: "sink" }, { name: "Alert/Block Gate", type: "branch" }
    ],
    connectors: ["Any SQL DB", "Spark Tables", "Parquet/Delta files", "BigQuery", "Redshift"],
    formats: ["Any tabular format"],
    tags: ["quality", "testing", "profiling", "contracts"], rating: 4.8, deployments: 7200, license: "Apache 2.0",
    features: ["Custom expectation rules", "Statistical anomaly detection", "Schema contract enforcement", "Trend monitoring", "Slack/PagerDuty alerts"]
  },
  {
    id: "p-05", name: "Multi-Cloud Sync Orchestrator", description: "DAG-based orchestration for complex multi-step, multi-cloud data workflows. Handles dependencies, retries, SLA monitoring, and cross-cloud data movement.",
    category: "orchestration", throughput: "10K+ DAG runs/day", latency: "Task scheduling <1s", scalability: "Distributed executor pool",
    nodes: [
      { name: "Schedule Trigger", type: "source" }, { name: "Dependency Resolver", type: "branch" },
      { name: "Task Executor Pool", type: "transform" }, { name: "SLA Monitor", type: "validate" },
      { name: "Completion Notifier", type: "sink" }
    ],
    connectors: ["AWS", "GCP", "Azure", "Kubernetes", "Airflow", "Databricks"],
    formats: ["DAG YAML", "Python DSL", "JSON Config"],
    tags: ["orchestration", "dag", "scheduling", "multi-cloud"], rating: 4.6, deployments: 15800, license: "Apache 2.0",
    features: ["Dynamic DAG generation", "Cross-cloud triggers", "SLA breach alerts", "Resource-aware scheduling", "Audit logging"]
  },
  {
    id: "p-06", name: "CDC Replication Pipeline", description: "Change Data Capture pipeline for real-time database replication. Captures row-level changes from source DBs via WAL/binlog and applies to targets with ordering guarantees.",
    category: "integration", throughput: "200K changes/sec", latency: "<500ms replication lag", scalability: "Multi-source fan-in",
    nodes: [
      { name: "WAL/Binlog Reader", type: "source" }, { name: "Change Deserializer", type: "transform" },
      { name: "Schema Mapper", type: "transform" }, { name: "Conflict Resolver", type: "branch" },
      { name: "Target DB Applier", type: "sink" }
    ],
    connectors: ["PostgreSQL", "MySQL", "MongoDB", "Oracle", "SQL Server", "Kafka"],
    formats: ["Debezium JSON", "Avro", "Protobuf"],
    tags: ["cdc", "replication", "sync", "migration"], rating: 4.7, deployments: 9300, license: "Apache 2.0",
    features: ["Exactly-once delivery", "Schema migration tracking", "Conflict resolution strategies", "Point-in-time recovery", "Multi-target fan-out"]
  },
  {
    id: "p-07", name: "LLM Data Prep Pipeline", description: "Specialized pipeline for preparing training data for language models. Web crawl dedup, quality filtering (perplexity/toxicity), tokenization, and sharded TFRecord output.",
    category: "ml-ops", throughput: "50TB/day processing", latency: "Batch (hours)", scalability: "1000+ node Spark",
    nodes: [
      { name: "Crawl Archive Ingest", type: "source" }, { name: "Language Detector", type: "branch" },
      { name: "MinHash Dedup", type: "transform" }, { name: "Quality Filter (PPL)", type: "validate" },
      { name: "Toxicity Classifier", type: "validate" }, { name: "Tokenizer + Shard", type: "sink" }
    ],
    connectors: ["CommonCrawl", "S3", "HDFS", "HuggingFace Hub"],
    formats: ["WARC", "JSON", "Parquet", "TFRecord", "Arrow"],
    tags: ["llm", "training-data", "dedup", "filtering"], rating: 4.9, deployments: 3200, license: "MIT",
    features: ["MinHash deduplication", "Perplexity-based filtering", "PII redaction", "Multi-language routing", "Contamination detection"]
  },
  {
    id: "p-08", name: "IoT Telemetry Ingestor", description: "High-throughput ingestion pipeline for IoT/sensor data. Protocol normalization (MQTT/CoAP/HTTP), edge aggregation, downsampling, and time-series storage.",
    category: "streaming", throughput: "5M msgs/sec", latency: "<50ms ingest", scalability: "Edge-to-cloud",
    nodes: [
      { name: "Protocol Gateway", type: "source" }, { name: "Device Registry Lookup", type: "transform" },
      { name: "Edge Aggregator", type: "transform" }, { name: "Anomaly Detector", type: "validate" },
      { name: "TimescaleDB/InfluxDB", type: "sink" }
    ],
    connectors: ["MQTT", "CoAP", "HTTP", "Kafka", "InfluxDB", "TimescaleDB"],
    formats: ["SenML", "Protobuf", "CBOR", "JSON"],
    tags: ["iot", "telemetry", "edge", "timeseries"], rating: 4.5, deployments: 6700, license: "Apache 2.0",
    features: ["Protocol auto-detection", "Edge pre-aggregation", "Device shadow state", "Configurable downsampling", "OTA config push"]
  },
];

const categoryLabels: Record<string, string> = {
  etl: "ETL / Batch", streaming: "Streaming", "ml-ops": "ML Ops", "data-quality": "Data Quality",
  orchestration: "Orchestration", integration: "Integration",
};

const nodeColors: Record<string, string> = {
  source: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  transform: "bg-primary/10 text-primary border-primary/30",
  sink: "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30",
  branch: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
  validate: "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30",
};

export default function DataPipelinesPage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [cart, setCart] = useState<string[]>([]);
  const [selected, setSelected] = useState<Pipeline | null>(null);

  const filtered = pipelineCatalog.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()) || p.tags.some(t => t.includes(search.toLowerCase()));
    const matchTab = activeTab === "all" || p.category === activeTab;
    return matchSearch && matchTab;
  });

  const toggleCart = (id: string) => {
    setCart(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const p = pipelineCatalog.find(x => x.id === id);
    if (p && !cart.includes(id)) toast.success(`${p.name} added to workspace`);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-6 pb-0 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Data Pipelines</h1>
              <p className="text-sm text-muted-foreground">{pipelineCatalog.length} battle-tested pipeline templates for every data workflow</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1"><ShoppingCart className="h-3 w-3" />{cart.length}</Badge>
              {cart.length > 0 && (
                <Button size="sm" onClick={() => { toast.success(`${cart.length} pipelines deployed`); setCart([]); }}>
                  <Download className="h-3 w-3 mr-1" /> Deploy All
                </Button>
              )}
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search pipelines, connectors, tags…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col p-6 pt-4">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0 justify-start">
            <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">All</TabsTrigger>
            {Object.entries(categoryLabels).map(([k, v]) => (
              <TabsTrigger key={k} value={k} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs">{v}</TabsTrigger>
            ))}
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <AnimatePresence mode="popLayout">
                {filtered.map(p => {
                  const inCart = cart.includes(p.id);
                  return (
                    <motion.div key={p.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                      className={cn("border rounded-lg p-4 cursor-pointer transition-colors hover:bg-accent/10", selected?.id === p.id && "ring-2 ring-primary")}
                      onClick={() => setSelected(p)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm">{p.name}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{p.description}</p>
                          {/* Mini pipeline viz */}
                          <div className="flex items-center gap-1 mt-3 overflow-x-auto">
                            {p.nodes.map((n, i) => (
                              <div key={i} className="flex items-center gap-1 shrink-0">
                                <span className={cn("text-[9px] px-1.5 py-0.5 rounded border font-medium", nodeColors[n.type])}>{n.name}</span>
                                {i < p.nodes.length - 1 && <ArrowRight className="h-2.5 w-2.5 text-muted-foreground shrink-0" />}
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Gauge className="h-2.5 w-2.5" />{p.throughput}</span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{p.latency}</span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Star className="h-2.5 w-2.5 fill-current text-yellow-500" />{p.rating}</span>
                          </div>
                        </div>
                        <Button size="icon" variant={inCart ? "default" : "outline"} className="h-7 w-7 shrink-0" onClick={e => { e.stopPropagation(); toggleCart(p.id); }}>
                          {inCart ? <CheckCircle2 className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </Tabs>
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 400, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="border-l bg-card overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold">{selected.name}</h2>
                    <Badge className="mt-1">{categoryLabels[selected.category]}</Badge>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => setSelected(null)}><X className="h-4 w-4" /></Button>
                </div>
                <p className="text-sm text-muted-foreground">{selected.description}</p>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { l: "Throughput", v: selected.throughput },
                    { l: "Latency", v: selected.latency },
                    { l: "Scalability", v: selected.scalability },
                    { l: "License", v: selected.license },
                  ].map(({ l, v }) => (
                    <div key={l} className="p-2 rounded-md bg-muted/50">
                      <div className="text-[10px] text-muted-foreground">{l}</div>
                      <div className="text-xs font-medium mt-0.5">{v}</div>
                    </div>
                  ))}
                </div>

                <Separator />
                <div>
                  <h4 className="text-xs font-semibold mb-2">Pipeline Flow</h4>
                  <div className="space-y-1.5">
                    {selected.nodes.map((n, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className={cn("text-[10px] px-2 py-1 rounded border font-medium min-w-[100px]", nodeColors[n.type])}>{n.name}</span>
                        <Badge variant="outline" className="text-[9px]">{n.type}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />
                <div>
                  <h4 className="text-xs font-semibold mb-2">Connectors</h4>
                  <div className="flex flex-wrap gap-1">{selected.connectors.map(c => <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>)}</div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold mb-2">Data Formats</h4>
                  <div className="flex flex-wrap gap-1">{selected.formats.map(f => <Badge key={f} variant="secondary" className="text-[10px]">{f}</Badge>)}</div>
                </div>

                <Separator />
                <div>
                  <h4 className="text-xs font-semibold mb-2">Features</h4>
                  <ul className="space-y-1">{selected.features.map(f => (
                    <li key={f} className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-primary shrink-0" />{f}</li>
                  ))}</ul>
                </div>

                <Separator />
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => toggleCart(selected.id)}>
                    {cart.includes(selected.id) ? <><CheckCircle2 className="h-3 w-3 mr-1" />In Workspace</> : <><Plus className="h-3 w-3 mr-1" />Add to Workspace</>}
                  </Button>
                  <Button variant="outline" onClick={() => toast.info("Pipeline documentation opened")}>
                    <Eye className="h-3 w-3 mr-1" /> Docs
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
