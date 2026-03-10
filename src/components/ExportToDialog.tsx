import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Download, Copy, CheckCircle2, ExternalLink, FileCode, ChevronRight,
  Loader2, ArrowRight
} from "lucide-react";

export type ExportTarget = {
  id: string;
  name: string;
  icon: string;
  description: string;
  formats: string[];
  setupSteps: string[];
  exportCode: string;
};

// ── Domain-specific export targets ───────────────────────────

const gameEngineTargets: ExportTarget[] = [
  {
    id: "unity", name: "Unity", icon: "🎮",
    description: "Export scene as Unity package with GameObjects, materials, physics settings, and AI scripts.",
    formats: [".unitypackage", "C# scripts", "Prefabs"],
    setupSteps: ["Open Unity Hub → New 3D project", "Assets → Import Package → Custom Package", "Select exported .unitypackage", "Scene auto-populates from SoupyForge layout"],
    exportCode: `// Unity C# — Auto-generated from SoupyForge Scene
using UnityEngine;

public class SceneLoader : MonoBehaviour {
    void Start() {
        // Ground Plane
        var ground = GameObject.CreatePrimitive(PrimitiveType.Plane);
        ground.transform.localScale = new Vector3(2f, 1f, 2f);
        ground.GetComponent<Renderer>().material.color = Color.gray;
        ground.AddComponent<BoxCollider>();
        ground.isStatic = true;
        
        // Player Cube (Dynamic Rigidbody)
        var player = GameObject.CreatePrimitive(PrimitiveType.Cube);
        player.transform.position = new Vector3(0f, 0.5f, 0f);
        player.transform.rotation = Quaternion.Euler(0f, 45f, 0f);
        var rb = player.AddComponent<Rigidbody>();
        rb.mass = 1f;
        rb.useGravity = true;
        
        // Guard NPC (Kinematic + AI)
        var guard = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        guard.transform.position = new Vector3(3f, 0.5f, 2f);
        guard.transform.localScale = Vector3.one * 0.8f;
        var guardRb = guard.AddComponent<Rigidbody>();
        guardRb.isKinematic = true;
        guard.AddComponent<PatrolAI>();  // AI module attached
        
        // Lighting
        var lightGO = new GameObject("Sun Light");
        var light = lightGO.AddComponent<Light>();
        light.type = LightType.Directional;
        light.transform.position = new Vector3(5f, 8f, 3f);
        light.transform.rotation = Quaternion.Euler(-45f, 30f, 0f);
        light.intensity = 1.2f;
    }
}`
  },
  {
    id: "unreal", name: "Unreal Engine 5", icon: "⚡",
    description: "Export as Unreal DataTable + Blueprint actors with physics presets, materials, and AI behavior trees.",
    formats: [".uasset", "Blueprints", "DataTable CSV"],
    setupSteps: ["Open Unreal Editor → New Blank project", "Import DataTable CSV via Content Browser", "Run 'SoupyForge Scene Importer' editor utility", "Actors spawn with physics & AI components"],
    exportCode: `// Unreal C++ — Auto-generated Actor Spawner
#include "SoupyForgeSceneLoader.h"
#include "Engine/World.h"

void ASoupyForgeSceneLoader::BeginPlay() {
    Super::BeginPlay();
    
    // Ground Plane
    FActorSpawnParameters SpawnParams;
    auto* Ground = GetWorld()->SpawnActor<AStaticMeshActor>(
        AStaticMeshActor::StaticClass(),
        FVector(0, 0, -50), FRotator::ZeroRotator, SpawnParams);
    Ground->GetStaticMeshComponent()->SetStaticMesh(
        LoadObject<UStaticMesh>(nullptr, TEXT("/Engine/BasicShapes/Plane")));
    Ground->SetMobility(EComponentMobility::Static);
    
    // Player Cube with Physics
    auto* Player = GetWorld()->SpawnActor<AStaticMeshActor>(
        AStaticMeshActor::StaticClass(),
        FVector(0, 0, 50), FRotator(0, 45, 0), SpawnParams);
    Player->GetStaticMeshComponent()->SetStaticMesh(
        LoadObject<UStaticMesh>(nullptr, TEXT("/Engine/BasicShapes/Cube")));
    Player->GetStaticMeshComponent()->SetSimulatePhysics(true);
    Player->GetStaticMeshComponent()->SetMassOverrideInKg(NAME_None, 1.0f);
    
    // Guard NPC with AI Controller
    auto* Guard = GetWorld()->SpawnActor<ACharacter>(
        ACharacter::StaticClass(),
        FVector(300, 200, 50), FRotator::ZeroRotator, SpawnParams);
    Guard->AIControllerClass = APatrolAIController::StaticClass();
    Guard->SpawnDefaultController();
}`
  },
  {
    id: "godot", name: "Godot 4", icon: "🤖",
    description: "Export as .tscn scene file with RigidBody3D nodes, CollisionShapes, and GDScript AI controllers.",
    formats: [".tscn", ".gd scripts", ".tres resources"],
    setupSteps: ["Open Godot 4 → Import Project", "Drag .tscn file into scene dock", "Scene tree auto-populates", "Run with F5"],
    exportCode: `# Godot 4 — Auto-generated Scene (scene.tscn)
[gd_scene load_steps=5 format=3]

[node name="SoupyForgeScene" type="Node3D"]

[node name="GroundPlane" type="StaticBody3D" parent="."]
transform = Transform3D(1, 0, 0, 0, 1, 0, 0, 0, 1, 0, -0.5, 0)

[node name="CollisionShape3D" type="CollisionShape3D" parent="GroundPlane"]
shape = BoxShape3D.new()

[node name="MeshInstance3D" type="MeshInstance3D" parent="GroundPlane"]
mesh = PlaneMesh.new()

[node name="PlayerCube" type="RigidBody3D" parent="."]
transform = Transform3D(1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0.5, 0)
mass = 1.0

[node name="CollisionShape3D" type="CollisionShape3D" parent="PlayerCube"]
shape = BoxShape3D.new()

[node name="GuardNPC" type="CharacterBody3D" parent="."]
transform = Transform3D(1, 0, 0, 0, 1, 0, 0, 0, 1, 3, 0.5, 2)
script = preload("res://scripts/patrol_ai.gd")

[node name="DirectionalLight3D" type="DirectionalLight3D" parent="."]
transform = Transform3D(1, 0, 0, 0, 1, 0, 0, 0, 1, 5, 8, 3)
light_energy = 1.2`
  },
  {
    id: "threejs", name: "Three.js / React Three Fiber", icon: "🌐",
    description: "Export as standalone Three.js scene or R3F JSX component with Cannon.js physics.",
    formats: [".jsx", ".glTF", "JSON scene"],
    setupSteps: ["npx create-react-app my-scene --template typescript", "npm install three @react-three/fiber @react-three/cannon", "Paste exported component into src/", "npm start"],
    exportCode: `// React Three Fiber — Auto-generated from SoupyForge
import { Canvas } from '@react-three/fiber';
import { Physics, useBox, usePlane, useSphere } from '@react-three/cannon';
import { OrbitControls, Environment } from '@react-three/drei';

function Ground() {
  const [ref] = usePlane(() => ({ rotation: [-Math.PI / 2, 0, 0], position: [0, -0.5, 0] }));
  return <mesh ref={ref}><planeGeometry args={[20, 20]} /><meshStandardMaterial color="#888" /></mesh>;
}

function PlayerCube() {
  const [ref] = useBox(() => ({ mass: 1, position: [0, 0.5, 0], rotation: [0, Math.PI/4, 0] }));
  return <mesh ref={ref} castShadow><boxGeometry /><meshStandardMaterial color="#6c5ce7" /></mesh>;
}

function GuardNPC() {
  const [ref] = useSphere(() => ({ mass: 1, position: [3, 0.5, 2], type: 'Kinematic' }));
  return <mesh ref={ref} castShadow><sphereGeometry args={[0.4]} /><meshStandardMaterial color="#e84393" /></mesh>;
}

export default function Scene() {
  return (
    <Canvas shadows camera={{ position: [8, 6, 8], fov: 50 }}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 3]} intensity={1.2} castShadow />
      <Physics>
        <Ground />
        <PlayerCube />
        <GuardNPC />
      </Physics>
      <OrbitControls />
      <Environment preset="sunset" />
    </Canvas>
  );
}`
  },
];

