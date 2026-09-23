import { Bot, CheckCircle2, Flame, GraduationCap, Route, Search, ShieldAlert, UsersRound } from 'lucide-react'
import { useCommandStore } from '../store/commandStore'
import { Panel, SectionLabel, SeverityPill } from '../components/ui/Primitives'

const iconMap = {
  takeoff: Bot,
  search: Search,
  hazard: ShieldAlert,
  survivor: UsersRound,
  route: Route,
  rescue: CheckCircle2,
}

export function MissionLogPage() {
  const events = useCommandStore(state => state.events)

  return (
    <div className="secondary-page mission-log">
      <div className="page-heading">
        <div>
          <SectionLabel>AUTONOMOUS MISSION LOG / CHRONOLOGICAL EVENT TIMELINE</SectionLabel>
          <h1>Mission history</h1>
          <p>Real-time autonomous log of UAV sorties, pose-sensed casualties, and tactical coordinates.</p>
        </div>
      </div>
      <Panel className="timeline">
        <div className="timeline-line" />
        {events.map((event, index) => {
          const Icon = iconMap[event.icon] || Search
          return (
            <article key={`${event.title}-${index}`}>
              <time>{event.time}</time>
              <span className={`timeline-icon ${event.severity.toLowerCase()}`}>
                <Icon size={16} />
              </span>
              <div>
                <div>
                  {event.severity !== 'INFO' && <SeverityPill severity={event.severity} />}
                  <small>T+{String(event.seconds).padStart(2, '0')} SEC</small>
                </div>
                <h2>{event.title}</h2>
                <p>{event.description}</p>
              </div>
            </article>
          )
        })}
      </Panel>
    </div>
  )
}
