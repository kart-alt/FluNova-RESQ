import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopHeader } from './TopHeader'
import { useSimulation } from '../../hooks/useSimulation'
import { CampusLocationModal } from '../map/CampusLocationModal'

export function CommandLayout() {
  const [isOpen, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  useSimulation()

  return (
    <div className={`command-layout ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        isOpen={isOpen}
        onClose={() => setOpen(false)}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />
      <div className="app-main">
        <TopHeader onOpenMenu={() => setOpen(true)} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
      <CampusLocationModal />
    </div>
  )
}

