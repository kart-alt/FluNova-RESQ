import { AlertTriangle, CheckCircle2, CircleDot, Filter, GraduationCap, MapPin, Shield, ShieldAlert, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCommandStore } from '../store/commandStore'
import { sampleDisasterHazards } from '../data/missionData'
import { Panel, SectionLabel, SeverityPill, StatusDot } from '../components/ui/Primitives'

export function HazardsPage() {
  const navigate = useNavigate()
  const hazards = useCommandStore(state => state.hazards)
  const setHazards = useCommandStore(state => state.setHazards)
  const clearHazards = useCommandStore(state => state.clearHazards)
  const selectHazard = useCommandStore(state => state.selectHazard)
  const campusLocation = useCommandStore(state => state.campusLocation)

  const hazardCategories = [
    'IMMOBILE / UNCONSCIOUS CASUALTY',
    'FIRE',
    'UNSTABLE STRUCTURE',
    'DEBRIS',
    'ENTRAPMENT RISK',
    'ACTIVE DISTRESS SIGNAL',
    'SMOKE',
    'BLOCKED ROAD',
    'LANDSLIDE',
  ]

  return (
    <div className="secondary-page">
      <div className="page-heading">
        <div>
          <SectionLabel>RISK INTELLIGENCE / ACTIVE THEATER MONITORING</SectionLabel>
          <h1>Hazard intelligence</h1>
          <p>
            Field risk assessment & environmental exclusion perimeters anchored over {campusLocation.name}.
          </p>
        </div>
        <div className="page-actions">
          {hazards.length > 0 ? (
            <button type="button" onClick={clearHazards} style={{ borderColor: 'rgba(52, 211, 153, 0.4)', color: '#34d399' }}>
              <ShieldCheck size={15} /> SET SAFE CAMPUS (0 HAZARDS)
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setHazards(sampleDisasterHazards)}
              style={{ borderColor: 'rgba(251, 146, 60, 0.4)', color: '#fb923c' }}
            >
              <AlertTriangle size={15} /> SIMULATE DRILL HAZARDS
            </button>
          )}
          <button type="button" onClick={() => navigate('/map')}>
            <MapPin size={15} /> VIEW CAMPUS ON MAP
          </button>
        </div>
      </div>

      {/* Zero Hazard / Safe Campus Banner */}
      {hazards.length === 0 && (
        <Panel className="safe-campus-banner" style={{
          background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.35) 0%, rgba(15, 23, 42, 0.85) 100%)',
          border: '1px solid rgba(52, 211, 153, 0.4)',
          borderRadius: '10px',
          padding: '24px 28px',
          marginBottom: '22px',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          boxShadow: '0 8px 32px rgba(6, 78, 59, 0.2)'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(52, 211, 153, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#34d399',
            flexShrink: 0
          }}>
            <ShieldCheck size={32} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, letterSpacing: '0.04em', color: '#6ee7b7' }}>
                SAFE CAMPUS ZONE · ZERO HAZARDS REPORTED
              </h2>
              <span style={{
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(52, 211, 153, 0.4)',
                color: '#34d399',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px'
              }}>
                100% CLEAR
              </span>
            </div>
            <p style={{ margin: '0 0 8px 0', color: '#cbd5e1', fontSize: '13px', lineHeight: 1.5 }}>
              UAV Eagle One aerial sweep confirms <strong>zero active environmental, structural, fire, or toxic debris hazards</strong> in the Sri Eshwar College of Engineering sector. Ground rescue and student corridors are completely unimpeded.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px', fontSize: '12px', color: '#94a3b8' }}>
              <span><GraduationCap size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px', color: '#38bdf8' }} /> {campusLocation.name}</span>
              <span><MapPin size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px', color: '#38bdf8' }} /> {campusLocation.notes || 'Kondampatti Post, Vadasithur via, Coimbatore - 641202, Tamil Nadu'}</span>
              <span><strong>Coordinates:</strong> {campusLocation.latitude.toFixed(5)}°N, {campusLocation.longitude.toFixed(5)}°E</span>
            </div>
          </div>
        </Panel>
      )}

      <div className="hazard-overview" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '10px', marginBottom: '16px' }}>
        {hazardCategories.map(type => {
          const matching = hazards.filter(hazard => hazard.type === type)
          const count = matching.length
          const highestSev = matching.find(h => h.severity === 'CRITICAL')?.severity ?? matching[0]?.severity

          return (
            <Panel
              key={type}
              className={`hazard-stat ${count > 0 ? 'active' : ''}`}
              style={{
                minHeight: '96px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '8px',
                background: '#ffffff',
                border: '1px solid rgba(203, 213, 225, 0.9)',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
              }}
            >
              <small style={{ fontSize: '9.5px', lineHeight: '1.3', fontWeight: 700, color: '#334155', minHeight: '26px', display: 'flex', alignItems: 'flex-start', letterSpacing: '0.02em' }}>
                {type}
              </small>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '6px' }}>
                <b style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: count > 0 ? '#dc2626' : '#0f172a' }}>
                  {String(count).padStart(2, '0')}
                </b>
                {count > 0 ? (
                  <span style={{ fontSize: '10px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#dc2626' }}>
                    <StatusDot tone={highestSev === 'CRITICAL' ? 'red' : highestSev === 'HIGH' ? 'orange' : 'yellow'} />
                    {highestSev}
                  </span>
                ) : (
                  <span style={{
                    color: '#059669',
                    fontSize: '10px',
                    fontWeight: 700,
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    letterSpacing: '0.04em',
                  }}>
                    CLEAR
                  </span>
                )}
              </div>
            </Panel>
          )
        })}
      </div>

      <div className="hazard-list">
        {hazards.length === 0 ? (
          <Panel style={{ textAlign: 'center', padding: '40px 20px', color: '#475569', background: '#ffffff', border: '1px solid rgba(203, 213, 225, 0.9)', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)' }}>
            <CheckCircle2 size={36} style={{ color: '#059669', margin: '0 auto 12px' }} />
            <h3 style={{ color: '#0f172a', margin: '0 0 6px 0', fontWeight: 700, fontSize: '17px' }}>No active hazards in this location</h3>
            <p style={{ margin: '0 auto', fontSize: '13.5px', color: '#475569', maxWidth: '600px', lineHeight: 1.55 }}>
              Your current campus location at Sri Eshwar College of Engineering has no recorded hazards. All drone routes and ground response paths are rated nominal.
            </p>
          </Panel>
        ) : (
          hazards.map(hazard => (
            <Panel key={hazard.id} className="hazard-detail">
              <div className={`hazard-icon ${hazard.severity.toLowerCase()}`}>
                <ShieldAlert size={21} />
              </div>
              <div>
                <div className="hazard-detail-meta">
                  <SeverityPill severity={hazard.severity} />
                  <small>{hazard.id} · DETECTED {hazard.detectedAt}</small>
                </div>
                <h2>{hazard.type}</h2>
                <p>
                  <MapPin size={13} /> Sector {hazard.sector} · affected radius {hazard.radius} m · {hazard.confidence}% confidence
                </p>
              </div>
              <div className="hazard-status">
                <b>
                  <StatusDot tone={hazard.status === 'ACTIVE' ? 'red' : 'yellow'} /> {hazard.status}
                </b>
                <button
                  type="button"
                  onClick={() => {
                    selectHazard(hazard.id)
                    navigate('/map')
                  }}
                >
                  <AlertTriangle size={13} /> VIEW ON MAP
                </button>
              </div>
            </Panel>
          ))
        )}
      </div>
    </div>
  )
}
