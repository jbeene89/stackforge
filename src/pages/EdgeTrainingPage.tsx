import { useState, useRef, useEffect } from "react";
import { ExportToDialog } from "@/components/ExportToDialog";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Cpu, Wifi, Battery, Thermometer, HardDrive, MemoryStick,
  Camera, Radio, Scan, Eye, Layers, Play, Square, RotateCcw,
  Download, Upload, CheckCircle2, AlertTriangle, Activity, X,
  Settings, ChevronRight, Zap, Box, Code2, Terminal, Navigation,
  Gauge, Clock, ArrowRight, Sparkles, Loader2, Copy,
  MonitorSpeaker, CircuitBoard, Usb
} from "lucide-react";
// ── Hardware Profiles ──────────────────────────────────────
interface PiProfile {
  id: string;
  name: string;
  cpu: string;
  ram: string;
  gpu: string;
  tflopsMax: string;
  tdp: string;
  price: string;
  interfaces: string[];
}

const piProfiles: PiProfile[] = [
  {
    id: "rpi4-4gb", name: "Raspberry Pi 4B (4GB)", cpu: "BCM2711 4× A72 @ 1.8GHz", ram: "4GB LPDDR4",
    gpu: "VideoCore VI @ 500MHz", tflopsMax: "0.5 TOPS (INT8 w/ NCS2)", tdp: "7.5W max",
    price: "$55", interfaces: ["USB 3.0 ×2", "USB 2.0 ×2", "GPIO 40-pin", "CSI", "I²C", "SPI", "UART"]
  },
  {
    id: "rpi4-8gb", name: "Raspberry Pi 4B (8GB)", cpu: "BCM2711 4× A72 @ 1.8GHz", ram: "8GB LPDDR4",
    gpu: "VideoCore VI @ 500MHz", tflopsMax: "0.5 TOPS (INT8 w/ NCS2)", tdp: "7.5W max",
    price: "$75", interfaces: ["USB 3.0 ×2", "USB 2.0 ×2", "GPIO 40-pin", "CSI", "I²C", "SPI", "UART"]
  },
  {
    id: "rpi5-4gb", name: "Raspberry Pi 5 (4GB)", cpu: "BCM2712 4× A76 @ 2.4GHz", ram: "4GB LPDDR4X",
    gpu: "VideoCore VII @ 800MHz", tflopsMax: "2.0 TOPS (INT8 w/ AI HAT+)", tdp: "12W max",
    price: "$60", interfaces: ["USB 3.0 ×2", "USB 2.0 ×2", "PCIe 2.0 ×1", "GPIO 40-pin", "CSI ×2", "I²C", "SPI", "UART"]
  },
  {
    id: "rpi5-8gb", name: "Raspberry Pi 5 (8GB)", cpu: "BCM2712 4× A76 @ 2.4GHz", ram: "8GB LPDDR4X",
    gpu: "VideoCore VII @ 800MHz", tflopsMax: "2.0 TOPS (INT8 w/ AI HAT+)", tdp: "12W max",
    price: "$80", interfaces: ["USB 3.0 ×2", "USB 2.0 ×2", "PCIe 2.0 ×1", "GPIO 40-pin", "CSI ×2", "I²C", "SPI", "UART"]
  },
];

// ── Sensor Definitions ─────────────────────────────────────
interface Sensor {
  id: string;
  name: string;
  type: "lidar" | "depth-camera" | "imu" | "ultrasonic" | "infrared" | "encoder" | "gps" | "tof";
  interface: string;
  dataRate: string;
  resolution: string;
  range: string;
  driver: string;
  price: string;
  powerDraw: string;
  dataFormat: string;
  setupCode: string;
}