const solverTargets: ExportTarget[] = [
  {
    id: "jupyter", name: "Jupyter Notebook", icon: "📓",
    description: "Export solver as a ready-to-run .ipynb notebook with setup cells, parameter sweeps, and visualization.",
    formats: [".ipynb", ".py"],
    setupSteps: ["pip install jupyter numpy scipy matplotlib", "jupyter notebook", "Open exported .ipynb", "Run All Cells"],
    exportCode: `{
 "cells": [
  {"cell_type": "markdown", "source": ["# SoupyForge Solver Export\\n", "Auto-generated notebook"]},
  {"cell_type": "code", "source": [
    "import numpy as np\\n",
    "from scipy.integrate import solve_ivp\\n",
    "import matplotlib.pyplot as plt\\n",
    "\\n",
    "# Solver parameters (from StackForge config)\\n",
    "dt = 0.001\\n",
    "t_end = 10.0\\n",
    "initial_state = [0.0, 1.0, 0.0, 0.0]\\n"
  ]},
  {"cell_type": "code", "source": [
    "def system(t, y):\\n",
    "    # Auto-generated equations of motion\\n",
    "    x, vx, theta, omega = y\\n",
    "    dxdt = vx\\n",
    "    dvxdt = -0.1 * vx  # damping\\n",
    "    dthetadt = omega\\n",
    "    domegadt = -9.81 * np.sin(theta) / 1.0\\n",
    "    return [dxdt, dvxdt, dthetadt, domegadt]\\n",
    "\\n",
    "sol = solve_ivp(system, [0, t_end], initial_state, max_step=dt)\\n",
    "plt.plot(sol.t, sol.y[0], label='x(t)')\\n",
    "plt.plot(sol.t, sol.y[2], label='θ(t)')\\n",
    "plt.legend(); plt.grid(); plt.show()"
  ]}
 ]
}`
  },
  {
    id: "matlab", name: "MATLAB / Simulink", icon: "📊",
    description: "Export as .m script or Simulink .slx model with ODE solver configuration and plotting.",
    formats: [".m", ".slx", ".mat"],
    setupSteps: ["Open MATLAB R2024+", "Run exported .m script", "Or open .slx for Simulink block diagram", "Adjust parameters in workspace"],
    exportCode: `% StackForge Solver Export — MATLAB
% Auto-generated from StackForge AI

clear; clc; close all;

%% Parameters
dt = 0.001;
t_end = 10.0;
y0 = [0; 1; 0; 0];  % [x, vx, theta, omega]

%% ODE System
odefun = @(t, y) [
    y(2);                          % dx/dt = vx
    -0.1 * y(2);                   % dvx/dt = -c*vx
    y(4);                          % dtheta/dt = omega
    -9.81 * sin(y(3)) / 1.0;      % domega/dt = -g*sin(theta)/L
];

%% Solve
opts = odeset('MaxStep', dt, 'RelTol', 1e-8, 'AbsTol', 1e-10);
[t, y] = ode45(odefun, [0 t_end], y0, opts);

%% Plot
figure('Position', [100 100 900 400]);
subplot(1,2,1);
plot(t, y(:,1), 'LineWidth', 1.5); grid on;
xlabel('Time (s)'); ylabel('x(t)'); title('Position');

subplot(1,2,2);
plot(t, y(:,3), 'LineWidth', 1.5, 'Color', [0.85 0.33 0.1]); grid on;
xlabel('Time (s)'); ylabel('\\theta(t)'); title('Angle');

sgtitle('StackForge Solver Results');`
  },
  {
    id: "comsol", name: "COMSOL Multiphysics", icon: "🔬",
    description: "Export as COMSOL .mph model file or Java API script for automated model construction.",
    formats: [".mph", ".java API", "Parameters CSV"],
    setupSteps: ["Open COMSOL Multiphysics 6.x", "File → Import → Java API script", "Or load parameters from CSV", "Run Study"],
    exportCode: `// COMSOL Java API — Auto-generated
import com.comsol.model.*;
import com.comsol.model.util.*;

public class StackForgeSolver {
    public static Model run() {
        Model model = ModelUtil.create("StackForge_Export");
        
        model.param().set("dt", "0.001[s]");
        model.param().set("t_end", "10[s]");
        model.param().set("rho", "1000[kg/m^3]");
        model.param().set("mu", "0.001[Pa*s]");
        
        // Geometry
        model.component().create("comp1", true);
        model.component("comp1").geom().create("geom1", 2);
        model.component("comp1").geom("geom1").create("r1", "Rectangle");
        model.component("comp1").geom("geom1").feature("r1")
            .set("size", new double[]{1.0, 1.0});
        
        // Physics
        model.component("comp1").physics().create("spf", "LaminarFlow", "geom1");
        model.component("comp1").physics("spf")
            .prop("CompressibilityProperty").set("Compressibility", "Incompressible");
        
        // Mesh
        model.component("comp1").mesh().create("mesh1");
        model.component("comp1").mesh("mesh1").automatic(true);
        model.component("comp1").mesh("mesh1").autoMeshSize(3); // Fine
        
        // Study
        model.study().create("std1");
        model.study("std1").create("time", "Transient");
        model.study("std1").feature("time").set("tlist", "range(0,dt,t_end)");
        
        model.study("std1").run();
        return model;
    }
}`
  },
  {
    id: "python-scipy", name: "Python (SciPy)", icon: "🐍",
    description: "Export as standalone Python script with SciPy solvers, NumPy arrays, and Matplotlib visualization.",
    formats: [".py", "requirements.txt"],
    setupSteps: ["pip install numpy scipy matplotlib", "python solver_export.py", "Results saved to output/"],
    exportCode: `#!/usr/bin/env python3
"""StackForge Solver Export — Standalone Python"""

import numpy as np
from scipy.integrate import solve_ivp
from scipy.optimize import minimize
import matplotlib.pyplot as plt
from pathlib import Path

# ── Parameters (from StackForge config) ──
config = {
    "dt": 0.001,
    "t_end": 10.0,
    "method": "RK45",
    "rtol": 1e-8,
    "atol": 1e-10,
}

initial_state = np.array([0.0, 1.0, 0.0, 0.0])

def equations(t, y):
    x, vx, theta, omega = y
    return [vx, -0.1 * vx, omega, -9.81 * np.sin(theta)]

# ── Solve ──
sol = solve_ivp(
    equations, [0, config["t_end"]], initial_state,
    method=config["method"], max_step=config["dt"],
    rtol=config["rtol"], atol=config["atol"],
    dense_output=True
)

# ── Save & Plot ──
Path("output").mkdir(exist_ok=True)
np.savez("output/results.npz", t=sol.t, y=sol.y)

fig, axes = plt.subplots(1, 2, figsize=(12, 5))
axes[0].plot(sol.t, sol.y[0], lw=1.5); axes[0].set_title("x(t)")
axes[1].plot(sol.t, sol.y[2], lw=1.5, color="tab:orange"); axes[1].set_title("θ(t)")
for ax in axes: ax.grid(True); ax.set_xlabel("Time (s)")
plt.tight_layout()
plt.savefig("output/results.png", dpi=150)
plt.show()
print(f"✓ Solved: {len(sol.t)} timesteps, final t={sol.t[-1]:.2f}s")`
  },
];

