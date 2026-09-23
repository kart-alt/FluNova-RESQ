import {
  AlertTriangle,
  Camera,
  Check,
  Compass,
  Crosshair,
  Download,
  Flame,
  Layers,
  Radio,
  ScanLine,
  Sliders,
  Thermometer,
  Upload,
  Wifi,
  X,
  Zap,
} from 'lucide-react'
import { useRef } from 'react'
import { useCommandStore } from '../../store/commandStore'

export function FeedExpandedModal() {
  const expandedFeed = useCommandStore(state => state.expandedFeed)
  const setExpandedFeed = useCommandStore(state => state.setExpandedFeed)
  const survivor = useCommandStore(state => state.survivors.find(s => s.id === state.selectedSurvivorId)) ?? useCommandStore(state => state.survivors[0])
  const drone = useCommandStore(state => state.drones[0])
  const uploadedVideoUrl = useCommandStore(state => state.uploadedVideoUrl)
  const uploadedVideoName = useCommandStore(state => state.uploadedVideoName)
  const setUploadedVideo = useCommandStore(state => state.setUploadedVideo)
  const activeDetections = useCommandStore(state => state.activeDetections)
  const modalFileInputRef = useRef<HTMLInputElement>(null)

  if (!expandedFeed) return null

  const alt = Math.round(drone?.altitude ?? 120)
  const hdg = Math.round(drone?.heading ?? 127)

  return (
    <div className="feed-modal-backdrop" onClick={() => setExpandedFeed(null)}>
      <div className="feed-modal-container" onClick={e => e.stopPropagation()}>
        {/* Modal Top Bar */}
        <div className="modal-top-bar">
          <div className="modal-title-cluster">
            <span className="modal-tag">HIGH-DEFINITION TACTICAL PERCEPTION</span>
            <h2 className="modal-title">
              {expandedFeed === 'RGB' && 'RGB RECONNAISSANCE SENSOR — 4K STREAM'}
              {expandedFeed === 'THERMAL' && 'LONG-WAVE INFRARED (LWIR) RADIOMETRIC IMAGING'}
              {expandedFeed === 'ODOMETRY' && 'VISUAL INERTIAL ODOMETRY (VIO) 3D POSE TRAJECTORY'}
            </h2>
          </div>
          <div className="modal-actions">
            {expandedFeed === 'RGB' && (
              <>
                <input
                  ref={modalFileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/ogg,video/quicktime,video/*"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setUploadedVideo(URL.createObjectURL(file), file.name)
                    }
                  }}
                />
                <button
                  type="button"
                  className="modal-upload-btn"
                  onClick={() => modalFileInputRef.current?.click()}
                  title="Upload video to run system inference"
                >
                  <Upload size={12} />
                  <span>{uploadedVideoUrl ? 'CHANGE VIDEO' : 'UPLOAD VIDEO'}</span>
                </button>
              </>
            )}
            <span className="modal-status-badge">
              <span className="pulse-green-dot" />
              {uploadedVideoName ? 'VIDEO STREAM · ACTIVE' : 'SYNCHRONIZED · 30 FPS'}
            </span>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setExpandedFeed(null)}
              aria-label="Close expanded view"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Main Viewport */}
        <div className="modal-viewport-row">
          <div className="modal-feed-viewport">
            {expandedFeed === 'RGB' && (
              <div className="modal-media-wrapper">
                {uploadedVideoUrl ? (
                  <video
                    src={uploadedVideoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls
                    className="modal-recon-img video-element"
                  />
                ) : (
                  <img
                    src="/drone-rgb-recon.jpg"
                    alt="Expanded 4K drone aerial view"
                    className="modal-recon-img"
                  />
                )}
                <div className="tactical-hud-grid dense" />
                <div className="modal-reticle">
                  <ScanLine size={48} className="huge-reticle" />
                </div>

                {/* Full Modal Tactical Neon 17-Keypoint Skeleton Layer */}
                {activeDetections.length > 0 && (
                  <svg
                    className="modal-tactical-pose-skeleton-layer"
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
                        <g key={`modal-skel-${det.id}`}>
                          {det.skeletonLines.map(([p1, p2], bIdx) => {
                            const k1 = det.keypoints![p1]
                            const k2 = det.keypoints![p2]
                            if (!k1 || !k2 || k1.conf < 0.25 || k2.conf < 0.25) return null
                            return (
                              <line
                                key={`mb-${det.id}-${bIdx}`}
                                x1={`${k1.x}%`}
                                y1={`${k1.y}%`}
                                x2={`${k2.x}%`}
                                y2={`${k2.y}%`}
                                stroke={boneColor}
                                strokeWidth="2.8"
                                strokeLinecap="round"
                                strokeOpacity="0.9"
                              />
                            )
                          })}
                          {det.keypoints.map((kpt) => {
                            if (kpt.conf < 0.25) return null
                            return (
                              <circle
                                key={`mk-${det.id}-${kpt.id}`}
                                cx={`${kpt.x}%`}
                                cy={`${kpt.y}%`}
                                r="3.2"
                                fill={jointColor}
                                stroke="#09101d"
                                strokeWidth="1"
                              />
                            )
                          })}
                        </g>
                      )
                    })}
                  </svg>
                )}

                {/* Dynamic Detections or Static Recon Bounding Boxes */}
                {activeDetections.length > 0 ? (
                  activeDetections.map((det) => (
                    <div
                      key={`modal-${det.id}`}
                      className={`modal-ai-box ${det.classId === 0 ? 'survivor-box-lg' : 'hazard-box-lg'} onnx-dynamic-box ${det.posture === 'LYING_DOWN' ? 'prone-border-glow' : ''}`}
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
                      <div className={`box-tag-lg ${det.classId !== 0 ? 'hazard' : ''} ${det.posture === 'LYING_DOWN' ? 'tag-prone-hazard' : ''}`}>
                        {det.classId !== 0 && <Flame size={12} />}
                        <span>{det.label} · {det.confidence}% CONFIDENCE</span>
                      </div>
                      {det.posture && (
                        <div className={`modal-posture-pill ${det.posture === 'LYING_DOWN' ? 'posture-prone-hazard' : det.posture === 'CALLING_FOR_HELP' ? 'posture-waving-distress' : 'posture-standing'}`}>
                          <span>{det.posture === 'LYING_DOWN' ? '⚠️ PRONE CASUALTY · CRITICAL' : det.posture === 'CALLING_FOR_HELP' ? '🚨 WAVING · DISTRESS BEACON' : det.posture === 'CROUCHING_TRAPPED' ? '⚡ CROUCHING / ENTRAPMENT' : 'AMBULATORY'}</span>
                        </div>
                      )}
                    </div>
                  ))
                ) : !uploadedVideoUrl ? (
                  <>
                    {/* S-03 High-Res Bounding Box */}
                    <div className="modal-ai-box survivor-box-lg">
                      <div className="box-corner tl" />
                      <div className="box-corner tr" />
                      <div className="box-corner bl" />
                      <div className="box-corner br" />
                      <div className="box-tag-lg">
                        <span>SURVIVOR {survivor.id} · 97% CONFIDENCE</span>
                      </div>
                    </div>

                    {/* Hazard Bounding Box */}
                    <div className="modal-ai-box hazard-box-lg">
                      <div className="box-corner tl" />
                      <div className="box-corner tr" />
                      <div className="box-corner bl" />
                      <div className="box-corner br" />
                      <div className="box-tag-lg hazard">
                        <Flame size={12} />
                        <span>HAZARD H-01 UNSTABLE STRUCTURE · 92%</span>
                      </div>
                    </div>
                  </>
                ) : null}

                {/* Corner HUD Telemetry */}
                <div className="modal-corner-telemetry">
                  <span>SENSOR: SONY EXMOR R 48MP</span>
                  <span>LENS: 24mm TACTICAL EQUIV</span>
                  <span>ZOOM: 1.0X OPTICAL</span>
                  <span>TARGET DIST: 120.4 METERS</span>
                </div>
              </div>
            )}

            {expandedFeed === 'THERMAL' && (
              <div className="modal-media-wrapper thermal-modal-bg">
                <div className="thermal-gradient-backdrop full-size" />
                <div className="ambient-heat-field heat-1-lg" />
                <div className="ambient-heat-field heat-2-lg" />
                <div className="thermal-scanlines" />

                <div className="thermal-human-signature-lg">
                  <div className="heat-body-core-lg" />
                  <div className="heat-halo-magenta-lg" />
                </div>

                <div className="thermal-targeting-box-lg">
                  <div className="thermal-bracket tl" />
                  <div className="thermal-bracket tr" />
                  <div className="thermal-bracket bl" />
                  <div className="thermal-bracket br" />
                  <div className="thermal-target-details">
                    <strong>HUMAN HEAT SIGNATURE: 96%</strong>
                    <span>MAX CORE TEMP: 36.8°C</span>
                    <span>DELTA T: +14.2°C OVER AMBIENT</span>
                  </div>
                </div>

                <div className="modal-corner-telemetry">
                  <span>SENSOR: FLIR BOSON 640x512 RADIOMETRIC</span>
                  <span>SPECTRUM: 7.5 - 13.5 µm (LWIR)</span>
                  <span>COLOR PALETTE: FUSED IRONBOW</span>
                </div>
              </div>
            )}

            {expandedFeed === 'ODOMETRY' && (
              <div className="modal-media-wrapper vio-modal-bg">
                <div className="vio-grid-perspective-lg">
                  <div className="grid-plane-lg" />
                </div>
                <svg viewBox="0 0 600 320" className="vio-svg-lg">
                  <defs>
                    <linearGradient id="modalVioGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0284c7" stopOpacity="0.3" />
                      <stop offset="50%" stopColor="#00f0ff" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="1" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 50,250 Q 180,220 300,160 T 480,95 T 540,65"
                    fill="none"
                    stroke="url(#modalVioGrad)"
                    strokeWidth="4"
                    strokeDasharray="6 3"
                  />
                  <circle cx="540" cy="65" r="7" fill="#10b981" />
                  <circle cx="540" cy="65" r="14" fill="none" stroke="#10b981" opacity="0.6" />
                </svg>

                <div className="modal-corner-telemetry">
                  <span>FUSION: STEREO VIO + IMU 6-DOF + BAROMETER</span>
                  <span>ESTIMATED DRIFT: &lt; 0.08m / km</span>
                  <span>STATUS: KEYFRAME TRACKING LOCKED</span>
                </div>
              </div>
            )}
          </div>

          {/* Diagnostic Sidebar Inside Modal */}
          <div className="modal-diag-panel">
            <h3 className="diag-heading">SENSOR TELEMETRY</h3>
            <div className="diag-grid">
              <div className="diag-item">
                <small>SOURCE PLATFORM</small>
                <strong>D1 EAGLE ONE</strong>
              </div>
              <div className="diag-item">
                <small>ALTITUDE AGL</small>
                <strong className="highlight-cyan">{alt} METERS</strong>
              </div>
              <div className="diag-item">
                <small>COMPASS HEADING</small>
                <strong className="highlight-cyan">{hdg}° TRUE NORTH</strong>
              </div>
              <div className="diag-item">
                <small>TARGET SECTOR</small>
                <strong>SECTOR C3 (BANGALORE)</strong>
              </div>
              <div className="diag-item">
                <small>AI FUSED CONFIDENCE</small>
                <strong className="highlight-green">97.2% VERIFIED</strong>
              </div>
              <div className="diag-item">
                <small>SAFE ROUTE CORRIDOR</small>
                <strong className="highlight-green">ALPHA → S-03 (2.4 km)</strong>
              </div>
            </div>

            <div className="diag-actions-section">
              <h4 className="diag-subheading">STREAM CONTROLS</h4>
              <button type="button" className="diag-btn primary">
                <ScanLine size={13} /> ENHANCE AI DETECTIONS
              </button>
              <button type="button" className="diag-btn">
                <Download size={13} /> CAPTURE EVIDENCE FRAME
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
