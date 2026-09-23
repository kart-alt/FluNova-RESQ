import { CalendarClock, Filter, Search } from 'lucide-react'
import { LiveMap } from '../components/map/LiveMap'
import { DemoControls } from '../components/mission/DemoControls'
import { SectionLabel } from '../components/ui/Primitives'

export function DisasterMapPage() { return <div className="secondary-page disaster-map-page"><div className="page-heading"><div><SectionLabel>GEO-SPATIAL INTELLIGENCE</SectionLabel><h1>Disaster map</h1><p>Operational assets, evidence and risk zones for the active mission area.</p></div><DemoControls/></div><div className="map-page-tools"><label><Search size={14}/><input placeholder="Find sector, team, survivor or hazard"/></label><button><Filter size={14}/> FILTERS</button><button><CalendarClock size={14}/> MISSION TIMELINE</button></div><LiveMap expanded/></div> }