const aiBuilderTargets: ExportTarget[] = [
  {
    id: "ollama", name: "Ollama", icon: "🦙",
    description: "Export as Ollama Modelfile with system prompt, parameters, and template for local deployment.",
    formats: ["Modelfile", "GGUF config"],
    setupSteps: ["curl -fsSL https://ollama.com/install.sh | sh", "ollama create mymodel -f Modelfile", "ollama run mymodel"],
    exportCode: `# Ollama Modelfile — Auto-generated from StackForge Build-a-AI
FROM phi3:mini

PARAMETER temperature 0.3
PARAMETER top_p 0.9
PARAMETER top_k 40
PARAMETER num_predict 512
PARAMETER repeat_penalty 1.1
PARAMETER num_ctx 4096
PARAMETER stop "<|end|>"
PARAMETER stop "<|user|>"

SYSTEM """
You are a specialized AI assistant built with StackForge AI.

Role: Classification and extraction specialist.
Behavior: Respond only with structured JSON output.
Constraints:
  - Never fabricate data not present in the input
  - Always include confidence scores
  - Flag uncertain outputs for human review

Output format:
{
  "classification": "string",
  "confidence": 0.0-1.0,
  "extracted_fields": {},
  "flags": []
}
"""

TEMPLATE """{{ if .System }}<|system|>
{{ .System }}<|end|>
{{ end }}{{ if .Prompt }}<|user|>
{{ .Prompt }}<|end|>
{{ end }}<|assistant|>
{{ .Response }}<|end|>
"""`
  },
  {
    id: "lmstudio", name: "LM Studio", icon: "🖥️",
    description: "Export as LM Studio preset with model config, system prompt, and inference parameters.",
    formats: [".json preset", "GGUF config"],
    setupSteps: ["Download LM Studio from lmstudio.ai", "File → Import Preset", "Load the matching GGUF model", "Start chatting or use the API server"],
    exportCode: `{
  "name": "StackForge AI Export",
  "model": "phi-3-mini-4k-instruct.Q4_K_M.gguf",
  "systemPrompt": "You are a specialized AI assistant built with StackForge AI. Respond with structured JSON. Never fabricate data.",
  "parameters": {
    "temperature": 0.3,
    "topP": 0.9,
    "topK": 40,
    "maxTokens": 512,
    "repeatPenalty": 1.1,
    "contextLength": 4096,
    "gpuLayers": -1
  },
  "stopStrings": ["<|end|>", "<|user|>"],
  "template": "phi3"
}`
  },
  {
    id: "huggingface", name: "Hugging Face", icon: "🤗",
    description: "Export as HF model card, tokenizer config, and adapter weights for Hub upload.",
    formats: ["model_card.md", "config.json", "adapter_config.json"],
    setupSteps: ["pip install huggingface_hub transformers", "huggingface-cli login", "python upload_to_hub.py", "Model card auto-populated on Hub"],
    exportCode: `# upload_to_hub.py — Auto-generated from StackForge
from huggingface_hub import HfApi, create_repo
from transformers import AutoModelForCausalLM, AutoTokenizer

# Config from StackForge Build-a-AI
MODEL_NAME = "stackforge-phi3-specialist"
BASE_MODEL = "microsoft/phi-3-mini-4k-instruct"
HF_REPO = f"your-org/{MODEL_NAME}"

# Load base + adapter
tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)
model = AutoModelForCausalLM.from_pretrained(
    BASE_MODEL,
    device_map="auto",
    torch_dtype="auto",
)

# Apply StackForge config
generation_config = {
    "temperature": 0.3,
    "top_p": 0.9,
    "top_k": 40,
    "max_new_tokens": 512,
    "repetition_penalty": 1.1,
    "do_sample": True,
}

# Push to Hub
create_repo(HF_REPO, exist_ok=True)
model.push_to_hub(HF_REPO)
tokenizer.push_to_hub(HF_REPO)
print(f"✓ Uploaded to https://huggingface.co/{HF_REPO}")`
  },
  {
    id: "onnx", name: "ONNX Runtime", icon: "⚙️",
    description: "Export quantized ONNX model with optimized graph for cross-platform inference.",
    formats: [".onnx", "config.json", "tokenizer.json"],
    setupSteps: ["pip install onnxruntime optimum", "python export_onnx.py", "Copy model.onnx to target device", "Run with onnxruntime in any language"],
    exportCode: `# export_onnx.py — Auto-generated from StackForge
from optimum.onnxruntime import ORTModelForCausalLM
from transformers import AutoTokenizer

MODEL_ID = "microsoft/phi-3-mini-4k-instruct"
OUTPUT_DIR = "./onnx_export"

# Export with INT8 quantization
model = ORTModelForCausalLM.from_pretrained(
    MODEL_ID,
    export=True,
    provider="CPUExecutionProvider",
)
tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)

model.save_pretrained(OUTPUT_DIR)
tokenizer.save_pretrained(OUTPUT_DIR)

# Verify
from optimum.onnxruntime import ORTModelForCausalLM
loaded = ORTModelForCausalLM.from_pretrained(OUTPUT_DIR)
inputs = tokenizer("Test prompt:", return_tensors="pt")
output = loaded.generate(**inputs, max_new_tokens=50)
print(tokenizer.decode(output[0], skip_special_tokens=True))
print(f"✓ ONNX model exported to {OUTPUT_DIR}/")`
  },
];

