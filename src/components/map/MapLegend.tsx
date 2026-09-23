export function MapLegend() {
  return (
    <div className="map-tactical-legend">
      <div className="legend-item">
        <span className="legend-marker-dot drone-dot" />
        <span className="legend-label">Drone D1</span>
      </div>
      <div className="legend-item">
        <span className="legend-marker-dot survivor-crit-dot" />
        <span className="legend-label">Critical Survivor (S-03)</span>
      </div>
      <div className="legend-item">
        <span className="legend-marker-dot uav-pin-dot" style={{ background: '#00f0ff', boxShadow: '0 0 8px #00f0ff' }} />
        <span className="legend-label">UAV Live Pin (QAI)</span>
      </div>
      <div className="legend-item">
        <span className="legend-marker-dot hazard-dot" />
        <span className="legend-label">Active Hazard</span>
      </div>
      <div className="legend-item">
        <span className="legend-marker-dot team-dot" />
        <span className="legend-label">Rescue Team Alpha</span>
      </div>
      <div className="legend-item">
        <span className="legend-line safe-route-line" />
        <span className="legend-label">Safe Corridor</span>
      </div>
      <div className="legend-item">
        <span className="legend-line" style={{ background: '#ef4444', height: '3px', borderTop: '2px dashed #fca5a5' }} />
        <span className="legend-label">Disaster Perimeter</span>
      </div>
      <div className="legend-item">
        <span className="legend-line" style={{ background: '#00f0ff', height: '2px', borderTop: '2px dashed #00f0ff' }} />
        <span className="legend-label">Confined UAV Search</span>
      </div>
    </div>
  )
}
