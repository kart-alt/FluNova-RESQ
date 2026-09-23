import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Clock3, CloudSun, Globe, Menu, Radio, Shield, ShieldCheck, UsersRound, Wifi } from 'lucide-react'
import { formatMissionTime, useCommandStore } from '../../store/commandStore'
import { StatusDot } from '../ui/Primitives'

export function TopHeader({ onOpenMenu }: { onOpenMenu: () => void }) {
  const [time, setTime] = useState(() => new Date())
  const mission = useCommandStore(state => state.mission)
  const alerts = useCommandStore(state => state.alerts)
  const survivors = useCommandStore(state => state.survivors)
  const hazards = useCommandStore(state => state.hazards)
  const openCampusModal = useCommandStore(state => state.openCampusModal)
  const unacknowledgedCount = alerts.filter(a => a.status === 'NEW').length
  const criticalCount = survivors.filter(s => s.status === 'CRITICAL' || s.priority > 85).length

  useEffect(() => {
    const id = window.setInterval(() => setTime(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <header className="top-header">
      <button className="mobile-menu" onClick={onOpenMenu} aria-label="Open navigation">
        <Menu size={19} />
      </button>

      {/* Brand & System Status */}
      <div className="header-brand-group" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        <div className="brand-crest" style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#ffffff', border: '1.5px solid rgba(2, 132, 199, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3px', boxShadow: '0 2px 8px rgba(2, 132, 199, 0.15)', position: 'relative', flexShrink: 0 }}>
          <img src="/flynova_drone_emblem.png" alt="FlyNova GCS Emblem" className="brand-crest-img" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          <div className="crest-radar-ping" />
        </div>
        <div className="brand-text" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="brand-title-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
            <b className="brand-title" style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'baseline', gap: '5px', lineHeight: 1.15 }}>
              FLYNOVA <span className="brand-title-gcs" style={{ color: '#0284c7', display: 'inline', fontWeight: 800 }}>GCS</span>
            </b>
            <span className="system-online-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 7px', borderRadius: '10px', fontSize: '9px', fontWeight: 700, whiteSpace: 'nowrap' }}>
              <span className="glowing-green-dot" />
              SYSTEM ONLINE
            </span>
          </div>
          <span className="brand-subtitle" style={{ fontSize: '8px', color: '#475569', fontWeight: 600, letterSpacing: '0.06em', whiteSpace: 'nowrap', marginTop: '2px', lineHeight: 1.2 }}>
            AI DISASTER RESPONSE GROUND CONTROL STATION
          </span>
        </div>
      </div>

      {/* Center Mission Details & Status Pills */}
      <div className="header-mission-center">
        <div className="mission-pill">
          <small>MISSION</small>
          <span className="pill-val bold highlight-cyan" style={{ whiteSpace: 'nowrap' }}>{mission.codeName}</span>
        </div>

        <div
          className="mission-pill location-pill header-campus-trigger-pill"
          onClick={openCampusModal}
          title={`College Campus Theater: ${mission.location} (Click to configure coordinates)`}
          style={{ cursor: 'pointer', maxWidth: '270px' }}
        >
          <small style={{ whiteSpace: 'nowrap' }}>CAMPUS · CLICK TO SET</small>
          <span className="pill-val" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Globe size={11} className="inline-icon text-cyan" style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mission.location}</span>
          </span>
        </div>

        {/* Global Live Survivor Count Pill */}
        <Link
          to="/survivors"
          className="mission-pill header-survivors-pill"
          title="Live Tracked Survivors across all sectors - Click to open Triage List"
          style={{ textDecoration: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          <small>SURVIVORS</small>
          <span className="pill-val bold text-cyan" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
            <UsersRound size={12} className="text-cyan" style={{ flexShrink: 0 }} />
            <span>{String(survivors.length).padStart(2, '0')}</span>
            {criticalCount > 0 && (
              <span style={{
                background: 'rgba(244,63,94,0.2)',
                color: '#fb7185',
                border: '1px solid rgba(244,63,94,0.4)',
                borderRadius: '3px',
                fontSize: '9px',
                padding: '1px 5px',
                marginLeft: '2px',
                whiteSpace: 'nowrap',
                lineHeight: '1.2',
                display: 'inline-flex',
                alignItems: 'center',
                flexShrink: 0,
              }}>
                {criticalCount} CRIT
              </span>
            )}
          </span>
        </Link>

        {/* Global Live Hazards Pill */}
        <Link
          to="/hazards"
          className="mission-pill header-hazards-pill"
          title={hazards.length === 0 ? 'Safe Campus Zone - Zero Active Hazards Reported' : 'Active Field Hazards'}
          style={{ textDecoration: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
        >
          <small>HAZARDS</small>
          <span
            className="pill-val bold"
            style={{
              color: hazards.length === 0 ? '#34d399' : '#fb923c',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap',
            }}
          >
            <ShieldCheck size={12} style={{ flexShrink: 0 }} />
            <span>{hazards.length === 0 ? '0 (ALL CLEAR)' : `${hazards.length} ACTIVE`}</span>
          </span>
        </Link>

        <div className="mission-pill timer-pill" style={{ whiteSpace: 'nowrap' }}>
          <small>MISSION TIME</small>
          <span className="pill-val mono timer-val">
            {formatMissionTime(mission.elapsedSeconds)}
          </span>
        </div>
      </div>

      {/* Right Telemetry Readouts */}
      <div className="header-right-group">
        {/* Real-time local clock */}
        <div className="header-status-badge clock-badge">
          <Clock3 size={13} className="text-muted" />
          <span className="mono">
            {time.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>

        {/* Weather */}
        <div className="header-status-badge weather-badge">
          <CloudSun size={13} className="weather-icon" />
          <span className="weather-temp">{mission.temperature}</span>
          <span className="weather-cond">{mission.weather}</span>
        </div>

        {/* Connectivity */}
        <div className="header-status-badge comms-badge">
          <span className="glowing-cyan-dot" />
          <Wifi size={12} />
          <span className="mono">{mission.linkStatus}</span>
        </div>

        {/* Notification bell */}
        <div className="notification-wrapper">
          <button className="notification-btn" aria-label={`${unacknowledgedCount} new alerts`}>
            <Bell size={16} />
            {unacknowledgedCount > 0 && <i className="notif-badge">{unacknowledgedCount}</i>}
          </button>
        </div>
      </div>
    </header>
  )
}
