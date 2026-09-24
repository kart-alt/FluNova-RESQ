import { create } from 'zustand'
import {
  alerts as initialAlerts,
  drones as initialDrones,
  hazards as initialHazards,
  missionEvents as initialEvents,
  rescueTeams as initialTeams,
  survivors as initialSurvivors,
} from '../data/missionData'
import type {
  Alert,
  CampusLocation,
  Drone,
  ExpandedFeedType,
  Hazard,
  MapLayers,
  MapStyleMode,
  Mission,
  MissionEvent,
  RescueTeam,
  RouteComparisonMode,
  Survivor,
  SurvivorStatus,
} from '../types'
import { generateSafeRescueRoute } from '../utils/safePathfinding'
import type { DetectedObject } from '../utils/qualcommOnnxDetector'
import { globalByteTracker } from '../utils/ByteTracker'

export const DEFAULT_CAMPUS_LOCATION: CampusLocation = {
  name: 'Sri Eshwar College of Engineering (Coimbatore)',
  latitude: 10.8266,
  longitude: 77.0602,
  sector: 'SECE MAIN CAMPUS SECTOR',
  radius: 650,
  notes: 'Kondampatti Post, Vadasithur via, Coimbatore - 641202, Tamil Nadu, India',
}

export const CAMPUS_PRESETS: CampusLocation[] = [
  {
    name: 'Sri Eshwar College of Engineering (Coimbatore)',
    latitude: 10.8266,
    longitude: 77.0602,
    sector: 'SECE MAIN CAMPUS SECTOR',
    radius: 650,
    notes: 'Kondampatti Post, Vadasithur via, Coimbatore - 641202, Tamil Nadu, India',
  },
  {
    name: 'SRM Institute of Science & Technology (KTR)',
    latitude: 12.8231,
    longitude: 80.0442,
    sector: 'MAIN CAMPUS TECH PARK',
    radius: 750,
    notes: 'Kattankulathur Campus Ground & Quadrangle',
  },
  {
    name: 'BMS College of Engineering (BMSCE)',
    latitude: 12.9416,
    longitude: 77.5658,
    sector: 'CAMPUS CORRIDOR',
    radius: 500,
    notes: 'Basavanagudi Campus Ground',
  },
  {
    name: 'RV College of Engineering (RVCE)',
    latitude: 12.9237,
    longitude: 77.4987,
    sector: 'ENGINEERING QUADRANGLE',
    radius: 600,
    notes: 'Mysore Road Campus Ground',
  },
  {
    name: 'IIT Madras (IITM Research Park)',
    latitude: 12.9915,
    longitude: 80.2337,
    sector: 'CAMPUS STADIUM SECTOR',
    radius: 900,
    notes: 'Central Campus Aerial Recon Grid',
  },
  {
    name: 'Anna University (CEG Campus)',
    latitude: 13.0109,
    longitude: 80.2355,
    sector: 'MAIN ACADEMIC BLOCK',
    radius: 700,
    notes: 'Guindy Campus Disaster Simulation',
  },
  {
    name: 'PES University (RR Campus)',
    latitude: 12.9352,
    longitude: 77.5360,
    sector: 'ACADEMIC PLAZA',
    radius: 550,
    notes: 'Outer Ring Road Ground Recon',
  },
]

const defaultLayers: MapLayers = {
  drones: true,
  survivors: true,
  hazards: true,
  teams: true,
  coverage: true,
  routes: true,
  terrain: false,
  satellite: true,
  grid: true,
  restricted: true,
  videoDetections: true,
}

// 2538 seconds = 42 minutes, 18 seconds (00:42:18)
const INITIAL_ELAPSED = 2538

const initialMission: Mission = {
  id: '042',
  codeName: 'OPERATION RESQ-SECE',
  location: 'SRI ESHWAR COLLEGE OF ENGG (COIMBATORE)',
  phase: 'ROUTE PLANNING',
  coverage: 68,
  startTime: '08:00:00',
  currentSector: 'SECE MAIN CAMPUS SECTOR',
  nextTarget: 'ZONE C4',
  elapsedSeconds: INITIAL_ELAPSED,
  demoMode: true,
  isPlaying: true,
  speed: 1,
  weather: 'PARTLY CLOUDY',
  temperature: '28°C',
  linkStatus: 'LINK STABLE',
}

