import { useEffect, useMemo, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import type { Map as MapLibreMap, Marker, StyleSpecification } from 'maplibre-gl'
import type { FeatureCollection, GeoJsonProperties, Geometry, Polygon, Position } from 'geojson'
import 'maplibre-gl/dist/maplibre-gl.css'
import '../../map-fixes.css'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  Crosshair,
  Flame,
  Globe,
  GraduationCap,
  LocateFixed,
  Map,
  Maximize2,
  Navigation,
  Route,
  Search,
  Send,
  Shield,
  SlidersHorizontal,
  X,
  Zap,
} from 'lucide-react'
import { MAP_STYLE_URL, MISSION_CENTER } from '../../data/missionData'
import { useCommandStore } from '../../store/commandStore'
import { generateSafeRescueRoute } from '../../utils/safePathfinding'
import { LayerControl } from './LayerControl'
import { MapLegend } from './MapLegend'
import type { Drone, Hazard, MapStyleMode, RescueTeam, Survivor } from '../../types'

type GeoCollection = FeatureCollection<Geometry, GeoJsonProperties>
type MarkerKind = 'drone' | 'survivor' | 'hazard' | 'team'

const circle = (longitude: number, latitude: number, radius: number): Polygon => {
  const points: Position[] = []
  for (let index = 0; index <= 32; index += 1) {
    const angle = (index / 32) * 2 * Math.PI
    points.push([longitude + Math.cos(angle) * radius / 105000, latitude + Math.sin(angle) * radius / 111000])
  }
  return { type: 'Polygon', coordinates: [points] }
}

const hazardRisk = (hazard: Hazard, nearbySurvivors: number) => {
  const severityScore = { LOW: 18, MEDIUM: 35, HIGH: 55, CRITICAL: 70 }[hazard.severity]
  return Math.min(100, Math.round(severityScore + hazard.confidence * 0.2 + (hazard.status === 'ACTIVE' ? 12 : 0) + nearbySurvivors * 6 + (hazard.type === 'BLOCKED ROAD' || hazard.type === 'UNSTABLE STRUCTURE' ? 4 : 0)))
}

const hazardIcon = (type: Hazard['type']) => {
  const paths: Record<Hazard['type'], string> = {
    FIRE: '<path d="M14 3c1.8 4.2 5.5 5.7 5.5 10.1A5.5 5.5 0 1 1 8.6 9.5c.5 2.2 1.9 3.4 3.2 4.1C11.4 9.8 13.2 7 14 3Z"/>',
    FLOOD: '<path d="M4 17c2.3-2.3 4.7 2.3 7 0 2.3-2.3 4.7 2.3 7 0 1.1-1.1 1.9-1.1 3-0M4 21c2.3-2.3 4.7 2.3 7 0 2.3-2.3 4.7 2.3 7 0 1.1-1.1 1.9-1.1 3 0"/>',
    SMOKE: '<path d="M6 18h11a3 3 0 0 0 .5-5.9A5 5 0 0 0 8 10a4 4 0 0 0-2 8Z"/>',
    DEBRIS: '<path d="m14 4 9 16H5L14 4Zm0 5v5m0 3v.1"/>',
    'UNSTABLE STRUCTURE': '<path d="M5 21V9l9-5 5 3v14M5 21h15M9 21v-6h4v6m2-9h2m-2 3h2"/>',
    LANDSLIDE: '<path d="m4 20 6-8 3 3 4-7 6 12H4Zm3-13h.1M11 6h.1"/>',
    ELECTRICAL: '<path d="m15 3-8 11h6l-1 7 8-12h-6l1-6Z"/>',
    'BLOCKED ROAD': '<path d="M8 4 5 20m12-16 3 16M9 12h6m-7 4h8"/>',
    'DAMAGED BRIDGE': '<path d="M4 19h16M6 19v-6c0-4 3-6 8-6s8 2 8 6v6M10 19v-4m8 4v-4"/>',
  }
  return paths[type]
}

// Tactical Demarcation: Sri Eshwar College of Engineering Campus Operational Perimeter (Kondampatti, Coimbatore)
export const DISASTER_AFFECTED_ZONE_COORDINATES: Position[] = [
  [77.0545, 10.8315], // NW Apex (North of Kondampatti Road)
  [77.0620, 10.8320], // North Perimeter (SECE Main Entry Corridor)
  [77.0665, 10.8290], // NE Outer Boundary (Sports Complex East)
  [77.0670, 10.8240], // East Flank (Hostel Block perimeter)
  [77.0650, 10.8210], // SE Flank (Agriculture/Green Corridor)
  [77.0590, 10.8205], // South Apex (Vadasithur Approach Corridor)
  [77.0540, 10.8230], // SW Flank (Kondampatti Village Boundary)
  [77.0535, 10.8280], // West Flank (Approach Road)
  [77.0545, 10.8315], // Close polygon loop
]