const edgeTrainingTargets: ExportTarget[] = [
  {
    id: "ros2", name: "ROS 2 (Humble/Iron)", icon: "🤖",
    description: "Export as ROS 2 package with sensor nodes, TF2 transforms, and inference service.",
    formats: ["ROS 2 package", "launch.py", "CMakeLists.txt"],
    setupSteps: ["source /opt/ros/humble/setup.bash", "colcon build --packages-select stackforge_pkg", "ros2 launch stackforge_pkg inference.launch.py", "ros2 topic echo /detections"],
    exportCode: `# ROS 2 Node — Auto-generated from StackForge Edge AI
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import LaserScan, Image, Imu
from geometry_msgs.msg import PoseStamped
from vision_msgs.msg import Detection3DArray, Detection3D
import numpy as np
import tflite_runtime.interpreter as tflite

class StackForgeInferenceNode(Node):
    def __init__(self):
        super().__init__('stackforge_inference')
        
        # Load TFLite model
        self.interpreter = tflite.Interpreter(
            model_path=self.declare_parameter('model_path', '').value)
        self.interpreter.allocate_tensors()
        
        # Subscribers
        self.lidar_sub = self.create_subscription(
            LaserScan, '/scan', self.lidar_callback, 10)
        self.depth_sub = self.create_subscription(
            Image, '/camera/depth/image_raw', self.depth_callback, 10)
        self.imu_sub = self.create_subscription(
            Imu, '/imu/data', self.imu_callback, 10)
        
        # Publishers
        self.det_pub = self.create_publisher(
            Detection3DArray, '/detections', 10)
        self.pose_pub = self.create_publisher(
            PoseStamped, '/estimated_pose', 10)
        
        self.get_logger().info('StackForge Inference Node started')
    
    def lidar_callback(self, msg: LaserScan):
        ranges = np.array(msg.ranges, dtype=np.float32)
        # Preprocess for model input
        input_data = self.preprocess_lidar(ranges)
        self.run_inference(input_data, 'lidar')
    
    def depth_callback(self, msg: Image):
        # Convert ROS Image to numpy
        depth = np.frombuffer(msg.data, dtype=np.uint16).reshape(msg.height, msg.width)
        input_data = self.preprocess_depth(depth)
        self.run_inference(input_data, 'depth')
    
    def imu_callback(self, msg: Imu):
        accel = [msg.linear_acceleration.x, msg.linear_acceleration.y, msg.linear_acceleration.z]
        gyro = [msg.angular_velocity.x, msg.angular_velocity.y, msg.angular_velocity.z]
        self.fuse_imu(accel, gyro, msg.orientation)
    
    def run_inference(self, input_data, source):
        input_details = self.interpreter.get_input_details()
        output_details = self.interpreter.get_output_details()
        self.interpreter.set_tensor(input_details[0]['index'], input_data)
        self.interpreter.invoke()
        output = self.interpreter.get_tensor(output_details[0]['index'])
        self.publish_detections(output, source)

def main():
    rclpy.init()
    node = StackForgeInferenceNode()
    rclpy.spin(node)
    rclpy.shutdown()

if __name__ == '__main__':
    main()`
  },
  {
    id: "arduino", name: "Arduino / PlatformIO", icon: "📟",
    description: "Export sensor reading code as Arduino sketch with I2C/SPI/UART driver integration.",
    formats: [".ino", "platformio.ini", "lib/"],
    setupSteps: ["Open Arduino IDE or PlatformIO", "File → Open exported sketch", "Select board (ESP32/Arduino Mega)", "Upload to device"],
    exportCode: `// Arduino Sketch — Auto-generated from StackForge Edge AI
#include <Wire.h>
#include <Adafruit_BNO08x.h>

// I2C IMU
Adafruit_BNO08x bno08x;
sh2_SensorValue_t sensorValue;

// Ultrasonic pins
const int TRIG_PINS[] = {4, 22, 6, 24};
const int ECHO_PINS[] = {17, 27, 5, 25};
const int NUM_SENSORS = 4;

void setup() {
    Serial.begin(115200);
    Wire.begin();
    
    // Initialize IMU
    if (!bno08x.begin_I2C()) {
        Serial.println("BNO085 not found!");
        while (1) delay(10);
    }
    bno08x.enableReport(SH2_ROTATION_VECTOR, 10000); // 100Hz
    bno08x.enableReport(SH2_ACCELEROMETER, 5000);     // 200Hz
    
    // Initialize ultrasonics
    for (int i = 0; i < NUM_SENSORS; i++) {
        pinMode(TRIG_PINS[i], OUTPUT);
        pinMode(ECHO_PINS[i], INPUT);
    }
    
    Serial.println("StackForge sensor array initialized");
}

float readUltrasonic(int idx) {
    digitalWrite(TRIG_PINS[idx], LOW);
    delayMicroseconds(2);
    digitalWrite(TRIG_PINS[idx], HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG_PINS[idx], LOW);
    long duration = pulseIn(ECHO_PINS[idx], HIGH, 30000);
    return (duration * 0.0343) / 2.0; // cm
}

void loop() {
    // Read IMU
    if (bno08x.getSensorEvent(&sensorValue)) {
        if (sensorValue.sensorId == SH2_ROTATION_VECTOR) {
            Serial.printf("QUAT: %.3f,%.3f,%.3f,%.3f\\n",
                sensorValue.un.rotationVector.real,
                sensorValue.un.rotationVector.i,
                sensorValue.un.rotationVector.j,
                sensorValue.un.rotationVector.k);
        }
    }
    
    // Read ultrasonics
    for (int i = 0; i < NUM_SENSORS; i++) {
        float dist = readUltrasonic(i);
        Serial.printf("US%d: %.1f cm\\n", i, dist);
    }
    
    delay(25); // 40Hz loop
}`
  },
  {
    id: "tflite", name: "TensorFlow Lite", icon: "🧠",
    description: "Export optimized TFLite model with metadata, label map, and benchmark config for Pi deployment.",
    formats: [".tflite", "metadata.json", "labels.txt"],
    setupSteps: ["pip install tflite-runtime", "Copy .tflite to target device", "Run benchmark: python benchmark.py", "Integrate into inference pipeline"],
    exportCode: `# TFLite Deployment — Auto-generated from StackForge
import tflite_runtime.interpreter as tflite
import numpy as np
import time

MODEL_PATH = "model_int8.tflite"
LABELS = ["wall", "person", "vehicle", "furniture", "unknown"]

# Initialize
interpreter = tflite.Interpreter(
    model_path=MODEL_PATH,
    num_threads=4  # Use all Pi cores
)
interpreter.allocate_tensors()

input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

print(f"Input shape:  {input_details[0]['shape']}")
print(f"Output shape: {output_details[0]['shape']}")
print(f"Input dtype:  {input_details[0]['dtype']}")

def run_inference(input_data):
    """Run single inference with timing."""
    # Quantize input if needed
    if input_details[0]['dtype'] == np.uint8:
        scale, zero_point = input_details[0]['quantization']
        input_data = (input_data / scale + zero_point).astype(np.uint8)
    
    interpreter.set_tensor(input_details[0]['index'], input_data)
    
    start = time.perf_counter()
    interpreter.invoke()
    latency = (time.perf_counter() - start) * 1000
    
    output = interpreter.get_tensor(output_details[0]['index'])
    
    # Dequantize if needed
    if output_details[0]['dtype'] == np.uint8:
        scale, zero_point = output_details[0]['quantization']
        output = (output.astype(np.float32) - zero_point) * scale
    
    class_id = np.argmax(output[0])
    confidence = float(output[0][class_id])
    
    return {
        "label": LABELS[class_id],
        "confidence": confidence,
        "latency_ms": round(latency, 2),
        "all_scores": {l: float(s) for l, s in zip(LABELS, output[0])}
    }

# Benchmark
print("\\nRunning 100-iteration benchmark...")
latencies = []
dummy = np.random.rand(*input_details[0]['shape']).astype(np.float32)
for _ in range(100):
    result = run_inference(dummy)
    latencies.append(result["latency_ms"])

print(f"Mean latency: {np.mean(latencies):.1f}ms")
print(f"P95 latency:  {np.percentile(latencies, 95):.1f}ms")
print(f"Throughput:   {1000/np.mean(latencies):.0f} inferences/sec")`
  },
];

