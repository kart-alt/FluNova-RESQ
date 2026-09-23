import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  MapPin,
  Navigation,
  Radio,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UsersRound,
  Zap,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCommandStore } from '../../store/commandStore'

const hazardGlyphs: Record<string, any> = {
  FIRE: Flame,
  'UNSTABLE STRUCTURE': ShieldAlert,
  DEBRIS: AlertTriangle,
  SMOKE: Radio,
}

export function IntelligencePanel() {
  const navigate = useNavigate()
  const {
    alerts,
    survivors,
    hazards,
    teams,
    selectedSurvivorId,
    selectedHazardId,
    selectedTeamId,
    selectSurvivor,
    selectHazard,
    selectTeam,
    acknowledgeAlert,
    openDispatchModal,
    events,
    activeDetections,
  } = useCommandStore()

  // Selected Survivor (default to S-03)
  const survivor = survivors.find(s => s.id === (selectedSurvivorId ?? 'S-03')) ?? survivors[0]
  const assignedTeam = teams.find(t => t.id === survivor.assignedTeamId) ?? teams[0]

  // Timeline events
  const timelineMilestones = [
    { time: '08:00', title: 'MISSION INITIALIZED', status: 'completed' },
    { time: '08:05', title: 'DRONE D1 AIRBORNE', status: 'completed' },
    { time: '08:11', title: 'HAZARD DETECTED', status: 'completed' },
    { time: '08:14', title: 'SURVIVOR S-03 DETECTED', status: 'completed' },
    { time: '08:15', title: 'THERMAL CONFIRMATION', status: 'completed' },
    { time: '08:17', title: 'TEAM ALPHA ROUTED', status: 'completed' },
    { time: '08:22', title: 'RESCUE OPERATION IN PROGRESS', status: 'active' },
  ]

  // Key Hazards to display in the Hazard Panel
  const keyHazards = [
    { type: 'FIRE', severity: 'CRITICAL', confidence: 95, sector: 'B2', id: 'H-02' },
    { type: 'UNSTABLE STRUCTURE', severity: 'HIGH', confidence: 92, sector: 'C3', id: 'H-01' },
    { type: 'DEBRIS', severity: 'HIGH', confidence: 87, sector: 'C3', id: 'H-04' },
    { type: 'SMOKE', severity: 'MEDIUM', confidence: 89, sector: 'C5', id: 'H-03' },
  ]

  return (
    <section className="lower-intelligence-suite">
      {/* 1. SURVIVOR INTELLIGENCE PANEL */}
      <div className="intel-card survivor-intel-panel">
        <div className="intel-card-header">
          <div className="intel-header-title">
            <span className="intel-panel-category">TACTICAL ASSESSMENT</span>
            <h3 className="intel-panel-title">SURVIVOR INTELLIGENCE</h3>
          </div>
          <div className="survivor-status-tag-row">
            {activeDetections.length > 0 && (
              <span
                className="qai-hub-detected-pill"
                style={{
                  background: 'rgba(6, 182, 212, 0.15)',
                  border: '1px solid rgba(6, 182, 212, 0.4)',
                  color: '#22d3ee',
                  fontSize: '10px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                }}
              >
                {activeDetections.length} MEMBERS DETECTED
              </span>
            )}
            <span className="survivor-id-badge">{survivor.id}</span>
            <span className={`survivor-crit-pill ${survivor.status === 'CRITICAL' ? 'pulsing-red' : ''}`}>{survivor.status}</span>
          </div>
        </div>

        {/* Survivor Tracked Selector Tab Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid rgba(56, 189, 248, 0.1)', overflowX: 'auto' }}>
          <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.05em' }}>TRACKED ID:</span>
          {survivors.map(s => {
            const isSelected = s.id === survivor.id
            const isCrit = s.status === 'CRITICAL' || s.observedPosture === 'LYING'
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => selectSurvivor(s.id)}
                style={{
                  background: isSelected ? (isCrit ? 'rgba(244, 63, 94, 0.25)' : 'rgba(56, 189, 248, 0.25)') : 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${isSelected ? (isCrit ? 'rgba(244, 63, 94, 0.7)' : 'rgba(56, 189, 248, 0.7)') : 'rgba(255, 255, 255, 0.1)'}`,
                  color: isSelected ? (isCrit ? '#fb7185' : '#38bdf8') : '#94a3b8',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>{s.id}</span>
                <span style={{ fontSize: '9px', opacity: 0.8 }}>({s.fusedConfidence}%)</span>
              </button>
            )
          })}
        </div>

        {/* Big Fused Confidence Display */}
        <div className="survivor-fused-hero">
          <div className="fused-score-circle">
            <svg viewBox="0 0 42 42" className="fused-radial-svg">
              <circle className="fused-radial-bg" cx="21" cy="21" r="17" />
              <circle
                className="fused-radial-meter"
                cx="21"
                cy="21"
                r="17"
                strokeDasharray="106.8"
                strokeDashoffset={106.8 - ((survivor.fusedConfidence || 92) / 100) * 106.8}
              />
            </svg>
            <div className="fused-score-value">
              <span className="huge-percent">{survivor.fusedConfidence || 92}%</span>
            </div>
          </div>

          <div className="fused-score-details">
            <span className="fused-caption">FUSED CONFIDENCE</span>
            <div className="sub-confidence-row">
              <div className="sub-conf-item">
                <small>RGB</small>
                <strong>{survivor.confidence || 88}%</strong>
              </div>
              <span className="plus-sign">+</span>
              <div className="sub-conf-item">
                <small>THERMAL</small>
                <strong>{survivor.thermalConfidence || 94}%</strong>
              </div>
            </div>
            <div className="posture-priority-row">
              <span className="posture-pill">POSTURE: {survivor.observedPosture}</span>
              <span className="priority-pill">PRIORITY: {survivor.priority} / 100</span>
            </div>
          </div>
        </div>

        {/* Location & Team Dispatch Grid */}
        <div className="survivor-location-grid">
          <div className="loc-item">
            <small>LOCATION</small>
            <span>Sector {survivor.sector}</span>
          </div>
          <div className="loc-item">
            <small>COORDINATES</small>
            <span className="mono">{survivor.latitude.toFixed(4)}, {survivor.longitude.toFixed(4)}</span>
          </div>
          <div className="loc-item highlight-team">
            <small>ASSIGNED TEAM</small>
            <strong className="highlight-green">{assignedTeam.name?.toUpperCase() ?? 'TEAM ALPHA'}</strong>
          </div>
          <div className="loc-item">
            <small>DISTANCE / ETA</small>
            <span className="mono highlight-cyan">{assignedTeam.distance} · ETA {assignedTeam.eta ?? '06:30'}</span>
          </div>
        </div>

        {/* Nearby Hazards */}
        <div className="survivor-hazards-block">
          <small className="block-label">NEARBY HAZARDS</small>
          <div className="hazard-pills-row">
            {survivor.nearbyHazards?.length > 0 && hazards.length > 0 ? (
              survivor.nearbyHazards.map(hId => {
                const h = hazards.find(item => item.id === hId)
                return (
                  <button
                    key={hId}
                    type="button"
                    className="nearby-hazard-pill"
                    onClick={() => selectHazard(hId)}
                    title={`Focus ${hId} on Map`}
                  >
                    <ShieldAlert size={11} className="hazard-pill-icon" />
                    <span>{h ? `${h.id} ${h.type}` : hId}</span>
                  </button>
                )
              })
            ) : (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                color: '#34d399'
              }}>
                <ShieldCheck size={12} />
                ALL CLEAR · ZERO HAZARDS IN SECTOR
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. LIVE ALERTS PANEL */}
      <div className="intel-card live-alerts-panel">
        <div className="intel-card-header">
          <div className="intel-header-title">
            <span className="intel-panel-category">EARLY WARNING SYSTEM</span>
            <h3 className="intel-panel-title">LIVE ALERTS</h3>
          </div>
          <button
            type="button"
            className="view-all-link"
            onClick={() => navigate('/alerts')}
            title="View all alerts"
          >
            VIEW ALL <ExternalLink size={11} />
          </button>
        </div>

        <div className="alerts-vertical-stack">
          {alerts.map(a => (
            <div key={a.id} className={`tactical-alert-card ${a.severity.toLowerCase()}-alert`}>
              <div className="alert-card-top-row">
                <span className={`alert-severity-tag ${a.severity.toLowerCase()}`}>{a.severity}</span>
                <span className="alert-time">{a.timestamp}</span>
              </div>
              <strong className="alert-title-text">{a.title}</strong>
              <p className="alert-sub-text">{a.message}</p>
              <div className="alert-action-buttons">
                <button
                  type="button"
                  className="alert-btn ack-btn"
                  onClick={() => acknowledgeAlert(a.id)}
                >
                  ACKNOWLEDGE
                </button>
                <button
                  type="button"
                  className="alert-btn map-btn"
                  onClick={() => {
                    if (a.survivorId) selectSurvivor(a.survivorId)
                    navigate('/map')
                  }}
                >
                  VIEW ON MAP
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. HAZARD INTELLIGENCE PANEL */}
      <div className="intel-card hazard-intel-panel">
        <div className="intel-card-header">
          <div className="intel-header-title">
            <span className="intel-panel-category">ENVIRONMENTAL RISKS</span>
            <h3 className="intel-panel-title">HAZARD INTELLIGENCE</h3>
          </div>
          <button
            type="button"
            className="view-all-link"
            onClick={() => navigate('/hazards')}
            title="View full hazard analysis"
          >
            CATALOG <ExternalLink size={11} />
          </button>
        </div>

        {hazards.length === 0 ? (
          <div style={{
            background: 'rgba(6, 78, 59, 0.25)',
            border: '1px solid rgba(52, 211, 153, 0.3)',
            borderRadius: '8px',
            padding: '28px 16px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}>
            <ShieldCheck size={30} style={{ color: '#34d399' }} />
            <strong style={{ fontSize: '13px', color: '#6ee7b7' }}>SAFE CAMPUS ZONE · ZERO HAZARDS</strong>
            <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', lineHeight: 1.4 }}>
              Sri Eshwar College of Engineering sector verified 100% clear. Zero environmental risks or active exclusion perimeters.
            </p>
          </div>
        ) : (
          <div className="hazards-compact-grid">
            {hazards.slice(0, 4).map(h => {
              const Icon = hazardGlyphs[h.type] ?? ShieldAlert
              return (
                <div
                  key={h.type}
                  className={`hazard-item-box severity-${h.severity.toLowerCase()}`}
                  onClick={() => selectHazard(h.id)}
                  title={`Click to view ${h.type} on tactical map`}
                >
                  <div className="hazard-box-left">
                    <div className={`hazard-glyph-wrapper ${h.severity.toLowerCase()}`}>
                      <Icon size={14} />
                    </div>
                    <div className="hazard-box-titles">
                      <strong className="hazard-type-name">{h.type}</strong>
                      <span className="hazard-sector-text">Sector {h.sector} · {h.id}</span>
                    </div>
                  </div>
                  <div className="hazard-box-right">
                    <span className={`hazard-severity-pill ${h.severity.toLowerCase()}`}>
                      {h.severity}
                    </span>
                    <span className="hazard-conf-pct">{h.confidence}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 4. RESCUE TEAMS PANEL */}
      <div className="intel-card rescue-teams-panel">
        <div className="intel-card-header">
          <div className="intel-header-title">
            <span className="intel-panel-category">GROUND ASSETS</span>
            <h3 className="intel-panel-title">RESCUE TEAMS</h3>
          </div>
          <button
            type="button"
            className="view-all-link"
            onClick={() => openDispatchModal(survivor.id)}
            title="Open Interactive Safe Route Dispatch Console"
          >
            DISPATCH <ExternalLink size={11} />
          </button>
        </div>

        <div className="teams-vertical-list">
          {teams.map(t => {
            const isAssigned = survivor.assignedTeamId === t.id
            const badgeLetter = t.name.includes('Alpha')
              ? 'α'
              : t.name.includes('Bravo')
                ? 'β'
                : t.name.includes('Charlie')
                  ? 'γ'
                  : 'δ'

            return (
              <div
                key={t.id}
                className={`team-entry-card ${isAssigned ? 'team-alpha-highlighted' : ''}`}
                onClick={() => selectTeam(t.id)}
              >
                <div className="team-entry-header">
                  <div className="team-name-group">
                    <span className={`team-icon-badge ${t.id.toLowerCase()}`}>{badgeLetter}</span>
                    <div>
                      <strong className="team-name-text">{t.name}</strong>
                      {isAssigned && <span className="team-assigned-target">→ ASSIGNED TO {survivor.id}</span>}
                    </div>
                  </div>
                  <span className={`team-status-tag ${t.status.toLowerCase().replace(' ', '-')}`}>
                    {t.status === 'EN ROUTE' && <span className="pulse-blue-dot" />}
                    {t.status === 'AVAILABLE' && <span className="green-dot" />}
                    {t.status === 'BUSY' && <span className="yellow-dot" />}
                    {t.status === 'OFFLINE' && <span className="gray-dot" />}
                    {t.status}
                  </span>
                </div>
                {t.status === 'EN ROUTE' && (
                  <div className="team-eta-bar">
                    <div className="eta-metric">
                      <small>DISTANCE</small>
                      <span>{t.distance}</span>
                    </div>
                    <div className="eta-metric">
                      <small>ETA CORRIDOR</small>
                      <span className="highlight-green">ETA {t.eta ?? '06:30'}</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 5. MISSION PROGRESS PANEL (TIMELINE) */}
      <div className="intel-card mission-progress-panel">
        <div className="intel-card-header">
          <div className="intel-header-title">
            <span className="intel-panel-category">AUTONOMOUS AUDIT</span>
            <h3 className="intel-panel-title">MISSION PROGRESS</h3>
          </div>
          <button
            type="button"
            className="view-all-link"
            onClick={() => navigate('/mission-log')}
            title="Open Mission Log"
          >
            LOG <ExternalLink size={11} />
          </button>
        </div>

        <div className="futuristic-vertical-timeline">
          <div className="timeline-glow-rail" />
          {(events && events.length > 0
            ? [
                ...timelineMilestones.slice(0, 3),
                ...events.slice(-3).map(e => ({
                  time: e.time,
                  title: e.title.toUpperCase(),
                  status: 'active' as const,
                })),
              ]
            : timelineMilestones
          ).map((item, idx) => (
            <div
              key={`${item.title}-${item.time}-${idx}`}
              className={`timeline-node ${item.status === 'active' ? 'is-active-step' : 'is-completed'}`}
            >
              <div className="timeline-node-dot">
                {item.status === 'active' ? (
                  <span className="active-ping-ring" />
                ) : (
                  <CheckCircle2 size={10} className="check-icon-timeline" />
                )}
              </div>
              <div className="timeline-node-content">
                <span className="timeline-timestamp">{item.time}</span>
                <strong className="timeline-step-name">{item.title}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
