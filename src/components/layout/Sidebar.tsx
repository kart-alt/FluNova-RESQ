import {
  Activity,
  AlertTriangle,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Cpu,
  FileClock,
  Flame,
  Globe,
  Map,
  Navigation,
  Radio,
  Settings,
  Shield,
  UsersRound,
  Video,
  Wifi,
  Zap,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useCommandStore } from '../../store/commandStore'

export function Sidebar({
  isOpen,
  onClose,
  collapsed,
  onToggle,
}: {
  isOpen: boolean
  onClose: () => void
  collapsed: boolean
  onToggle: () => void
}) {
  const drone = useCommandStore(state => state.drones[0])
  const survivors = useCommandStore(state => state.survivors)
  const hazards = useCommandStore(state => state.hazards)
  const teams = useCommandStore(state => state.teams)

  const battery = Math.round(drone?.battery ?? 72)
  const strokeDashoffset = 100 - (battery / 100) * 100

  const navItems = [
    { to: '/', label: 'COMMAND CENTER', icon: Activity, badge: undefined },
    { to: '/map', label: 'LIVE MAP', icon: Map, badge: undefined },
    { to: '/live-feeds', label: 'LIVE FEEDS', icon: Video, badge: 'REC' },
    { to: '/survivors', label: 'SURVIVORS', icon: UsersRound, badge: String(survivors.length).padStart(2, '0') },
    { to: '/hazards', label: 'HAZARDS', icon: Flame, badge: hazards.length === 0 ? '0' : String(hazards.length).padStart(2, '0') },
    { to: '/rescue-teams', label: 'RESCUE TEAMS', icon: Shield, badge: String(teams.length).padStart(2, '0') },
    { to: '/analytics', label: 'ANALYTICS', icon: BarChart3, badge: undefined },
    { to: '/mission-log', label: 'MISSION LOG', icon: FileClock, badge: undefined },
    { to: '/settings', label: 'SETTINGS', icon: Settings, badge: undefined },
  ]

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>
      {/* Sidebar Header with Brand & Collapse toggle */}
      <div className="sidebar-head">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon" style={{ width: '38px', height: '38px', borderRadius: '8px', background: '#ffffff', border: '1.5px solid rgba(2, 132, 199, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px', overflow: 'hidden', flexShrink: 0 }}>
            <img src="/flynova_drone_emblem.png" alt="FlyNova GCS Logo" className="sidebar-logo-img" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          {!collapsed && (
            <div className="sidebar-brand-group">
              <span className="sidebar-logo-text">FLYNOVA</span>
              <span className="sidebar-logo-badge">GCS</span>
            </div>
          )}
        </div>
        <button
          className="collapse-btn"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="sidebar-nav">
        {navItems.map(({ to, label, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onClose}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            title={collapsed ? label : undefined}
          >
            <span className="nav-icon-wrapper">
              <Icon size={17} className="nav-icon" />
            </span>
            {!collapsed && <strong className="nav-label">{label}</strong>}
            {!collapsed && badge && <span className={`nav-badge ${label === 'HAZARDS' && hazards.length === 0 ? 'badge-safe-clear' : ''}`}>{badge}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Active Drone Card */}
      <div className="sidebar-drone-footer">
        {!collapsed ? (
          <div className="active-drone-card">
            <div className="drone-card-header">
              <div className="drone-card-title-group">
                <span className="drone-tag">ACTIVE DRONE</span>
                <strong className="drone-name">{drone?.id ?? 'D1'} — {drone?.name?.toUpperCase() ?? 'EAGLE ONE'}</strong>
              </div>
              <span className="drone-status-pill">
                <span className="glowing-green-dot" />
                ONLINE
              </span>
            </div>

            {/* Telemetry rows with circular battery indicator */}
            <div className="drone-telemetry-cluster">
              <div className="battery-circular-widget">
                <svg viewBox="0 0 36 36" className="circular-chart">
                  <path
                    className="circle-bg"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="circle"
                    strokeDasharray="100, 100"
                    style={{ strokeDashoffset }}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="battery-inner-text">
                  <Zap size={10} className="battery-zap" />
                  <span className="battery-percent">{battery}%</span>
                </div>
              </div>

              <div className="drone-specs-list">
                <div className="spec-row">
                  <span className="spec-label"><Wifi size={10} /> Signal:</span>
                  <span className="spec-val highlight-cyan">{drone?.signal ?? 94}%</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label"><Cpu size={10} /> AI:</span>
                  <span className="spec-val highlight-green">{drone?.aiStatus ?? 'ACTIVE'}</span>
                </div>
                <div className="spec-row">
                  <span className="spec-label"><Navigation size={10} /> GPS:</span>
                  <span className="spec-val highlight-cyan">{drone?.gpsStatus ?? 'FIXED'}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="collapsed-drone-indicator" title="D1 — EAGLE ONE (ONLINE · 72%)">
            <div className="collapsed-battery-ring">
              <Zap size={14} className="battery-zap" />
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