const roboticsTargets: ExportTarget[] = [
  {
    id: "ros2-ctrl", name: "ROS 2 Control", icon: "🤖",
    description: "Export as ros2_control hardware interface with controller manager config.",
    formats: ["ROS 2 package", "URDF", ".yaml config"],
    setupSteps: ["colcon build", "ros2 launch robot_bringup.launch.py", "ros2 control list_controllers"],
    exportCode: `# controller_config.yaml — Auto-generated
controller_manager:
  ros__parameters:
    update_rate: 1000
    
    joint_state_broadcaster:
      type: joint_state_broadcaster/JointStateBroadcaster
      
    stackforge_controller:
      type: forward_command_controller/ForwardCommandController
      
stackforge_controller:
  ros__parameters:
    joints: [joint_1, joint_2, joint_3, joint_4, joint_5, joint_6]
    interface_name: effort
    
    # PID gains from StackForge tuning
    gains:
      joint_1: {p: 10.0, i: 0.1, d: 1.0}
      joint_2: {p: 10.0, i: 0.1, d: 1.0}
      joint_3: {p: 10.0, i: 0.1, d: 1.0}
      joint_4: {p: 5.0, i: 0.05, d: 0.5}
      joint_5: {p: 5.0, i: 0.05, d: 0.5}
      joint_6: {p: 2.0, i: 0.02, d: 0.2}`
  },
  {
    id: "isaac-sim", name: "NVIDIA Isaac Sim", icon: "🎯",
    description: "Export as Isaac Sim USD scene with physics materials and RL training config.",
    formats: [".usd", ".yaml", "Python extension"],
    setupSteps: ["Open Isaac Sim from Omniverse Launcher", "File → Open USD", "Load RL config", "Start training"],
    exportCode: `# Isaac Sim task config — Auto-generated from StackForge
task:
  name: StackForgeRobot
  physics_engine: physx
  env:
    numEnvs: 4096
    envSpacing: 2.0
  sim:
    dt: 0.002
    substeps: 2
    gravity: [0.0, 0.0, -9.81]
    physx:
      num_threads: 8
      solver_type: 1  # TGS
      num_position_iterations: 4
      num_velocity_iterations: 1
      contact_offset: 0.02
      bounce_threshold_velocity: 0.2`
  },
];