export type CommandStore = {
  drones: Drone[]
  survivors: Survivor[]
  hazards: Hazard[]
  teams: RescueTeam[]
  alerts: Alert[]
  mission: Mission
  mapLayers: MapLayers
  expandedFeed: ExpandedFeedType
  uploadedVideoUrl: string | null
  uploadedVideoName: string | null
  mapStyleMode: MapStyleMode
  videoPlaying: boolean
  followDrone: boolean
  selectedDroneId?: string
  selectedSurvivorId?: string
  selectedHazardId?: string
  selectedTeamId?: string
  events: MissionEvent[]
  routeComparisonMode: RouteComparisonMode
  dispatchModalOpen: boolean
  dispatchSurvivorId?: string

  // Campus Location State
  campusLocation: CampusLocation
  campusModalOpen: boolean
  openCampusModal: () => void
  closeCampusModal: () => void
  setCampusLocation: (loc: Partial<CampusLocation>) => void
  syncVideoDetectionsToStore: (detections: DetectedObject[]) => void
  clearHazards: () => void
  setHazards: (hazards: Hazard[]) => void
  clearSurvivors: () => void
  setSurvivors: (survivors: Survivor[]) => void
  resetToSafeCampus: () => void
  
  // Qualcomm AI Hub Detection Engine State
  activeDetections: DetectedObject[]
  onnxModelName: string
  onnxConfidenceThreshold: number
  onnxInferenceTimeMs: number
  onnxFps: number
  modelManagerOpen: boolean

  setActiveDetections: (detections: DetectedObject[]) => void
  setOnnxConfidenceThreshold: (thresh: number) => void
  setOnnxMetrics: (metrics: { inferenceTimeMs: number; fps: number; modelName?: string }) => void
  openModelManager: () => void
  closeModelManager: () => void

  openDispatchModal: (survivorId: string) => void
  closeDispatchModal: () => void
  setRouteComparisonMode: (mode: RouteComparisonMode) => void
  dispatchTeamToSurvivor: (teamId: string, survivorId: string) => void
  markSurvivorStatus: (survivorId: string, status: SurvivorStatus) => void
  
  selectDrone: (id: string) => void
  updateDrone: (id: string, updates: Partial<Drone>) => void
  selectSurvivor: (id?: string) => void
  selectHazard: (id?: string) => void
  selectTeam: (id?: string) => void
  toggleLayer: (layer: keyof MapLayers) => void
  setExpandedFeed: (feed: ExpandedFeedType) => void
  acknowledgeAlert: (id: string) => void
  setUploadedVideo: (url: string | null, name?: string | null) => void
  setMapStyleMode: (mode: MapStyleMode) => void
  setVideoPlaying: (playing: boolean) => void
  setFollowDrone: (follow: boolean) => void
  
  setPlaying: (isPlaying: boolean) => void
  setSpeed: (speed: Mission['speed']) => void
  setDemoMode: (enabled: boolean) => void
  resetDemo: () => void
  tick: () => void
}

const phaseAt = (elapsed: number): Mission['phase'] => {
  const mod = elapsed % 240
  if (mod < 20) return 'TAKEOFF'
  if (mod < 70) return 'AUTONOMOUS SEARCH'
  if (mod < 110) return 'SURVIVOR DETECTED'
  if (mod < 140) return 'VERIFYING'
  if (mod < 170) return 'PRIORITIZING'
  if (mod < 210) return 'ROUTE PLANNING'
  return 'RESCUE IN PROGRESS'
}

export const formatMissionTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export const DEFAULT_VIDEO_URL = '/mipi_2_20260917143157.mp4'
export const DEFAULT_VIDEO_NAME = 'mipi_2_20260917143157.mp4'