const markerSvg = (kind: MarkerKind, item: Drone | Survivor | Hazard | RescueTeam, selected: boolean, focused: boolean) => {
  const hazard = kind === 'hazard' ? item as Hazard : undefined
  const survivor = kind === 'survivor' ? item as Survivor : undefined
  const drone = kind === 'drone' ? item as Drone : undefined
  const team = kind === 'team' ? item as RescueTeam : undefined

  // Drone: tactical quadcopter UAV marker with active rotor rings, heading orientation and telemetry pill
  if (kind === 'drone') {
    const isD1 = item.id === 'D1'
    const heading = drone?.heading ?? 135
    const alt = Math.round(drone?.altitude ?? 121)
    const speed = drone?.speed ?? 8.4
    return `
      <div class="tactical-marker drone-marker ${selected ? 'is-selected' : ''} ${isD1 ? 'd1-active-beacon' : ''}">
        <div class="drone-heading-wrapper" style="transform: rotate(${heading}deg);">
          <svg viewBox="0 0 36 36" class="drone-uav-svg">
            <!-- Rotors arms -->
            <line x1="7" y1="7" x2="29" y2="29" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="7" y1="29" x2="29" y2="7" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round"/>
            <!-- Center body fuselage -->
            <circle cx="18" cy="18" r="6.5" fill="#0f172a" stroke="#00f0ff" stroke-width="2"/>
            <!-- Directional Nose Triangle -->
            <polygon points="18,6 13,13 23,13" fill="#00f0ff"/>
            <!-- 4 Active Rotor Disks -->
            <circle cx="7" cy="7" r="4.2" fill="rgba(0, 240, 255, 0.45)" stroke="#00f0ff" stroke-width="1.2"/>
            <circle cx="29" cy="7" r="4.2" fill="rgba(0, 240, 255, 0.45)" stroke="#00f0ff" stroke-width="1.2"/>
            <circle cx="7" cy="29" r="4.2" fill="rgba(0, 240, 255, 0.45)" stroke="#00f0ff" stroke-width="1.2"/>
            <circle cx="29" cy="29" r="4.2" fill="rgba(0, 240, 255, 0.45)" stroke="#00f0ff" stroke-width="1.2"/>
          </svg>
        </div>
        <div class="drone-pulse-radar"></div>
        <div class="drone-gps-pill">
          <span class="pill-id">${item.id} · ${drone?.name ?? 'UAV'}</span>
          <span class="pill-stats">ALT ${alt}m · ${speed}m/s</span>
        </div>
      </div>
    `
  }

  // Survivor: red/orange pulsing circular marker with large glowing red ring for critical S-03
  if (kind === 'survivor') {
    const isCritical = survivor?.status === 'CRITICAL' || survivor?.id === 'S-03'
    const color = isCritical ? '#f43f5e' : survivor?.status === 'HIGH PRIORITY' ? '#f97316' : '#10b981'
    return `
      <div class="tactical-marker survivor-marker ${isCritical ? 'critical-survivor-ring' : ''} ${selected ? 'is-selected' : ''}">
        ${isCritical ? '<div class="critical-outer-glow-ring"></div>' : ''}
        <div class="survivor-core-circle" style="--survivor-color: ${color};">
          <svg viewBox="0 0 24 24" class="survivor-icon">
            <circle cx="12" cy="8" r="4" fill="currentColor"/>
            <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" stroke-width="2" fill="none"/>
          </svg>
        </div>
        <div class="survivor-ping"></div>
        <span class="marker-label survivor-label">${item.id} ${isCritical ? '· 97%' : ''}</span>
      </div>
    `
  }

  // Hazard: orange/red warning marker
  if (kind === 'hazard') {
    const isCritical = hazard?.severity === 'CRITICAL'
    const color = isCritical ? '#ef4444' : hazard?.severity === 'HIGH' ? '#f97316' : '#eab308'
    return `
      <div class="tactical-marker hazard-marker ${selected ? 'is-selected' : ''}" style="--hazard-color: ${color};">
        <div class="hazard-diamond">
          <svg viewBox="0 0 28 28" class="hazard-svg">${hazardIcon(hazard!.type)}</svg>
        </div>
        <span class="marker-label hazard-label">${item.id}</span>
      </div>
    `
  }

  // Rescue Team: green shield/person marker
  const color = '#10b981'
  const isAlpha = team?.id === 'ALPHA'
  return `
    <div class="tactical-marker team-marker ${isAlpha ? 'team-alpha-active' : ''} ${selected ? 'is-selected' : ''}">
      <div class="team-shield-core">
        <svg viewBox="0 0 24 24" class="team-svg">
          <path d="M12 2L4 5V11C4 16.5 7.4 21.6 12 23C16.6 21.6 20 16.5 20 11V5L12 2Z" fill="#064e3b" stroke="#10b981" stroke-width="2"/>
          <path d="M9 12L11 14L15 10" stroke="#34d399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <span class="marker-label team-label">${team?.name ?? item.id}</span>
    </div>
  `
}

const SATELLITE_TILES = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
const STREET_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

const resolveMapStyle = (mode: MapStyleMode): StyleSpecification => {
  return {
    version: 8,
    sources: {
      'satellite-tiles': {
        type: 'raster',
        tiles: [SATELLITE_TILES],
        tileSize: 256,
        attribution: '© Esri, Maxar, Earthstar Geographics',
        maxzoom: 19,
      },
      'street-tiles': {
        type: 'raster',
        tiles: [STREET_TILES],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors',
        maxzoom: 19,
      },
    },
    layers: [
      {
        id: 'satellite-layer',
        type: 'raster',
        source: 'satellite-tiles',
        layout: {
          visibility: mode === 'SATELLITE' ? 'visible' : 'none',
        },
        paint: {
          'raster-opacity': 1.0,
        },
      },
      {
        id: 'street-layer',
        type: 'raster',
        source: 'street-tiles',
        layout: {
          visibility: mode === 'STREETS' ? 'visible' : 'none',
        },
        paint: {
          'raster-opacity': 1.0,
        },
      },
    ],
  } as StyleSpecification
}

