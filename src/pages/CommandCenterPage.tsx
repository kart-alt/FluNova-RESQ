import { Sparkles } from 'lucide-react'
import { IntelligencePanel } from '../components/alerts/IntelligencePanel'
import { TeamDispatchModal } from '../components/dispatch/TeamDispatchModal'
import { CameraFeed } from '../components/feeds/CameraFeed'
import { FeedExpandedModal } from '../components/feeds/FeedExpandedModal'
import { QualcommModelModal } from '../components/feeds/QualcommModelModal'
import { LiveMap } from '../components/map/LiveMap'
import { DemoControls } from '../components/mission/DemoControls'
import { KpiStrip } from '../components/mission/KpiStrip'
import { useCommandStore } from '../store/commandStore'
import '../command-center-polish.css'

export function CommandCenterPage() {
  const mission = useCommandStore(state => state.mission)
  const survivor = useCommandStore(state => state.survivors.find(s => s.id === state.selectedSurvivorId))

  return (
    <div className="command-center-container" data-mission-phase={mission.phase}>
      {/* Top Page Sub-Header with Mission Objective and Demo Controls */}
      <div className="command-sub-header">
        <div className="sub-header-left">
          <div className="tactical-breadcrumbs">
            <span className="breadcrumb-brand">FLYNOVA GCS</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-mission">MISSION #{mission.id}</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-sector">OPERATION RESQ-SECE</span>
          </div>
          <h1 className="page-main-heading">
            FlyNova GCS — Tactical Disaster Response Ground Control Station
          </h1>
          <p className="page-desc-text">
            Autonomous multi-modal UAV search, real-time thermal verification, hazard avoidance, and rescue vector routing.
          </p>
        </div>

        <div className="sub-header-right">
          <DemoControls />
        </div>
      </div>

      {/* 1. KPI STRIP */}
      <KpiStrip />

      {/* 2. HORIZONTAL FULL-WIDTH TACTICAL DISASTER MAP */}
      <div className="command-horizontal-map-section">
        <LiveMap />
      </div>

      {/* 3. DUAL MULTI-SPECTRAL CAMERA FEEDS: RGB & THERMAL SPLIT SIDE-BY-SIDE */}
      <div className="command-dual-feeds-split-row">
        <CameraFeed type="RGB" />
        <CameraFeed type="THERMAL" />
      </div>

      {/* 4. LOWER INTELLIGENCE / ALERT / RESCUE SECTION */}
      <IntelligencePanel />

      {/* Expanded Modal for RGB, Thermal, or VIO */}
      <FeedExpandedModal />

      {/* Interactive Collision-Free Team Dispatch & Tactical Routing Modal */}
      <TeamDispatchModal />

      {/* Qualcomm AI Hub Model Manager & Custom Model Loader */}
      <QualcommModelModal />
    </div>
  )
}
