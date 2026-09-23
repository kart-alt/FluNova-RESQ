import { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  HeartPulse,
  MapPin,
  Navigation,
  Radio,
  Send,
  Shield,
  ShieldAlert,
  UsersRound,
  X,
  Zap,
} from 'lucide-react'
import { useCommandStore } from '../../store/commandStore'
import { generateSafeRescueRoute } from '../../utils/safePathfinding'

export function TeamDispatchModal() {
  const {
    dispatchModalOpen,
    dispatchSurvivorId,
    survivors,
    teams,
    hazards,
    closeDispatchModal,
    dispatchTeamToSurvivor,
  } = useCommandStore()

  const [selectedTeam, setSelectedTeam] = useState<string>('ALPHA')
  const [justDispatched, setJustDispatched] = useState<string | null>(null)

  if (!dispatchModalOpen) return null

  const survivor =
    survivors.find(s => s.id === dispatchSurvivorId) ??
    survivors.find(s => s.id === 'S-03') ??
    survivors[0]

  const handleDispatch = (teamId: string) => {
    dispatchTeamToSurvivor(teamId, survivor.id)
    setJustDispatched(teamId)
    setTimeout(() => {
      setJustDispatched(null)
      closeDispatchModal()
    }, 1800)
  }

  // Pre-calculate safe route metrics for all teams to this survivor
  const teamMetrics = teams.map(team => {
    const route = generateSafeRescueRoute(team, survivor, hazards)
    return {
      team,
      route,
      isAssigned: survivor.assignedTeamId === team.id,
    }
  })

  return (
    <div className="vitals-modal-backdrop" onClick={closeDispatchModal}>
      <div
        className="vitals-modal-dialog dispatch-modal-dialog"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="vitals-modal-header dispatch-header">
          <div className="vitals-modal-header-left">
            <div className="tactical-chip-row">
              <span className="modal-category-tag">
                <Send size={13} className="text-cyan" />
                GROUND COMMAND DISPATCHER
              </span>
              <span className="tag-sep">/</span>
              <span className="modal-sub-tag">AI SAFE VECTOR ROUTING</span>
            </div>
            <h2 className="vitals-modal-title">
              Dispatch Rescue Unit → Survivor {survivor.id}
            </h2>
          </div>

          <div className="vitals-modal-header-right">
            <span className={`survivor-crit-pill ${survivor.status === 'CRITICAL' ? 'pulsing-red' : ''}`}>
              {survivor.status} · PRIORITY {survivor.priority}/100
            </span>
            <button
              type="button"
              className="vitals-modal-close-btn"
              onClick={closeDispatchModal}
              title="Close Dispatcher"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Target Victim Summary Bar */}
        <div className="vitals-tactical-subbar">
          <div className="subbar-stat">
            <small>TARGET SECTOR</small>
            <span>
              <MapPin size={11} className="inline-icon" /> Sector {survivor.sector} (
              {survivor.latitude.toFixed(4)}, {survivor.longitude.toFixed(4)})
            </span>
          </div>
          <div className="subbar-stat">
            <small>OBSERVED POSTURE</small>
            <strong className="posture-tag">{survivor.observedPosture}</strong>
          </div>
          <div className="subbar-stat">
            <small>FUSED AI CONFIDENCE</small>
            <strong className="text-emerald">{survivor.fusedConfidence}%</strong>
          </div>
          <div className="subbar-stat">
            <small>CURRENT ASSIGNMENT</small>
            <strong className="text-cyan">
              {survivor.assignedTeamId ? `TEAM ${survivor.assignedTeamId}` : 'UNASSIGNED (STANDBY)'}
            </strong>
          </div>
        </div>

        {/* Body: Available Teams List */}
        <div className="vitals-modal-body dispatch-modal-body">
          <div className="dispatch-guidance-banner">
            <Zap size={14} className="text-amber" />
            <p>
              AI safe pathfinding automatically calculates obstacle-avoidance vectors around active fire, structural
              collapse, and debris zones with an <b>80m buffer margin</b>.
            </p>
          </div>

          <div className="dispatch-teams-grid">
            {teamMetrics.map(({ team, route, isAssigned }) => {
              const isSelected = selectedTeam === team.id
              const isDispatchedSuccess = justDispatched === team.id

              return (
                <div
                  key={team.id}
                  className={`dispatch-team-card ${isAssigned ? 'current-assigned' : ''} ${
                    isSelected ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedTeam(team.id)}
                >
                  <div className="dispatch-team-top">
                    <div className="team-badge-group">
                      <div className="team-avatar">
                        <UsersRound size={16} />
                      </div>
                      <div>
                        <span className="team-code">{team.id}</span>
                        <h3 className="team-title">{team.name}</h3>
                      </div>
                    </div>

                    <div className="team-status-tag-row">
                      <span className={`team-status-pill ${team.status.toLowerCase().replace(' ', '-')}`}>
                        {team.status}
                      </span>
                    </div>
                  </div>

                  {/* Calculated Safe Path Metrics */}
                  <div className="route-calc-metrics">
                    <div className="calc-metric">
                      <small>SAFE CORRIDOR DISTANCE</small>
                      <strong>{route.distanceKm} km</strong>
                    </div>
                    <div className="calc-metric">
                      <small>ESTIMATED ETA</small>
                      <strong className="text-cyan">{route.etaString}</strong>
                    </div>
                    <div className="calc-metric">
                      <small>HAZARDS BYPASSED</small>
                      <strong className={route.collidingHazards.length > 0 ? 'text-amber' : 'text-emerald'}>
                        {route.collidingHazards.length} Zones
                      </strong>
                    </div>
                    <div className="calc-metric">
                      <small>CLEARANCE BUFFER</small>
                      <strong className="text-emerald">{route.clearanceMeters}m SAFE</strong>
                    </div>
                  </div>

                  {/* Capabilities */}
                  <div className="team-caps-row">
                    <Shield size={12} className="text-slate" />
                    {team.capabilities.map(c => (
                      <span key={c} className="cap-pill">
                        {c}
                      </span>
                    ))}
                  </div>

                  {/* Dispatch Action */}
                  <div className="team-dispatch-action-row">
                    {isDispatchedSuccess ? (
                      <button type="button" className="dispatch-btn success" disabled>
                        <CheckCircle2 size={13} />
                        <span>DISPATCHED & CORRIDOR ENGAGED</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={`dispatch-btn ${isAssigned ? 'reassign' : 'primary'}`}
                        onClick={e => {
                          e.stopPropagation()
                          handleDispatch(team.id)
                        }}
                      >
                        <Send size={13} />
                        <span>
                          {isAssigned ? `RE-ENGAGE SAFE ROUTE (${team.name})` : `DISPATCH ${team.name.toUpperCase()}`}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="vitals-modal-footer">
          <div className="footer-status-msg">
            <Radio size={13} className="text-emerald animate-pulse" />
            <span>Telemetry broadcast ready on NDRF Tactical Frequency 148.250 MHz</span>
          </div>

          <div className="footer-actions">
            <button type="button" className="modal-close-action-btn" onClick={closeDispatchModal}>
              CANCEL
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