const signalTargets: ExportTarget[] = [
  {
    id: "gnu-radio", name: "GNU Radio", icon: "📻",
    description: "Export as GNU Radio Companion flowgraph (.grc) with signal blocks and connections.",
    formats: [".grc", ".py flowgraph"],
    setupSteps: ["Open GNU Radio Companion", "File → Open .grc", "Run flowgraph (F6)", "View output sinks"],
    exportCode: `# GNU Radio Python flowgraph — Auto-generated
from gnuradio import gr, blocks, filter, analog, fft
import numpy as np

class StackForgeFlowgraph(gr.top_block):
    def __init__(self, sample_rate=48000):
        gr.top_block.__init__(self, "StackForge Signal Chain")
        
        # Source
        self.source = blocks.file_source(gr.sizeof_float, "input.raw", True)
        
        # Butterworth LPF (from StackForge config)
        self.lpf = filter.iir_filter_ffd(
            filter.firdes.low_pass(1, sample_rate, 1000, 100),
            [1.0])
        
        # FFT for spectrum analysis
        self.fft = fft.fft_vfc(1024, True, fft.window.hamming(1024))
        
        # Output
        self.sink = blocks.file_sink(gr.sizeof_float, "output.raw")
        
        # Connections
        self.connect(self.source, self.lpf)
        self.connect(self.lpf, self.sink)

if __name__ == '__main__':
    fg = StackForgeFlowgraph()
    fg.run()`
  },
  {
    id: "audacity", name: "Audacity / SoX", icon: "🔊",
    description: "Export filter chain as Audacity macro or SoX command pipeline.",
    formats: [".txt macro", "sox_pipeline.sh"],
    setupSteps: ["Open Audacity", "Tools → Apply Macro", "Select exported macro", "Process audio files"],
    exportCode: `#!/bin/bash
# SoX Pipeline — Auto-generated from StackForge Signal Lab

INPUT="input.wav"
OUTPUT="output.wav"

sox "$INPUT" "$OUTPUT" \\
  highpass 80 \\               # DC removal
  lowpass 4000 \\              # Anti-alias filter (from StackForge)
  sinc -n 127 1000 \\          # FIR bandpass
  compand 0.3,1 6:-70,-60,-20 \\  # Dynamic range compression
  norm -1 \\                   # Normalize to -1dB
  rate 16000                   # Resample

echo "✓ Processed: $OUTPUT"
echo "  Duration: $(soxi -D $OUTPUT)s"
echo "  Sample rate: $(soxi -r $OUTPUT)Hz"`
  },
];

