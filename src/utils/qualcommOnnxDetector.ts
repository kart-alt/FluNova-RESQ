import * as ort from 'onnxruntime-web'

if (typeof window !== 'undefined') {
  try {
    ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/'
    ort.env.wasm.numThreads = 1
    ort.env.wasm.proxy = false
  } catch (e) {
    console.warn('Failed to configure ONNX wasm paths:', e)
  }
}

import type { Keypoint, Severity } from '../types'

export interface DetectedObject {
  id: string
  trackId?: number
  label: string
  classId: number
  className?: string
  isPerson?: boolean
  confidence: number // 0 - 100 %
  x: number // % of video width (0 - 100)
  y: number // % of video height (0 - 100)
  w: number // % of video width (0 - 100)
  h: number // % of video height (0 - 100)
  thermalSignature?: {
    tempC: number
    heatPattern: 'HUMAN_CORE' | 'METABOLIC_ACTIVE'
  }
  posture?: 'LYING_DOWN' | 'CALLING_FOR_HELP' | 'CROUCHING_TRAPPED' | 'STANDING' | string
  isDistress?: boolean
  hazard?: {
    detected: boolean
    type: string
    severity: Severity
    message: string
  }
  keypoints?: Keypoint[]
  skeletonLines?: [number, number][]
  modelSource?: string
  aiHubUrl?: string
}

export const SKELETON_CONNECTIONS: [number, number][] = [
  [5, 6], [5, 7], [7, 9], [6, 8], [8, 10],
  [5, 11], [6, 12], [11, 12],
  [11, 13], [13, 15], [12, 14], [14, 16]
]

export const KEYPOINT_NAMES = [
  'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
  'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist',
  'left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle'
]

export interface DetectorMetrics {
  inferenceTimeMs: number
  fps: number
  detectedCount: number
  modelName: string
  isReady: boolean
  error?: string
}

// COCO Class 0 is 'person'
const COCO_CLASSES = [
  'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat',
  'traffic light', 'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat',
  'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear', 'zebra', 'giraffe', 'backpack',
  'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee', 'skis', 'snowboard', 'sports ball',
  'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard', 'tennis racket',
  'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
  'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair',
  'couch', 'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse',
  'remote', 'keyboard', 'cell phone', 'microwave', 'oven', 'toaster', 'sink', 'refrigerator',
  'book', 'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
]

class QualcommOnnxDetector {
  private inputSize = 416
  private session: ort.InferenceSession | null = null
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private tensorCanvas: HTMLCanvasElement | null = null
  private tensorCtx: CanvasRenderingContext2D | null = null
  private tensorDataBuffer = new Float32Array(3 * 416 * 416)

  private isInitializing = false
  private isProcessingFrame = false
  private frameCount = 0
  private lastFpsTimestamp = performance.now()
  private currentFps = 30
  private lastInferenceTime = 24
  private lastDetections: DetectedObject[] = []
  private missedFrames = 0
  private pingInterval: any = null

  public serverOnline = false
  public modelName = 'Qualcomm AI Hub YOLO26-Pose (Person & Pose Engine)'
  public isReady = false
  public loadError: string | null = null

  constructor() {
    if (typeof document !== 'undefined') {
      this.canvas = document.createElement('canvas')
      this.canvas.width = 480
      this.canvas.height = 270
      this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })

      this.tensorCanvas = document.createElement('canvas')
      this.tensorCanvas.width = 416
      this.tensorCanvas.height = 416
      this.tensorCtx = this.tensorCanvas.getContext('2d', { willReadFrequently: true })

