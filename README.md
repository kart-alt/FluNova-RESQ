# FlyNova-ResQ: Autonomous UAV Search & Rescue Ground Control Station (GCS)

FlyNova-ResQ is a modern tactical Ground Control Station (GCS) web application designed for autonomous UAV disaster reconnaissance, real-time survivor detection, AI pose estimation, hazard intelligence, and rescue team dispatch routing.

---

## 🌟 Key Features

- **Tactical Live Map & Telemetry**:
  - MapLibre GL-powered GIS satellite and tactical road map views.
  - Real-time drone GPS tracking, waypoint trajectories, and dynamic optical camera footprint projections.
  - Multi-sector disaster zone demarcations and clearance corridors.

- **Edge AI & Computer Vision Perception**:
  - Qualcomm AI Hub / ONNX Runtime Web integration for real-time person, hazard, and survivor detection.
  - YOLOv8 / YOLO26-Pose 17-keypoint human pose estimation (detects lying, waving for help, crouching, and ambulatory states).
  - High-altitude aerial detection support (VisDrone model support).
  - Radiometric Long-Wave Infrared (LWIR) thermal signature fusion and body temperature estimation.
  - Visual Inertial Odometry (VIO) trajectory and drift estimation.

- **Survivors & Hazards Intelligence**:
  - Multi-sensor confidence scoring (RGB optical + Radiometric LWIR thermal fusion).
  - Real-time early warning alert triage and acknowledgment system.
  - Environmental hazard mapping (fire, unstable structures, debris, smoke corridors).

- **Autonomous Safe Route Clearance & Dispatch**:
  - Dynamic hazard-avoidance pathfinding for ground rescue teams.
  - Direct vector vs. AI safe corridor comparison with collision warnings.
  - Tactical team dispatch management console.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS
- **State Management**: Zustand
- **Mapping & GIS**: MapLibre GL
- **Computer Vision & Inference**:
  - `onnxruntime-web` (WebAssembly SIMD / WebGL)
  - Python FastAPI / PyTorch YOLOv8 detection server (`server/yolo_detector_server.py`)
- **Icons & Visualization**: Lucide React, Recharts

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v18 or newer)
- Python 3.10+ (for optional backend YOLO server)

### 2. Frontend Installation & Setup
```bash
# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3. (Optional) Run Python YOLO Detection Server
```bash
# Install server dependencies
pip install ultralytics fastapi uvicorn pillow

# Run the detection server
npm run detector:server
# or directly:
python server/yolo_detector_server.py
```
The detector server will listen at `http://127.0.0.1:8000`.

---

## 📁 Project Structure

```
FlyNova-ResQ Dashboard/
├── public/                 # Static assets, models & ONNX WASM runtimes
│   ├── models/             # Pre-trained ONNX models (yolov8n.onnx)
│   └── onnx/               # ONNX Runtime Web WASM binaries
├── server/                 # Python backend for YOLO pose & hazard inference
│   └── yolo_detector_server.py
├── src/
│   ├── components/         # Map, telemetry, feed HUDs & alert panels
│   ├── pages/              # Command Center, Survivors, Hazards, Rescue Teams
│   ├── store/              # Zustand mission stores
│   └── utils/              # Qualcomm ONNX detector & geo-projection utilities
├── train_aerial_drone.py   # Script for fine-tuning aerial drone models (VisDrone)
├── package.json
└── vite.config.ts
```

---

## 📄 License

Proprietary / MIT License - FlyNova Autonomous Rescue Systems.
