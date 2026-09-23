import { ChevronRight, MapPin, Radio, ShieldCheck, UsersRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCommandStore } from '../store/commandStore'
import { Panel, SectionLabel, StatusDot } from '../components/ui/Primitives'

export function RescueTeamsPage() {
  const { teams, selectedTeamId, selectTeam } = useCommandStore(state => state)
  const navigate = useNavigate()

  return (
    <div className="secondary-page">
      <div className="page-heading">
        <div>
          <SectionLabel>FIELD COORDINATION / GROUND RESPONSE</SectionLabel>
          <h1>Rescue team coordination</h1>
          <p>Availability, capability and safe-route assignment across Sri Eshwar College of Engineering.</p>
        </div>
        <div className="page-actions">
          <button type="button"><Radio size={15} /> COMMUNICATIONS CONNECTED</button>
        </div>
      </div>

      <div className="team-operations">
        {teams.map(team => (
          <Panel
            className={`team-operation ${team.id === selectedTeamId ? 'selected' : ''}`}
            key={team.id}
            style={{ minHeight: '210px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          >
            <div>
              <div className="team-operation-head">
                <span className="team-shield"><UsersRound size={20} /></span>
                <div>
                  <small>{team.id}</small>
                  <h2>{team.name}</h2>
                </div>
                <span className={`team-state ${team.status.toLowerCase().replace(' ', '-')}`}>
                  <StatusDot tone={team.status === 'EN ROUTE' ? 'blue' : team.status === 'AVAILABLE' ? 'green' : team.status === 'BUSY' ? 'yellow' : 'red'} />
                  {team.status}
                </span>
              </div>

              <div className="team-operation-info">
                <span>
                  <small>CURRENT LOCATION</small>
                  <b><MapPin size={13} /> Sector {team.id === 'ALPHA' ? 'C2' : team.id === 'BRAVO' ? 'B1' : team.id === 'CHARLIE' ? 'D5' : 'A3'}</b>
                </span>
                <span>
                  <small>ASSIGNMENT</small>
                  <b style={{ color: team.assignedSurvivorId ? '#00f0ff' : '#94a3b8' }}>{team.assignedSurvivorId ?? 'UNASSIGNED'}</b>
                </span>
                <span>
                  <small>ROUTE DISTANCE</small>
                  <b>{team.distance || '0.0 km'}</b>
                </span>
                <span>
                  <small>ESTIMATED ETA</small>
                  <b>{team.eta ?? (team.status === 'OFFLINE' ? 'STANDBY' : '05:00')}</b>
                </span>
              </div>
            </div>

            <div>
              <div className="team-capabilities">
                <ShieldCheck size={14} />
                {team.capabilities.map(capability => (
                  <span key={capability}>{capability}</span>
                ))}
              </div>
              <button
                type="button"
                className="team-view"
                onClick={() => {
                  selectTeam(team.id)
                  navigate('/map')
                }}
              >
                OPEN FIELD VIEW <ChevronRight size={15} />
              </button>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  )
}
