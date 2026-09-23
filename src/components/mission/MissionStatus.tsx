import { ArrowRight, Bot, MapPinned, Target } from 'lucide-react'
import { useCommandStore } from '../../store/commandStore'
import { StatusDot } from '../ui/Primitives'

export function MissionStatus() { const mission = useCommandStore(state => state.mission); return <section className="mission-status"><div><small>MISSION PHASE</small><b><StatusDot tone="blue" /> {mission.phase}</b></div><ArrowRight size={15}/><div><small>CURRENT SECTOR</small><b><MapPinned size={14}/> {mission.currentSector}</b></div><ArrowRight size={15}/><div className="coverage-progress"><small>SEARCH COVERAGE</small><b>{Math.round(mission.coverage)}%</b><span><i style={{ width: `${mission.coverage}%` }}/></span></div><ArrowRight size={15}/><div><small>NEXT TARGET</small><b><Target size={14}/> {mission.nextTarget}</b></div><ArrowRight size={15}/><div><small>DRONE ETA</small><b><Bot size={14}/> 02:41</b></div></section> }
