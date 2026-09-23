import { ArrowUpRight, CheckCircle2, Filter, Search, Send, UsersRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Panel, SectionLabel, StatusDot } from '../components/ui/Primitives'
import { TeamDispatchModal } from '../components/dispatch/TeamDispatchModal'
import { useCommandStore } from '../store/commandStore'

export function SurvivorsPage() {
  const navigate = useNavigate()
  const {
    survivors,
    openDispatchModal,
    markSurvivorStatus,
  } = useCommandStore()

  const criticalCount = survivors.filter(s => s.priority > 80 || s.status === 'CRITICAL').length
  const rescuedCount = survivors.filter(s => s.status === 'RESCUED').length

  return (
    <div className="secondary-page">
      <div className="page-heading">
        <div>
          <SectionLabel>PERSON DETECTION / MULTI-MODAL VERIFICATION</SectionLabel>
          <h1>Survivor Management & Triage</h1>
          <p>AI-observed indicators, obstacle-free vector dispatching, and live triage lifecycle.</p>
        </div>
        <div className="page-actions">
          <button type="button">
            <Search size={15} /> SEARCH ID
          </button>
          <button type="button">
            <Filter size={15} /> FILTER
          </button>
        </div>
      </div>

      <Panel className="data-table">
        <div className="table-summary">
          <span>
            <UsersRound size={16} /> {String(survivors.length).padStart(2, '0')} DETECTIONS
          </span>
          <span>
            <StatusDot tone="red" /> {String(criticalCount).padStart(2, '0')} CRITICAL PRIORITY
          </span>
          <span>
            <StatusDot tone="green" /> {String(rescuedCount).padStart(2, '0')} RESCUED
          </span>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>ID & TIME</th>
                <th>PRIORITY</th>
                <th>FUSED CONF</th>
                <th>POSTURE</th>
                <th>LOCATION</th>
                <th>ASSIGNED TEAM</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {survivors.map(survivor => (
                <tr key={survivor.id}>
                  <td onClick={() => navigate(`/survivors/${survivor.id}`)} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <b style={{ fontSize: '13px', color: '#00f0ff', letterSpacing: '0.02em' }}>{survivor.id}</b>
                      <small style={{ color: '#8091a5', fontSize: '10px', fontFamily: 'monospace' }}>Detected {survivor.detectedAt}</small>
                    </div>
                  </td>
                  <td>
                    <strong className={`priority ${survivor.priority > 85 ? 'critical' : survivor.priority > 65 ? 'high' : ''}`}>
                      {survivor.priority}/100
                    </strong>
                  </td>
                  <td>
                    <b>{survivor.fusedConfidence}%</b>
                    <div className="thin-progress">
                      <i style={{ width: `${survivor.fusedConfidence}%` }} />
                    </div>
                  </td>
                  <td>
                    <span className={`posture-badge posture-${survivor.observedPosture.toLowerCase()}`} style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      lineHeight: '1.2',
                      background: survivor.observedPosture === 'LYING' ? 'rgba(244, 63, 94, 0.15)' : survivor.observedPosture === 'WAVING_HELP' ? 'rgba(249, 115, 22, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      border: `1px solid ${survivor.observedPosture === 'LYING' ? 'rgba(244, 63, 94, 0.4)' : survivor.observedPosture === 'WAVING_HELP' ? 'rgba(249, 115, 22, 0.4)' : 'rgba(16, 185, 129, 0.3)'}`,
                      color: survivor.observedPosture === 'LYING' ? '#fb7185' : survivor.observedPosture === 'WAVING_HELP' ? '#fb923c' : '#34d399',
                      whiteSpace: 'nowrap',
                    }}>
                      {survivor.observedPosture === 'LYING' ? 'PRONE' : survivor.observedPosture === 'WAVING_HELP' ? 'WAVING' : survivor.observedPosture === 'CROUCHING' ? 'CROUCHING' : survivor.observedPosture}
                    </span>
                  </td>
                  <td>Sector {survivor.sector}</td>
                  <td>
                    <span style={{ fontWeight: 600, color: survivor.assignedTeamId ? '#10b981' : '#94a3b8' }}>
                      {survivor.assignedTeamId ?? 'UNASSIGNED'}
                    </span>
                  </td>
                  <td>
                    <span className={`survivor-status ${survivor.status.toLowerCase().replace(' ', '-')}`}>
                      <StatusDot tone={survivor.status === 'CRITICAL' ? 'red' : survivor.status === 'RESCUED' ? 'green' : 'yellow'} />
                      {survivor.status}
                    </span>
                  </td>
                  <td style={{ minWidth: '240px' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => openDispatchModal(survivor.id)}
                        className="table-action-btn dispatch-action"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '5px 9px',
                          fontSize: '10px',
                          fontWeight: 700,
                          background: 'rgba(56, 189, 248, 0.12)',
                          border: '1px solid rgba(56, 189, 248, 0.35)',
                          color: '#38bdf8',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          height: '26px',
                        }}
                        title="Dispatch or reassign team with safe route"
                      >
                        <Send size={11} /> DISPATCH
                      </button>

                      {survivor.status !== 'RESCUED' ? (
                        <button
                          type="button"
                          onClick={() => markSurvivorStatus(survivor.id, 'RESCUED')}
                          className="table-action-btn rescue-action"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '5px 9px',
                            fontSize: '10px',
                            fontWeight: 700,
                            background: 'rgba(16, 185, 129, 0.12)',
                            border: '1px solid rgba(16, 185, 129, 0.35)',
                            color: '#34d399',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            height: '26px',
                          }}
                          title="Mark survivor rescued"
                        >
                          <CheckCircle2 size={11} /> RESCUE
                        </button>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '5px 9px',
                            fontSize: '10px',
                            fontWeight: 700,
                            color: '#34d399',
                            background: 'rgba(16, 185, 129, 0.08)',
                            border: '1px solid rgba(16, 185, 129, 0.25)',
                            borderRadius: '4px',
                            whiteSpace: 'nowrap',
                            height: '26px',
                          }}
                        >
                          <CheckCircle2 size={11} /> EXTRACTED
                        </span>
                      )}
                    </div>
                  </td>
                  <td onClick={() => navigate(`/survivors/${survivor.id}`)} style={{ cursor: 'pointer' }}>
                    <ArrowUpRight size={15} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Interactive modals */}
      <TeamDispatchModal />
    </div>
  )
}
