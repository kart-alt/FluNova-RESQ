import { Compass, Maximize2, Navigation, Radio, Waves, Zap } from 'lucide-react'
import { useCommandStore } from '../../store/commandStore'

export function OdometryView() {
  const drone = useCommandStore(state => state.drones[0])
  const setExpandedFeed = useCommandStore(state => state.setExpandedFeed)

  const odo = drone?.odometry ?? {
    x: 12.4,
    y: -4.8,
    z: 118.7,
    vx: 2.1,
    vy: 0.4,
    vz: 0.0,
    heading: 127,
    confidence: 99.4,
  }

  // Format with sign
  const formatCoord = (val: number) => (val >= 0 ? `+${val.toFixed(1)}` : `${val.toFixed(1)}`)
  const formatVel = (val: number) => val.toFixed(1)

  return (
    <div className="intelligence-stack-card odometry-card">
      {/* Header */}
      <div className="stack-card-header">
        <div className="card-header-left">
          <span className="card-title">VISUAL ODOMETRY</span>
          <span className="feed-status-pill tracking">
            <span className="tracking-cyan-dot" />
            TRACKING
          </span>
        </div>
        <div className="card-header-actions">
          <button
            type="button"
            className="expand-feed-btn"
            onClick={() => setExpandedFeed('ODOMETRY')}
            title="Expand Visual Odometry trajectory"
          >
            <Maximize2 size={13} />
          </button>
        </div>
      </div>

      {/* Stylized Dark VIO Trajectory Visualization */}
      <div className="feed-media-container vio-viewport" onClick={() => setExpandedFeed('ODOMETRY')}>
        {/* Tactical 3D Wireframe Plane */}
        <div className="vio-grid-perspective">
          <div className="grid-plane" />
        </div>

        {/* Animated Trajectory SVG Path */}
        <svg viewBox="0 0 260 110" className="vio-trajectory-svg" preserveAspectRatio="none">
          <defs>
            <linearGradient id="vioTrajectoryGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#00f0ff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="1" />
            </linearGradient>
            <filter id="vioGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Reference Ground Projection Lines */}
          <line x1="25" y1="95" x2="25" y2="78" stroke="#1e293b" strokeDasharray="2 2" />
          <line x1="75" y1="90" x2="75" y2="65" stroke="#1e293b" strokeDasharray="2 2" />
          <line x1="130" y1="85" x2="130" y2="52" stroke="#1e293b" strokeDasharray="2 2" />
          <line x1="185" y1="82" x2="185" y2="38" stroke="#1e293b" strokeDasharray="2 2" />
          <line x1="230" y1="80" x2="230" y2="28" stroke="#00f0ff" strokeWidth="0.8" strokeDasharray="2 2" />

          {/* Trajectory Flight Path */}
          <path
            d="M 20,82 Q 60,75 100,62 T 180,42 T 230,28"
            fill="none"
            stroke="url(#vioTrajectoryGrad)"
            strokeWidth="2.5"
            filter="url(#vioGlow)"
            className="trajectory-flight-path"
          />

          {/* Waypoint nodes */}
          <circle cx="20" cy="82" r="2.5" fill="#0284c7" />
          <circle cx="100" cy="62" r="2.5" fill="#00f0ff" />
          <circle cx="180" cy="42" r="2.5" fill="#38bdf8" />

          {/* Current Drone Position Beacon */}
          <circle cx="230" cy="28" r="4" fill="#34d399" filter="url(#vioGlow)" />
          <circle cx="230" cy="28" r="8" fill="none" stroke="#34d399" strokeWidth="1" className="drone-beacon-ripple" />
        </svg>

        {/* Tactical Corner Watermark */}
        <div className="vio-hud-label">
          <small>DRONE TRAJECTORY</small>
        </div>

        {/* Compass Heading Widget */}
        <div className="vio-heading-widget">
          <Compass
            size={16}
            className="vio-compass-icon"
            style={{ transform: `rotate(${odo.heading}deg)` }}
          />
          <div className="heading-meta">
            <small>HEADING</small>
            <span className="heading-deg highlight-cyan">{odo.heading}°</span>
          </div>
        </div>
      </div>

      {/* Telemetry Metrics Readout Grid */}
      <div className="vio-metrics-grid">
        {/* CURRENT POSITION */}
        <div className="vio-metric-col">
          <span className="metric-col-title">CURRENT POSITION</span>
          <div className="coord-row">
            <span className="axis-item">
              <small>X:</small>
              <strong className="coord-val">{formatCoord(odo.x)}m</strong>
            </span>
            <span className="axis-item">
              <small>Y:</small>
              <strong className="coord-val">{formatCoord(odo.y)}m</strong>
            </span>
            <span className="axis-item">
              <small>Z:</small>
              <strong className="coord-val highlight-cyan">{formatCoord(odo.z)}m</strong>
            </span>
          </div>
        </div>

        {/* VELOCITY */}
        <div className="vio-metric-col">
          <span className="metric-col-title">VELOCITY</span>
          <div className="coord-row">
            <span className="axis-item">
              <small>VX:</small>
              <strong className="coord-val">{formatVel(odo.vx)}</strong>
            </span>
            <span className="axis-item">
              <small>VY:</small>
              <strong className="coord-val">{formatVel(odo.vy)}</strong>
            </span>
            <span className="axis-item">
              <small>VZ:</small>
              <strong className="coord-val">{formatVel(odo.vz)}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
