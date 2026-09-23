import { AlertTriangle, Bot, CheckCircle2, Crosshair, Flame, HeartHandshake, Shield, UsersRound } from 'lucide-react'
import { useCommandStore } from '../../store/commandStore'

export function KpiStrip() {
  const mission = useCommandStore(state => state.mission)
  const survivors = useCommandStore(state => state.survivors)
  const hazards = useCommandStore(state => state.hazards)
  const drones = useCommandStore(state => state.drones)
  const teams = useCommandStore(state => state.teams)

  const awaitingCount = survivors.filter(s => s.status === 'CRITICAL' || s.status === 'HIGH PRIORITY').length
  const highRiskHazards = hazards.filter(h => h.severity === 'CRITICAL' || h.severity === 'HIGH').length
  const activeDronesCount = drones.filter(d => d.status === 'SEARCHING' || d.status === 'HOLDING').length
  const enRouteTeamsCount = teams.filter(t => t.status === 'EN ROUTE').length

  const cards = [
    {
      label: 'AREA SCANNED',
      value: `${Math.round(mission.coverage)}%`,
      detail: '4.2 / 6.1 km²',
      icon: Crosshair,
      tone: 'cyan',
      progress: mission.coverage,
      progressGradient: 'linear-gradient(90deg, #00f0ff, #0284c7)',
    },
    {
      label: 'SURVIVORS',
      value: String(survivors.length).padStart(2, '0'),
      detail: survivors.length > 0 ? `IDS: ${survivors.map(s => s.id).join(', ')}` : 'ALL TRIAGED / SAFE',
      icon: UsersRound,
      tone: 'red',
      progress: Math.min(100, Math.max(10, survivors.length * 20)),
      progressGradient: 'linear-gradient(90deg, #f43f5e, #e11d48)',
    },
    {
      label: 'HAZARDS',
      value: String(hazards.length).padStart(2, '0'),
      detail: hazards.length === 0 ? 'ALL CLEAR · SAFE ZONE' : `${String(highRiskHazards).padStart(2, '0')} HIGH RISK`,
      icon: Flame,
      tone: hazards.length === 0 ? 'green' : 'orange',
      progress: hazards.length === 0 ? 0 : Math.min(100, hazards.length * 25),
      progressGradient: hazards.length === 0 ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #f59e0b, #ea580c)',
    },
    {
      label: 'ACTIVE DRONES',
      value: `${String(activeDronesCount).padStart(2, '0')} / ${String(drones.length).padStart(2, '0')}`,
      detail: 'D1 & D2 OPERATIONAL',
      icon: Bot,
      tone: 'blue',
      progress: (activeDronesCount / drones.length) * 100,
      progressGradient: 'linear-gradient(90deg, #38bdf8, #6366f1)',
    },
    {
      label: 'RESCUE TEAMS',
      value: String(teams.length).padStart(2, '0'),
      detail: `${String(enRouteTeamsCount).padStart(2, '0')} EN ROUTE`,
      icon: Shield,
      tone: 'green',
      progress: (enRouteTeamsCount / Math.max(1, teams.length)) * 100,
      progressGradient: 'linear-gradient(90deg, #10b981, #06b6d4)',
    },
    {
      label: 'MISSION STATUS',
      value: 'SEARCH & RESCUE',
      detail: mission.phase,
      icon: HeartHandshake,
      tone: 'purple',
      progress: 80,
      progressGradient: 'linear-gradient(90deg, #a855f7, #ec4899)',
    },
  ]

  return (
    <div className="kpi-strip">
      {cards.map(card => {
        const Icon = card.icon
        return (
          <div key={card.label} className={`kpi-card tone-${card.tone}`}>
            <div className="kpi-card-inner">
              <div className="kpi-meta-row">
                <span className="kpi-label">{card.label}</span>
                <div className={`kpi-icon-badge tone-${card.tone}`}>
                  <Icon size={13} />
                </div>
              </div>
              <div className="kpi-value-row">
                <span className="kpi-val">{card.value}</span>
              </div>
              <div className="kpi-detail-row">
                <span className="kpi-detail" title={card.detail}>
                  {card.detail}
                </span>
              </div>
              {/* Sleek Gradient Progress Indicator */}
              <div className="kpi-progress-track">
                <div
                  className="kpi-progress-fill"
                  style={{
                    width: `${Math.min(100, Math.max(5, card.progress))}%`,
                    background: card.progressGradient,
                  }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