const sensorCatalog: Sensor[] = [
  // LiDAR
  {
    id: "sen-01", name: "RPLiDAR A1M8", type: "lidar", interface: "UART (USB adapter)",
    dataRate: "8,000 samples/sec", resolution: "360° / 0.5° angular", range: "0.15m – 12m",
    driver: "rplidar_sdk", price: "$99", powerDraw: "2.5W", dataFormat: "angle, distance, quality",
    setupCode: `from rplidar import RPLidar

lidar = RPLidar('/dev/ttyUSB0', baudrate=115200)

info = lidar.get_info()
print(f"Model: {info['model']}, FW: {info['firmware']}")

health = lidar.get_health()
print(f"Health: {health[0]}")

# Continuous scan
for scan in lidar.iter_scans(max_buf_meas=500):
    for (quality, angle, distance) in scan:
        if quality > 10 and distance > 0:
            x = distance * math.cos(math.radians(angle))
            y = distance * math.sin(math.radians(angle))
            point_cloud.append((x, y, quality))
    
    # Process 360° sweep
    occupancy_grid.update(point_cloud)
    point_cloud.clear()

lidar.stop()
lidar.disconnect()`
  },
  {
    id: "sen-02", name: "RPLiDAR A2M12", type: "lidar", interface: "UART (USB adapter)",
    dataRate: "16,000 samples/sec", resolution: "360° / 0.225° angular", range: "0.2m – 18m",
    driver: "rplidar_sdk", price: "$319", powerDraw: "3.0W", dataFormat: "angle, distance, quality, flag",
    setupCode: `from rplidar import RPLidar
import numpy as np

lidar = RPLidar('/dev/ttyUSB0', baudrate=256000)
lidar.set_pwm(660)  # Motor speed control

for scan in lidar.iter_scans(scan_type='express', max_buf_meas=1500):
    angles = np.array([m[1] for m in scan])
    distances = np.array([m[2] for m in scan])
    
    # Convert to cartesian
    x = distances * np.cos(np.radians(angles))
    y = distances * np.sin(np.radians(angles))
    
    # ICP scan matching for SLAM
    transform = icp_match(prev_cloud, np.column_stack([x, y]))
    pose = pose @ transform
    map_points = np.vstack([map_points, (transform @ np.column_stack([x, y, np.ones(len(x))]).T).T[:, :2]])

lidar.stop()
lidar.disconnect()`
  },
  {
    id: "sen-03", name: "YDLIDAR X4", type: "lidar", interface: "UART (USB adapter)",
    dataRate: "5,000 samples/sec", resolution: "360° / 0.5° angular", range: "0.12m – 10m",
    driver: "ydlidar_sdk", price: "$69", powerDraw: "2.0W", dataFormat: "angle, range, intensity",
    setupCode: `import ydlidar
import math

ports = ydlidar.lidarPortList()
laser = ydlidar.CYdLidar()
laser.setlidaropt(ydlidar.LidarPropSerialPort, "/dev/ttyUSB0")
laser.setlidaropt(ydlidar.LidarPropSerialBaudrate, 128000)
laser.setlidaropt(ydlidar.LidarPropLidarType, ydlidar.TYPE_TRIANGLE)
laser.setlidaropt(ydlidar.LidarPropSampleRate, 5)
laser.setlidaropt(ydlidar.LidarPropSingleChannel, False)

laser.initialize()
laser.turnOn()

scan = ydlidar.LaserScan()
while ydlidar.os_isOk():
    if laser.doProcessSimple(scan):
        for point in scan.points:
            angle = math.degrees(point.angle)
            dist = point.range
            if 0.12 < dist < 10.0:
                process_point(angle, dist, point.intensity)

laser.turnOff()
laser.disconnecting()`
  },
  // Depth Cameras
  {
    id: "sen-04", name: "Intel RealSense D435i", type: "depth-camera", interface: "USB 3.0",
    dataRate: "90 FPS (depth), 30 FPS (RGB)", resolution: "1280×720 (depth), 1920×1080 (RGB)", range: "0.1m – 10m",
    driver: "librealsense2", price: "$349", powerDraw: "4.5W", dataFormat: "depth_frame, color_frame, imu_data",
    setupCode: `import pyrealsense2 as rs
import numpy as np
import cv2

pipeline = rs.pipeline()
config = rs.config()

# Configure streams
config.enable_stream(rs.stream.depth, 640, 480, rs.format.z16, 30)
config.enable_stream(rs.stream.color, 640, 480, rs.format.bgr8, 30)
config.enable_stream(rs.stream.accel, rs.format.motion_xyz32f, 200)
config.enable_stream(rs.stream.gyro, rs.format.motion_xyz32f, 200)

profile = pipeline.start(config)

# Get depth scale
depth_sensor = profile.get_device().first_depth_sensor()
depth_scale = depth_sensor.get_depth_scale()

# Align depth to color
align = rs.align(rs.stream.color)

# Filters for depth quality
decimation = rs.decimation_filter()
spatial = rs.spatial_filter()
temporal = rs.temporal_filter()
hole_filling = rs.hole_filling_filter()

try:
    while True:
        frames = pipeline.wait_for_frames()
        aligned = align.process(frames)
        
        depth_frame = aligned.get_depth_frame()
        color_frame = aligned.get_color_frame()
        
        # Apply filters
        depth_frame = decimation.process(depth_frame)
        depth_frame = spatial.process(depth_frame)
        depth_frame = temporal.process(depth_frame)
        
        depth_image = np.asanyarray(depth_frame.get_data())
        color_image = np.asanyarray(color_frame.get_data())
        
        # 3D point cloud generation
        pc = rs.pointcloud()
        pc.map_to(color_frame)
        points = pc.calculate(depth_frame)
        vertices = np.asanyarray(points.get_vertices()).view(np.float32).reshape(-1, 3)
        
        # IMU data
        accel = frames.first_or_default(rs.stream.accel)
        gyro = frames.first_or_default(rs.stream.gyro)
        if accel:
            a = accel.as_motion_frame().get_motion_data()
            imu_accel = [a.x, a.y, a.z]
        
        # Process depth + RGB + IMU fusion
        process_multimodal(color_image, depth_image, vertices, imu_accel)

finally:
    pipeline.stop()`
  },
  {
    id: "sen-05", name: "OAK-D Lite (Luxonis)", type: "depth-camera", interface: "USB 3.0 / USB-C",
    dataRate: "30 FPS stereo depth", resolution: "640×480 (depth), 4032×3040 (RGB)", range: "0.2m – 19.1m",
    driver: "depthai", price: "$149", powerDraw: "3.5W", dataFormat: "depth_map, rgb_frame, nn_output",
    setupCode: `import depthai as dai
import numpy as np
import cv2

pipeline = dai.Pipeline()

# Color camera
cam_rgb = pipeline.create(dai.node.ColorCamera)
cam_rgb.setPreviewSize(416, 416)  # For NN input
cam_rgb.setResolution(dai.ColorCameraProperties.SensorResolution.THE_1080_P)
cam_rgb.setInterleaved(False)

# Stereo depth
mono_left = pipeline.create(dai.node.MonoCamera)
mono_right = pipeline.create(dai.node.MonoCamera)
stereo = pipeline.create(dai.node.StereoDepth)
mono_left.setResolution(dai.MonoCameraProperties.SensorResolution.THE_400_P)
mono_right.setResolution(dai.MonoCameraProperties.SensorResolution.THE_400_P)
mono_left.setBoardSocket(dai.CameraBoardSocket.CAM_B)
mono_right.setBoardSocket(dai.CameraBoardSocket.CAM_C)
stereo.setDefaultProfilePreset(dai.node.StereoDepth.PresetMode.HIGH_DENSITY)
stereo.setDepthAlign(dai.CameraBoardSocket.CAM_A)

mono_left.out.link(stereo.left)
mono_right.out.link(stereo.right)

# On-device neural network (MobileNet-SSD)
nn = pipeline.create(dai.node.MobileNetDetectionNetwork)
nn.setConfidenceThreshold(0.5)
nn.setBlobPath("/models/mobilenet-ssd_openvino_2021.4_6shave.blob")
cam_rgb.preview.link(nn.input)

# Outputs
xout_rgb = pipeline.create(dai.node.XLinkOut)
xout_depth = pipeline.create(dai.node.XLinkOut)
xout_nn = pipeline.create(dai.node.XLinkOut)
xout_rgb.setStreamName("rgb")
xout_depth.setStreamName("depth")
xout_nn.setStreamName("nn")

cam_rgb.preview.link(xout_rgb.input)
stereo.depth.link(xout_depth.input)
nn.out.link(xout_nn.input)

with dai.Device(pipeline) as device:
    q_rgb = device.getOutputQueue("rgb", maxSize=4, blocking=False)
    q_depth = device.getOutputQueue("depth", maxSize=4, blocking=False)
    q_nn = device.getOutputQueue("nn", maxSize=4, blocking=False)
    
    while True:
        rgb_frame = q_rgb.get().getCvFrame()
        depth_frame = q_depth.get().getFrame()
        detections = q_nn.get().detections
        
        for det in detections:
            # 3D localization: combine detection + depth
            x_center = int((det.xmin + det.xmax) / 2 * depth_frame.shape[1])
            y_center = int((det.ymin + det.ymax) / 2 * depth_frame.shape[0])
            z_mm = depth_frame[y_center, x_center]
            
            label = labels[det.label]
            confidence = det.confidence
            print(f"{label} ({confidence:.0%}) at {z_mm/1000:.2f}m")`
  },
  {
    id: "sen-06", name: "Arducam ToF Camera", type: "tof", interface: "CSI (MIPI)",
    dataRate: "30 FPS", resolution: "240×180 depth", range: "0.2m – 4m",
    driver: "arducam_tof_sdk", price: "$79", powerDraw: "1.5W", dataFormat: "depth_frame, confidence_frame, amplitude_frame",
    setupCode: `import ArducamDepthCamera as ac
import numpy as np
import cv2

cam = ac.ArducamCamera()
ret = cam.open(ac.TOFConnect.CSI, 0)
ret = cam.start(ac.TOFOutput.DEPTH)

cam.setControl(ac.TOFControl.RANG, 4)  # Max range 4m

while True:
    frame = cam.requestFrame(200)  # 200ms timeout
    if frame is not None:
        depth_buf = frame.getDepthData()
        confidence_buf = frame.getConfidenceData()
        amplitude_buf = frame.getAmplitudeData()
        
        # Filter by confidence
        mask = confidence_buf > 30
        filtered_depth = np.where(mask, depth_buf, 0)
        
        # Colorize for visualization
        depth_colormap = cv2.applyColorMap(
            cv2.convertScaleAbs(filtered_depth, alpha=0.03),
            cv2.COLORMAP_JET
        )
        
        # 3D point cloud from depth
        fx, fy = cam.getIntrinsicParameters()
        cx, cy = depth_buf.shape[1] / 2, depth_buf.shape[0] / 2
        u, v = np.meshgrid(np.arange(depth_buf.shape[1]), np.arange(depth_buf.shape[0]))
        x_3d = (u - cx) * filtered_depth / fx
        y_3d = (v - cy) * filtered_depth / fy
        z_3d = filtered_depth
        
        points = np.stack([x_3d, y_3d, z_3d], axis=-1).reshape(-1, 3)
        valid = points[:, 2] > 0
        point_cloud = points[valid]
        
        cam.releaseFrame(frame)

cam.stop()
cam.close()`
  },
  // IMU
  {
    id: "sen-07", name: "BNO085 9-DOF IMU", type: "imu", interface: "I²C / SPI",
    dataRate: "400Hz accel/gyro, 100Hz mag", resolution: "16-bit per axis", range: "±8g / ±2000°/s",
    driver: "adafruit_bno08x", price: "$25", powerDraw: "0.1W", dataFormat: "quaternion, accel, gyro, mag",
    setupCode: `import board
import busio
from adafruit_bno08x.i2c import BNO08X_I2C
from adafruit_bno08x import (
    BNO_REPORT_ROTATION_VECTOR,
    BNO_REPORT_ACCELEROMETER,
    BNO_REPORT_GYROSCOPE,
    BNO_REPORT_MAGNETOMETER,
    BNO_REPORT_GAME_ROTATION_VECTOR,
)

i2c = busio.I2C(board.SCL, board.SDA, frequency=400000)
imu = BNO08X_I2C(i2c)

# Enable reports
imu.enable_feature(BNO_REPORT_ROTATION_VECTOR)   # Absolute orientation
imu.enable_feature(BNO_REPORT_ACCELEROMETER)       # Linear acceleration
imu.enable_feature(BNO_REPORT_GYROSCOPE)           # Angular velocity
imu.enable_feature(BNO_REPORT_GAME_ROTATION_VECTOR) # Game rotation (no mag)

while True:
    # Fused orientation (quaternion)
    quat = imu.quaternion  # (w, x, y, z)
    
    # Raw sensor data
    accel = imu.acceleration      # (x, y, z) m/s²
    gyro = imu.gyro               # (x, y, z) rad/s
    
    # Compute Euler angles from quaternion
    import math
    w, x, y, z = quat
    roll = math.atan2(2*(w*x + y*z), 1 - 2*(x*x + y*y))
    pitch = math.asin(max(-1, min(1, 2*(w*y - z*x))))
    yaw = math.atan2(2*(w*z + x*y), 1 - 2*(y*y + z*z))
    
    # Feed to EKF/UKF for sensor fusion
    ekf.predict(gyro, dt)
    ekf.update_imu(accel, quat)
    
    fused_state = ekf.get_state()  # position, velocity, orientation`
  },
  // Ultrasonic
  {
    id: "sen-08", name: "HC-SR04 Ultrasonic Array", type: "ultrasonic", interface: "GPIO",
    dataRate: "40Hz per sensor", resolution: "3mm", range: "0.02m – 4m",
    driver: "RPi.GPIO / gpiozero", price: "$3 each", powerDraw: "0.075W", dataFormat: "distance_cm",
    setupCode: `from gpiozero import DistanceSensor
from time import sleep
import numpy as np

# 4-sensor array for 180° coverage
sensors = [
    DistanceSensor(echo=17, trigger=4,  max_distance=4),  # Left
    DistanceSensor(echo=27, trigger=22, max_distance=4),  # Front-left
    DistanceSensor(echo=5,  trigger=6,  max_distance=4),  # Front-right
    DistanceSensor(echo=25, trigger=24, max_distance=4),  # Right
]
labels = ["left", "front_left", "front_right", "right"]
angles = [-90, -30, 30, 90]  # Mounting angles

while True:
    readings = {}
    for sensor, label, angle in zip(sensors, labels, angles):
        distance = sensor.distance * 100  # Convert to cm
        readings[label] = {
            "distance_cm": round(distance, 1),
            "angle_deg": angle,
            "in_range": 2 < distance < 400,
        }
    
    # Simple obstacle avoidance logic
    min_dist = min(r["distance_cm"] for r in readings.values() if r["in_range"])
    if min_dist < 30:
        # Emergency stop or reroute
        closest = min(readings.items(), key=lambda x: x[1]["distance_cm"])
        avoid_angle = -closest[1]["angle_deg"]  # Turn away
        motor_controller.set_heading(avoid_angle)
    
    sleep(0.025)  # 40Hz update`
  },
  // GPS
  {
    id: "sen-09", name: "BN-880Q GPS/GLONASS", type: "gps", interface: "UART / I²C",
    dataRate: "10Hz fix rate", resolution: "2.5m CEP (SBAS: 1.5m)", range: "Global",
    driver: "gpsd / pynmea2", price: "$18", powerDraw: "0.15W", dataFormat: "NMEA sentences (GGA, RMC, VTG)",
    setupCode: `import serial
import pynmea2
from datetime import datetime

gps = serial.Serial('/dev/ttyS0', baudrate=9600, timeout=1)

# Configure for 10Hz update rate (UBX protocol)
# UBX-CFG-RATE: 100ms measurement period
ubx_rate = bytes([
    0xB5, 0x62, 0x06, 0x08, 0x06, 0x00,
    0x64, 0x00,  # 100ms
    0x01, 0x00,  # 1 cycle
    0x01, 0x00,  # UTC
    0x7A, 0x12   # checksum
])
gps.write(ubx_rate)

while True:
    line = gps.readline().decode('ascii', errors='ignore').strip()
    
    if line.startswith('$GNGGA') or line.startswith('$GPGGA'):
        msg = pynmea2.parse(line)
        lat = msg.latitude
        lon = msg.longitude
        alt = msg.altitude
        fix_quality = msg.gps_qual  # 0=no fix, 1=GPS, 2=DGPS
        num_sats = int(msg.num_sats)
        hdop = float(msg.horizontal_dil)
        
        gps_state = {
            "lat": lat, "lon": lon, "alt": alt,
            "fix": fix_quality, "sats": num_sats, "hdop": hdop,
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        # Feed to EKF for GPS+IMU fusion
        if fix_quality >= 1:
            ekf.update_gps(lat, lon, alt, hdop)
            fused_position = ekf.get_position()`
  },
];

