import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { CommandLayout } from './components/layout/CommandLayout'

const CommandCenterPage = lazy(() => import('./pages/CommandCenterPage').then(module => ({ default: module.CommandCenterPage })))
const LiveFeedsPage = lazy(() => import('./pages/LiveFeedsPage').then(module => ({ default: module.LiveFeedsPage })))
const DisasterMapPage = lazy(() => import('./pages/DisasterMapPage').then(module => ({ default: module.DisasterMapPage })))
const AlertsPage = lazy(() => import('./pages/AlertsPage').then(module => ({ default: module.AlertsPage })))
const SurvivorsPage = lazy(() => import('./pages/SurvivorsPage').then(module => ({ default: module.SurvivorsPage })))
const SurvivorDetailPage = lazy(() => import('./pages/SurvivorDetailPage').then(module => ({ default: module.SurvivorDetailPage })))
const HazardsPage = lazy(() => import('./pages/HazardsPage').then(module => ({ default: module.HazardsPage })))
const RescueTeamsPage = lazy(() => import('./pages/RescueTeamsPage').then(module => ({ default: module.RescueTeamsPage })))
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then(module => ({ default: module.AnalyticsPage })))
const MissionLogPage = lazy(() => import('./pages/MissionLogPage').then(module => ({ default: module.MissionLogPage })))
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(module => ({ default: module.SettingsPage })))
const LoadingView = () => <div className="route-loading">LOADING OPERATIONAL VIEW…</div>

export default function App() {
  return (
    <Suspense fallback={<LoadingView />}>
      <Routes>
        {/* Tactical GCS Desk & Operations Routes */}
        <Route element={<CommandLayout />}>
          <Route path="/" element={<CommandCenterPage />} />
          <Route path="/live-feeds" element={<LiveFeedsPage />} />
          <Route path="/map" element={<DisasterMapPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/survivors" element={<SurvivorsPage />} />
          <Route path="/survivors/:id" element={<SurvivorDetailPage />} />
          <Route path="/hazards" element={<HazardsPage />} />
          <Route path="/rescue-teams" element={<RescueTeamsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/mission-log" element={<MissionLogPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
