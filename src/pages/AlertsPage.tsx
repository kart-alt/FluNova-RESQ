import { Check, ChevronRight, Filter, MapPin, Radio, ShieldAlert } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCommandStore } from '../store/commandStore'
import { Panel, SectionLabel, SeverityPill, StatusDot } from '../components/ui/Primitives'

export function AlertsPage() {
  const alerts = useCommandStore(state => state.alerts)
  const selectSurvivor = useCommandStore(state => state.selectSurvivor)
  const navigate = useNavigate()

  return (
    <div className="secondary-page">
      <div className="page-heading">
        <div>
          <SectionLabel>OPERATIONAL NOTIFICATIONS</SectionLabel>
          <h1>Emergency alerts</h1>
          <p>Events are ordered by severity and operational impact.</p>
        </div>
        <div className="page-actions">
          <button type="button"><Filter size={15} /> FILTER</button>
          <button type="button"><Radio size={15} /> LIVE EVENTS</button>
        </div>
      </div>
      <div className="alert-page-layout">
        <Panel className="alert-filters">
          <b>FILTERS</b>
          {['Critical', 'High', 'Medium', 'Low'].map((label, index) => {
            const count = alerts.filter(a => a.severity.toLowerCase() === label.toLowerCase()).length
            return (
              <label key={label}>
                <input defaultChecked={index < 2} type="checkbox" />
                {label}
                <span>{String(count).padStart(2, '0')}</span>
              </label>
            )
          })}
          <hr />
          <label><input defaultChecked type="checkbox" /> New only</label>
          <label><input type="checkbox" /> Assigned to team</label>
        </Panel>
        <div className="alert-list-full">
          {alerts.map(alert => (
            <Panel key={alert.id} className={`alert-list-item ${alert.severity.toLowerCase()}`}>
              <div className="alert-list-icon"><ShieldAlert size={19} /></div>
              <div className="alert-list-content">
                <div>
                  <SeverityPill severity={alert.severity} />
                  <small>{alert.type} · {alert.timestamp}</small>
                </div>
                <h2>{alert.title}</h2>
                <p>{alert.message}</p>
                <span><MapPin size={13} /> {alert.survivorId ? `Survivor ${alert.survivorId}` : 'Sector Recon'} · {alert.confidence}% confidence</span>
              </div>
              <div className="alert-list-actions">
                <b>{alert.recommendedAction}</b>
                <div>
                  <button type="button"><Check size={13} /> ACKNOWLEDGE</button>
                  <button
                    type="button"
                    onClick={() => {
                      if (alert.survivorId) {
                        selectSurvivor(alert.survivorId)
                        navigate(`/survivors/${alert.survivorId}`)
                      } else {
                        navigate('/map')
                      }
                    }}
                  >
                    VIEW {alert.survivorId ?? ''} <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      </div>
    </div>
  )
}