export function LiveMap({ expanded = false }: { expanded?: boolean }) {
  const container = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markers = useRef<Marker[]>([])
  const overlaysInitialized = useRef(false)
  const [mapReady, setMapReady] = useState(false)
  const [query, setQuery] = useState('')

  const state = useCommandStore()
  const {
    drones,
    survivors,
    hazards,
    teams,
    mapLayers,
    mission,
    selectedDroneId,
    selectedSurvivorId,
    selectedHazardId,
    selectedTeamId,
    selectDrone,
    selectSurvivor,
    selectHazard,
    selectTeam,
  } = state

  const activeDetections = state.activeDetections
  const [selectedProjectedPin, setSelectedProjectedPin] = useState<{
    id: string
    index: number
    lat: number
    lng: number
    confidence: number
    tempC: number
    label: string
    posture?: string
    hazard?: any
  } | null>(null)

  // Floating route window controls: default to compact collapsed pill so it never obstructs map view
  const [routeCardCollapsed, setRouteCardCollapsed] = useState(true)
  const [routeCardDismissed, setRouteCardDismissed] = useState(false)

  // Re-center map smoothly when college campus location changes
  useEffect(() => {
    const map = mapRef.current
    if (!map || !state.campusLocation) return
    map.flyTo({
      center: [state.campusLocation.longitude, state.campusLocation.latitude],
      zoom: 14.2,
      duration: 1200,
    })
  }, [state.campusLocation?.latitude, state.campusLocation?.longitude])

  // Georeference real-time Qualcomm YOLOv8 detections from drone camera onto satellite ground map
  const projectedDetections = useMemo(() => {
    const d1 = drones.find(d => d.id === 'D1') ?? drones[0]
    if (!d1 || !activeDetections || activeDetections.length === 0) return []

    const fovAngle = (d1.heading ?? 135) * (Math.PI / 180)
    const fovSpread = 28 * (Math.PI / 180) // 56 deg horizontal FOV
    const fovDist = 0.0038 // ~420m ground swath

    return activeDetections.map((det, index) => {
      // Normalized screen position
      const u = (det.x + det.w / 2) / 100 - 0.5
      const v = Math.min(1.0, Math.max(0.0, (det.y + det.h) / 100))

      // Oblique perspective ground range
      const dist = fovDist * (0.92 - v * 0.68)
      const lateralAngle = u * (2 * fovSpread)
      const bearing = fovAngle + lateralAngle

      const lng = d1.longitude + Math.sin(bearing) * dist
      const lat = d1.latitude + Math.cos(bearing) * (dist * 0.90)

      return {
        id: det.id,
        index,
        lat,
        lng,
        confidence: det.confidence,
        tempC: det.thermalSignature?.tempC ?? 36.6,
        label: det.label,
        posture: det.posture || 'STANDING',
        hazard: det.hazard,
      }
    })
  }, [activeDetections, drones])

  const selectedSurvivor = survivors.find(item => item.id === selectedSurvivorId)
  const selectedHazard = hazards.find(item => item.id === selectedHazardId)
  const activeSurvivor = selectedSurvivor ?? survivors.find(s => s.id === 'S-03') ?? survivors[0]
  const assignedTeam =
    teams.find(item => item.id === activeSurvivor.assignedTeamId) ??
    teams.find(item => item.id === selectedTeamId) ??
    teams[0]

  const routeCalculation = useMemo(() => {
    if (!assignedTeam || !activeSurvivor) return null
    return generateSafeRescueRoute(assignedTeam, activeSurvivor, hazards)
  }, [assignedTeam, activeSurvivor, hazards])

  const geo = useMemo(() => {
    const hazardData: GeoCollection = {
      type: 'FeatureCollection',
      features: hazards.map(item => ({
        type: 'Feature',
        properties: {
          id: item.id,
          severity: item.severity,
          status: item.status,
          focused: selectedHazardId === item.id || activeSurvivor?.nearbyHazards.includes(item.id),
        },
        geometry: circle(item.longitude, item.latitude, item.radius),
      })),
    }

    const routeCoordinates: Position[] = routeCalculation
      ? (state.routeComparisonMode === 'DIRECT_VECTOR'
          ? routeCalculation.directCoordinates
          : routeCalculation.coordinates)
      : []

    const route: GeoCollection = {
      type: 'FeatureCollection',
      features: routeCoordinates.length
        ? [
            {
              type: 'Feature',
              properties: {
                id: 'dynamic-rescue-route',
                name: state.routeComparisonMode === 'DIRECT_VECTOR' ? 'Direct Hazardous Vector' : 'Safe Rescue Corridor',
                mode: state.routeComparisonMode,
                hasCollision: routeCalculation?.hasHazardCollisions ?? false,
              },
              geometry: { type: 'LineString', coordinates: routeCoordinates },
            },
          ]
        : [],
    }

    // Demarcated Disaster Operational Zone Perimeter (Encompassing all active rescue teams, hazards, and staging corridors)
    const disasterZone: GeoCollection = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {
            id: 'disaster-affected-perimeter',
            title: 'DISASTER OPERATIONAL ZONE · ALL RESCUE TEAMS ENCOMPASSED',
            status: 'CRITICAL_HAZARD_ZONE',
          },
          geometry: {
            type: 'Polygon',
            coordinates: [DISASTER_AFFECTED_ZONE_COORDINATES],
          },
        },
      ],
    }

    // Drone search trajectory (strictly confined inside the disaster affected zone)
    const droneTrajectoryCoordinates: Position[] = [
      [77.5895, 12.9750], // WP-01: NW Ingress corridor inside disaster boundary
      [77.6030, 12.9760], // WP-02: North lawnmower sweep across Sector C1-C4 ruins
      [77.6110, 12.9740], // WP-03: East turn scanning smoke buffer near H-03
      [77.6050, 12.9715], // WP-04: Transverse sweep across structural collapse corridor (H-01)
      [77.5925, 12.9710], // WP-05: West sweep line over northern debris
      [77.5910, 12.9670], // WP-06: South turn near H-05 road blockage
      [77.6015, 12.9678], // WP-07: Scan across S-03 distress beacon and H-04 rubble
      [77.5998, 12.9691], // WP-08: Target lock & thermal scan over Survivor S-03
      [drones[0].longitude, drones[0].latitude], // Active UAV Eagle One live position & camera orbit
    ]

    const trajectory: GeoCollection = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: { id: 'drone-path', name: 'Confined UAV Search Patrol' },
        geometry: { type: 'LineString', coordinates: droneTrajectoryCoordinates },
      }],
    }

    const droneWaypoints: GeoCollection = {
      type: 'FeatureCollection',
      features: droneTrajectoryCoordinates.slice(0, -1).map((coord, idx) => ({
        type: 'Feature',
        properties: { id: `wp-${idx + 1}`, label: `WP-0${idx + 1}` },
        geometry: { type: 'Point', coordinates: coord },
      })),
    }

    const coverage: GeoCollection = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { status: 'searched' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[77.5875, 12.9765], [77.6025, 12.9782], [77.6130, 12.9745], [77.6080, 12.9690], [77.5925, 12.9680], [77.5870, 12.9720], [77.5875, 12.9765]]],
          },
        },
        {
          type: 'Feature',
          properties: { status: 'active' },
          geometry: circle(drones[0].longitude, drones[0].latitude, 180),
        },
      ],
    }

    // Camera Field of View polygon projection from Drone D1 (where the RGB & Thermal cameras point)
    const d1 = drones[0]
    const fovAngle = (d1?.heading ?? 135) * (Math.PI / 180)
    const fovSpread = 28 * (Math.PI / 180) // 56 deg horizontal FOV
    const fovDist = 0.0038 // ~420m ground swath
    const apex: Position = [d1.longitude, d1.latitude]
    const p1: Position = [d1.longitude + Math.sin(fovAngle - fovSpread) * fovDist, d1.latitude + Math.cos(fovAngle - fovSpread) * (fovDist * 0.9)]
    const pMid: Position = [d1.longitude + Math.sin(fovAngle) * (fovDist * 1.06), d1.latitude + Math.cos(fovAngle) * (fovDist * 0.96)]
    const p2: Position = [d1.longitude + Math.sin(fovAngle + fovSpread) * fovDist, d1.latitude + Math.cos(fovAngle + fovSpread) * (fovDist * 0.9)]

    const cameraFov: GeoCollection = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: { id: 'd1-camera-fov' },
        geometry: {
          type: 'Polygon',
          coordinates: [[apex, p1, pMid, p2, apex]],
        },
      }],
    }

    // Direct sensor target lock line from D1 to active survivor
    const sensorLock: GeoCollection = {
      type: 'FeatureCollection',
      features: activeSurvivor ? [{
        type: 'Feature',
        properties: { id: 'd1-sensor-lock' },
        geometry: {
          type: 'LineString',
          coordinates: [[d1.longitude, d1.latitude], [activeSurvivor.longitude, activeSurvivor.latitude]],
        },
      }] : [],
    }

    const restricted: GeoCollection = {
      type: 'FeatureCollection',
      features: hazards
        .filter(item => item.status === 'ACTIVE' && (item.severity === 'CRITICAL' || item.severity === 'HIGH'))
        .map(item => ({
          type: 'Feature',
          properties: { id: item.id },
          geometry: circle(item.longitude, item.latitude, item.radius * 1.4),
        })),
    }

    // Laser targeting rays from D1 to each detected person in camera view
    const detectionRays: GeoCollection = {
      type: 'FeatureCollection',
      features: projectedDetections.map(p => ({
        type: 'Feature',
        properties: { id: `ray-${p.id}`, confidence: p.confidence },
        geometry: {
          type: 'LineString',
          coordinates: [[d1.longitude, d1.latitude], [p.lng, p.lat]],
        },
      })),
    }

    // Thermal radiometric ground footprints around each detected person
    const detectionFootprints: GeoCollection = {
      type: 'FeatureCollection',
      features: projectedDetections.map(p => ({
        type: 'Feature',
        properties: { id: `footprint-${p.id}`, confidence: p.confidence, tempC: p.tempC },
        geometry: circle(p.lng, p.lat, 14),
      })),
    }

    return {
      hazardData,
      route,
      trajectory,
      droneWaypoints,
      disasterZone,
      coverage,
      restricted,
      cameraFov,
      sensorLock,
      detectionRays,
      detectionFootprints,
    }
  }, [
    drones,
    survivors,
    hazards,
    teams,
    selectedHazardId,
    activeSurvivor,
    assignedTeam,
    routeCalculation,
    state.routeComparisonMode,
    projectedDetections,
  ])

  const geoRef = useRef(geo)
  geoRef.current = geo

  useEffect(() => {
    if (!container.current || mapRef.current) return
    let cancelled = false

    void (async () => {
      try {
        const mapStyle = resolveMapStyle(state.mapStyleMode)
        if (cancelled || !container.current || mapRef.current) return

        const fullStyle: StyleSpecification = {
          ...mapStyle,
          sources: {
            ...mapStyle.sources,
            coverage: { type: 'geojson', data: geoRef.current.coverage },
            hazards: { type: 'geojson', data: geoRef.current.hazardData },
            disasterZone: { type: 'geojson', data: geoRef.current.disasterZone },
            droneWaypoints: { type: 'geojson', data: geoRef.current.droneWaypoints },
            routes: { type: 'geojson', data: geoRef.current.route },
            trajectory: { type: 'geojson', data: geoRef.current.trajectory },
            restricted: { type: 'geojson', data: geoRef.current.restricted },
            cameraFov: { type: 'geojson', data: geoRef.current.cameraFov },
            sensorLock: { type: 'geojson', data: geoRef.current.sensorLock },
            detectionRays: { type: 'geojson', data: geoRef.current.detectionRays },
            detectionFootprints: { type: 'geojson', data: geoRef.current.detectionFootprints },
          },
          layers: [
            ...(mapStyle.layers ?? []),
            {
              id: 'detection-footprint-fill',
              type: 'fill',
              source: 'detectionFootprints',
              paint: {
                'fill-color': '#06b6d4',
                'fill-opacity': 0.22,
              },
            },
            {
              id: 'detection-footprint-ring',
              type: 'line',
              source: 'detectionFootprints',
              paint: {
                'line-color': '#22d3ee',
                'line-width': 1.6,
                'line-dasharray': [2, 2],
              },
            },
            {
              id: 'detection-laser-rays',
              type: 'line',
              source: 'detectionRays',
              paint: {
                'line-color': '#00f0ff',
                'line-width': 1.6,
                'line-dasharray': [2, 3],
                'line-opacity': 0.75,
              },
            },
            {
              id: 'camera-fov-fill',
              type: 'fill',
              source: 'cameraFov',
              paint: { 'fill-color': '#0284c7', 'fill-opacity': 0.2 },
            },
            {
              id: 'camera-fov-line',
              type: 'line',
              source: 'cameraFov',
              paint: {
                'line-color': '#38bdf8',
                'line-width': 1.6,
                'line-dasharray': [2, 2],
              },
            },
            {
              id: 'sensor-lock-line',
              type: 'line',
              source: 'sensorLock',
              paint: {
                'line-color': '#00f0ff',
                'line-width': 2,
                'line-dasharray': [3, 2],
                'line-opacity': 0.85,
              },
            },
            {
              id: 'coverage-searched',
              type: 'fill',
              source: 'coverage',
              filter: ['==', ['get', 'status'], 'searched'],
              paint: { 'fill-color': '#06b6d4', 'fill-opacity': 0.14 },
            },
            {
              id: 'coverage-active',
              type: 'fill',
              source: 'coverage',
              filter: ['==', ['get', 'status'], 'active'],
              paint: { 'fill-color': '#00f0ff', 'fill-opacity': 0.22 },
            },
            // Demarcated Disaster Impact Perimeter (Red Zone covering earthquake ruins & hazards)
            {
              id: 'disaster-zone-glow',
              type: 'line',
              source: 'disasterZone',
              paint: {
                'line-color': '#ef4444',
                'line-width': 12,
                'line-opacity': 0.35,
                'line-blur': 5,
              },
            },
            {
              id: 'disaster-zone-fill',
              type: 'fill',
              source: 'disasterZone',
              paint: {
                'fill-color': '#dc2626',
                'fill-opacity': 0.08,
              },
            },
            {
              id: 'disaster-zone-casing',
              type: 'line',
              source: 'disasterZone',
              paint: {
                'line-color': '#991b1b',
                'line-width': 3.5,
                'line-opacity': 0.95,
              },
            },
            {
              id: 'disaster-zone-dash',
              type: 'line',
              source: 'disasterZone',
              paint: {
                'line-color': '#fca5a5',
                'line-width': 2,
                'line-dasharray': [4, 2],
                'line-opacity': 1.0,
              },
            },
            {
              id: 'hazard-fill',
              type: 'fill',
              source: 'hazards',
              paint: {
                'fill-color': ['match', ['get', 'severity'], 'CRITICAL', '#f43f5e', 'HIGH', '#f97316', 'MEDIUM', '#eab308', '#10b981'],
                'fill-opacity': 0.18,
              },
            },
            {
              id: 'hazard-line',
              type: 'line',
              source: 'hazards',
              paint: {
                'line-color': ['match', ['get', 'severity'], 'CRITICAL', '#ff6b81', 'HIGH', '#fb923c', '#fde047'],
                'line-width': 1.8,
                'line-dasharray': [2, 2],
              },
            },
            {
              id: 'safe-route-casing',
              type: 'line',
              source: 'routes',
              paint: {
                'line-color': ['case', ['==', ['get', 'mode'], 'DIRECT_VECTOR'], '#450a0a', '#ffffff'],
                'line-width': 7,
                'line-opacity': 0.95,
              },
            },
            {
              id: 'safe-route-core',
              type: 'line',
              source: 'routes',
              paint: {
                'line-color': ['case', ['==', ['get', 'mode'], 'DIRECT_VECTOR'], '#ef4444', '#059669'],
                'line-width': 4,
                'line-opacity': 1.0,
              },
            },
            // Drone Confined Patrol Search Grid inside Disaster Perimeter
            {
              id: 'drone-trajectory-casing',
              type: 'line',
              source: 'trajectory',
              paint: {
                'line-color': '#0369a1',
                'line-width': 4.5,
                'line-opacity': 0.6,
              },
            },
            {
              id: 'drone-trajectory-line',
              type: 'line',
              source: 'trajectory',
              paint: {
                'line-color': '#00f0ff',
                'line-width': 2.4,
                'line-opacity': 0.95,
                'line-dasharray': [3, 2],
              },
            },
            {
              id: 'drone-waypoint-dots',
              type: 'circle',
              source: 'droneWaypoints',
              paint: {
                'circle-color': '#00f0ff',
                'circle-radius': 3.5,
                'circle-stroke-width': 1.5,
                'circle-stroke-color': '#0b1329',
              },
            },
          ],
        }

        const centerLng = state.campusLocation ? state.campusLocation.longitude : MISSION_CENTER.longitude
        const centerLat = state.campusLocation ? state.campusLocation.latitude : MISSION_CENTER.latitude

        const map = new maplibregl.Map({
          container: container.current,
          style: fullStyle,
          center: [centerLng, centerLat],
          zoom: expanded ? 14.8 : 14.0,
          attributionControl: false,
        })

        mapRef.current = map
        map.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: true }), 'bottom-right')

        const initLayers = () => {
          if (overlaysInitialized.current) return
          overlaysInitialized.current = true
          map.resize()
          setMapReady(true)
        }

        map.on('style.load', initLayers)
        map.on('load', initLayers)
        map.on('idle', initLayers)
        if (map.isStyleLoaded()) initLayers()
      } catch (err) {
        if (!cancelled) setMapReady(false)
      }
    })()

    return () => {
      cancelled = true
      overlaysInitialized.current = false
      markers.current.forEach(m => m.remove())
      mapRef.current?.remove()
      mapRef.current = null
      setMapReady(false)
    }
  }, [expanded])

  // Update GeoJSON Sources and Markers
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const setData = (source: string, data: GeoCollection) =>
      (map.getSource(source) as maplibregl.GeoJSONSource | undefined)?.setData(data)

    if (mapReady && map.isStyleLoaded()) {
      setData('coverage', geo.coverage)
      setData('hazards', geo.hazardData)
      setData('disasterZone', geo.disasterZone)
      setData('droneWaypoints', geo.droneWaypoints)
      setData('routes', geo.route)
      setData('trajectory', geo.trajectory)
      setData('restricted', geo.restricted)
      setData('cameraFov', geo.cameraFov)
      setData('sensorLock', geo.sensorLock)
      setData('detectionRays', geo.detectionRays)
      setData('detectionFootprints', geo.detectionFootprints)
    }

    markers.current.forEach(m => m.remove())
    markers.current = []

    const addMarker = (
      kind: MarkerKind,
      item: Drone | Survivor | Hazard | RescueTeam,
      selected: boolean,
      focused: boolean,
      visible: boolean,
      onClick: () => void,
    ) => {
      if (!visible) return
      const element = document.createElement('div')
      element.className = 'maplibre-custom-marker-wrapper'
      element.innerHTML = markerSvg(kind, item, selected, focused)
      element.onclick = (e) => {
        e.stopPropagation()
        onClick()
      }
      const marker = new maplibregl.Marker({ element, anchor: 'center' })
        .setLngLat([item.longitude, item.latitude])
        .addTo(map)
      markers.current.push(marker)
    }

    drones.forEach(d => addMarker('drone', d, selectedDroneId === d.id, true, mapLayers.drones, () => selectDrone(d.id)))
    survivors.forEach(s => addMarker('survivor', s, selectedSurvivorId === s.id, true, mapLayers.survivors, () => selectSurvivor(s.id)))
    hazards.forEach(h => addMarker('hazard', h, selectedHazardId === h.id, true, mapLayers.hazards, () => selectHazard(h.id)))
    teams.forEach(t => addMarker('team', t, selectedTeamId === t.id, true, mapLayers.teams, () => selectTeam(t.id)))

    // Projected Real-Time UAV Detection Pins
    if (mapLayers.videoDetections) {
      projectedDetections.forEach(p => {
        const isSelected = selectedProjectedPin?.id === p.id
        const isLying = p.posture === 'LYING_DOWN'
        const isWaving = p.posture === 'CALLING_FOR_HELP'
        const isTrapped = p.posture === 'CROUCHING_TRAPPED'
        const element = document.createElement('div')
        element.className = 'maplibre-custom-marker-wrapper projected-pin-wrapper'
        element.innerHTML = `
          <div class="tactical-marker projected-uav-pin ${isSelected ? 'is-selected' : ''} ${isLying ? 'prone-hazard-pin' : isWaving ? 'waving-distress-pin' : ''}">
            <div class="projected-pin-radar ${isLying ? 'radar-red' : ''}"></div>
            <div class="projected-pin-core">
              <svg viewBox="0 0 24 24" class="pin-crosshair-svg">
                <circle cx="12" cy="12" r="8" fill="none" stroke="${isLying ? '#f43f5e' : isWaving ? '#f97316' : '#00f0ff'}" stroke-width="1.8"/>
                <line x1="12" y1="2" x2="12" y2="6" stroke="${isLying ? '#f43f5e' : isWaving ? '#f97316' : '#00f0ff'}" stroke-width="1.8"/>
                <line x1="12" y1="18" x2="12" y2="22" stroke="${isLying ? '#f43f5e' : isWaving ? '#f97316' : '#00f0ff'}" stroke-width="1.8"/>
                <line x1="2" y1="12" x2="6" y2="12" stroke="${isLying ? '#f43f5e' : isWaving ? '#f97316' : '#00f0ff'}" stroke-width="1.8"/>
                <line x1="18" y1="12" x2="22" y2="12" stroke="${isLying ? '#f43f5e' : isWaving ? '#f97316' : '#00f0ff'}" stroke-width="1.8"/>
                <circle cx="12" cy="9.5" r="2.2" fill="${isLying ? '#f43f5e' : isWaving ? '#f97316' : '#00f0ff'}"/>
                <path d="M8.5 15.5c0-1.8 1.6-3 3.5-3s3.5 1.2 3.5 3" fill="none" stroke="${isLying ? '#f43f5e' : isWaving ? '#f97316' : '#00f0ff'}" stroke-width="1.5"/>
              </svg>
            </div>
            <div class="projected-pin-pill">
              <span class="pin-id-tag">${p.id} · ${p.confidence}%</span>
              ${isLying ? '<span class="pin-pose-badge badge-prone">⚠️ PRONE</span>' : isWaving ? '<span class="pin-pose-badge badge-waving">🚨 WAVING</span>' : isTrapped ? '<span class="pin-pose-badge badge-trapped">TRAPPED</span>' : ''}
              <span class="pin-temp-tag">${p.tempC}°C</span>
            </div>
          </div>
        `
        element.onclick = (e) => {
          e.stopPropagation()
          setSelectedProjectedPin(p)
          if (p.id) {
            state.selectSurvivor(p.id)
          }
          map.flyTo({
            center: [p.lng, p.lat],
            zoom: Math.max(14.2, map.getZoom()),
            duration: 600,
          })
        }
        const marker = new maplibregl.Marker({ element, anchor: 'center' })
          .setLngLat([p.lng, p.lat])
          .addTo(map)
        markers.current.push(marker)
      })
    }

    // College Campus Ground Zero Center Marker
    if (state.campusLocation) {
      const campus = state.campusLocation
      const element = document.createElement('div')
      element.className = 'maplibre-custom-marker-wrapper campus-badge-marker-wrapper'
      element.innerHTML = `
        <div class="tactical-marker campus-ground-zero-marker" title="College Campus Theater: ${campus.name} (Click to configure)">
          <div class="campus-sonar-ring"></div>
          <div class="campus-core-crest">
            <svg viewBox="0 0 24 24" class="campus-crest-svg">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" fill="none" stroke="#00f0ff" stroke-width="2"/>
              <path d="M6 12v5c3 3 9 3 12 0v-5" fill="none" stroke="#00f0ff" stroke-width="2"/>
            </svg>
          </div>
          <div class="campus-pin-pill">
            <span class="campus-pill-title">COLLEGE CAMPUS · GROUND ZERO</span>
            <span class="campus-pill-name">${campus.name}</span>
            <span class="campus-pill-sector">${campus.notes || 'Kondampatti Post, Vadasithur via, Coimbatore - 641202, Tamil Nadu, India'}</span>
          </div>
        </div>
      `
      element.onclick = (e) => {
        e.stopPropagation()
        state.openCampusModal()
      }
      const marker = new maplibregl.Marker({ element, anchor: 'bottom' })
        .setLngLat([campus.longitude, campus.latitude])
        .addTo(map)
      markers.current.push(marker)
    }

    // Campus Recon / Perimeter Tactical Header Marker
    if (mapLayers.hazards) {
      const isSafeZone = state.hazards.length === 0
      const element = document.createElement('div')
      element.className = 'maplibre-custom-marker-wrapper disaster-badge-wrapper'
      element.innerHTML = isSafeZone ? `
        <div class="disaster-perimeter-badge safe-perimeter-zone" style="background: rgba(6, 78, 59, 0.9); border-color: rgba(52, 211, 153, 0.5);" title="Safe Campus Recon Zone: Sri Eshwar College of Engineering">
          <div class="badge-title-row">
            <span class="badge-warning-icon">🛡️</span>
            <strong class="badge-main-text" style="color: #6ee7b7;">SECE CAMPUS RECON ZONE</strong>
            <span class="badge-tag-red" style="background: rgba(16, 185, 129, 0.25); color: #34d399; border-color: rgba(16, 185, 129, 0.5);">ZERO HAZARDS REPORTED</span>
          </div>
          <span class="badge-sub-text" style="color: #a7f3d0;">SRI ESHWAR COLLEGE OF ENGG · KONDAMPATTI, COIMBATORE 641202 · ALL CLEAR</span>
        </div>
      ` : `
        <div class="disaster-perimeter-badge" title="Disaster Affected Zone (Confined UAV Search Patrol)">
          <div class="badge-title-row">
            <span class="badge-warning-icon">⚠️</span>
            <strong class="badge-main-text">DISASTER OPERATIONAL ZONE</strong>
            <span class="badge-tag-red">RESCUE TEAMS DEPLOYED</span>
          </div>
          <span class="badge-sub-text">ACTIVE THEATER PERIMETER · ALL TEAMS & UAV SWARM DEPLOYED WITHIN ZONE</span>
        </div>
      `
      element.onclick = (e) => {
        e.stopPropagation()
        map.fitBounds([
          [77.0535, 10.8205],
          [77.0670, 10.8320],
        ], { padding: 45, duration: 900 })
      }
      const marker = new maplibregl.Marker({ element, anchor: 'bottom' })
        .setLngLat([77.0602, 10.8318])
        .addTo(map)
      markers.current.push(marker)
    }

    const setVisibility = (layer: string, visible: boolean) => {
      if (map.getLayer(layer)) map.setLayoutProperty(layer, 'visibility', visible ? 'visible' : 'none')
    }

    if (map.isStyleLoaded()) {
      setVisibility('coverage-searched', mapLayers.coverage)
      setVisibility('coverage-active', mapLayers.coverage)
      setVisibility('disaster-zone-glow', mapLayers.hazards)
      setVisibility('disaster-zone-fill', mapLayers.hazards)
      setVisibility('disaster-zone-casing', mapLayers.hazards)
      setVisibility('disaster-zone-dash', mapLayers.hazards)
      setVisibility('hazard-fill', mapLayers.hazards)
      setVisibility('hazard-line', mapLayers.hazards)
      setVisibility('safe-route-casing', mapLayers.routes)
      setVisibility('safe-route-core', mapLayers.routes)
      setVisibility('drone-trajectory-casing', mapLayers.drones)
      setVisibility('drone-trajectory-line', mapLayers.drones)
      setVisibility('drone-waypoint-dots', mapLayers.drones)
      setVisibility('camera-fov-fill', mapLayers.drones)
      setVisibility('camera-fov-line', mapLayers.drones)
      setVisibility('sensor-lock-line', mapLayers.drones)
      setVisibility('detection-footprint-fill', mapLayers.videoDetections)
      setVisibility('detection-footprint-ring', mapLayers.videoDetections)
      setVisibility('detection-laser-rays', mapLayers.videoDetections)
    }
  }, [
    geo,
    mapLayers,
    mapReady,
    drones,
    survivors,
    hazards,
    teams,
    selectedDroneId,
    selectedSurvivorId,
    selectedHazardId,
    selectedTeamId,
    selectDrone,
    selectSurvivor,
    selectHazard,
    selectTeam,
    projectedDetections,
    selectedProjectedPin,
  ])

  // Update satellite vs street tile visibility smoothly when mapStyleMode changes
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    try {
      if (map.getLayer('satellite-layer')) {
        map.setLayoutProperty('satellite-layer', 'visibility', state.mapStyleMode === 'SATELLITE' ? 'visible' : 'none')
      }
      if (map.getLayer('street-layer')) {
        map.setLayoutProperty('street-layer', 'visibility', state.mapStyleMode === 'STREETS' ? 'visible' : 'none')
      }
    } catch (err) {
      console.warn('Could not update map style visibility:', err)
    }
  }, [state.mapStyleMode, mapReady])

  // Smoothly locate Drone D1 and track optical camera field of view
  const locateDrone = () => {
    const d1 = drones.find(d => d.id === 'D1') ?? drones[0]
    if (!d1 || !mapRef.current) return
    selectDrone(d1.id)
    mapRef.current.flyTo({
      center: [d1.longitude, d1.latitude],
      zoom: 15.2,
      pitch: 35,
      bearing: d1.heading,
      duration: 1200,
    })
  }

  // Auto-follow Drone D1 when followDrone is enabled
  useEffect(() => {
    if (state.followDrone && mapRef.current) {
      const d1 = drones[0]
      if (d1) {
        mapRef.current.panTo([d1.longitude, d1.latitude], { duration: 600 })
      }
    }
  }, [drones, state.followDrone])

  const centerMap = () => {
    const lng = state.campusLocation ? state.campusLocation.longitude : MISSION_CENTER.longitude
    const lat = state.campusLocation ? state.campusLocation.latitude : MISSION_CENTER.latitude
    mapRef.current?.flyTo({
      center: [lng, lat],
      zoom: expanded ? 15.2 : 14.2,
      duration: 800,
    })
  }

  const focusDisasterZone = () => {
    mapRef.current?.fitBounds([
      [77.0535, 10.8205],
      [77.0670, 10.8320],
    ], { padding: 45, duration: 1000 })
  }

  const followDrone = () => {
    selectDrone('D1')
    const drone = drones.find(d => d.id === 'D1')
    if (drone) {
      mapRef.current?.flyTo({
        center: [drone.longitude, drone.latitude],
        zoom: 13.8,
        duration: 800,
      })
    }
  }

  const runSearch = () => {
    const term = query.trim().toUpperCase()
    if (!term) return centerMap()

    const target =
      survivors.find(s => s.id === term || s.sector === term) ??
      hazards.find(h => h.id === term || h.sector === term) ??
      teams.find(t => t.id === term || t.name.toUpperCase().includes(term)) ??
      drones.find(d => d.id === term || d.name.toUpperCase().includes(term))

    if (!target) return centerMap()

    if ('confidence' in target && 'nearbyHazards' in target) selectSurvivor(target.id)
    else if ('severity' in target) selectHazard(target.id)
    else if ('capabilities' in target) selectTeam(target.id)
    else selectDrone(target.id)

    mapRef.current?.flyTo({ center: [target.longitude, target.latitude], zoom: 14.1, duration: 800 })
  }

  return (
    <div className={`tactical-map-panel ${expanded ? 'expanded' : ''}`}>
      {/* Tactical Map In-Map Header */}
      <div className="tactical-map-header">
        <div className="map-title-group">
          <div className="title-live-row">
            <span className="map-title-text">LIVE TACTICAL MAP</span>
            <span className="map-live-pill">
              <span className="live-dot-pulse" />
              LIVE
            </span>
          </div>
          <span className="map-subtitle-text">AUTONOMOUS SEARCH OPERATION</span>
        </div>

        {/* Search, Map Style and Action buttons */}
        <div className="map-header-actions">
          {/* Map Style Selector: Real Photorealistic Satellite vs Tactical Streets */}
          <div className="map-style-toggle-pill">
            <button
              type="button"
              className={`style-pill-btn ${state.mapStyleMode === 'SATELLITE' ? 'active' : ''}`}
              onClick={() => state.setMapStyleMode('SATELLITE')}
              title="Real photorealistic satellite earth imagery"
            >
              <Globe size={12} />
              <span>SATELLITE</span>
            </button>
            <button
              type="button"
              className={`style-pill-btn ${state.mapStyleMode === 'STREETS' ? 'active' : ''}`}
              onClick={() => state.setMapStyleMode('STREETS')}
              title="Tactical road and street map"
            >
              <Map size={12} />
              <span>STREETS</span>
            </button>
          </div>

          <div className="tactical-search-wrapper">
            <Search size={13} className="search-icon" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runSearch()}
              placeholder="Locate sector or asset (e.g. C3, S-03)"
              className="tactical-search-input"
            />
            {query && (
              <button type="button" onClick={runSearch} className="search-submit-btn">
                GO
              </button>
            )}
          </div>

          {/* Primary Action: Locate Drone D1 */}
          <button
            type="button"
            onClick={locateDrone}
            className="map-action-btn locate-primary-btn"
            title="Locate Drone D1 and track optical camera field of view"
          >
            <Crosshair size={13} />
            <span>LOCATE DRONE</span>
          </button>

          {/* College Campus Location Config */}
          <button
            type="button"
            onClick={state.openCampusModal}
            className="map-action-btn campus-header-action-btn"
            title="Configure College Campus coordinates & Ground Zero"
          >
            <GraduationCap size={13} className="text-cyan animate-pulse" />
            <span>CAMPUS: {state.campusLocation.name.length > 14 ? `${state.campusLocation.name.slice(0, 14)}…` : state.campusLocation.name}</span>
          </button>

          <button
            type="button"
            onClick={() => state.setFollowDrone(!state.followDrone)}
            className={`map-action-btn ${state.followDrone ? 'follow-active' : ''}`}
            title="Automatically track Drone D1 position"
          >
            <LocateFixed size={13} />
            <span>{state.followDrone ? 'TRACKING D1' : 'FOLLOW D1'}</span>
          </button>

          <button
            type="button"
            onClick={centerMap}
            className="map-action-btn"
            title="Center mission sector"
          >
            <Navigation size={13} />
            <span>SECTOR</span>
          </button>

          <button
            type="button"
            onClick={focusDisasterZone}
            className="map-action-btn hazard-zone-btn"
            title="Focus camera on demarcated Disaster Affected Zone"
          >
            <Flame size={13} />
            <span>DISASTER ZONE</span>
          </button>
        </div>
      </div>

      {/* Map Canvas and Interactive Overlays */}
      <div className="tactical-map-viewport">
        <div className="map-canvas-grid-overlay" />
        <div ref={container} className="maplibre-container" />

        {/* Floating Active Drone Locator Badge */}
        <div className="floating-drone-hud" onClick={locateDrone} title="Click to center Drone D1">
          <div className="locator-beacon-dot" />
          <div className="locator-info">
            <span className="locator-title">ACTIVE UAV: D1 (EAGLE ONE)</span>
            <span className="locator-coords">{drones[0]?.latitude.toFixed(4)}°N, {drones[0]?.longitude.toFixed(4)}°E</span>
          </div>
          <span className="locator-stat">ALT {Math.round(drones[0]?.altitude ?? 121)}m</span>
        </div>

        {/* Floating Layer Control */}
        <div className="floating-layer-anchor">
          <LayerControl />
        </div>

        {/* Floating Safe Rescue Route Card & Mission Triage Controller */}
        {/* Floating Safe Rescue Route Card & Mission Triage Controller */}
        {assignedTeam && activeSurvivor && mapLayers.routes && !routeCardDismissed && (
          routeCardCollapsed ? (
            /* Compact Floating Route Pill: Non-obstructive 30px bar that never hides the map */
            <div
              className="floating-route-pill-compact tactical-hud-card"
              onClick={() => setRouteCardCollapsed(false)}
              title="Click to expand team dispatch route and clearance corridor"
            >
              <div className="compact-pill-left">
                <span className="safe-route-pulse-dot" />
                <Shield size={12} className="compact-pill-shield" />
                <strong className="compact-pill-title">
                  {assignedTeam.name} → {activeSurvivor.id} (Sector {activeSurvivor.sector})
                </strong>
                <span className={`compact-team-tag status-pill-${assignedTeam.status.toLowerCase().replace(' ', '-')}`}>
                  {assignedTeam.status}
                </span>
              </div>

              <div className="compact-pill-metrics">
                <span className="compact-dist">
                  {routeCalculation ? `${routeCalculation.distanceKm.toFixed(2)} km` : assignedTeam.distance}
                </span>
                <span className="compact-sep">·</span>
                <span className="compact-eta">
                  ETA {routeCalculation ? `${routeCalculation.etaMinutes}m` : (assignedTeam.eta ?? '06:30')}
                </span>
                <span className="compact-sep">·</span>
                <span className={`compact-safe-status ${state.routeComparisonMode === 'DIRECT_VECTOR' ? 'direct' : 'safe'}`}>
                  {state.routeComparisonMode === 'DIRECT_VECTOR' ? 'DIRECT' : 'AI SAFE'}
                </span>
              </div>

              <div className="compact-pill-actions" onClick={e => e.stopPropagation()}>
                <button
                  type="button"
                  className="compact-expand-btn"
                  onClick={() => setRouteCardCollapsed(false)}
                  title="Expand full route controls"
                >
                  <ChevronUp size={12} />
                  <span>EXPAND</span>
                </button>
                <button
                  type="button"
                  className="compact-close-btn"
                  onClick={() => setRouteCardDismissed(true)}
                  title="Hide route pill"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          ) : (
            /* Full Tactical Route HUD Card with Minimize & Close Controls */
            <div className="floating-route-card tactical-hud-card">
              <div className="route-badge-row">
                <span className={`safe-route-tag ${state.routeComparisonMode === 'DIRECT_VECTOR' ? 'direct-risk-tag' : 'safe-corridor-tag'}`}>
                  <span className="safe-route-pulse-dot" />
                  {state.routeComparisonMode === 'DIRECT_VECTOR' ? 'DIRECT HAZARDOUS VECTOR' : 'AI SAFE CORRIDOR'}
                </span>

                <div className="route-header-right-tools">
                  {/* Interactive Corridor Mode Switch */}
                  <div className="route-mode-switch-pill">
                    <button
                      type="button"
                      onClick={() => state.setRouteComparisonMode('SAFE_CORRIDOR')}
                      className={`mode-pill-btn ${state.routeComparisonMode === 'SAFE_CORRIDOR' ? 'active-corridor' : ''}`}
                      title="Obstacle-free verified clearance corridor around active hazards"
                    >
                      <Shield size={11} />
                      <span>SAFE</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => state.setRouteComparisonMode('DIRECT_VECTOR')}
                      className={`mode-pill-btn ${state.routeComparisonMode === 'DIRECT_VECTOR' ? 'active-direct' : ''}`}
                      title="Direct line comparison (flags hazard collisions)"
                    >
                      <AlertTriangle size={11} />
                      <span>DIRECT</span>
                    </button>
                  </div>

                  {/* Minimize & Close buttons to prevent hiding map features */}
                  <div className="route-card-min-tools">
                    <button
                      type="button"
                      className="route-card-min-btn"
                      onClick={() => setRouteCardCollapsed(true)}
                      title="Minimize to non-obstructive bar"
                    >
                      <ChevronDown size={13} />
                    </button>
                    <button
                      type="button"
                      className="route-card-close-btn"
                      onClick={() => setRouteCardDismissed(true)}
                      title="Dismiss route window"
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="route-path-header">
                <strong className="route-path-text">
                  {assignedTeam.name} → {activeSurvivor.id} (Sector {activeSurvivor.sector})
                </strong>
                <span className={`route-team-status status-pill-${assignedTeam.status.toLowerCase().replace(' ', '-')}`}>
                  {assignedTeam.status}
                </span>
              </div>

              <div className="route-metrics-row">
                <span className="route-dist">
                  {routeCalculation ? `${routeCalculation.distanceKm.toFixed(2)} km` : assignedTeam.distance}
                </span>
                <span className="route-dot-sep">·</span>
                <span className="route-eta">
                  ETA {routeCalculation ? `${routeCalculation.etaMinutes}m` : (assignedTeam.eta ?? '06:30')}
                </span>
                <span className="route-dot-sep">·</span>
                <span className={`route-clearance ${state.routeComparisonMode === 'DIRECT_VECTOR' && routeCalculation?.hasHazardCollisions ? 'risk-collision' : 'risk-safe'}`}>
                  {state.routeComparisonMode === 'DIRECT_VECTOR'
                    ? `${routeCalculation?.collidingHazards.length ?? 0} HAZARDS IN PATH`
                    : `CLEARANCE: ${Math.round(routeCalculation?.clearanceMeters ?? 60)}m`}
                </span>
              </div>

              {state.routeComparisonMode === 'DIRECT_VECTOR' && routeCalculation?.hasHazardCollisions && (
                <div className="route-collision-alert-banner">
                  <AlertTriangle size={12} />
                  <span>DIRECT VECTOR PASSES THROUGH ACTIVE HAZARD BUFFER! AI SAFE DETOUR MANDATED.</span>
                </div>
              )}

              <div className="route-card-quick-actions">
                <button
                  type="button"
                  onClick={() => state.openDispatchModal(activeSurvivor.id)}
                  className="route-btn-action dispatch-btn"
                  title="Open Team Dispatch & Routing Console"
                >
                  <Send size={12} />
                  <span>DISPATCH TEAM</span>
                </button>

                {activeSurvivor.status !== 'RESCUED' ? (
                  <button
                    type="button"
                    onClick={() => state.markSurvivorStatus(activeSurvivor.id, 'RESCUED')}
                    className="route-btn-action rescue-btn"
                    title="Mark survivor as successfully extracted"
                  >
                    <CheckCircle2 size={12} />
                    <span>MARK RESCUED</span>
                  </button>
                ) : (
                  <span className="route-rescued-badge">
                    <CheckCircle2 size={12} />
                    RESCUED
                  </span>
                )}
              </div>
            </div>
          )
        )}

        {/* Restore button if route overlay dismissed */}
        {assignedTeam && activeSurvivor && mapLayers.routes && routeCardDismissed && (
          <button
            type="button"
            className="restore-route-btn"
            onClick={() => { setRouteCardDismissed(false); setRouteCardCollapsed(false) }}
            title="Restore Team Alpha safe route HUD"
          >
            <Shield size={12} />
            <span>SHOW ROUTE ({assignedTeam.name})</span>
          </button>
        )}

        {/* Floating UAV Projected Detection Target Card */}
        {selectedProjectedPin && (
          <div className="floating-projected-card tactical-hud-card">
            <div className="projected-card-header">
              <div className="projected-header-chip">
                <span className="live-dot-pulse" />
                <span>QUALCOMM® AI HUB · REAL-TIME UAV PIN</span>
              </div>
              <button
                type="button"
                className="projected-close-btn"
                onClick={() => setSelectedProjectedPin(null)}
                title="Dismiss"
              >
                ×
              </button>
            </div>

            <div className="projected-title-row">
              <strong>SURVIVOR TARGET #{selectedProjectedPin.index + 1}</strong>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {selectedProjectedPin.posture && (
                  <span className={`projected-pose-pill ${selectedProjectedPin.posture === 'LYING_DOWN' ? 'crit' : selectedProjectedPin.posture === 'CALLING_FOR_HELP' ? 'distress' : ''}`}>
                    {selectedProjectedPin.posture.replace('_', ' ')}
                  </span>
                )}
                <span className="projected-conf-pill">{selectedProjectedPin.confidence}% CONF</span>
              </div>
            </div>

            <div className="projected-specs-grid">
              <div className="projected-spec-col">
                <small>PROJECTED GPS COORDINATES</small>
                <span>{selectedProjectedPin.lat.toFixed(5)}°N, {selectedProjectedPin.lng.toFixed(5)}°E</span>
              </div>
              <div className="projected-spec-col">
                <small>THERMAL RADIOMETRIC TEMP</small>
                <strong className="text-amber">{selectedProjectedPin.tempC}°C (Human Core)</strong>
              </div>
              <div className="projected-spec-col">
                <small>POSE & SENSOR INTELLIGENCE</small>
                <span className="text-cyan">
                  {selectedProjectedPin.posture === 'LYING_DOWN'
                    ? '⚠️ PRONE CASUALTY · UNCONSCIOUS RISK'
                    : selectedProjectedPin.posture === 'CALLING_FOR_HELP'
                      ? '🚨 ACTIVE DISTRESS · WAVING GESTURE'
                      : 'Qualcomm YOLOv8-Pose'}
                </span>
              </div>
              <div className="projected-spec-col">
                <small>RECOMMENDED ACTION</small>
                <span className={selectedProjectedPin.posture === 'LYING_DOWN' ? 'text-rose-400' : 'text-emerald'}>
                  {selectedProjectedPin.posture === 'LYING_DOWN'
                    ? 'Urgent AED & Paramedic Extraction'
                    : 'Safe-Corridor Ground Dispatch'}
                </span>
              </div>
            </div>

            <div className="projected-actions-row">
              <button
                type="button"
                className="projected-action-btn dispatch-action"
                onClick={() => {
                  state.openDispatchModal(activeSurvivor.id)
                }}
              >
                <Send size={12} />
                <span>DISPATCH RESCUE TEAM</span>
              </button>
            </div>
          </div>
        )}

        {/* Map Legend */}
        <MapLegend />
      </div>
    </div>
  )
}
