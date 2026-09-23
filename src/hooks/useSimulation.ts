import { useEffect } from 'react'
import { useCommandStore } from '../store/commandStore'

export function useSimulation() { const isPlaying = useCommandStore(state => state.mission.isPlaying); const tick = useCommandStore(state => state.tick); useEffect(() => { if (!isPlaying) return; const id = window.setInterval(tick, 1000); return () => window.clearInterval(id) }, [isPlaying, tick]) }