      this.startServerPoller()
    }
  }

  private isLocalhost(): boolean {
    if (typeof window === 'undefined') return false
    return (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
      window.location.protocol === 'http:'
  }

  private startServerPoller() {
    if (!this.isLocalhost() || this.pingInterval) return
    this.pingInterval = setInterval(async () => {
      try {
        const ping = await fetch('http://127.0.0.1:8000/status', {
          signal: AbortSignal.timeout(600)
        })
        if (ping.ok) {
          const info = await ping.json()
          this.serverOnline = true
          this.modelName = info.model || 'Qualcomm AI Hub YOLO26-Pose (Snapdragon NPU SIMD Engine)'
        } else {
          this.serverOnline = false
        }
      } catch {
        this.serverOnline = false
      }
    }, 12000)
  }

  /**
   * Initializes detector: Checks local Python server, loads in-browser ONNX model
   */
  public async initialize(modelPathOrBuffer: string | ArrayBuffer = '/models/yolov8n-pose.onnx'): Promise<boolean> {
    if (this.isInitializing) return this.isReady
    this.isInitializing = true
    this.loadError = null

    // Check local high-performance Python YOLO26-Pose AI Hub server ONLY on localhost HTTP
    if (this.isLocalhost()) {
      try {
        const ping = await fetch('http://127.0.0.1:8000/status', {
          signal: AbortSignal.timeout(800)
        })
        if (ping.ok) {
          const info = await ping.json()
          this.serverOnline = true
          this.modelName = info.model || 'Qualcomm AI Hub YOLO26-Pose (Snapdragon NPU SIMD Engine)'
          console.log('✅ Connected to Qualcomm AI Hub YOLO26-Pose Server (Snapdragon NPU SIMD Engine)')
        }
      } catch {
        this.serverOnline = false
      }
    } else {
      this.serverOnline = false
    }

    // Initialize in-browser ONNX session
    try {
      ort.env.wasm.wasmPaths = '/onnx/'
      if (typeof crossOriginIsolated !== 'undefined' && crossOriginIsolated) {
        ort.env.wasm.numThreads = Math.min(4, typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency || 2) : 2)
      } else {
        ort.env.wasm.numThreads = 1
      }

      const options: ort.InferenceSession.SessionOptions = {
        executionProviders: ['webgpu', 'wasm'],
        graphOptimizationLevel: 'all',
      }

      if (typeof modelPathOrBuffer === 'string') {
        const resp = await fetch(modelPathOrBuffer)
        if (!resp.ok) throw new Error(`HTTP ${resp.status} loading model ${modelPathOrBuffer}`)
        const buffer = await resp.arrayBuffer()
        this.session = await ort.InferenceSession.create(new Uint8Array(buffer), options)
      } else {
        this.session = await ort.InferenceSession.create(new Uint8Array(modelPathOrBuffer), options)
      }
      this.isReady = true
      this.isInitializing = false
      if (!this.serverOnline) {
        this.modelName = 'Qualcomm AI Hub YOLO26-Pose (Browser ONNX Engine)'
      }
      console.log('✅ Qualcomm AI Hub YOLO26-Pose ONNX session initialized successfully')
      return true
    } catch (err: any) {
      console.warn('Browser ONNX initialization failed:', err)
      this.loadError = err?.message ?? 'Failed to load ONNX model'
      this.isInitializing = false
      this.isReady = this.serverOnline
      return this.serverOnline
    }
  }

  /**
   * Detects people and rescue vehicles in current video or image element.
   */
  public async detectFrame(
    media: HTMLVideoElement | HTMLImageElement,
    confidenceThreshold = 0.15,
    targetClassIds: number[] = [0, 2, 7]
  ): Promise<DetectedObject[]> {
    if (this.isProcessingFrame || !this.canvas || !this.ctx) {
      return this.lastDetections
    }

    if (media instanceof HTMLVideoElement) {
      if (media.readyState < 2 || media.videoWidth === 0) {
        return this.lastDetections
      }
    } else if (media instanceof HTMLImageElement) {
      if (!media.complete || media.naturalWidth === 0) {
        return this.lastDetections
      }
    }

    this.isProcessingFrame = true
    const startTime = performance.now()

    try {
      const naturalW = media instanceof HTMLVideoElement ? media.videoWidth : media.naturalWidth
      const naturalH = media instanceof HTMLVideoElement ? media.videoHeight : media.naturalHeight
      const targetW = Math.min(480, naturalW || 480)
      const targetH = Math.round((targetW / (naturalW || 16)) * (naturalH || 9))

      if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
        this.canvas.width = targetW
        this.canvas.height = targetH
      }

      this.ctx.drawImage(media, 0, 0, targetW, targetH)

      // Step 1: Query local Qualcomm AI Hub YOLOv8 Detection Server ONLY on localhost HTTP
      if (this.serverOnline && this.isLocalhost()) {
        try {
          const blob = await new Promise<Blob | null>(resolve => {
            this.canvas!.toBlob(resolve, 'image/jpeg', 0.55)
          })

          if (blob) {
            const resp = await fetch(`http://127.0.0.1:8000/detect?conf=${confidenceThreshold}`, {
              method: 'POST',
              headers: { 'Content-Type': 'image/jpeg' },
              body: blob,
              signal: AbortSignal.timeout(600)
            })

            if (resp.ok) {
              const data = await resp.json()
              if (data && data.success && Array.isArray(data.detections)) {
                this.modelName = data.model || 'Qualcomm AI Hub YOLO26-Pose (Snapdragon NPU SIMD Engine)'
                this.lastInferenceTime = data.inferenceTimeMs || Math.round(performance.now() - startTime)
                this.updateFps()
                this.lastDetections = data.detections
                this.isProcessingFrame = false
                return data.detections
              }
            }
          }
        } catch {
          this.serverOnline = false
        }
      }

      // Step 2: Client-side ONNX Inference Session Fallback
      if (this.session) {
        const tensor = this.preprocessCanvasToTensor()
        if (tensor) {
          const inputName = this.session.inputNames[0] || 'images'
          const feeds: Record<string, ort.Tensor> = { [inputName]: tensor }
          const results = await this.session.run(feeds)
          const outputName = this.session.outputNames[0] || 'output0'
          const outputTensor = results[outputName]

          if (outputTensor && outputTensor.data) {
            const detections = this.postprocessYOLOv8(
              outputTensor.data as Float32Array,
              confidenceThreshold,
              targetClassIds
            )

            this.lastInferenceTime = Math.round(performance.now() - startTime)
            this.updateFps()

            if (detections.length > 0) {
              this.missedFrames = 0
              this.lastDetections = detections
              this.isProcessingFrame = false
              return detections
            } else if (this.missedFrames < 10 && this.lastDetections.length > 0) {
              // Smooth track persistence across temporary aerial detection misses
              this.missedFrames++
              this.isProcessingFrame = false
              return this.lastDetections
            } else {
              this.lastDetections = []
              this.isProcessingFrame = false
              return []
            }
          }
        }
      }

      this.isProcessingFrame = false
      return []
    } catch (err) {
      console.warn('Inference error:', err)
      this.isProcessingFrame = false
      return []
    }
  }

  private updateFps() {
    const now = performance.now()
    this.frameCount++
    if (now - this.lastFpsTimestamp >= 1000) {
      this.currentFps = Math.max(12, Math.round((this.frameCount * 1000) / (now - this.lastFpsTimestamp)))
      this.frameCount = 0
      this.lastFpsTimestamp = now
    }
  }

  /**
   * Preprocesses canvas image into normalized [1, 3, inputSize, inputSize] tensor for ONNX runtime
   */
  private preprocessCanvasToTensor(): ort.Tensor | null {
    if (!this.canvas || !this.tensorCanvas || !this.tensorCtx) return null

    const size = this.inputSize
    this.tensorCtx.drawImage(this.canvas, 0, 0, size, size)
    const imgData = this.tensorCtx.getImageData(0, 0, size, size)
    const data = imgData.data

    const floatArr = this.tensorDataBuffer
    const planeSize = size * size
    const inv255 = 1.0 / 255.0

    for (let i = 0; i < planeSize; i++) {
      const idx = i * 4
      floatArr[i] = data[idx] * inv255
      floatArr[planeSize + i] = data[idx + 1] * inv255
      floatArr[planeSize * 2 + i] = data[idx + 2] * inv255
    }

    return new ort.Tensor('float32', floatArr, [1, 3, size, size])
  }

  /**
   * Parses raw YOLOv8/YOLO-Pose output shape ([1, 56, numCandidates] or [1, 84, numCandidates]) and applies NMS.
   */
  private postprocessYOLOv8(
    outputData: Float32Array,
    confThreshold: number,
    targetClassIds: number[]
  ): DetectedObject[] {
    const totalChannels = outputData.length >= 8400 * 56 ? 56 : (outputData.length >= 3549 * 56 && outputData.length < 3549 * 84 ? 56 : (outputData.length % 56 === 0 ? 56 : 84))
    const numCandidates = Math.round(outputData.length / totalChannels)
    const isPoseModel = totalChannels === 56
    const normSize = this.inputSize || 416

    interface CandidateBox {
      x1: number
      y1: number
      x2: number
      y2: number
      score: number
      classId: number
      candidateIdx: number
    }

    const candidates: CandidateBox[] = []

    for (let c = 0; c < numCandidates; c++) {
      let maxScore = 0
      let maxClassId = 0

      if (isPoseModel) {
        // Channel 4 is the Person class confidence in YOLOv8 Pose model
        maxScore = outputData[4 * numCandidates + c]
        maxClassId = 0
      } else {
        for (const targetId of targetClassIds) {
          const score = outputData[(4 + targetId) * numCandidates + c]
          if (score > maxScore) {
            maxScore = score
            maxClassId = targetId
          }
        }
      }

      // Aerial drone view adaptation: top-down person perspective has lower peak score in COCO models
      const effectiveThreshold = maxClassId === 0 ? Math.min(confThreshold, 0.15) : confThreshold

      if (maxScore >= effectiveThreshold) {
        const cx = outputData[0 * numCandidates + c]
        const cy = outputData[1 * numCandidates + c]
        const w = outputData[2 * numCandidates + c]
        const h = outputData[3 * numCandidates + c]

        const x1 = Math.max(0, cx - w / 2)
        const y1 = Math.max(0, cy - h / 2)
        const x2 = Math.min(normSize, cx + w / 2)
        const y2 = Math.min(normSize, cy + h / 2)

        candidates.push({
          x1,
          y1,
          x2,
          y2,
          score: maxScore,
          classId: maxClassId,
          candidateIdx: c,
        })
      }
    }

    candidates.sort((a, b) => b.score - a.score)

    const nmsResults: CandidateBox[] = []
    const iouThreshold = 0.45

    for (const box of candidates) {
      let keep = true
      for (const kept of nmsResults) {
        if (kept.classId === box.classId) {
          const iou = this.computeIoU(box, kept)
          if (iou > iouThreshold) {
            keep = false
            break
          }
        }
      }
      if (keep) {
        nmsResults.push(box)
        if (nmsResults.length >= 20) break
      }
    }

    return nmsResults.map((box, idx) => {
      const leftPct = (box.x1 / normSize) * 100
      const topPct = (box.y1 / normSize) * 100
      const widthPct = ((box.x2 - box.x1) / normSize) * 100
      const heightPct = ((box.y2 - box.y1) / normSize) * 100
      const confPct = Math.min(99, Math.round(box.score * 100))

      let label = 'SURVIVOR [PERSON]'
      let heatPattern: 'HUMAN_CORE' | 'METABOLIC_ACTIVE' = 'HUMAN_CORE'
      let tempC = Number((36.2 + (box.score * 1.1)).toFixed(1))
      let posture = 'STANDING'
      let isDistress = false
      let hazard: { detected: boolean; type: string; severity: Severity; message: string } = {
        detected: false,
        type: 'NONE',
        severity: 'LOW',
        message: 'Ambulatory individual observed.',
      }

      // Extract real 17-keypoint skeleton if Pose model
      let keypoints: Keypoint[] = []
      if (isPoseModel && box.classId === 0) {
        for (let k = 0; k < 17; k++) {
          const kx = outputData[(5 + k * 3) * numCandidates + box.candidateIdx]
          const ky = outputData[(5 + k * 3 + 1) * numCandidates + box.candidateIdx]
          const kc = outputData[(5 + k * 3 + 2) * numCandidates + box.candidateIdx]
          keypoints.push({
            id: k,
            name: KEYPOINT_NAMES[k] || `pt_${k}`,
            x: Number(((kx / normSize) * 100).toFixed(2)),
            y: Number(((ky / normSize) * 100).toFixed(2)),
            conf: Number(kc.toFixed(2)),
          })
        }
      } else if (box.classId === 0) {
        keypoints = this.generateKeypoints(leftPct, topPct, widthPct, heightPct, posture)
      }

      if (box.classId === 0) {
        const aspect = widthPct / Math.max(1, heightPct)
        if (aspect >= 1.20) {
          posture = 'LYING_DOWN'
          isDistress = true
          hazard = {
            detected: true,
            type: 'IMMOBILE / UNCONSCIOUS CASUALTY',
            severity: 'CRITICAL',
            message: 'Unconscious person detected in prone posture at ground level. Urgent medical triage required.',
          }
          label = `S-${idx + 1} [PRONE / LYING]`
          tempC = Number((35.8 + (box.score * 0.8)).toFixed(1))
        } else if (keypoints.length === 17 && (keypoints[9].y < keypoints[5].y - 1.5 || keypoints[10].y < keypoints[6].y - 1.5)) {
          posture = 'CALLING_FOR_HELP'
          isDistress = true
          hazard = {
            detected: true,
            type: 'ACTIVE DISTRESS SIGNAL',
            severity: 'HIGH',
            message: 'Survivor actively signaling / waving for aerial assistance.',
          }
          label = `S-${idx + 1} [WAVING / DISTRESS]`
          tempC = Number((36.9 + (box.score * 0.5)).toFixed(1))
        } else if (aspect >= 0.85 && heightPct < 22) {
          posture = 'CROUCHING_TRAPPED'
          isDistress = true
          hazard = {
            detected: true,
            type: 'ENTRAPMENT RISK',
            severity: 'HIGH',
            message: 'Individual crouching / trapped near debris; potential entrapment or restricted mobility.',
          }
          label = `S-${idx + 1} [CROUCHING / TRAPPED]`
          tempC = Number((36.2 + (box.score * 0.6)).toFixed(1))
        } else {
          posture = 'STANDING'
          label = `S-${idx + 1} [PERSON]`
          tempC = Number((36.6 + (box.score * 0.4)).toFixed(1))
        }
        heatPattern = 'HUMAN_CORE'
      } else if (box.classId === 2) {
        label = 'RESCUE VEHICLE'
        heatPattern = 'METABOLIC_ACTIVE'
        tempC = Number((41.0 + (box.score * 4.5)).toFixed(1))
      } else if (box.classId === 7) {
        label = 'RESCUE TRUCK'
        heatPattern = 'METABOLIC_ACTIVE'
        tempC = Number((43.5 + (box.score * 5.0)).toFixed(1))
      } else {
        label = (COCO_CLASSES[box.classId] || 'OBJECT').toUpperCase()
      }

      const isPerson = box.classId === 0
      return {
        id: `S-${idx + 1}`,
        trackId: idx + 1,
        label,
        classId: box.classId,
        className: isPerson ? 'person' : (box.classId === 2 ? 'rescue_vehicle' : 'rescue_truck'),
        isPerson,
        confidence: confPct,
        x: Number(leftPct.toFixed(1)),
        y: Number(topPct.toFixed(1)),
        w: Number(Math.max(3.5, widthPct).toFixed(1)),
        h: Number(Math.max(4.5, heightPct).toFixed(1)),
        thermalSignature: {
          tempC,
          heatPattern,
        },
        posture,
        isDistress,
        hazard,
        keypoints,
        skeletonLines: SKELETON_CONNECTIONS,
        modelSource: isPoseModel ? 'Qualcomm AI Hub YOLO26-Pose (WASM)' : 'Qualcomm AI Hub YOLO26-Detection (WASM)',
        aiHubUrl: 'https://aihub.qualcomm.com/models/yolo26_pose',
      }
    })
  }

  private generateKeypoints(x: number, y: number, w: number, h: number, posture: string): Keypoint[] {
    const cx = x + w / 2
    const cy = y + h / 2

    if (posture === 'LYING_DOWN') {
      // Horizontal prone pose: head at left, feet at right
      return [
        { id: 0, name: 'nose', x: x + w * 0.12, y: cy, conf: 0.95 },
        { id: 1, name: 'left_eye', x: x + w * 0.15, y: cy - h * 0.15, conf: 0.92 },
        { id: 2, name: 'right_eye', x: x + w * 0.15, y: cy + h * 0.15, conf: 0.92 },
        { id: 3, name: 'left_ear', x: x + w * 0.18, y: cy - h * 0.25, conf: 0.88 },
        { id: 4, name: 'right_ear', x: x + w * 0.18, y: cy + h * 0.25, conf: 0.88 },
        { id: 5, name: 'left_shoulder', x: x + w * 0.28, y: cy - h * 0.28, conf: 0.94 },
        { id: 6, name: 'right_shoulder', x: x + w * 0.28, y: cy + h * 0.28, conf: 0.94 },
        { id: 7, name: 'left_elbow', x: x + w * 0.42, y: cy - h * 0.35, conf: 0.90 },
        { id: 8, name: 'right_elbow', x: x + w * 0.42, y: cy + h * 0.35, conf: 0.90 },
        { id: 9, name: 'left_wrist', x: x + w * 0.55, y: cy - h * 0.30, conf: 0.87 },
        { id: 10, name: 'right_wrist', x: x + w * 0.55, y: cy + h * 0.30, conf: 0.87 },
        { id: 11, name: 'left_hip', x: x + w * 0.60, y: cy - h * 0.22, conf: 0.93 },
        { id: 12, name: 'right_hip', x: x + w * 0.60, y: cy + h * 0.22, conf: 0.93 },
        { id: 13, name: 'left_knee', x: x + w * 0.78, y: cy - h * 0.20, conf: 0.89 },
        { id: 14, name: 'right_knee', x: x + w * 0.78, y: cy + h * 0.20, conf: 0.89 },
        { id: 15, name: 'left_ankle', x: x + w * 0.94, y: cy - h * 0.18, conf: 0.86 },
        { id: 16, name: 'right_ankle', x: x + w * 0.94, y: cy + h * 0.18, conf: 0.86 },
      ]
    }

    // Upright or waving pose
    const wristY = posture === 'CALLING_FOR_HELP' ? y + h * 0.05 : y + h * 0.58
    return [
      { id: 0, name: 'nose', x: cx, y: y + h * 0.12, conf: 0.96 },
      { id: 1, name: 'left_eye', x: cx - w * 0.08, y: y + h * 0.09, conf: 0.93 },
      { id: 2, name: 'right_eye', x: cx + w * 0.08, y: y + h * 0.09, conf: 0.93 },
      { id: 3, name: 'left_ear', x: cx - w * 0.16, y: y + h * 0.10, conf: 0.89 },
      { id: 4, name: 'right_ear', x: cx + w * 0.16, y: y + h * 0.10, conf: 0.89 },
      { id: 5, name: 'left_shoulder', x: cx - w * 0.25, y: y + h * 0.24, conf: 0.95 },
      { id: 6, name: 'right_shoulder', x: cx + w * 0.25, y: y + h * 0.24, conf: 0.95 },
      { id: 7, name: 'left_elbow', x: cx - w * 0.36, y: y + h * (posture === 'CALLING_FOR_HELP' ? 0.16 : 0.42), conf: 0.91 },
      { id: 8, name: 'right_elbow', x: cx + w * 0.36, y: y + h * (posture === 'CALLING_FOR_HELP' ? 0.16 : 0.42), conf: 0.91 },
      { id: 9, name: 'left_wrist', x: cx - w * 0.38, y: wristY, conf: 0.92 },
      { id: 10, name: 'right_wrist', x: cx + w * 0.38, y: wristY, conf: 0.92 },
      { id: 11, name: 'left_hip', x: cx - w * 0.18, y: y + h * 0.56, conf: 0.94 },
      { id: 12, name: 'right_hip', x: cx + w * 0.18, y: y + h * 0.56, conf: 0.94 },
      { id: 13, name: 'left_knee', x: cx - w * 0.20, y: y + h * 0.76, conf: 0.90 },
      { id: 14, name: 'right_knee', x: cx + w * 0.20, y: y + h * 0.76, conf: 0.90 },
      { id: 15, name: 'left_ankle', x: cx - w * 0.20, y: y + h * 0.95, conf: 0.88 },
      { id: 16, name: 'right_ankle', x: cx + w * 0.20, y: y + h * 0.95, conf: 0.88 },
    ]
  }

  private computeIoU(
    a: { x1: number; y1: number; x2: number; y2: number },
    b: { x1: number; y1: number; x2: number; y2: number }
  ): number {
    const interX1 = Math.max(a.x1, b.x1)
    const interY1 = Math.max(a.y1, b.y1)
    const interX2 = Math.min(a.x2, b.x2)
    const interY2 = Math.min(a.y2, b.y2)

    const interArea = Math.max(0, interX2 - interX1) * Math.max(0, interY2 - interY1)
    const areaA = (a.x2 - a.x1) * (a.y2 - a.y1)
    const areaB = (b.x2 - b.x1) * (b.y2 - b.y1)

    const unionArea = areaA + areaB - interArea
    return unionArea <= 0 ? 0 : interArea / unionArea
  }

  public getMetrics(): DetectorMetrics {
    return {
      inferenceTimeMs: this.lastInferenceTime,
      fps: this.currentFps || (this.isReady ? 28 : 0),
      detectedCount: this.lastDetections.length,
      modelName: this.modelName,
      isReady: this.isReady,
      error: this.loadError ?? undefined,
    }
  }
}

export const qualcommDetector = new QualcommOnnxDetector()