// ── Training Configs ────────────────────────────────────────
interface TrainTask {
  id: string;
  name: string;
  description: string;
  modelArch: string;
  inputSensors: string[];
  outputType: string;
  datasetSize: string;
  trainingTime: string;
  inferenceSpeed: string;
  accuracy: string;
}

const trainingTasks: TrainTask[] = [
  {
    id: "tt-01", name: "LiDAR Obstacle Classifier", description: "Train a lightweight PointNet to classify obstacles from LiDAR point clouds into categories: wall, person, vehicle, furniture, unknown.",
    modelArch: "PointNet-Tiny (280K params)", inputSensors: ["RPLiDAR A1M8", "RPLiDAR A2M12", "YDLIDAR X4"],
    outputType: "Classification (5 classes)", datasetSize: "~5,000 labeled scans", trainingTime: "~45 min on Pi 5",
    inferenceSpeed: "12ms per scan", accuracy: "94.2% top-1"
  },
  {
    id: "tt-02", name: "Depth-Based Object Detection", description: "MobileNet-SSD trained on RGBD data for detecting objects with 3D localization using depth maps from RealSense or OAK-D.",
    modelArch: "MobileNetV3-SSD (2.1M params)", inputSensors: ["Intel RealSense D435i", "OAK-D Lite"],
    outputType: "2D bbox + depth → 3D position", datasetSize: "~10,000 annotated frames", trainingTime: "~3 hrs on Pi 5 (transfer learning)",
    inferenceSpeed: "28ms per frame (INT8)", accuracy: "78.4 mAP@0.5"
  },
  {
    id: "tt-03", name: "Visual-Inertial Odometry (VIO)", description: "Train a TinyONet to predict relative pose from stereo images + IMU. Self-supervised with photometric loss.",
    modelArch: "TinyONet (1.8M params)", inputSensors: ["Intel RealSense D435i", "BNO085 IMU"],
    outputType: "6-DOF relative pose (SE3)", datasetSize: "~20 min recording (~36K frames)", trainingTime: "~6 hrs on Pi 5",
    inferenceSpeed: "18ms per frame pair", accuracy: "0.8% translational drift"
  },
  {
    id: "tt-04", name: "Terrain Classification", description: "CNN classifier for ground surface types using depth camera. Identifies: asphalt, grass, gravel, carpet, tile for adaptive locomotion.",
    modelArch: "EfficientNet-Lite0 (4.7M params)", inputSensors: ["OAK-D Lite", "Arducam ToF"],
    outputType: "Classification (5 terrain types)", datasetSize: "~3,000 depth patches", trainingTime: "~30 min on Pi 5 (transfer learning)",
    inferenceSpeed: "8ms per patch", accuracy: "96.1% top-1"
  },
  {
    id: "tt-05", name: "Multi-Sensor Fusion SLAM", description: "Train a learned loop closure detector + feature matcher for LiDAR+depth+IMU SLAM. Uses NetVLAD-Tiny for place recognition.",
    modelArch: "NetVLAD-Tiny + SuperPoint-Lite", inputSensors: ["RPLiDAR A2M12", "Intel RealSense D435i", "BNO085 IMU"],
    outputType: "Loop closure probability + match", datasetSize: "~50 mapping sessions", trainingTime: "~8 hrs on Pi 5",
    inferenceSpeed: "35ms per query", accuracy: "91.7% recall@1"
  },
  {
    id: "tt-06", name: "Proximity Alert Classifier", description: "Tiny neural network for classifying ultrasonic+ToF proximity patterns into threat levels: safe, caution, warning, critical.",
    modelArch: "MLP (12K params)", inputSensors: ["HC-SR04 Array", "Arducam ToF"],
    outputType: "Threat level (4 classes)", datasetSize: "~2,000 scenarios", trainingTime: "~5 min on Pi 4",
    inferenceSpeed: "0.3ms per inference", accuracy: "98.7% accuracy"
  },
];

