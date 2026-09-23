import { Activity, ArrowLeft, ClipboardCheck, Navigation, Radio, Send, ShieldAlert, ShieldCheck, UsersRound } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AcousticSpectrogram } from '../components/diagnostics/AcousticSpectrogram'
import { TeamDispatchModal } from '../components/dispatch/TeamDispatchModal'
import { CameraFeed } from '../components/feeds/CameraFeed'
import { Panel, SectionLabel } from '../components/ui/Primitives'
import { useCommandStore } from '../store/commandStore'

export function SurvivorDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    survivors,
    teams,
    hazards,
    selectSurvivor,
    openDispatchModal,
    markSurvivorStatus,
  } = useCommandStore(state => state)
  const survivor = survivors.find(item => item.id === id)

  if (!survivor) {
    return (
      <div className="empty-page">
        <UsersRound size={32} />
        <h1>Survivor record not found</h1>
        <Link to="/survivors">Return to survivor management</Link>
      </div>
    )
  }

  const team = teams.find(item => item.id === survivor.assignedTeamId)
  const nearby = hazards.filter(hazard => survivor.nearbyHazards.includes(hazard.id))

  return (
    <div className="survivor-detail">
      <div className="detail-heading">
        <Link to="/survivors"><ArrowLeft size={16} /> SURVIVOR MANAGEMENT</Link>
        <div>
          <div>
            <SectionLabel>SURVIVOR INTELLIGENCE / EVIDENCE RECORD</SectionLabel>
            <h1>{survivor.id} <span className={`status-tag ${survivor.status.toLowerCase().replace(' ', '-')}`}>{survivor.status}</span></h1>
            <p>Last observation {survivor.detectedAt} · Sector {survivor.sector} · {survivor.latitude.toFixed(5)}, {survivor.longitude.toFixed(5)}</p>
          </div>
          <div className="detail-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <button type="button" onClick={() => navigate('/map')} style={{ height: '30px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <Navigation size={15} /> NAVIGATE
            </button>
            <button type="button" onClick={() => openDispatchModal(survivor.id)} style={{ height: '30px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <Send size={15} /> DISPATCH TEAM
            </button>
            {survivor.status !== 'RESCUED' ? (
              <>
                {survivor.status !== 'VERIFIED' && (
                  <button type="button" onClick={() => markSurvivorStatus(survivor.id, 'VERIFIED')} style={{ height: '30px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <ClipboardCheck size={15} /> MARK VERIFIED
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => markSurvivorStatus(survivor.id, 'RESCUED')}
                  style={{ height: '30px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(16, 185, 129, 0.2)', borderColor: '#10b981', color: '#10b981' }}
                >
                  <ClipboardCheck size={15} /> MARK RESCUED
                </button>
              </>
            ) : (
              <span className="rescued-status-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0 12px', height: '30px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#10b981', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                <ClipboardCheck size={14} /> EXTRACTED & RESCUED
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="detail-grid">
        <div className="evidence-column">
          <CameraFeed type="RGB" />
          <CameraFeed type="THERMAL" />
          
          {/* Deep AI Sensor Diagnostics */}
          <div className="survivor-deep-diagnostics-section" style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
            {/* AI Pose Estimation & Biomechanical Hazard Analysis Card */}
            <Panel className="pose-diagnostics-panel" style={{ background: '#0b1329', border: '1px solid #1e293b', padding: '16px', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <SectionLabel>QUALCOMM AI HUB YOLO26-POSE · PERSON DETECTION & 17-KEYPOINT BIOMECHANICS</SectionLabel>
                  <h3 style={{ margin: '4px 0 0', fontSize: '15px', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={16} className="text-cyan" />
                    <span>Posture & Hazard Sensing Report</span>
                  </h3>
                </div>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  background: survivor.observedPosture === 'LYING' ? 'rgba(244, 63, 94, 0.2)' : survivor.observedPosture === 'WAVING_HELP' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  border: `1px solid ${survivor.observedPosture === 'LYING' ? '#f43f5e' : survivor.observedPosture === 'WAVING_HELP' ? '#f97316' : '#10b981'}`,
                  color: survivor.observedPosture === 'LYING' ? '#fb7185' : survivor.observedPosture === 'WAVING_HELP' ? '#fb923c' : '#34d399',
                }}>
                  {survivor.observedPosture === 'LYING' ? '⚠️ PRONE / IMMOBILE' : survivor.observedPosture === 'WAVING_HELP' ? '🚨 WAVING DISTRESS' : survivor.observedPosture === 'CROUCHING' ? '⚡ CROUCHING / TRAPPED' : 'AMBULATORY'}
                </span>
              </div>

              {/* Wireframe and Metrics Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '16px', alignItems: 'center' }}>
                {/* Visual Skeleton Wireframe Preview */}
                <div style={{ height: '130px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '6px', position: 'relative', overflow: 'hidden' }}>
                  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                    {survivor.observedPosture === 'LYING' ? (
                      <>
                        <circle cx="22" cy="50" r="6" fill="#fb7185" />
                        <line x1="28" y1="50" x2="62" y2="50" stroke="#f43f5e" strokeWidth="3" />
                        <line x1="38" y1="50" x2="48" y2="35" stroke="#f43f5e" strokeWidth="2.5" />
                        <line x1="38" y1="50" x2="48" y2="65" stroke="#f43f5e" strokeWidth="2.5" />
                        <line x1="62" y1="50" x2="80" y2="42" stroke="#f43f5e" strokeWidth="2.5" />
                        <line x1="62" y1="50" x2="80" y2="58" stroke="#f43f5e" strokeWidth="2.5" />
                      </>
                    ) : survivor.observedPosture === 'WAVING_HELP' ? (
                      <>
                        <circle cx="50" cy="22" r="6" fill="#fb923c" />
                        <line x1="50" y1="28" x2="50" y2="60" stroke="#f97316" strokeWidth="3" />
                        <line x1="50" y1="38" x2="32" y2="20" stroke="#f97316" strokeWidth="2.5" />
                        <line x1="50" y1="38" x2="68" y2="18" stroke="#f97316" strokeWidth="2.5" />
                        <circle cx="32" cy="20" r="3" fill="#fb923c" />
                        <circle cx="68" cy="18" r="3" fill="#fb923c" />
                        <line x1="50" y1="60" x2="38" y2="88" stroke="#f97316" strokeWidth="2.5" />
                        <line x1="50" y1="60" x2="62" y2="88" stroke="#f97316" strokeWidth="2.5" />
                      </>
                    ) : (
                      <>
                        <circle cx="50" cy="20" r="6" fill="#38bdf8" />
                        <line x1="50" y1="26" x2="50" y2="58" stroke="#00f0ff" strokeWidth="3" />
                        <line x1="50" y1="36" x2="32" y2="52" stroke="#00f0ff" strokeWidth="2.5" />
                        <line x1="50" y1="36" x2="68" y2="52" stroke="#00f0ff" strokeWidth="2.5" />
                        <line x1="50" y1="58" x2="38" y2="88" stroke="#00f0ff" strokeWidth="2.5" />
                        <line x1="50" y1="58" x2="62" y2="88" stroke="#00f0ff" strokeWidth="2.5" />
                      </>
                    )}
                  </svg>
                  <span style={{ position: 'absolute', bottom: '4px', right: '6px', fontSize: '9px', color: '#94a3b8', fontFamily: 'monospace' }}>
                    17-KP MODEL
                  </span>
                </div>

                {/* Biomechanics Breakdown */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '8px 12px', borderRadius: '4px' }}>
                    <small style={{ color: '#94a3b8', fontSize: '10px', display: 'block' }}>SPINE INCLINATION</small>
                    <strong style={{ color: survivor.observedPosture === 'LYING' ? '#fb7185' : '#f8fafc', fontSize: '13px' }}>
                      {survivor.observedPosture === 'LYING' ? '12° (HORIZONTAL PRONE)' : '84° (UPRIGHT)'}
                    </strong>
                  </div>
                  <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '8px 12px', borderRadius: '4px' }}>
                    <small style={{ color: '#94a3b8', fontSize: '10px', display: 'block' }}>ARM ELEVATION</small>
                    <strong style={{ color: survivor.observedPosture === 'WAVING_HELP' ? '#fb923c' : '#f8fafc', fontSize: '13px' }}>
                      {survivor.observedPosture === 'WAVING_HELP' ? '+38° ABOVE SHOULDER' : 'RESTING (-45°)'}
                    </strong>
                  </div>
                  <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '8px 12px', borderRadius: '4px' }}>
                    <small style={{ color: '#94a3b8', fontSize: '10px', display: 'block' }}>MOBILITY INDEX</small>
                    <strong style={{ color: survivor.observedPosture === 'LYING' ? '#f43f5e' : '#10b981', fontSize: '13px' }}>
                      {survivor.observedPosture === 'LYING' ? '04% (IMMOBILE CASUALTY)' : '78% (ACTIVE)'}
                    </strong>
                  </div>
                  <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '8px 12px', borderRadius: '4px' }}>
                    <small style={{ color: '#94a3b8', fontSize: '10px', display: 'block' }}>INFERRED HAZARD</small>
                    <strong style={{ color: survivor.observedPosture === 'LYING' ? '#f43f5e' : '#38bdf8', fontSize: '13px' }}>
                      {survivor.observedPosture === 'LYING' ? 'UNCONSCIOUS RISK' : 'NONE DETECTED'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Hazard Inference Note */}
              <div style={{ marginTop: '12px', padding: '8px 12px', background: survivor.observedPosture === 'LYING' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(56, 189, 248, 0.08)', border: `1px solid ${survivor.observedPosture === 'LYING' ? 'rgba(244, 63, 94, 0.3)' : 'rgba(56, 189, 248, 0.2)'}`, borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={14} className={survivor.observedPosture === 'LYING' ? 'text-rose-400' : 'text-cyan'} />
                <span style={{ fontSize: '11px', color: '#cbd5e1' }}>
                  {survivor.observedPosture === 'LYING'
                    ? 'CRITICAL POSE HAZARD: Survivor in horizontal prone posture for >180 seconds. High likelihood of hypothermia, blunt force trauma, or unconsciousness. Immediate triage dispatch priority.'
                    : survivor.observedPosture === 'WAVING_HELP'
                      ? 'DISTRESS BEACON DETECTED: Survivor exhibits bilateral arm elevation cadence indicating conscious distress call and request for aerial guidance.'
                      : 'MONITORED POSE: Ambulatory victim observed with nominal joint articulations.'}
                </span>
              </div>
            </Panel>

            <AcousticSpectrogram acoustic={survivor.acoustic} survivorId={survivor.id} />
          </div>

          <Panel className="evidence-note">
            <Radio size={16} />
            <div>
              <b>AI-observed indicators, not a medical diagnosis</b>
              <p>Visual and thermal perception data are confidence signals to support responder verification.</p>
            </div>
          </Panel>
        </div>

        <aside className="survivor-facts">
          <Panel>
            <SectionLabel>MULTI-MODAL VERIFICATION</SectionLabel>
            <h2>Fused confidence <b>{survivor.fusedConfidence}%</b></h2>
            <div className="fusion">
              <span>RGB <b>{survivor.confidence}%</b><i style={{ width: `${survivor.confidence}%` }} /></span>
              <span>THERMAL <b>{survivor.thermalConfidence}%</b><i style={{ width: `${survivor.thermalConfidence}%` }} /></span>
              <span>POSTURE <b>{survivor.observedPosture}</b><i style={{ width: '76%' }} /></span>
            </div>
          </Panel>

          <Panel>
            <SectionLabel>AI PRIORITY SCORE</SectionLabel>
            <div className="score">
              <b>{survivor.priority}</b>
              <div>
                <span>Response priority</span>
                <small>AI confidence + thermal + hazard proximity + team distance</small>
              </div>
            </div>
            <div className="fact-grid">
              <span><small>POSTURE</small><b>{survivor.observedPosture}</b></span>
              <span><small>SECTOR</small><b>{survivor.sector}</b></span>
              <span><small>TEAM</small><b>{team?.name ?? 'UNASSIGNED'}</b></span>
              <span><small>ETA</small><b>{team?.eta ?? '—'}</b></span>
            </div>
          </Panel>

          <Panel>
            <SectionLabel>NEARBY HAZARD ASSESSMENT</SectionLabel>
            {nearby.length > 0 ? (
              <>
                <div className="hazard-chips">
                  {nearby.map(hazard => (
                    <button key={hazard.id} type="button" onClick={() => { selectSurvivor(survivor.id); navigate('/map') }}>
                      <ShieldAlert size={13} /> {hazard.id}
                    </button>
                  ))}
                </div>
                <div className="fact-grid">
                  <span><small>ROUTE IMPACT</small><b>Moderate</b></span>
                  <span><small>RISK</small><b>HIGH</b></span>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '6px 10px',
                  borderRadius: '4px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(52, 211, 153, 0.35)',
                  color: '#34d399',
                }}>
                  <ShieldCheck size={14} /> ALL CLEAR · SAFE ZONE
                </span>
                <div className="fact-grid">
                  <span><small>ROUTE IMPACT</small><b style={{ color: '#34d399' }}>NOMINAL (CLEAR)</b></span>
                  <span><small>RISK</small><b style={{ color: '#34d399' }}>SAFE</b></span>
                </div>
              </div>
            )}
          </Panel>

          <Panel>
            <SectionLabel>MISSION CONTEXT</SectionLabel>
            <div className="fact-grid">
              <span><small>LAT</small><b>{survivor.latitude.toFixed(5)}</b></span>
              <span><small>LNG</small><b>{survivor.longitude.toFixed(5)}</b></span>
              <span><small>DETECTED</small><b>{survivor.detectedAt}</b></span>
              <span><small>STATUS</small><b>{survivor.status}</b></span>
            </div>
          </Panel>
        </aside>
      </div>

      {/* Dynamic Team Dispatch Modal */}
      <TeamDispatchModal />
    </div>
  )
}