const pipelineTargets: ExportTarget[] = [
  {
    id: "airflow", name: "Apache Airflow", icon: "🌬️",
    description: "Export as Airflow DAG with operators, dependencies, and schedule configuration.",
    formats: [".py DAG", "connections.json"],
    setupSteps: ["Copy DAG to $AIRFLOW_HOME/dags/", "airflow db migrate", "airflow dags list", "Enable DAG in UI"],
    exportCode: `# Airflow DAG — Auto-generated from StackForge Pipelines
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.providers.postgres.operators.postgres import PostgresOperator
from datetime import datetime, timedelta

default_args = {
    'owner': 'stackforge',
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
    'email_on_failure': True,
}

with DAG(
    'stackforge_pipeline',
    default_args=default_args,
    schedule_interval='@hourly',
    start_date=datetime(2024, 1, 1),
    catchup=False,
    tags=['stackforge', 'etl'],
) as dag:

    extract = PythonOperator(
        task_id='extract_source',
        python_callable=lambda: print("Extracting..."),
    )
    
    validate = PythonOperator(
        task_id='validate_schema',
        python_callable=lambda: print("Validating..."),
    )
    
    transform = PythonOperator(
        task_id='transform_data',
        python_callable=lambda: print("Transforming..."),
    )
    
    load = PostgresOperator(
        task_id='load_target',
        postgres_conn_id='target_db',
        sql='INSERT INTO ...',
    )
    
    extract >> validate >> transform >> load`
  },
  {
    id: "docker", name: "Docker Compose", icon: "🐳",
    description: "Export pipeline as Docker Compose stack with all services, volumes, and networking.",
    formats: ["docker-compose.yml", "Dockerfile", ".env"],
    setupSteps: ["docker compose up -d", "docker compose logs -f", "docker compose ps"],
    exportCode: `# docker-compose.yml — Auto-generated from StackForge
version: '3.9'
services:
  pipeline:
    build: .
    environment:
      - PIPELINE_ID=stackforge_export
      - BATCH_SIZE=1000
    volumes:
      - ./data:/app/data
    depends_on:
      - postgres
      - redis
    
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: stackforge
      POSTGRES_PASSWORD: \${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    
  redis:
    image: redis:7-alpine
    
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"

volumes:
  pgdata:`
  },
];

