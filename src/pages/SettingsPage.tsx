import { CheckCircle2, ChevronRight, Cpu, Map, MonitorCog, SlidersHorizontal, ToggleLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { useCommandStore } from '../store/commandStore'
import { Panel, SectionLabel, StatusDot } from '../components/ui/Primitives'

export function SettingsPage() {
  const { mission, setDemoMode } = useCommandStore(state => state)

  return (
    <div className="secondary-page settings-page">
      <div className="page-heading">
        <div>
          <SectionLabel>SYSTEM CONFIGURATION / PROTOTYPE ENVIRONMENT</SectionLabel>
          <h1>System settings</h1>
          <p>Mission configuration, alert thresholds and display options.</p>
        </div>
      </div>

      <div className="settings-grid">
        <SettingsCard
          icon={<Cpu size={18} />}
          title="Drone configuration"
          description="Connected flight, perception and telemetry settings."
        >
          <span>D1 · Eagle One <b>CONNECTED</b></span>
          <span>AI inference threshold <b>0.82</b></span>
          <span>Return battery threshold <b>25%</b></span>
        </SettingsCard>

        <SettingsCard
          icon={<SlidersHorizontal size={18} />}
          title="Alert thresholds"
          description="Control notification prioritization within the prototype."
        >
          <span>Critical confidence <b>90%</b></span>
          <span>Hazard proximity <b>100 m</b></span>
          <span>Auto-escalation <b>ENABLED</b></span>
        </SettingsCard>

        <SettingsCard
          icon={<Map size={18} />}
          title="Map settings"
          description="Configure mission visuals and geographic layers."
        >
          <span>Mission grid <b>SECTOR C</b></span>
          <span>Terrain source <b>DEFAULT</b></span>
          <span>Coordinate format <b>WGS 84</b></span>
        </SettingsCard>

        <SettingsCard
          icon={<MonitorCog size={18} />}
          title="Display settings"
          description="Operational workstation display preferences."
        >
          <span>High contrast markers <b>ON</b></span>
          <span>Feed overlays <b>ON</b></span>
          <span>Animation level <b>REDUCED</b></span>
        </SettingsCard>
      </div>

      <Panel className="demo-settings">
        <div>
          <ToggleLeft size={22} />
          <div>
            <SectionLabel>PRESENTATION CONTROLS</SectionLabel>
            <h2>Demo mode</h2>
            <p>Runs the deterministic Mission #042 rescue sequence for the SIH presentation.</p>
          </div>
        </div>
        <button
          type="button"
          className={mission.demoMode ? 'enabled' : ''}
          onClick={() => setDemoMode(!mission.demoMode)}
        >
          <i />
          {mission.demoMode ? 'ENABLED' : 'ENABLE DEMO MODE'}
        </button>
      </Panel>

      <Panel className="system-health">
        <CheckCircle2 size={18} />
        <span>
          <b>All prototype services operational</b>
          <small>Simulation engine, map fallback, telemetry and local data services are ready.</small>
        </span>
        <StatusDot tone="green" />
      </Panel>
    </div>
  )
}

function SettingsCard({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <Panel
      className="settings-card"
      style={{
        minHeight: '210px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 16px', gap: '9px', alignItems: 'center' }}>
        <div className="settings-icon">{icon}</div>
        <div>
          <h2 style={{ margin: 0, fontSize: '13px', fontWeight: 700 }}>{title}</h2>
          <p style={{ margin: '3px 0 0', color: '#7f96a9', fontSize: '10px' }}>{description}</p>
        </div>
        <ChevronRight size={17} style={{ color: '#64748b' }} />
      </div>
      <div className="settings-options" style={{ marginTop: '12px' }}>
        {children}
      </div>
    </Panel>
  )
}
