import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  Camera,
  Check,
  Crosshair,
  Eye,
  EyeOff,
  Flame,
  GraduationCap,
  Maximize2,
  Pause,
  Play,
  PlayCircle,
  Radio,
  RotateCcw,
  ScanLine,
  Thermometer,
  Upload,
  Volume2,
  VolumeX,
  Cpu,
} from 'lucide-react'
import { useCommandStore, DEFAULT_VIDEO_URL, DEFAULT_VIDEO_NAME } from '../../store/commandStore'
import { generateSampleReconVideo } from '../../utils/generateSampleVideo'
import { qualcommDetector } from '../../utils/qualcommOnnxDetector'

export function CameraFeed({ type }: { type: 'RGB' | 'THERMAL' }) {
  const survivor = useCommandStore(state => state.survivors.find(s => s.id === state.selectedSurvivorId)) ?? useCommandStore(state => state.survivors[0])
  const hazards = useCommandStore(state => state.hazards)
  const drone = useCommandStore(state => state.drones[0])
  const setExpandedFeed = useCommandStore(state => state.setExpandedFeed)
  const uploadedVideoUrl = useCommandStore(state => state.uploadedVideoUrl)
  const uploadedVideoName = useCommandStore(state => state.uploadedVideoName)
  const setUploadedVideo = useCommandStore(state => state.setUploadedVideo)
  const videoPlaying = useCommandStore(state => state.videoPlaying)
  const setVideoPlaying = useCommandStore(state => state.setVideoPlaying)

  const activeDetections = useCommandStore(state => state.activeDetections)
  const setActiveDetections = useCommandStore(state => state.setActiveDetections)
  const syncVideoDetectionsToStore = useCommandStore(state => state.syncVideoDetectionsToStore)
  const campusLocation = useCommandStore(state => state.campusLocation)
  const openCampusModal = useCommandStore(state => state.openCampusModal)

  const onnxConfidenceThreshold = useCommandStore(state => state.onnxConfidenceThreshold)
  const onnxInferenceTimeMs = useCommandStore(state => state.onnxInferenceTimeMs)
  const onnxFps = useCommandStore(state => state.onnxFps)
  const openModelManager = useCommandStore(state => state.openModelManager)
  const setOnnxMetrics = useCommandStore(state => state.setOnnxMetrics)

  const [isMuted, setIsMuted] = useState(true)
  const [showDetections, setShowDetections] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [isGeneratingDemo, setIsGeneratingDemo] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const alt = Math.round(drone?.altitude ?? 121)
  const hdg = Math.round(drone?.heading ?? 135)

  // Initialize Qualcomm detector on mount
  useEffect(() => {
    void qualcommDetector.initialize('/models/yolov8n.onnx').catch(() => {})
  }, [])

  // Run real-time detection loop on RGB feed (both uploaded video and static recon view)
  useEffect(() => {
    if (type !== 'RGB') return

    let isMounted = true
    let isProcessing = false
    let timerId: any = null

    const runInference = async () => {
      if (!isMounted || isProcessing) return

      const media = videoRef.current ?? imgRef.current
      if (!media) return

      // If video is still loading metadata, wait a moment
      if (media instanceof HTMLVideoElement && (media.readyState < 2 || media.videoWidth === 0)) {
        timerId = setTimeout(runInference, 150)
        return
      }

      isProcessing = true
      try {
        const detections = await qualcommDetector.detectFrame(media, onnxConfidenceThreshold, [0, 1, 2, 7])
        if (isMounted) {
          const list = detections ?? []
          setActiveDetections(list)
          syncVideoDetectionsToStore(list)
          const metrics = qualcommDetector.getMetrics()
          setOnnxMetrics({
            inferenceTimeMs: metrics.inferenceTimeMs,
            fps: metrics.fps,
            modelName: metrics.modelName,
          })
        }
      } catch (e) {
        console.warn('Frame detection error:', e)
      } finally {
        isProcessing = false
        if (isMounted) {
          // If video is playing, check next frame in ~100ms; if paused or static, check every ~500ms
          const delay = videoPlaying ? 100 : 500
          timerId = setTimeout(runInference, delay)
        }
      }
    }

    // Trigger immediate inference
    void runInference()

    return () => {
      isMounted = false
      if (timerId) clearTimeout(timerId)
    }
  }, [videoPlaying, uploadedVideoUrl, onnxConfidenceThreshold, type, setActiveDetections, setOnnxMetrics, syncVideoDetectionsToStore])

  // Keep video playback state synchronized with global store
  useEffect(() => {
    if (!videoRef.current) return
    if (videoPlaying) {
      void videoRef.current.play().catch(() => {})
    } else {
      videoRef.current.pause()
    }
  }, [videoPlaying, uploadedVideoUrl])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setUploadedVideo(url, file.name)
      setVideoPlaying(true)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file && (file.type.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi)$/i.test(file.name))) {
      const url = URL.createObjectURL(file)
      setUploadedVideo(url, file.name)
      setVideoPlaying(true)
    }
  }

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    setVideoPlaying(!videoPlaying)
  }

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const resetFeed = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (uploadedVideoUrl !== DEFAULT_VIDEO_URL) {
      setUploadedVideo(DEFAULT_VIDEO_URL, DEFAULT_VIDEO_NAME)
      setVideoPlaying(true)
    } else {
      if (videoRef.current) {
        videoRef.current.currentTime = 0
        void videoRef.current.play().catch(() => {})
      }
    }
  }

  const loadDemoVideo = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      setIsGeneratingDemo(true)
      const url = await generateSampleReconVideo()
      setUploadedVideo(url, 'DEMO_SURVEILLANCE_UAV.WEBM')
      setVideoPlaying(true)
    } catch (err) {
      console.warn('Could not generate sample video:', err)
    } finally {
      setIsGeneratingDemo(false)
    }
  }

  return (
    <div className={`intelligence-stack-card ${type === 'RGB' ? 'rgb-card' : 'thermal-card'}`}>
      {/* Embedded SVG Radiometric FLIR Ironbow Thermal Palette Filter */}
      {type === 'THERMAL' && (
        <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }} aria-hidden="true">
          <filter id="flir-ironbow-filter" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values="
                0.30 0.59 0.11 0 0
                0.30 0.59 0.11 0 0
                0.30 0.59 0.11 0 0
                0    0    0    1 0"
            />
            <feComponentTransfer>
              <feFuncR type="table" tableValues="0.08 0.05 0.28 0.72 1.00 1.00 1.00" />
              <feFuncG type="table" tableValues="0.00 0.00 0.04 0.15 0.65 0.95 1.00" />
              <feFuncB type="table" tableValues="0.25 0.55 0.65 0.15 0.00 0.40 1.00" />
            </feComponentTransfer>
          </filter>
        </svg>
      )}

      {/* Panel Header */}
      <div className="stack-card-header">
        <div className="card-header-left">
          <span className="card-title">
            {type === 'RGB' ? 'RGB CAMERA' : 'THERMAL (LWIR) CAMERA'}
          </span>
          {uploadedVideoUrl ? (
            <span className={`feed-status-pill ${type === 'RGB' ? 'recording video-pill' : 'active-thermal video-pill'}`}>
              <span className={type === 'RGB' ? 'record-red-dot' : 'thermal-purple-dot'} />
              {uploadedVideoUrl === DEFAULT_VIDEO_URL ? 'DEFAULT UAV STREAM' : 'SYNCHRONIZED FEED'}
            </span>
          ) : (
            <span className={`feed-status-pill ${type === 'RGB' ? 'recording' : 'active-thermal'}`}>
              <span className={type === 'RGB' ? 'record-red-dot' : 'thermal-purple-dot'} />
              {type === 'RGB' ? 'RECORDING' : 'ACTIVE · 36.8°C'}
            </span>
          )}

          {/* Qualcomm AI Hub Model Status & Config Trigger */}
          <button
            type="button"
            className="feed-header-btn qualcomm-model-badge-btn"
            onClick={e => {
              e.stopPropagation()
              openModelManager()
            }}
            title="Configure Qualcomm AI Hub YOLO26-Pose (Person Detection + 17-Keypoint Biomechanics)"
          >
            <Cpu size={12} className="text-cyan animate-pulse" />
            <span>QAI-HUB YOLO26-POSE</span>
            <span className="qai-sub-pill">PERSON+POSE</span>
          </button>
        </div>

        <div className="card-header-actions">
          {/* Hidden Video Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/ogg,video/quicktime,video/*"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />

          {/* Campus Location Button */}
          <button
            type="button"
            className="feed-header-btn campus-select-quick-btn"
            onClick={e => {
              e.stopPropagation()
              openCampusModal()
            }}
            title="Configure College Campus coordinates & Ground Zero location"
          >
            <GraduationCap size={12} className="text-cyan animate-pulse" />
            <span>CAMPUS: {campusLocation.name.length > 12 ? `${campusLocation.name.slice(0, 12)}…` : campusLocation.name}</span>
          </button>

          {/* Upload Video Button */}
          <button
            type="button"
            className="feed-header-btn upload-btn"
            onClick={e => {
              e.stopPropagation()
              fileInputRef.current?.click()
            }}
            title="Upload your custom video file (MP4, WebM, MOV) to run both RGB & Thermal simultaneously"
          >
            <Upload size={12} />
            <span>{uploadedVideoUrl ? 'CHANGE VIDEO' : 'UPLOAD VIDEO'}</span>
          </button>

          {/* Quick restore to default video if custom video is active */}
          {uploadedVideoUrl !== DEFAULT_VIDEO_URL && (
            <button
              type="button"
              className="feed-header-btn demo-video-btn"
              onClick={e => {
                e.stopPropagation()
                setUploadedVideo(DEFAULT_VIDEO_URL, DEFAULT_VIDEO_NAME)
                setVideoPlaying(true)
              }}
              title="Restore default drone video (mipi_2_20260917143157.mp4)"
            >
              <RotateCcw size={12} />
              <span>DEFAULT FEED</span>
            </button>
          )}

          {/* Quick Demo Video if not uploaded */}
          {!uploadedVideoUrl && (
            <button
              type="button"
              className="feed-header-btn demo-video-btn"
              onClick={loadDemoVideo}
              disabled={isGeneratingDemo}
              title="Generate and run synchronized aerial drone surveillance video"
            >
              <PlayCircle size={12} />
              <span>{isGeneratingDemo ? 'GENERATING…' : 'SAMPLE VIDEO'}</span>
            </button>
          )}

          {/* Video Player Controls if video active */}
          {uploadedVideoUrl && (
            <>
              <button
                type="button"
                className="feed-header-btn icon-only"
                onClick={togglePlay}
                title={videoPlaying ? 'Pause video (both feeds)' : 'Play video (both feeds)'}
              >
                {videoPlaying ? <Pause size={12} /> : <Play size={12} />}
              </button>
              <button
                type="button"
                className="feed-header-btn icon-only"
                onClick={toggleMute}
                title={isMuted ? 'Unmute audio' : 'Mute audio'}
              >
                {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
              </button>
              <button
                type="button"
                className="feed-header-btn icon-only reset-btn"
                onClick={resetFeed}
                title={uploadedVideoUrl !== DEFAULT_VIDEO_URL ? "Reset to default MIPI video stream" : "Restart video from beginning"}
              >
                <RotateCcw size={12} />
              </button>
            </>
          )}

          {/* Expand Feed Fullscreen */}
          <button
            type="button"
            className="expand-feed-btn"
            onClick={() => setExpandedFeed(type)}
            title={`Expand ${type} camera feed`}
          >
            <Maximize2 size={13} />
          </button>
        </div>
      </div>

      {/* Viewport Scene: RGB Natural Color OR Thermal FLIR Ironbow Palette */}
      <div
        className={`feed-media-container ${type === 'THERMAL' ? 'thermal-viewport' : ''} ${isDragging ? 'drag-over' : ''}`}
        onClick={() => setExpandedFeed(type)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag & Drop Overlay */}
        {isDragging && (
          <div className="drag-drop-overlay">
            <Upload size={32} className="drag-icon" />
            <span>DROP VIDEO FILE TO RUN DUAL RGB + THERMAL SYSTEM</span>
          </div>
        )}

        {/* Both RGB & Thermal run the EXACT SAME camera feed */}
        {uploadedVideoUrl ? (
          <video
            ref={videoRef}
            src={uploadedVideoUrl}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            className={`aerial-recon-img video-element ${type === 'THERMAL' ? 'thermal-vision-stream' : ''}`}
          />
        ) : (
          <img
            ref={imgRef}
            src="/drone-rgb-recon.jpg"
            alt="Aerial drone reconnaissance view of earthquake disaster ruins"
            crossOrigin="anonymous"
            className={`aerial-recon-img ${type === 'THERMAL' ? 'thermal-vision-stream' : ''}`}
          />
        )}

        {/* Grid & Lens Scanline Overlay */}
        <div className="tactical-hud-grid" />
        <div className={`scanline-sweep ${type === 'THERMAL' ? 'thermal-sweep' : ''}`} />

        {/* Top-Left Telemetry HUD Overlay */}
        <div className="hud-telemetry-strip">
          <span className="hud-badge drone-id">D1</span>
          <span className="hud-readout">ALT {alt}m</span>
          <span className="hud-readout">HDG {hdg}°</span>
          <span className="hud-readout fps">FPS {onnxFps}</span>
          <span className={`hud-badge ${type === 'RGB' ? 'ai-active-badge' : 'thermal-badge'}`}>
            {type === 'RGB' ? 'RGB OPTICAL' : 'LWIR 8-14μm'}
          </span>
          <span className="hud-badge qai-chip">QAI-HUB YOLO26-POSE</span>
        </div>

        {/* Center Targeting Reticle */}
        <div className="hud-crosshair-center">
          <ScanLine size={18} className="center-reticle-icon" />
        </div>

        {/* Full Viewport Tactical 17-Keypoint Neon Skeleton Wireframe Overlay */}
        {showDetections && activeDetections.length > 0 && (
          <svg
            className="tactical-pose-skeleton-layer"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 14,
            }}
          >
            {activeDetections.map((det) => {
              if (!det.keypoints || det.keypoints.length < 17 || !det.skeletonLines) return null
              const isLying = det.posture === 'LYING_DOWN'
              const isWaving = det.posture === 'CALLING_FOR_HELP'
              const isTrapped = det.posture === 'CROUCHING_TRAPPED'
              const boneColor = isLying ? '#f43f5e' : isWaving ? '#f97316' : isTrapped ? '#eab308' : '#00f0ff'
              const jointColor = isLying ? '#fb7185' : isWaving ? '#fb923c' : isTrapped ? '#facc15' : '#67e8f9'

              return (
                <g key={`skel-${type}-${det.id}`}>
                  {/* Neon Glow Limb Lines */}
                  {det.skeletonLines.map(([p1, p2], bIdx) => {
                    const k1 = det.keypoints![p1]
                    const k2 = det.keypoints![p2]
                    if (!k1 || !k2 || k1.conf < 0.25 || k2.conf < 0.25) return null
                    return (
                      <line
                        key={`b-${det.id}-${bIdx}`}
                        x1={`${k1.x}%`}
                        y1={`${k1.y}%`}
                        x2={`${k2.x}%`}
                        y2={`${k2.y}%`}
                        stroke={boneColor}
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeOpacity="0.9"
                      />
                    )
                  })}
                  {/* Joint Dots */}
                  {det.keypoints.map((kpt) => {
                    if (kpt.conf < 0.25) return null
                    return (
                      <circle
                        key={`k-${det.id}-${kpt.id}`}
                        cx={`${kpt.x}%`}
                        cy={`${kpt.y}%`}
                        r="2.2"
                        fill={jointColor}
                        stroke="#09101d"
                        strokeWidth="0.8"
                      />
                    )
                  })}
                </g>
              )
            })}
          </svg>
        )}

        {/* RGB OVERLAYS: Real Qualcomm ONNX Detections or Fallback Tactical Bounding Boxes */}
        {type === 'RGB' && showDetections && (
          <>
            {activeDetections.length > 0 ? (
              activeDetections.map((det) => (
                <div
                  key={det.id}
                  className={`ai-detection-box ${det.classId === 0 ? 'survivor-box' : 'hazard-box'} onnx-dynamic-box ${det.posture === 'LYING_DOWN' ? 'prone-border-glow' : ''}`}
                  style={{
                    left: `${det.x}%`,
                    top: `${det.y}%`,
                    width: `${det.w}%`,
                    height: `${det.h}%`,
                    position: 'absolute',
                  }}
                >
                  <div className="box-corner tl" />
                  <div className="box-corner tr" />
                  <div className="box-corner bl" />
                  <div className="box-corner br" />
                  <div className={`box-tag ${det.classId === 0 ? 'qai-onnx-tag' : 'hazard-tag'} ${det.posture === 'LYING_DOWN' ? 'tag-prone-hazard' : ''}`}>
                    {det.classId !== 0 && <Flame size={9} />}
                    <span className="tag-name">{det.label}</span>
                    <span className="tag-confidence">{det.confidence}%</span>
                  </div>
                  {det.posture && (
                    <div className={`box-posture-badge ${det.posture === 'LYING_DOWN' ? 'posture-prone-hazard' : det.posture === 'CALLING_FOR_HELP' ? 'posture-waving-distress' : 'posture-standing'}`}>
                      {det.posture === 'LYING_DOWN' && <AlertTriangle size={9} />}
                      {det.posture === 'CALLING_FOR_HELP' && <Radio size={9} />}
                      <span>{det.posture === 'LYING_DOWN' ? 'PRONE / UNCONSCIOUS HAZARD' : det.posture === 'CALLING_FOR_HELP' ? 'WAVING / CALLING FOR HELP' : det.posture === 'CROUCHING_TRAPPED' ? 'CROUCHING / TRAPPED' : 'STANDING'}</span>
                    </div>
                  )}
                  <div className="bounding-pulse" />
                </div>
              ))
            ) : !uploadedVideoUrl ? (
              <>
                {/* Fallback AI Detection Bounding Box for static recon view only */}
                {survivor && (
                  <div className="ai-detection-box survivor-box">
                    <div className="box-corner tl" />
                    <div className="box-corner tr" />
                    <div className="box-corner bl" />
                    <div className="box-corner br" />
                    <div className="box-tag">
                      <span className="tag-name">SURVIVOR {survivor.id}</span>
                      <span className="tag-confidence">{survivor.fusedConfidence || 97}%</span>
                    </div>
                    <div className="bounding-pulse" />
                  </div>
                )}

                {/* Only render hazard box if hazards actually exist in active mission store */}
                {hazards.length > 0 && (
                  <div className="ai-detection-box hazard-box">
                    <div className="box-corner tl" />
                    <div className="box-corner tr" />
                    <div className="box-corner bl" />
                    <div className="box-corner br" />
                    <div className="box-tag hazard-tag">
                      <Flame size={9} />
                      <span className="tag-name">HAZARD {hazards[0].id}</span>
                      <span className="tag-confidence">92%</span>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </>
        )}

        {/* THERMAL OVERLAYS: Radiometric Thermal Spot Meter & Temperature Readout */}
        {type === 'THERMAL' && (
          <>
            {activeDetections.length > 0 ? (
              activeDetections.map((det) => (
                <div
                  key={`thermal-${det.id}`}
                  className="thermal-spot-marker onnx-thermal-lock"
                  style={{
                    left: `${det.x}%`,
                    top: `${det.y}%`,
                    width: `${det.w}%`,
                    height: `${det.h}%`,
                    position: 'absolute',
                  }}
                >
                  <div className="thermal-bracket tl" />
                  <div className="thermal-bracket tr" />
                  <div className="thermal-bracket bl" />
                  <div className="thermal-bracket br" />
                  <div className="spot-temp-box">
                    <div className="temp-header">
                      <span className="spot-dot" />
                      <strong className="spot-temp">{det.thermalSignature?.tempC ?? '36.8'}°C</strong>
                    </div>
                    <div className="spot-meta">
                      <span>{det.label} · {det.confidence}%</span>
                      {det.posture && <span className="thermal-posture-label">[{det.posture.replace('_', ' ')}]</span>}
                    </div>
                  </div>
                </div>
              ))
            ) : !uploadedVideoUrl ? (
              /* Fallback Spot Radiometric Temperature Marker Lock on S-03 for static recon view */
              <div className="thermal-spot-marker">
                <div className="thermal-bracket tl" />
                <div className="thermal-bracket tr" />
                <div className="thermal-bracket bl" />
                <div className="thermal-bracket br" />
                <div className="spot-temp-box">
                  <div className="temp-header">
                    <span className="spot-dot" />
                    <strong className="spot-temp">36.8°C</strong>
                  </div>
                  <div className="spot-meta">
                    <span>HUMAN SIGNATURE · 96%</span>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Thermal Spectrum Scale Legend (Left Vertical) */}
            <div className="thermal-palette-bar">
              <span className="palette-label high">42°C</span>
              <div className="palette-gradient" />
              <span className="palette-label low">18°C</span>
            </div>
          </>
        )}

        {/* Floating AI Overlay Toggle in Viewport Bottom */}
        <button
          type="button"
          className="hud-overlay-toggle"
          onClick={e => {
            e.stopPropagation()
            setShowDetections(!showDetections)
          }}
          title="Toggle AI computer vision bounding boxes"
        >
          {showDetections ? <Eye size={10} /> : <EyeOff size={10} />}
          <span>{type === 'RGB' ? (showDetections ? 'AI TRACKING ON' : 'AI TRACKING OFF') : 'THERMAL CALIBRATED'}</span>
        </button>
      </div>

      {/* Bottom AI Status Bar */}
      <div className="feed-status-footer">
        {uploadedVideoName ? (
          <div className="video-meta-badge" title={uploadedVideoName}>
            <span className={`video-dot ${type === 'RGB' ? 'blue' : 'purple'}`} />
            <span className="video-filename">{uploadedVideoName}</span>
          </div>
        ) : (
          <div className="detection-flag survivor-flag">
            <span className="flag-dot green" />
            <span>
              {activeDetections.length > 0
                ? `${activeDetections.length} TARGETS DETECTED`
                : type === 'RGB'
                  ? 'SURVIVOR DETECTED'
                  : 'THERMAL SIGNATURE 96%'}
            </span>
          </div>
        )}

        <div className="detection-flag hazard-flag">
          <span className="flag-dot cyan" />
          <span>QUALCOMM ONNX {onnxInferenceTimeMs}ms</span>
        </div>
      </div>
    </div>
  )
}
