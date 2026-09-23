import { useState } from 'react'
import {
  Compass,
  Crosshair,
  Globe,
  GraduationCap,
  LocateFixed,
  MapPin,
  Navigation,
  Shield,
  X,
} from 'lucide-react'
import { CAMPUS_PRESETS, useCommandStore } from '../../store/commandStore'
import type { CampusLocation } from '../../types'

export function CampusLocationModal() {
  const isOpen = useCommandStore(state => state.campusModalOpen)
  const closeCampusModal = useCommandStore(state => state.closeCampusModal)
  const campusLocation = useCommandStore(state => state.campusLocation)
  const setCampusLocation = useCommandStore(state => state.setCampusLocation)

  const [name, setName] = useState(campusLocation.name)
  const [lat, setLat] = useState(String(campusLocation.latitude))
  const [lng, setLng] = useState(String(campusLocation.longitude))
  const [sector, setSector] = useState(campusLocation.sector)
  const [radius, setRadius] = useState(String(campusLocation.radius || 650))
  const [isGettingGps, setIsGettingGps] = useState(false)
  const [gpsStatus, setGpsStatus] = useState<string | null>(null)

  if (!isOpen) return null

  const handleApplyPreset = (preset: CampusLocation) => {
    setName(preset.name)
    setLat(String(preset.latitude))
    setLng(String(preset.longitude))
    setSector(preset.sector)
    setRadius(String(preset.radius || 650))
    setGpsStatus(`Loaded preset: ${preset.name}`)
  }

  const handleUseDeviceGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus('Geolocation not supported by browser.')
      return
    }
    setIsGettingGps(true)
    setGpsStatus('Acquiring high-accuracy GNSS fix…')

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsGettingGps(false)
        const userLat = pos.coords.latitude.toFixed(6)
        const userLng = pos.coords.longitude.toFixed(6)
        setLat(userLat)
        setLng(userLng)
        setName('MY COLLEGE CAMPUS (CURRENT GPS)')
        setGpsStatus(`Fix acquired: ${userLat}°N, ${userLng}°E (±${Math.round(pos.coords.accuracy)}m)`)
      },
      (err) => {
        setIsGettingGps(false)
        setGpsStatus(`GPS error: ${err.message}`)
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  const handleSave = () => {
    const parsedLat = parseFloat(lat)
    const parsedLng = parseFloat(lng)
    const parsedRadius = parseFloat(radius)

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      setGpsStatus('Error: Invalid latitude or longitude format')
      return
    }

    setCampusLocation({
      name: name.trim() || 'COLLEGE CAMPUS (RECON GROUND)',
      latitude: parsedLat,
      longitude: parsedLng,
      sector: sector.trim() || 'CAMPUS QUADRANGLE',
      radius: !isNaN(parsedRadius) ? parsedRadius : 650,
      notes: 'User verified college campus drone recon theater',
    })
  }

  return (
    <div className="command-center-modal-backdrop" onClick={closeCampusModal}>
      <div className="campus-modal-window" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="campus-modal-header">
          <div className="header-icon-box">
            <GraduationCap size={20} className="text-cyan animate-pulse" />
          </div>
          <div className="header-title-box">
            <span className="modal-category">TACTICAL MISSION THEATER</span>
            <h3>College Campus Location & Ground Zero</h3>
            <p>Anchor aerial swarm waypoints, video georeferencing, and disaster grid over your campus.</p>
          </div>
          <button type="button" className="modal-close-btn" onClick={closeCampusModal}>
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="campus-modal-body">
          {/* Quick Presets Carousel */}
          <div className="form-section">
            <label className="form-label">
              <Compass size={13} /> QUICK SELECT POPULAR CAMPUSES
            </label>
            <div className="campus-presets-grid">
              {CAMPUS_PRESETS.map((preset) => {
                const isSelected = preset.name === name
                return (
                  <button
                    key={preset.name}
                    type="button"
                    className={`preset-btn ${isSelected ? 'active-preset' : ''}`}
                    onClick={() => handleApplyPreset(preset)}
                  >
                    <span className="preset-name">{preset.name}</span>
                    <span className="preset-coord">
                      {preset.latitude.toFixed(4)}°N, {preset.longitude.toFixed(4)}°E · {preset.sector}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Location Name */}
          <div className="form-section">
            <label className="form-label" htmlFor="campus-name-input">
              <GraduationCap size={13} /> COLLEGE / CAMPUS NAME
            </label>
            <input
              id="campus-name-input"
              type="text"
              className="campus-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. SRM Institute, BMSCE, or My College Campus"
            />
          </div>

          {/* Coordinates Row */}
          <div className="form-row-2">
            <div className="form-section">
              <label className="form-label" htmlFor="campus-lat-input">
                <MapPin size={13} /> LATITUDE (°N)
              </label>
              <input
                id="campus-lat-input"
                type="text"
                className="campus-input mono"
                value={lat}
                onChange={e => setLat(e.target.value)}
                placeholder="12.9716"
              />
            </div>
            <div className="form-section">
              <label className="form-label" htmlFor="campus-lng-input">
                <Globe size={13} /> LONGITUDE (°E)
              </label>
              <input
                id="campus-lng-input"
                type="text"
                className="campus-input mono"
                value={lng}
                onChange={e => setLng(e.target.value)}
                placeholder="77.5946"
              />
            </div>
          </div>

          {/* Sector & Radius */}
          <div className="form-row-2">
            <div className="form-section">
              <label className="form-label" htmlFor="campus-sector-input">
                <Crosshair size={13} /> CAMPUS SECTOR / ZONE
              </label>
              <input
                id="campus-sector-input"
                type="text"
                className="campus-input"
                value={sector}
                onChange={e => setSector(e.target.value)}
                placeholder="e.g. Main Quadrangle, Engineering Block"
              />
            </div>
            <div className="form-section">
              <label className="form-label" htmlFor="campus-radius-input">
                <Shield size={13} /> PERIMETER RADIUS (METERS)
              </label>
              <input
                id="campus-radius-input"
                type="number"
                className="campus-input mono"
                value={radius}
                onChange={e => setRadius(e.target.value)}
                placeholder="650"
              />
            </div>
          </div>

          {/* Device GPS / Quick Actions */}
          <div className="campus-actions-bar">
            <button
              type="button"
              className="gps-acquire-btn"
              onClick={handleUseDeviceGps}
              disabled={isGettingGps}
            >
              <LocateFixed size={14} className={isGettingGps ? 'animate-spin' : ''} />
              <span>{isGettingGps ? 'ACQUIRING GNSS FIX…' : 'USE MY DEVICE CURRENT GPS'}</span>
            </button>

            {gpsStatus && (
              <span className="gps-status-feedback">
                {gpsStatus}
              </span>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="campus-modal-footer">
          <button type="button" className="btn-cancel" onClick={closeCampusModal}>
            CANCEL
          </button>
          <button type="button" className="btn-confirm-campus" onClick={handleSave}>
            <Navigation size={14} />
            <span>CONFIRM & ANCHOR CAMPUS PERIMETER</span>
          </button>
        </div>
      </div>
    </div>
  )
}