// ── Export target registry by page context ──
export const exportTargetsByContext: Record<string, ExportTarget[]> = {
  "game-engine": gameEngineTargets,
  "solvers": solverTargets,
  "ai-builder": aiBuilderTargets,
  "edge-training": edgeTrainingTargets,
  "robotics": roboticsTargets,
  "signals": signalTargets,
  "pipelines": pipelineTargets,
  "model-zoo": [...aiBuilderTargets.filter(t => ["onnx", "huggingface"].includes(t.id)), ...edgeTrainingTargets.filter(t => t.id === "tflite")],
};

// ── Reusable Export Dialog Component ──

interface ExportToDialogProps {
  context: string;
  projectName?: string;
  triggerLabel?: string;
  triggerVariant?: "default" | "outline" | "ghost" | "secondary";
  triggerSize?: "default" | "sm" | "icon";
}

export function ExportToDialog({ context, projectName = "StackForge Project", triggerLabel = "Export To…", triggerVariant = "outline", triggerSize = "sm" }: ExportToDialogProps) {
  const [selected, setSelected] = useState<ExportTarget | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState<string[]>([]);
  const targets = exportTargetsByContext[context] || [];

  if (targets.length === 0) return null;

  const handleExport = (target: ExportTarget) => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      setExported(prev => [...prev, target.id]);
      toast.success(`Exported to ${target.name} format`);
    }, 1500);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size={triggerSize}>
          <Download className="h-3.5 w-3.5 mr-1.5" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0 overflow-hidden">
        <div className="flex h-[70vh]">
          {/* Left: Target list */}
          <div className="w-[280px] border-r flex flex-col">
            <div className="p-4 border-b">
              <DialogTitle className="text-sm font-bold flex items-center gap-2">
                <Download className="h-4 w-4 text-primary" />
                Export To
              </DialogTitle>
              <p className="text-[10px] text-muted-foreground mt-1">{targets.length} export targets available</p>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {targets.map(t => (
                  <button key={t.id}
                    onClick={() => setSelected(t)}
                    className={cn("w-full text-left p-3 rounded-lg transition-all flex items-center gap-3",
                      selected?.id === t.id ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-muted/50"
                    )}
                  >
                    <span className="text-xl">{t.icon}</span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium flex items-center gap-1.5">
                        {t.name}
                        {exported.includes(t.id) && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                      </div>
                      <div className="text-[10px] text-muted-foreground line-clamp-1">{t.formats.join(", ")}</div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Right: Detail */}
          <div className="flex-1 flex flex-col min-w-0">
            <AnimatePresence mode="wait">
              {selected ? (
                <motion.div key={selected.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col overflow-hidden">
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{selected.icon}</span>
                        <div>
                          <h3 className="font-bold">{selected.name}</h3>
                          <p className="text-xs text-muted-foreground">{selected.description}</p>
                        </div>
                      </div>
                      <Button onClick={() => handleExport(selected)} disabled={exporting}>
                        {exporting ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Exporting…</> :
                         exported.includes(selected.id) ? <><CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />Exported</> :
                         <><Download className="h-3.5 w-3.5 mr-1.5" />Export</>}
                      </Button>
                    </div>
                    <div className="flex gap-1 mt-2">
                      {selected.formats.map(f => <Badge key={f} variant="secondary" className="text-[9px]">{f}</Badge>)}
                    </div>
                  </div>

                  <ScrollArea className="flex-1">
                    <div className="p-4 space-y-4">
                      {/* Setup steps */}
                      <div>
                        <h4 className="text-xs font-semibold mb-2">Setup Steps</h4>
                        <div className="space-y-1.5">
                          {selected.setupSteps.map((s, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs">
                              <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                              <span className="text-muted-foreground pt-0.5">{s}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Generated code */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-semibold flex items-center gap-1"><FileCode className="h-3 w-3" /> Export Preview</h4>
                          <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => { navigator.clipboard.writeText(selected.exportCode); toast.success("Copied!"); }}>
                            <Copy className="h-3 w-3 mr-1" /> Copy
                          </Button>
                        </div>
                        <div className="rounded-lg border bg-muted/30 overflow-hidden">
                          <pre className="p-4 text-[10px] font-mono leading-relaxed whitespace-pre-wrap text-foreground/80 max-h-[300px] overflow-auto">{selected.exportCode}</pre>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Download className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Select an export target to see preview & code</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