// ── Component ──────────────────────────────────────────────

type PageStep = "hardware" | "sensors" | "training" | "deploy";

export default function EdgeTrainingPage() {
  const [step, setStep] = useState<PageStep>("hardware");
  const [selectedPi, setSelectedPi] = useState<PiProfile>(piProfiles[3]); // Default Pi 5 8GB
  const [selectedSensors, setSelectedSensors] = useState<string[]>([]);
  const [selectedTask, setSelectedTask] = useState<TrainTask | null>(null);
  const [viewSensor, setViewSensor] = useState<Sensor | null>(null);
  const [training, setTraining] = useState(false);
  const [trainProgress, setTrainProgress] = useState(0);
  const [trainLog, setTrainLog] = useState<string[]>([]);
  const [epochs, setEpochs] = useState(50);
  const [batchSize, setBatchSize] = useState(16);
  const [learningRate, setLearningRate] = useState(0.001);
  const [quantize, setQuantize] = useState(true);

  const steps: { key: PageStep; label: string; icon: any }[] = [
    { key: "hardware", label: "1. Hardware", icon: CircuitBoard },
    { key: "sensors", label: "2. Sensors", icon: Scan },
    { key: "training", label: "3. Train", icon: Sparkles },
    { key: "deploy", label: "4. Deploy", icon: Download },
  ];

  const toggleSensor = (id: string) => {
    setSelectedSensors(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const startTraining = () => {
    if (!selectedTask) return;
    setTraining(true);
    setTrainProgress(0);
    setTrainLog([
      `[${new Date().toLocaleTimeString()}] Initializing ${selectedTask.modelArch}…`,
      `[${new Date().toLocaleTimeString()}] Target: ${selectedPi.name}`,
      `[${new Date().toLocaleTimeString()}] Sensors: ${selectedSensors.length} configured`,
      `[${new Date().toLocaleTimeString()}] Quantization: ${quantize ? "INT8 (TFLite)" : "FP32"}`,
      `[${new Date().toLocaleTimeString()}] Loading dataset (${selectedTask.datasetSize})…`,
    ]);

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 4 + 1;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTraining(false);
        setTrainLog(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] ✓ Training complete — ${selectedTask.accuracy}`,
          `[${new Date().toLocaleTimeString()}] ✓ Model exported: ${selectedTask.name.toLowerCase().replace(/\s+/g, "_")}_${quantize ? "int8" : "fp32"}.tflite`,
          `[${new Date().toLocaleTimeString()}] ✓ Size: ${quantize ? "1.2MB" : "4.8MB"} | Inference: ${selectedTask.inferenceSpeed}`,
        ]);
        toast.success("Training complete! Model ready for deployment.");
      }
      setTrainProgress(Math.min(progress, 100));

      // Simulate log entries
      const epoch = Math.floor(progress / (100 / epochs));
      if (epoch > 0 && epoch <= epochs) {
        const loss = (2.5 * Math.exp(-epoch * 0.06) + 0.08 + Math.random() * 0.02).toFixed(4);
        const acc = (Math.min(0.99, 0.5 + 0.49 * (1 - Math.exp(-epoch * 0.08))) + (Math.random() - 0.5) * 0.02).toFixed(4);
        setTrainLog(prev => {
          const last = prev[prev.length - 1];
          if (last?.includes(`Epoch ${epoch}/`)) return prev;
          return [...prev, `[${new Date().toLocaleTimeString()}] Epoch ${epoch}/${epochs} — loss: ${loss}, acc: ${acc}`];
        });
      }
    }, 300);
  };

  const totalPower = selectedSensors.reduce((sum, id) => {
    const s = sensorCatalog.find(x => x.id === id);
    return sum + (s ? parseFloat(s.powerDraw) : 0);
  }, parseFloat(selectedPi.tdp));

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Left: Steps */}
      <div className="w-[260px] border-r flex flex-col">
        <div className="p-4">
          <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <CircuitBoard className="h-5 w-5 text-primary" />
            Edge AI Trainer
          </h1>
          <p className="text-[10px] text-muted-foreground mt-1">Train & deploy AI on Raspberry Pi with full sensor fusion</p>
          <div className="mt-2"><ExportToDialog context="edge-training" projectName="Edge AI" triggerSize="sm" /></div>
        </div>
        <Separator />
        <div className="p-2 space-y-1">
          {steps.map(s => (
            <button key={s.key}
              onClick={() => setStep(s.key)}
              className={cn("w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors text-left",
                step === s.key ? "bg-primary text-primary-foreground" : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
              )}
            >
              <s.icon className="h-4 w-4" />{s.label}
            </button>
          ))}
        </div>
        <Separator />
        {/* Summary panel */}
        <div className="flex-1 p-4 space-y-3">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Config Summary</p>
          <div className="space-y-2">
            <div className="p-2 rounded-md bg-muted/50">
              <div className="text-[10px] text-muted-foreground">Board</div>
              <div className="text-xs font-medium">{selectedPi.name}</div>
            </div>
            <div className="p-2 rounded-md bg-muted/50">
              <div className="text-[10px] text-muted-foreground">Sensors</div>
              <div className="text-xs font-medium">{selectedSensors.length} selected</div>
            </div>
            <div className="p-2 rounded-md bg-muted/50">
              <div className="text-[10px] text-muted-foreground">Power Budget</div>
              <div className="text-xs font-medium">{totalPower.toFixed(1)}W total</div>
            </div>
            {selectedTask && (
              <div className="p-2 rounded-md bg-primary/10 border border-primary/20">
                <div className="text-[10px] text-primary">Training Task</div>
                <div className="text-xs font-medium">{selectedTask.name}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <AnimatePresence mode="wait">
          {/* ── STEP 1: Hardware ── */}
          {step === "hardware" && (
            <motion.div key="hw" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 overflow-auto p-6 space-y-6">
              <div>
                <h2 className="text-xl font-bold">Select Target Hardware</h2>
                <p className="text-sm text-muted-foreground">Choose your Raspberry Pi model. This determines compute budget, RAM, and available interfaces.</p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {piProfiles.map(pi => (
                  <div key={pi.id}
                    onClick={() => setSelectedPi(pi)}
                    className={cn("border rounded-lg p-5 cursor-pointer transition-all hover:shadow-md",
                      selectedPi.id === pi.id ? "ring-2 ring-primary bg-primary/5" : "hover:bg-accent/5"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{pi.name}</h3>
                        <Badge variant="outline" className="mt-1">{pi.price}</Badge>
                      </div>
                      {selectedPi.id === pi.id && <CheckCircle2 className="h-5 w-5 text-primary" />}
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="text-xs"><span className="text-muted-foreground">CPU:</span> <span className="font-medium">{pi.cpu}</span></div>
                      <div className="text-xs"><span className="text-muted-foreground">RAM:</span> <span className="font-medium">{pi.ram}</span></div>
                      <div className="text-xs"><span className="text-muted-foreground">GPU:</span> <span className="font-medium">{pi.gpu}</span></div>
                      <div className="text-xs"><span className="text-muted-foreground">AI Perf:</span> <span className="font-medium">{pi.tflopsMax}</span></div>
                      <div className="text-xs"><span className="text-muted-foreground">TDP:</span> <span className="font-medium">{pi.tdp}</span></div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {pi.interfaces.map(i => <Badge key={i} variant="secondary" className="text-[9px]">{i}</Badge>)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setStep("sensors")}>Next: Sensors <ArrowRight className="h-3.5 w-3.5 ml-1.5" /></Button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Sensors ── */}
          {step === "sensors" && (
            <motion.div key="sens" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex overflow-hidden">
              <div className="flex-1 overflow-auto p-6 space-y-4">
                <div>
                  <h2 className="text-xl font-bold">Configure Sensor Stack</h2>
                  <p className="text-sm text-muted-foreground">Select sensors for your robot. Each includes wiring, driver setup, and full Python code.</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {sensorCatalog.map(s => {
                    const checked = selectedSensors.includes(s.id);
                    return (
                      <div key={s.id}
                        className={cn("border rounded-lg p-4 cursor-pointer transition-all", checked ? "ring-2 ring-primary bg-primary/5" : "hover:bg-accent/5")}
                        onClick={() => toggleSensor(s.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={cn("p-2 rounded-md shrink-0", s.type === "lidar" ? "bg-cyan-500/10" : s.type === "depth-camera" ? "bg-purple-500/10" : s.type === "tof" ? "bg-orange-500/10" : s.type === "imu" ? "bg-green-500/10" : "bg-muted")}>
                              {s.type === "lidar" ? <Scan className="h-4 w-4 text-cyan-500" /> :
                               s.type === "depth-camera" ? <Camera className="h-4 w-4 text-purple-500" /> :
                               s.type === "tof" ? <Eye className="h-4 w-4 text-orange-500" /> :
                               s.type === "imu" ? <Activity className="h-4 w-4 text-green-500" /> :
                               s.type === "gps" ? <Navigation className="h-4 w-4 text-blue-500" /> :
                               <Radio className="h-4 w-4 text-muted-foreground" />}
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm">{s.name}</h3>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <Badge variant="outline" className="text-[9px]">{s.type}</Badge>
                                <Badge variant="secondary" className="text-[9px]">{s.interface}</Badge>
                                <span className="text-[10px] text-muted-foreground">{s.price}</span>
                              </div>
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-[10px] text-muted-foreground">{s.range}</span>
                                <span className="text-[10px] text-muted-foreground">{s.dataRate}</span>
                                <span className="text-[10px] text-muted-foreground">{s.powerDraw}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={e => { e.stopPropagation(); setViewSensor(s); }}>
                              <Code2 className="h-3 w-3 mr-1" /> Code
                            </Button>
                            <div className={cn("h-5 w-5 rounded border-2 flex items-center justify-center transition-colors", checked ? "bg-primary border-primary" : "border-muted-foreground/30")}>
                              {checked && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={() => setStep("hardware")}>Back</Button>
                  <Button onClick={() => setStep("training")} disabled={selectedSensors.length === 0}>
                    Next: Training <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Button>
                </div>
              </div>

              {/* Sensor code viewer */}
              <AnimatePresence>
                {viewSensor && (
                  <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 440, opacity: 1 }} exit={{ width: 0, opacity: 0 }} className="border-l bg-card overflow-hidden shrink-0">
                    <ScrollArea className="h-full">
                      <div className="p-5 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold">{viewSensor.name}</h3>
                            <Badge className="mt-1">{viewSensor.type}</Badge>
                          </div>
                          <Button size="icon" variant="ghost" onClick={() => setViewSensor(null)}><X className="h-4 w-4" /></Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { l: "Interface", v: viewSensor.interface }, { l: "Data Rate", v: viewSensor.dataRate },
                            { l: "Resolution", v: viewSensor.resolution }, { l: "Range", v: viewSensor.range },
                            { l: "Driver", v: viewSensor.driver }, { l: "Power", v: viewSensor.powerDraw },
                            { l: "Format", v: viewSensor.dataFormat },
                          ].map(({ l, v }) => (
                            <div key={l} className="p-2 rounded-md bg-muted/50">
                              <div className="text-[10px] text-muted-foreground">{l}</div>
                              <div className="text-[10px] font-medium mt-0.5">{v}</div>
                            </div>
                          ))}
                        </div>
                        <Separator />
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-semibold flex items-center gap-1"><Terminal className="h-3 w-3" /> Setup Code</h4>
                            <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => { navigator.clipboard.writeText(viewSensor.setupCode); toast.success("Copied!"); }}>
                              <Copy className="h-3 w-3 mr-1" /> Copy
                            </Button>
                          </div>
                          <div className="rounded-lg border bg-muted/30 p-3">
                            <pre className="text-[10px] font-mono leading-relaxed whitespace-pre-wrap text-foreground/80">{viewSensor.setupCode}</pre>
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── STEP 3: Training ── */}
          {step === "training" && (
            <motion.div key="train" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex overflow-hidden">
              <div className="flex-1 overflow-auto p-6 space-y-4">
                <div>
                  <h2 className="text-xl font-bold">Select & Train Model</h2>
                  <p className="text-sm text-muted-foreground">Pick a training task matched to your sensor stack. Configure hyperparameters and start training.</p>
                </div>

                {/* Task cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {trainingTasks.filter(t => {
                    // Show tasks compatible with selected sensors
                    const selectedSensorNames = selectedSensors.map(id => sensorCatalog.find(s => s.id === id)?.name || "");
                    return t.inputSensors.some(req => selectedSensorNames.some(sel => sel.includes(req.split(" ")[0]) || req.includes(sel.split(" ")[0])));
                  }).map(t => (
                    <div key={t.id}
                      onClick={() => setSelectedTask(t)}
                      className={cn("border rounded-lg p-4 cursor-pointer transition-all", selectedTask?.id === t.id ? "ring-2 ring-primary bg-primary/5" : "hover:bg-accent/5")}
                    >
                      <h3 className="font-semibold text-sm">{t.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <div className="text-[10px]"><span className="text-muted-foreground">Arch:</span> <span className="font-medium">{t.modelArch}</span></div>
                        <div className="text-[10px]"><span className="text-muted-foreground">Output:</span> <span className="font-medium">{t.outputType}</span></div>
                        <div className="text-[10px]"><span className="text-muted-foreground">Train time:</span> <span className="font-medium">{t.trainingTime}</span></div>
                        <div className="text-[10px]"><span className="text-muted-foreground">Inference:</span> <span className="font-medium">{t.inferenceSpeed}</span></div>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {t.inputSensors.map(s => <Badge key={s} variant="secondary" className="text-[9px]">{s}</Badge>)}
                      </div>
                    </div>
                  ))}
                  {trainingTasks.filter(t => {
                    const selectedSensorNames = selectedSensors.map(id => sensorCatalog.find(s => s.id === id)?.name || "");
                    return t.inputSensors.some(req => selectedSensorNames.some(sel => sel.includes(req.split(" ")[0]) || req.includes(sel.split(" ")[0])));
                  }).length === 0 && (
                    <div className="col-span-2 text-center py-8 text-muted-foreground">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No training tasks match your sensor selection. Go back and add LiDAR or depth camera sensors.</p>
                    </div>
                  )}
                </div>

                {/* Hyperparams */}
                {selectedTask && (
                  <div className="border rounded-lg p-5 space-y-4">
                    <h3 className="font-semibold text-sm">Training Configuration</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground">Epochs</label>
                        <Input type="number" value={epochs} onChange={e => setEpochs(Number(e.target.value))} min={5} max={500} className="mt-1" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Batch Size</label>
                        <Select value={String(batchSize)} onValueChange={v => setBatchSize(Number(v))}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {[4, 8, 16, 32].map(b => <SelectItem key={b} value={String(b)}>{b}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Learning Rate</label>
                        <Select value={String(learningRate)} onValueChange={v => setLearningRate(Number(v))}>
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {[0.0001, 0.0005, 0.001, 0.005, 0.01].map(lr => <SelectItem key={lr} value={String(lr)}>{lr}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">INT8 Quantization</label>
                        <div className="flex items-center gap-2 mt-2.5">
                          <Switch checked={quantize} onCheckedChange={setQuantize} />
                          <span className="text-xs">{quantize ? "ON (4× smaller)" : "OFF"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={startTraining} disabled={training} className="flex-1">
                        {training ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Training…</> : <><Play className="h-3.5 w-3.5 mr-1.5" />Start Training</>}
                      </Button>
                      {training && (
                        <Button variant="destructive" onClick={() => { setTraining(false); toast.info("Training cancelled"); }}>
                          <Square className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    {trainProgress > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-mono font-medium">{trainProgress.toFixed(1)}%</span>
                        </div>
                        <Progress value={trainProgress} className="h-2" />
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={() => setStep("sensors")}>Back</Button>
                  <Button onClick={() => setStep("deploy")} disabled={trainProgress < 100}>
                    Next: Deploy <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Button>
                </div>
              </div>

              {/* Training log */}
              {trainLog.length > 0 && (
                <div className="w-[360px] border-l bg-card flex flex-col shrink-0">
                  <div className="px-4 py-3 border-b flex items-center gap-2">
                    <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold">Training Log</span>
                    {training && <span className="ml-auto h-2 w-2 rounded-full bg-green-500 animate-pulse" />}
                  </div>
                  <ScrollArea className="flex-1">
                    <pre className="p-3 text-[10px] font-mono leading-relaxed text-foreground/70 whitespace-pre-wrap">{trainLog.join("\n")}</pre>
                  </ScrollArea>
                </div>
              )}
            </motion.div>
          )}

          {/* ── STEP 4: Deploy ── */}
          {step === "deploy" && (
            <motion.div key="deploy" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 overflow-auto p-6 space-y-6">
              <div>
                <h2 className="text-xl font-bold">Deploy to {selectedPi.name}</h2>
                <p className="text-sm text-muted-foreground">Flash-ready deployment package with model, sensor drivers, and inference runtime.</p>
              </div>

              {selectedTask && (
                <>
                  {/* Model summary */}
                  <div className="border rounded-lg p-5 space-y-4">
                    <h3 className="font-semibold flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Trained Model</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {[
                        { l: "Model", v: selectedTask.name },
                        { l: "Architecture", v: selectedTask.modelArch },
                        { l: "Format", v: quantize ? "TFLite INT8" : "TFLite FP32" },
                        { l: "Size", v: quantize ? "~1.2 MB" : "~4.8 MB" },
                        { l: "Inference", v: selectedTask.inferenceSpeed },
                        { l: "Accuracy", v: selectedTask.accuracy },
                        { l: "Target", v: selectedPi.name },
                        { l: "Sensors", v: `${selectedSensors.length} configured` },
                      ].map(({ l, v }) => (
                        <div key={l} className="p-2.5 rounded-md bg-muted/50">
                          <div className="text-[10px] text-muted-foreground">{l}</div>
                          <div className="text-xs font-medium mt-0.5">{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Deploy commands */}
                  <div className="border rounded-lg p-5 space-y-4">
                    <h3 className="font-semibold flex items-center gap-2"><Terminal className="h-4 w-4" /> Deployment Commands</h3>
                    {[
                      { title: "1. Flash Raspberry Pi OS", code: `# Download Raspberry Pi OS (64-bit)\n# Use Raspberry Pi Imager to flash SD card\n# Enable SSH and set Wi-Fi in imager settings\n\n# Boot and SSH in:\nssh pi@raspberrypi.local` },
                      { title: "2. Install Dependencies", code: `sudo apt update && sudo apt upgrade -y\nsudo apt install -y python3-pip python3-venv libatlas-base-dev\nsudo apt install -y libopencv-dev python3-opencv\n\n# Create virtual environment\npython3 -m venv ~/ai_env\nsource ~/ai_env/bin/activate\n\n# Install ML runtime\npip install tflite-runtime numpy opencv-python-headless\npip install ${selectedSensors.map(id => sensorCatalog.find(s => s.id === id)?.driver || "").filter(Boolean).join(" ")}` },
                      { title: "3. Deploy Model", code: `# Copy model to Pi\nscp ${selectedTask.name.toLowerCase().replace(/\s+/g, "_")}_${quantize ? "int8" : "fp32"}.tflite pi@raspberrypi.local:~/models/\n\n# Copy inference script\nscp inference_runner.py pi@raspberrypi.local:~/\nscp sensor_fusion.py pi@raspberrypi.local:~/` },
                      { title: "4. Run Inference", code: `ssh pi@raspberrypi.local\nsource ~/ai_env/bin/activate\n\n# Test sensor connectivity\npython3 -c "import sensor_fusion; sensor_fusion.test_all()"\n\n# Run real-time inference\npython3 inference_runner.py \\\n  --model ~/models/${selectedTask.name.toLowerCase().replace(/\s+/g, "_")}_${quantize ? "int8" : "fp32"}.tflite \\\n  --sensors ${selectedSensors.map(id => sensorCatalog.find(s => s.id === id)?.type || "").filter(Boolean).join(",")} \\\n  --hz 30 \\\n  --visualize` },
                      { title: "5. Systemd Service (auto-start)", code: `# Create service file\nsudo tee /etc/systemd/system/ai-inference.service << 'EOF'\n[Unit]\nDescription=Edge AI Inference Service\nAfter=network.target\n\n[Service]\nUser=pi\nWorkingDirectory=/home/pi\nEnvironment=PATH=/home/pi/ai_env/bin\nExecStart=/home/pi/ai_env/bin/python3 inference_runner.py --model /home/pi/models/${selectedTask.name.toLowerCase().replace(/\s+/g, "_")}_${quantize ? "int8" : "fp32"}.tflite --daemon\nRestart=always\nRestartSec=5\n\n[Install]\nWantedBy=multi-user.target\nEOF\n\nsudo systemctl enable ai-inference\nsudo systemctl start ai-inference\nsudo systemctl status ai-inference` },
                    ].map(({ title, code }) => (
                      <div key={title}>
                        <div className="flex items-center justify-between mb-1.5">
                          <h4 className="text-xs font-semibold">{title}</h4>
                          <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => { navigator.clipboard.writeText(code); toast.success("Copied!"); }}>
                            <Copy className="h-3 w-3 mr-1" /> Copy
                          </Button>
                        </div>
                        <div className="rounded-lg border bg-muted/30 p-3">
                          <pre className="text-[10px] font-mono leading-relaxed whitespace-pre-wrap text-foreground/80">{code}</pre>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <Button className="flex-1" onClick={() => toast.success("Deployment package downloaded!")}>
                      <Download className="h-3.5 w-3.5 mr-1.5" /> Download Full Package
                    </Button>
                    <Button variant="outline" onClick={() => toast.info("OTA update pushed to device")}>
                      <Wifi className="h-3.5 w-3.5 mr-1.5" /> OTA Push
                    </Button>
                  </div>
                </>
              )}

              {!selectedTask && (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No trained model available. Go back to Step 3 and complete training first.</p>
                  <Button variant="outline" className="mt-4" onClick={() => setStep("training")}>Go to Training</Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
