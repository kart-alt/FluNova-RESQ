import { useState } from 'react'
import {
  Activity,
  Bot,
  Check,
  ChevronDown,
  Crosshair,
  Eye,
  Flame,
  Grid,
  Layers,
  MapPin,
  Route,
  Shield,
  UsersRound,
} from 'lucide-react'
import { useCommandStore } from '../../store/commandStore'
import type { MapLayers } from '../../types'

const layerConfig: {
  key: keyof MapLayers
  label: string
  icon: any
  tone: string
}[] = [
  { key: 'drones', label: 'DRONES', icon: Bot, tone: 'cyan' },
  { key: 'videoDetections', label: 'UAV DETECTIONS', icon: Crosshair, tone: 'teal' },
  { key: 'survivors', label: 'SURVIVORS', icon: UsersRound, tone: 'red' },
  { key: 'hazards', label: 'HAZARDS', icon: Flame, tone: 'orange' },
  { key: 'teams', label: 'RESCUE TEAMS', icon: Shield, tone: 'green' },
  { key: 'coverage', label: 'SEARCH COVERAGE', icon: Eye, tone: 'teal' },
  { key: 'routes', label: 'SAFE ROUTES', icon: Route, tone: 'emerald' },
  { key: 'grid', label: 'TACTICAL GRID', icon: Grid, tone: 'blue' },
]

export function LayerControl() {
  const [isOpen, setIsOpen] = useState(false)
  const layers = useCommandStore(state => state.mapLayers)
  const toggle = useCommandStore(state => state.toggleLayer)

  const activeCount = layerConfig.filter(l => layers[l.key]).length

  return (
    <div className={`tactical-layer-control ${isOpen ? 'open' : ''}`}>
      <button
        type="button"
        className="layer-trigger-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Toggle map overlays"
      >
        <div className="trigger-left">
          <Layers size={13} className="trigger-icon" />
          <span className="trigger-text">LAYERS</span>
        </div>
        <span className="layer-count-badge">{activeCount}/{layerConfig.length}</span>
        <ChevronDown size={12} className={`trigger-chevron ${isOpen ? 'rotate' : ''}`} />
      </button>

      {isOpen && (
        <div className="layer-dropdown-panel">
          <div className="layer-dropdown-header">
            <small>TACTICAL OVERLAYS</small>
          </div>
          <div className="layer-toggles-list">
            {layerConfig.map(({ key, label, icon: Icon, tone }) => {
              const active = layers[key]
              return (
                <button
                  key={key}
                  type="button"
                  className={`layer-toggle-row ${active ? 'is-active' : 'is-inactive'} tone-${tone}`}
                  onClick={() => toggle(key)}
                >
                  <span className="layer-switch-box">
                    <span className="switch-glow-dot" />
                    {active && <Check size={10} className="check-icon" />}
                  </span>
                  <Icon size={12} className="layer-row-icon" />
                  <span className="layer-row-label">{label}</span>
                  <span className={`layer-status-tag ${active ? 'tag-on' : 'tag-off'}`}>
                    {active ? 'ON' : 'OFF'}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
