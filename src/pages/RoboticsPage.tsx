import { useState } from "react";
import { useFeatureGate } from "@/hooks/useFeatureGate";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { ExportToDialog } from "@/components/ExportToDialog";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Search, Star, ShoppingCart, CheckCircle2, X, Plus,
  Eye, Download, ChevronRight, Gauge, Clock,
  Compass, Move, Target, Crosshair, Cog, Scan,
  Navigation, Route, Joystick, RotateCcw
} from "lucide-react";

interface Controller {
  id: string;
  name: string;
  description: string;
  category: "motion" | "perception" | "planning" | "manipulation" | "locomotion" | "swarm" | "slam" | "control";
  algorithm: string;
  dof: string;
  updateRate: string;
  latency: string;
  hardware: string[];
  interfaces: string[];
  tags: string[];
  rating: number;
  downloads: number;
  license: string;
  capabilities: string[];
}

const controllerCatalog: Controller[] = [
  {
    id: "r-01", name: "MPC Trajectory Controller", description: "Model Predictive Control for robot trajectory tracking. Solves constrained QP at each timestep with receding horizon. Handles actuator limits, obstacle avoidance, and dynamic constraints.",
    category: "control", algorithm: "QP-based MPC (OSQP)", dof: "1–12 DOF", updateRate: "1kHz", latency: "<1ms solve time",
    hardware: ["ARM Cortex", "x86", "GPU (batch)"], interfaces: ["ROS2", "C++ API", "Python bindings"],
    tags: ["mpc", "trajectory", "optimal-control"], rating: 4.9, downloads: 34000, license: "BSD-3",
    capabilities: ["Constraint handling", "Preview trajectory optimization", "Obstacle avoidance integration", "Warm-starting between solves", "Variable horizon length"]
  },
  {
    id: "r-02", name: "Visual-Inertial SLAM", description: "Stereo visual-inertial odometry with loop closure and map optimization. Tightly-coupled IMU preintegration with feature-based visual frontend. Real-time on embedded hardware.",
    category: "slam", algorithm: "Keyframe VO + IMU Preintegration + PGO", dof: "6-DOF pose", updateRate: "30Hz visual / 200Hz IMU", latency: "<33ms per frame",
    hardware: ["Jetson", "RK3588", "x86"], interfaces: ["ROS2", "C++ API"],
    tags: ["vio", "slam", "mapping", "localization"], rating: 4.8, downloads: 56000, license: "GPL-3.0",
    capabilities: ["Loop closure detection", "Map merging", "Dynamic object rejection", "Relocalization", "Dense/semi-dense depth"]
  },
  {
    id: "r-03", name: "6-DOF Arm IK/FK Solver", description: "Analytical + numerical inverse kinematics for 6-DOF serial manipulators. DH parameter configuration, singularity handling, workspace analysis, and smooth trajectory interpolation.",
    category: "manipulation", algorithm: "Analytical IK + Jacobian DLS", dof: "6-DOF (configurable)", updateRate: "10kHz", latency: "<0.1ms per solve",
    hardware: ["Any"], interfaces: ["ROS2", "MoveIt2", "Python", "C++"],
    tags: ["ik", "fk", "manipulator", "kinematics"], rating: 4.9, downloads: 89000, license: "Apache 2.0",
    capabilities: ["Singularity-robust solving", "Joint limit avoidance", "Workspace visualization", "Multi-solution enumeration", "Cartesian velocity control"]
  },
  {
    id: "r-04", name: "RRT* Path Planner", description: "Asymptotically optimal sampling-based motion planner. Informed RRT* with path shortcutting and adaptive sampling. Works in arbitrary C-space dimensions with custom validity checkers.",
    category: "planning", algorithm: "Informed RRT* + Path Shortcutting", dof: "2–12 dimensions", updateRate: "N/A (query-based)", latency: "10–500ms typical",
    hardware: ["Any"], interfaces: ["OMPL", "ROS2", "Python"],
    tags: ["rrt", "motion-planning", "sampling"], rating: 4.7, downloads: 67000, license: "BSD-3",
    capabilities: ["Asymptotic optimality", "Anytime planning", "Goal biasing", "Informed sampling ellipsoid", "Multi-goal planning"]
  },
  {
    id: "r-05", name: "Quadruped Locomotion Controller", description: "Central pattern generator + RL-refined gait controller for quadrupedal robots. Supports walk, trot, pace, bound gaits with terrain adaptation and fall recovery.",
    category: "locomotion", algorithm: "CPG + PPO Policy", dof: "12-DOF (3 per leg)", updateRate: "500Hz", latency: "<2ms",
    hardware: ["Jetson", "RPi CM4", "Custom MCU"], interfaces: ["ROS2", "Isaac Gym", "Python"],
    tags: ["quadruped", "gait", "locomotion", "rl"], rating: 4.8, downloads: 23000, license: "MIT",
    capabilities: ["Multi-gait transitions", "Terrain adaptation", "Fall recovery", "Velocity tracking", "Push recovery"]
  },
  {
    id: "r-06", name: "LiDAR 3D Object Detector", description: "PointPillars + CenterPoint detection pipeline for 3D LiDAR point clouds. Real-time detection of cars, pedestrians, cyclists with oriented 3D bounding boxes and velocity estimation.",
    category: "perception", algorithm: "PointPillars + CenterPoint", dof: "N/A", updateRate: "20Hz (10Hz LiDAR)", latency: "<50ms inference",
    hardware: ["Jetson Orin", "x86 + GPU"], interfaces: ["ROS2", "ONNX", "TensorRT"],
    tags: ["lidar", "3d-detection", "autonomous"], rating: 4.7, downloads: 41000, license: "Apache 2.0",
    capabilities: ["Multi-class detection", "Velocity estimation", "Tracking integration", "TensorRT optimization", "Multi-LiDAR fusion"]
  },
  {
    id: "r-07", name: "Multi-Agent Formation Controller", description: "Consensus-based formation control for robot swarms. Virtual structure and behavior-based approaches with collision avoidance, leader-follower, and leaderless consensus protocols.",
    category: "swarm", algorithm: "Consensus + APF Collision Avoidance", dof: "2D/3D per agent", updateRate: "100Hz", latency: "<10ms",
    hardware: ["ESP32", "RPi", "Crazyflie"], interfaces: ["ROS2", "MAVLink", "Custom UDP"],
    tags: ["swarm", "formation", "multi-agent"], rating: 4.5, downloads: 15000, license: "MIT",
    capabilities: ["Dynamic formation changes", "Obstacle-aware reshaping", "Communication-aware topology", "Scalable to 100+ agents", "Heterogeneous swarms"]
  },
  {
    id: "r-08", name: "Force-Torque Impedance Controller", description: "Cartesian impedance controller for compliant manipulation. Configurable stiffness/damping in 6-DOF. Enables safe human-robot interaction and delicate assembly tasks.",
    category: "motion", algorithm: "Cartesian Impedance + Nullspace Opt.", dof: "6-DOF Cartesian", updateRate: "1kHz", latency: "<1ms",
    hardware: ["Real-time Linux", "EtherCAT"], interfaces: ["ROS2 Control", "FCI (Franka)", "C++"],
    tags: ["impedance", "compliant", "force-control"], rating: 4.8, downloads: 28000, license: "Apache 2.0",
    capabilities: ["Variable stiffness profiles", "Contact transition handling", "Nullspace posture optimization", "Energy tank passivity", "Wrench estimation"]
  },
];