export const useCommandStore = create<CommandStore>((set, get) => ({
  drones: initialDrones,
  survivors: initialSurvivors,
  hazards: initialHazards,
  teams: initialTeams,
  alerts: initialAlerts,
  mission: initialMission,
  mapLayers: defaultLayers,
  expandedFeed: null,
  uploadedVideoUrl: DEFAULT_VIDEO_URL,
  uploadedVideoName: DEFAULT_VIDEO_NAME,
  mapStyleMode: 'SATELLITE',
  videoPlaying: true,
  followDrone: false,
  selectedSurvivorId: 'S-03',
  selectedTeamId: 'ALPHA',
  events: initialEvents,
  routeComparisonMode: 'SAFE_CORRIDOR',
  dispatchModalOpen: false,
  dispatchSurvivorId: undefined,

  // Campus Location State
  campusLocation: DEFAULT_CAMPUS_LOCATION,
  campusModalOpen: false,
  openCampusModal: () => set({ campusModalOpen: true }),
  closeCampusModal: () => set({ campusModalOpen: false }),

  setCampusLocation: (loc: Partial<CampusLocation>) => {
    const state = get()
    const updatedCampus: CampusLocation = {
      ...state.campusLocation,
      ...loc,
    }
    const lat = updatedCampus.latitude
    const lng = updatedCampus.longitude

    // Shift drones to survey the college campus
    const updatedDrones: Drone[] = state.drones.map((d, idx) => {
      if (idx === 0) {
        return {
          ...d,
          latitude: lat + 0.0019,
          longitude: lng - 0.0008,
          altitude: 120,
          heading: 135,
        }
      } else if (idx === 1) {
        return {
          ...d,
          latitude: lat - 0.0022,
          longitude: lng + 0.0020,
          altitude: 105,
        }
      } else {
        return {
          ...d,
          latitude: lat - 0.0035,
          longitude: lng - 0.0025,
          altitude: 85,
        }
      }
    })

    // Shift ground teams to staging perimeter around campus
    const updatedTeams: RescueTeam[] = state.teams.map((t) => {
      if (t.id === 'ALPHA') {
        return {
          ...t,
          latitude: lat - 0.0024,
          longitude: lng - 0.0020,
          distance: '1.2 km',
          eta: '04:15',
        }
      } else if (t.id === 'BRAVO') {
        return {
          ...t,
          latitude: lat + 0.0032,
          longitude: lng + 0.0025,
          distance: '2.4 km',
          eta: '07:30',
        }
      }
      return t
    })

    const newEvent: MissionEvent = {
      time: formatMissionTime(state.mission.elapsedSeconds),
      seconds: Math.max(0, state.mission.elapsedSeconds - INITIAL_ELAPSED),
      title: `Theater Centered: ${updatedCampus.name}`,
      description: `Tactical operational grid anchored at ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E. Drone D1 recon patrol re-routed.`,
      severity: 'INFO',
      icon: 'route',
    }

    set({
      campusLocation: updatedCampus,
      campusModalOpen: false,
      mission: {
        ...state.mission,
        location: updatedCampus.name.toUpperCase(),
      },
      drones: updatedDrones,
      teams: updatedTeams,
      events: [newEvent, ...state.events],
    })
  },

  clearHazards: () => set({ hazards: [] }),
  setHazards: (hazards: Hazard[]) => set({ hazards }),
  clearSurvivors: () => {
    globalByteTracker.reset()
    set({ survivors: [] })
  },
  setSurvivors: (survivors: Survivor[]) => set({ survivors }),
  resetToSafeCampus: () => {
    globalByteTracker.reset()
    set({
      hazards: [],
      survivors: initialSurvivors,
      alerts: initialAlerts,
    })
  },

  syncVideoDetectionsToStore: (detections: DetectedObject[]) => {
    if (!detections || detections.length === 0) return
    const state = get()
    const campus = state.campusLocation

    // Pass through ByteTrack to ensure 1 persistent, consistent ID per person across all video frames
    const trackedDetections = globalByteTracker.update(detections)

    let updatedSurvivors = [...state.survivors]
    const newEvents: MissionEvent[] = []

    trackedDetections.forEach((det, idx) => {
      const isPerson = det.isPerson || det.classId === 0 || det.classId === 1 ||
        det.label?.toLowerCase().includes('survivor') ||
        det.label?.toLowerCase().includes('person') ||
        det.label?.toLowerCase().includes('pedestrian')
      if (!isPerson) return

      // Use consistent ByteTrack unique survivor ID (e.g. S-01, S-02)
      const survivorId = det.id.startsWith('S-') ? det.id : (det.trackId ? `S-${String(det.trackId).padStart(2, '0')}` : `S-${String(idx + 1).padStart(2, '0')}`)

      // Georeference from video screen normalized coords onto Sri Eshwar College of Engineering grounds
      const u = (det.x + det.w / 2) / 100 - 0.5
      const v = Math.min(1.0, Math.max(0.0, (det.y + det.h) / 100))
      const lat = Number((campus.latitude + (0.5 - v) * 0.0028).toFixed(6))
      const lng = Number((campus.longitude + u * 0.0036).toFixed(6))

      const isLying = det.posture === 'LYING_DOWN'
      const isWaving = det.posture === 'CALLING_FOR_HELP'
      const isCrouching = det.posture === 'CROUCHING_TRAPPED'

      const postureMap: Record<string, 'LYING' | 'MOVING' | 'SEATED' | 'WAVING_HELP' | 'CROUCHING' | 'UNRESPONSIVE'> = {
        LYING_DOWN: 'LYING',
        CALLING_FOR_HELP: 'WAVING_HELP',
        CROUCHING_TRAPPED: 'CROUCHING',
        STANDING: 'MOVING',
      }
      const observedPosture = postureMap[det.posture || 'STANDING'] || 'MOVING'

      const status: SurvivorStatus = isLying
        ? 'CRITICAL'
        : (isWaving || isCrouching)
          ? 'HIGH PRIORITY'
          : 'VERIFIED'

      const priority = isLying ? 98 : isWaving ? 89 : isCrouching ? 84 : 62

      const survivorRecord: Survivor = {
        id: survivorId,
        latitude: lat,
        longitude: lng,
        confidence: det.confidence,
        thermalConfidence: Math.min(99, det.confidence + 2),
        fusedConfidence: Math.min(99, det.confidence + (isLying ? 5 : 2)),
        priority,
        status,
        observedPosture,
        detectedAt: formatMissionTime(state.mission.elapsedSeconds),
        assignedTeamId: isLying ? 'ALPHA' : undefined,
        nearbyHazards: [], // Zero hazards in user's college location
        sector: `${campus.sector} [${survivorId}]`,
        poseData: {
          posture: det.posture || 'STANDING',
          isDistress: det.isDistress ?? false,
          hazard: det.hazard,
          keypoints: det.keypoints,
          skeletonLines: det.skeletonLines,
        },
        vitals: {
          heartRate: isLying ? 122 : isWaving ? 104 : 84,
          heartRateStatus: isLying ? 'TACHYCARDIA' : 'NORMAL',
          respirationRate: isLying ? 26 : isWaving ? 22 : 18,
          respirationStatus: isLying ? 'TACHYPNEA' : 'NORMAL',
          coreTempEst: det.thermalSignature?.tempC ?? (isLying ? 35.6 : 36.8),
          extremityTemp: isLying ? 32.1 : 34.8,
          hypothermiaRisk: isLying ? 'MILD' : 'NONE',
          hrv: isLying ? 26 : 48,
          triageTag: isLying ? 'RED_IMMEDIATE' : isWaving ? 'YELLOW_DELAYED' : 'GREEN_MINOR',
          consciousness: isLying ? 'RESPONSIVE_TO_PAIN' : 'ALERT',
        },
        acoustic: {
          detected: isWaving,
          confidence: isWaving ? 92 : 40,
          classification: isWaving ? 'VOCAL_DISTRESS' : 'NONE',
          peakFrequency: 1420,
          soundLevelDb: isWaving ? 66.5 : 44.0,
          snrDb: isWaving ? 12.4 : 3.0,
          dspNoiseReductionDb: -38,
          cadenceDescription: isWaving ? 'Waving gestures accompanied by vocal distress call' : 'Nominal acoustic pattern',
          audioSnippetAvailable: isWaving,
        },
      }

      const existingIndex = updatedSurvivors.findIndex(s => s.id === survivorId)
      if (existingIndex >= 0) {
        // Smoothly update existing survivor record in-place (no duplicate IDs!)
        updatedSurvivors[existingIndex] = {
          ...updatedSurvivors[existingIndex],
          ...survivorRecord,
          assignedTeamId: updatedSurvivors[existingIndex].assignedTeamId ?? survivorRecord.assignedTeamId,
        }
      } else {
        // Register new ByteTrack survivor
        updatedSurvivors = [survivorRecord, ...updatedSurvivors]
        newEvents.push({
          time: formatMissionTime(state.mission.elapsedSeconds),
          seconds: Math.max(0, state.mission.elapsedSeconds - INITIAL_ELAPSED),
          title: `Campus Survivor ${survivorId} Sensed`,
          description: `ByteTrack verified individual ${survivorId} (${observedPosture}) at ${campus.name}. Fused confidence ${survivorRecord.fusedConfidence}%.`,
          severity: isLying ? 'CRITICAL' : 'HIGH',
          icon: 'survivor',
        })
      }
    })

    set({
      survivors: updatedSurvivors,
      events: [...newEvents, ...state.events],
    })
  },

  // Qualcomm AI Hub Detection Engine State
  activeDetections: [],
  onnxModelName: 'Qualcomm AI Hub YOLO26-Pose (Person & Pose)',
  onnxConfidenceThreshold: 0.15,
  onnxInferenceTimeMs: 24,
  onnxFps: 30,
  modelManagerOpen: false,

  setActiveDetections: (detections: DetectedObject[]) => set({ activeDetections: detections }),
  setOnnxConfidenceThreshold: (thresh: number) => set({ onnxConfidenceThreshold: thresh }),
  setOnnxMetrics: (metrics: { inferenceTimeMs: number; fps: number; modelName?: string }) => set(state => ({
    onnxInferenceTimeMs: metrics.inferenceTimeMs,
    onnxFps: metrics.fps,
    onnxModelName: metrics.modelName ?? state.onnxModelName,
  })),
  openModelManager: () => set({ modelManagerOpen: true }),
  closeModelManager: () => set({ modelManagerOpen: false }),

  openDispatchModal: (survivorId: string) => set({
    dispatchModalOpen: true,
    dispatchSurvivorId: survivorId,
    selectedSurvivorId: survivorId,
  }),

  closeDispatchModal: () => set({ dispatchModalOpen: false }),

  setRouteComparisonMode: (mode: RouteComparisonMode) => set({ routeComparisonMode: mode }),

  dispatchTeamToSurvivor: (teamId: string, survivorId: string) => {
    const state = get()
    const survivor = state.survivors.find(s => s.id === survivorId)
    const team = state.teams.find(t => t.id === teamId)
    if (!survivor || !team) return

    // Calculate dynamic safe route
    const routeResult = generateSafeRescueRoute(team, survivor, state.hazards)

    const updatedTeams = state.teams.map(t => {
      if (t.id === teamId) {
        return {
          ...t,
          status: 'EN ROUTE' as const,
          assignedSurvivorId: survivorId,
          distance: `${routeResult.distanceKm} km`,
          eta: routeResult.etaString,
        }
      }
      return t
    })

    const updatedSurvivors = state.survivors.map(s => {
      if (s.id === survivorId) {
        return {
          ...s,
          assignedTeamId: teamId,
          status: (s.status === 'CRITICAL' ? 'CRITICAL' : 'VERIFIED') as SurvivorStatus,
        }
      }
      return s
    })

    const newEvent: MissionEvent = {
      time: formatMissionTime(state.mission.elapsedSeconds),
      seconds: Math.max(0, state.mission.elapsedSeconds - INITIAL_ELAPSED),
      title: `${team.name} Dispatched → ${survivor.id}`,
      description: `Safe rescue corridor engaged avoiding ${routeResult.collidingHazards.length} hazards. Distance ${routeResult.distanceKm}km, ETA ${routeResult.etaString}.`,
      severity: 'INFO',
      icon: 'route',
    }

    set({
      teams: updatedTeams,
      survivors: updatedSurvivors,
      selectedSurvivorId: survivorId,
      selectedTeamId: teamId,
      dispatchModalOpen: false,
      events: [newEvent, ...state.events],
      mission: {
        ...state.mission,
        phase: 'RESCUE IN PROGRESS',
      },
    })
  },

  markSurvivorStatus: (survivorId: string, status: SurvivorStatus) => {
    const state = get()
    const survivor = state.survivors.find(s => s.id === survivorId)
    if (!survivor) return

    const updatedSurvivors = state.survivors.map(s => {
      if (s.id === survivorId) {
        return {
          ...s,
          status,
          priority: status === 'RESCUED' ? 10 : s.priority,
        }
      }
      return s
    })

    // If rescued, release the assigned ground team
    let updatedTeams = state.teams
    if (status === 'RESCUED' && survivor.assignedTeamId) {
      updatedTeams = state.teams.map(t => {
        if (t.id === survivor.assignedTeamId) {
          return {
            ...t,
            status: 'AVAILABLE' as const,
            assignedSurvivorId: undefined,
            eta: undefined,
          }
        }
        return t
      })
    }

    const newEvent: MissionEvent = {
      time: formatMissionTime(state.mission.elapsedSeconds),
      seconds: Math.max(0, state.mission.elapsedSeconds - INITIAL_ELAPSED),
      title: `Survivor ${survivorId} marked ${status}`,
      description:
        status === 'RESCUED'
          ? `Patient evacuated from Sector ${survivor.sector}. Ground team ${survivor.assignedTeamId ?? 'ALPHA'} returned to ready pool.`
          : `Field observation confirmed by tactical response supervisor.`,
      severity: status === 'RESCUED' ? 'INFO' : 'HIGH',
      icon: status === 'RESCUED' ? 'rescue' : 'survivor',
    }

    set({
      survivors: updatedSurvivors,
      teams: updatedTeams,
      events: [newEvent, ...state.events],
    })
  },

  selectDrone: (id: string) => set({
    selectedDroneId: id,
    selectedSurvivorId: undefined,
    selectedHazardId: undefined,
    selectedTeamId: undefined,
  }),

  updateDrone: (id: string, updates: Partial<Drone>) => set(state => ({
    drones: state.drones.map(drone => drone.id === id ? { ...drone, ...updates } : drone),
  })),

  selectSurvivor: (id?: string) => set(state => ({
    selectedDroneId: undefined,
    selectedSurvivorId: id,
    selectedHazardId: undefined,
    selectedTeamId: id ? state.survivors.find(survivor => survivor.id === id)?.assignedTeamId : undefined,
  })),

  selectHazard: (id?: string) => set({
    selectedDroneId: undefined,
    selectedHazardId: id,
    selectedSurvivorId: undefined,
    selectedTeamId: undefined,
  }),

  selectTeam: (id?: string) => set(state => ({
    selectedDroneId: undefined,
    selectedTeamId: id,
    selectedSurvivorId: state.teams.find(team => team.id === id)?.assignedSurvivorId,
    selectedHazardId: undefined,
  })),

  toggleLayer: (layer: keyof MapLayers) => set(state => ({
    mapLayers: { ...state.mapLayers, [layer]: !state.mapLayers[layer] },
  })),

  setExpandedFeed: (feed: ExpandedFeedType) => set({ expandedFeed: feed }),

  setUploadedVideo: (url: string | null, name?: string | null) => set({
    uploadedVideoUrl: url,
    uploadedVideoName: name ?? (url ? 'Uploaded Drone Video' : null),
  }),

  setMapStyleMode: (mode: MapStyleMode) => set(state => ({
    mapStyleMode: mode,
    mapLayers: { ...state.mapLayers, satellite: mode === 'SATELLITE' },
  })),

  setVideoPlaying: (playing: boolean) => set({ videoPlaying: playing }),

  setFollowDrone: (follow: boolean) => set({ followDrone: follow }),

  acknowledgeAlert: (id: string) => set(state => ({
    alerts: state.alerts.map(alert => alert.id === id ? { ...alert, status: 'ACKNOWLEDGED' } : alert),
  })),

  setPlaying: (isPlaying: boolean) => set(state => ({
    mission: { ...state.mission, isPlaying },
  })),

  setSpeed: (speed: Mission['speed']) => set(state => ({
    mission: { ...state.mission, speed },
  })),

  setDemoMode: (demoMode: boolean) => set(state => ({
    mission: { ...state.mission, demoMode, isPlaying: demoMode ? true : state.mission.isPlaying },
  })),

  resetDemo: () => set(state => ({
    mission: {
      ...state.mission,
      coverage: 68,
      elapsedSeconds: INITIAL_ELAPSED,
      phase: 'ROUTE PLANNING',
      isPlaying: true,
      demoMode: true,
    },
    selectedSurvivorId: 'S-03',
    selectedHazardId: undefined,
    selectedTeamId: 'ALPHA',
    drones: initialDrones,
    alerts: initialAlerts,
  })),

  tick: () => {
    const state = get()
    if (!state.mission.isPlaying) return

    const elapsedSeconds = state.mission.elapsedSeconds + state.mission.speed
    const step = elapsedSeconds - INITIAL_ELAPSED

    // Smooth movement path
    const angle = (step * 0.05) % (2 * Math.PI)
    const latOffset = Math.sin(angle) * 0.0018
    const lngOffset = Math.cos(angle * 0.7) * 0.0022
    const currentHeading = Math.round((127 + Math.sin(angle) * 24 + 360) % 360)
    const currentAlt = Math.round((120 + Math.sin(step * 0.2) * 1.5) * 10) / 10
    const currentSpeed = Math.round((8.4 + Math.sin(step * 0.3) * 0.4) * 10) / 10
    const currentBattery = Math.max(22, Math.round((72 - (step * 0.015)) * 10) / 10)

    // Odometry updates
    const odoX = Math.round((12.4 + Math.sin(angle) * 1.2) * 10) / 10
    const odoY = Math.round((-4.8 + Math.cos(angle) * 0.9) * 10) / 10
    const odoZ = Math.round((118.7 + Math.sin(step * 0.15) * 1.8) * 10) / 10
    const odoVx = Math.round((2.1 + Math.cos(angle) * 0.3) * 10) / 10
    const odoVy = Math.round((0.4 + Math.sin(angle) * 0.2) * 10) / 10

    const updatedDrones = state.drones.map((drone, idx) => {
      if (idx === 0) {
        return {
          ...drone,
          latitude: initialDrones[0].latitude + latOffset,
          longitude: initialDrones[0].longitude + lngOffset,
          heading: currentHeading,
          altitude: currentAlt,
          speed: currentSpeed,
          battery: currentBattery,
          signal: 94,
          odometry: {
            x: odoX,
            y: odoY,
            z: odoZ,
            vx: odoVx,
            vy: odoVy,
            vz: 0.0,
            heading: currentHeading,
            confidence: 99.4,
          },
        }
      }
      return drone
    })

    // ETA countdown for Team Alpha
    const baseEtaSeconds = Math.max(30, 390 - Math.floor(step * 0.5))
    const etaMinutes = Math.floor(baseEtaSeconds / 60)
    const etaSecs = baseEtaSeconds % 60
    const etaString = `${String(etaMinutes).padStart(2, '0')}:${String(etaSecs).padStart(2, '0')}`

    const updatedTeams = state.teams.map(team => {
      if (team.id === 'ALPHA') {
        return {
          ...team,
          eta: etaString,
          distance: `${(Math.max(0.4, 2.4 - (step * 0.003))).toFixed(1)} km`,
        }
      }
      return team
    })

    // Coverage updates slightly
    const coverage = Math.min(94, Math.round((68 + (step * 0.02)) * 10) / 10)

    set({
      drones: updatedDrones,
      teams: updatedTeams,
      mission: {
        ...state.mission,
        elapsedSeconds,
        coverage,
        phase: phaseAt(elapsedSeconds),
      },
    })
  },
}))
