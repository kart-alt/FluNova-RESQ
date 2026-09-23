import { Activity, ArrowUpRight, Clock3, Cpu, Gauge, HeartPulse, Radar, ShieldCheck, UsersRound } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { coverageSeries } from '../data/missionData'
import { Panel, SectionLabel, StatusDot } from '../components/ui/Primitives'
import { useCommandStore } from '../store/commandStore'

export function AnalyticsPage() {
  const navigate = useNavigate()
  const hazards = useCommandStore(state => state.hazards)
  const survivors = useCommandStore(state => state.survivors)
  const campusLocation = useCommandStore(state => state.campusLocation)

  const hazardSummary = [
    'UNCONSCIOUS CASUALTY',
    'FIRE',
    'UNSTABLE STRUCTURE',
    'DEBRIS',
    'ENTRAPMENT RISK',
    'DISTRESS SIGNAL',
    'SMOKE',
    'BLOCKED ROAD',
  ].map(label => {
    let count = 0
    if (label === 'UNCONSCIOUS CASUALTY') {
      count = hazards.filter(h => h.type.includes('UNCONSCIOUS') || h.type.includes('IMMOBILE')).length
    } else if (label === 'DISTRESS SIGNAL') {
      count = hazards.filter(h => h.type.includes('DISTRESS')).length
    } else if (label === 'ENTRAPMENT RISK') {
      count = hazards.filter(h => h.type.includes('ENTRAPMENT')).length
    } else {
      count = hazards.filter(h => h.type === label).length
    }
    return { type: label, count }
  })

  const criticalCount = survivors.filter(s => s.status === 'CRITICAL' || s.priority > 85).length

  return (
    <div className="secondary-page analytics-page">
      <div className="page-heading">
        <div>
          <SectionLabel>THEATER PERFORMANCE / REAL-TIME MISSION METRICS</SectionLabel>
          <h1>Mission analytics & AI sensing</h1>
          <p>
            Real-time multi-modal perception metrics anchored over {campusLocation.name}.
          </p>
        </div>
      </div>

      <div className="analytics-summary">
        <Metric
          icon={<UsersRound className="text-cyan" />}
          label="VICTIMS LOCATED"
          value={String(survivors.length).padStart(2, '0')}
          detail={`${criticalCount} critical triage priorities`}
        />
        <Metric
          icon={<Cpu className="text-emerald" />}
          label="POSE SENSING ACCURACY"
          value="96.4%"
          detail="17-keypoint biomechanics"
        />
        <Metric
          icon={<Radar className="text-amber" />}
          label="SEARCH EFFICIENCY"
          value="3.2×"
          detail="drone aerial reconnaissance"
        />
        <Metric
          icon={<Activity className="text-rose" />}
          label="ACTIVE RISKS SOURCED"
          value={String(hazards.length).padStart(2, '0')}
          detail="exclusion zones computed"
        />
      </div>

      <div className="chart-grid">
        <Panel className="chart-panel">
          <div>
            <SectionLabel>SEARCH COVERAGE OVER TIME</SectionLabel>
            <h2>Autonomous grid completion</h2>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={coverageSeries}>
              <defs>
                <linearGradient id="coverage" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#31b7e5" stopOpacity=".42" />
                  <stop offset="100%" stopColor="#31b7e5" stopOpacity="0" />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#26394f" />
              <XAxis dataKey="time" tick={{ fill: '#8091a5', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[40, 70]} tick={{ fill: '#8091a5', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#101d2e', border: '1px solid #2a4058', borderRadius: 6 }} />
              <Area type="monotone" dataKey="coverage" stroke="#4bc7f3" strokeWidth={2} fill="url(#coverage)" />
            </AreaChart>
          </ResponsiveContainer>
        </Panel>

        <Panel className="chart-panel">
          <div>
            <SectionLabel>HAZARDS BY CATEGORY (INCLUDING POSE CASUALTIES)</SectionLabel>
            <h2>Classified field & posture risks</h2>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={hazardSummary}>
              <CartesianGrid vertical={false} stroke="#26394f" />
              <XAxis dataKey="type" interval={0} angle={-25} textAnchor="end" height={60} tick={{ fill: '#8091a5', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: '#8091a5', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#101d2e', border: '1px solid #2a4058', borderRadius: 6 }} />
              <Bar dataKey="count" fill="#38bdf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>

      {/* ByteTrack Multi-Object Tracking Survivor Manifest & ID Roster */}
      <Panel className="chart-panel" style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <SectionLabel>BYTETRACK MULTI-OBJECT TRACKING / PERSISTENT PERSON IDENTIFIERS</SectionLabel>
            <h2>Tracked Person Manifest (1-to-1 ID Association)</h2>
          </div>
          <span style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#34d399',
            fontSize: '11px',
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: '5px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
          }}>
            <ShieldCheck size={13} /> {survivors.length} UNIQUE PERSISTENT IDS
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #26394f', color: '#8091a5', textAlign: 'left', whiteSpace: 'nowrap' }}>
                <th style={{ padding: '10px 14px' }}>TRACK ID</th>
                <th style={{ padding: '10px 14px' }}>OBSERVED POSTURE</th>
                <th style={{ padding: '10px 14px' }}>CONFIDENCE</th>
                <th style={{ padding: '10px 14px' }}>TRIAGE STATUS</th>
                <th style={{ padding: '10px 14px' }}>SECTOR & GPS</th>
                <th style={{ padding: '10px 14px' }}>ASSIGNED TEAM</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {survivors.map(survivor => {
                const isCrit = survivor.status === 'CRITICAL' || survivor.observedPosture === 'LYING'
                return (
                  <tr
                    key={survivor.id}
                    style={{ borderBottom: '1px solid rgba(38, 57, 79, 0.5)', cursor: 'pointer', verticalAlign: 'middle' }}
                    onClick={() => navigate(`/survivors/${survivor.id}`)}
                  >
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <b style={{ color: '#00f0ff', fontSize: '13px' }}>{survivor.id}</b>
                      <div style={{ color: '#8091a5', fontSize: '10px' }}>Detected {survivor.detectedAt}</div>
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        background: isCrit ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        border: `1px solid ${isCrit ? 'rgba(244, 63, 94, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                        color: isCrit ? '#fb7185' : '#34d399',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                      }}>
                        {survivor.observedPosture}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <b>{survivor.fusedConfidence}%</b>
                      <div style={{ color: '#8091a5', fontSize: '10px' }}>RGB {survivor.confidence}% · LWIR {survivor.thermalConfidence}%</div>
                    </td>
                    <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <StatusDot tone={isCrit ? 'red' : survivor.status === 'RESCUED' ? 'green' : 'yellow'} />
                        <strong style={{ color: isCrit ? '#fb7185' : '#e2e8f0' }}>{survivor.status}</strong>
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {survivor.latitude.toFixed(4)}, {survivor.longitude.toFixed(4)}
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: survivor.assignedTeamId ? '#10b981' : '#8091a5', whiteSpace: 'nowrap' }}>
                      {survivor.assignedTeamId ? `TEAM ${survivor.assignedTeamId}` : 'UNASSIGNED'}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/survivors/${survivor.id}`)
                        }}
                        style={{
                          background: 'rgba(56, 189, 248, 0.15)',
                          border: '1px solid rgba(56, 189, 248, 0.4)',
                          color: '#38bdf8',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          height: '26px',
                        }}
                      >
                        VIEW {survivor.id} <ArrowUpRight size={12} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <p className="simulation-notice" style={{ marginTop: '18px' }}>
        AI posture sensing and ByteTrack single persistent object tracking are synchronized across UAV Eagle One (D1) and SECE Ground Control.
      </p>
    </div>
  )
}

function Metric({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string; detail: string }) {
  return (
    <Panel
      className="analytics-metric"
      style={{
        minHeight: '115px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '16px 18px',
        borderRadius: '8px',
        background: '#ffffff',
        border: '1px solid rgba(203, 213, 225, 0.9)',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <small style={{ fontSize: '10.5px', fontWeight: 800, letterSpacing: '0.04em', color: '#334155' }}>{label}</small>
        <span>{icon}</span>
      </div>
      <div>
        <b style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', lineHeight: 1.1, display: 'block', fontFamily: 'var(--font-mono)' }}>{value}</b>
        <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#475569', fontWeight: 500 }}>{detail}</p>
      </div>
    </Panel>
  )
}