const categoryLabels: Record<string, string> = {
  motion: "Motion Control", perception: "Perception", planning: "Planning", manipulation: "Manipulation",
  locomotion: "Locomotion", swarm: "Swarm", slam: "SLAM", control: "Control Theory",
};

export default function RoboticsPage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [cart, setCart] = useState<string[]>([]);
  const [selected, setSelected] = useState<Controller | null>(null);

  const filtered = controllerCatalog.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase()) || c.tags.some(t => t.includes(search.toLowerCase()));
    const matchTab = activeTab === "all" || c.category === activeTab;
    return matchSearch && matchTab;
  });

  const toggleCart = (id: string) => {
    setCart(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const c = controllerCatalog.find(x => x.id === id);
    if (c && !cart.includes(id)) toast.success(`${c.name} added to workspace`);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-6 pb-0 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Robotics Controllers</h1>
              <p className="text-sm text-muted-foreground">{controllerCatalog.length} production controllers — SLAM, manipulation, locomotion, swarms & more</p>
            </div>
            <div className="flex items-center gap-2">
              <ExportToDialog context="robotics" projectName="Robotics Controller" />
              <Badge variant="outline" className="gap-1"><ShoppingCart className="h-3 w-3" />{cart.length}</Badge>
              {cart.length > 0 && (
                <Button size="sm" onClick={() => { toast.success(`${cart.length} controllers deployed`); setCart([]); }}>
                  <Download className="h-3 w-3 mr-1" /> Deploy All
                </Button>
              )}
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search controllers, algorithms, hardware…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
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
                {filtered.map(c => {
                  const inCart = cart.includes(c.id);
                  return (
                    <motion.div key={c.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                      className={cn("border rounded-lg p-4 cursor-pointer transition-colors hover:bg-accent/10", selected?.id === c.id && "ring-2 ring-primary")}
                      onClick={() => setSelected(c)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm truncate">{c.name}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{c.description}</p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <Badge variant="secondary" className="text-[10px]">{c.dof}</Badge>
                            <Badge variant="outline" className="text-[10px]">{c.updateRate}</Badge>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Star className="h-2.5 w-2.5 fill-current text-yellow-500" />{c.rating}</span>
                            <span className="text-[10px] text-muted-foreground">{(c.downloads / 1000).toFixed(0)}K ↓</span>
                          </div>
                        </div>
                        <Button size="icon" variant={inCart ? "default" : "outline"} className="h-7 w-7 shrink-0" onClick={e => { e.stopPropagation(); toggleCart(c.id); }}>
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
                    { l: "Algorithm", v: selected.algorithm },
                    { l: "DOF", v: selected.dof },
                    { l: "Update Rate", v: selected.updateRate },
                    { l: "Latency", v: selected.latency },
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
                  <h4 className="text-xs font-semibold mb-2">Hardware</h4>
                  <div className="flex flex-wrap gap-1">{selected.hardware.map(h => <Badge key={h} variant="outline" className="text-[10px]">{h}</Badge>)}</div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold mb-2">Interfaces</h4>
                  <div className="flex flex-wrap gap-1">{selected.interfaces.map(i => <Badge key={i} variant="secondary" className="text-[10px]">{i}</Badge>)}</div>
                </div>

                <Separator />
                <div>
                  <h4 className="text-xs font-semibold mb-2">Capabilities</h4>
                  <ul className="space-y-1">{selected.capabilities.map(c => (
                    <li key={c} className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-primary shrink-0" />{c}</li>
                  ))}</ul>
                </div>

                <Separator />
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => toggleCart(selected.id)}>
                    {cart.includes(selected.id) ? <><CheckCircle2 className="h-3 w-3 mr-1" />In Workspace</> : <><Plus className="h-3 w-3 mr-1" />Add to Workspace</>}
                  </Button>
                  <Button variant="outline" onClick={() => toast.info("Controller docs opened")}>
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
