export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type SurvivorStatus = 'POSSIBLE' | 'VERIFIED' | 'HIGH PRIORITY' | 'CRITICAL' | 'RESCUED'
export type DroneStatus = 'SEARCHING' | 'RETURNING' | 'HOLDING' | 'EMERGENCY' | 'OFFLINE'
export type TeamStatus = 'AVAILABLE' | 'EN ROUTE' | 'BUSY' | 'OFFLINE'
export type MissionPhase = 'INITIALIZING' | 'TAKEOFF' | 'AUTONOMOUS SEARCH' | 'SURVIVOR DETECTED' | 'VERIFYING' | 'PRIORITIZING' | 'ROUTE PLANNING' | 'RESCUE IN PROGRESS' | 'MISSION COMPLETE'

export interface Coordinates { latitude: number; longitude: number }

export interface OdometryData {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  heading: number
  confidence: number
}

export interface Drone extends Coordinates {
  id: string
  name: string
  status: DroneStatus
  altitude: number
  speed: number
  heading: number
  battery: number
  signal: number
  gpsStatus: 'FIXED' | 'SEARCHING'
  aiStatus: 'ACTIVE' | 'STANDBY'
  odometry?: OdometryData
}

export type StartTriageTag = 'RED_IMMEDIATE' | 'YELLOW_DELAYED' | 'GREEN_MINOR' | 'BLACK_EXPECTANT'

export interface SurvivorVitals {
  heartRate: number // BPM
  heartRateStatus: 'NORMAL' | 'TACHYCARDIA' | 'BRADYCARDIA' | 'CRITICAL'
  respirationRate: number // Breaths / min
  respirationStatus: 'NORMAL' | 'TACHYPNEA' | 'SHALLOW' | 'DEPRESSED'
  coreTempEst: number // °C
  extremityTemp: number // °C
  hypothermiaRisk: 'NONE' | 'MILD' | 'MODERATE' | 'SEVERE'
  hrv: number // Heart Rate Variability in ms
  triageTag: StartTriageTag
  consciousness: 'ALERT' | 'RESPONSIVE_TO_VOICE' | 'RESPONSIVE_TO_PAIN' | 'UNRESPONSIVE'
}

export interface AcousticSignature {
  detected: boolean
  confidence: number // %
  classification: 'VOCAL_DISTRESS' | 'SOS_TAPPING' | 'WHISTLE' | 'GROAN' | 'DEBRIS_IMPACT' | 'NONE'
  peakFrequency: number // Hz
  soundLevelDb: number // dB SPL
  snrDb: number // Signal-to-noise ratio in dB
  dspNoiseReductionDb: number // dB rotor attenuation
  cadenceDescription: string
  audioSnippetAvailable: boolean
}

export interface Keypoint {
  id: number
  name: string
  x: number // percentage 0 - 100
  y: number // percentage 0 - 100
  conf: number
}

export interface PoseData {
  posture: 'LYING_DOWN' | 'CALLING_FOR_HELP' | 'CROUCHING_TRAPPED' | 'STANDING' | string
  isDistress: boolean
  hazard?: {
    detected: boolean
    type: string
    severity: Severity
    message: string
  }
  keypoints?: Keypoint[]
  skeletonLines?: [number, number][]
  spineAngleDeg?: number
}

export interface CampusLocation {
  name: string
  latitude: number
  longitude: number
  sector: string
  radius: number
  notes?: string
}

export interface Survivor extends Coordinates {
  id: string
  confidence: number
  thermalConfidence: number
  fusedConfidence: number
  priority: number
  status: SurvivorStatus
  observedPosture: 'LYING' | 'MOVING' | 'SEATED' | 'WAVING_HELP' | 'CROUCHING' | 'UNRESPONSIVE'
  detectedAt: string
  assignedTeamId?: string
  nearbyHazards: string[]
  sector: string
  vitals?: SurvivorVitals
  acoustic?: AcousticSignature
  poseData?: PoseData
}

export interface Hazard extends Coordinates {
  id: string
  type: 'FIRE' | 'FLOOD' | 'SMOKE' | 'DEBRIS' | 'UNSTABLE STRUCTURE' | 'LANDSLIDE' | 'ELECTRICAL' | 'BLOCKED ROAD' | 'DAMAGED BRIDGE' | 'IMMOBILE / UNCONSCIOUS CASUALTY' | 'ENTRAPMENT RISK' | 'ACTIVE DISTRESS SIGNAL'
  severity: Severity
  confidence: number
  radius: number
  status: 'ACTIVE' | 'MONITORED' | 'CLEARED'
  detectedAt: string
  sector: string
}

export interface RescueTeam extends Coordinates {
  id: string
  name: string
  status: TeamStatus
  capabilities: string[]
  assignedSurvivorId?: string
  eta?: string
  distance: string
  communication: 'CONNECTED' | 'WEAK' | 'OFFLINE'
}

export interface Alert extends Coordinates {
  id: string
  severity: Severity
  type: string
  title: string
  message: string
  confidence: number
  timestamp: string
  status: 'NEW' | 'ACKNOWLEDGED' | 'DISPATCHED' | 'RESOLVED'
  recommendedAction: string
  survivorId?: string
}

export interface Mission {
  id: string
  codeName: string
  location: string
  phase: MissionPhase
  coverage: number
  startTime: string
  currentSector: string
  nextTarget: string
  elapsedSeconds: number
  demoMode: boolean
  isPlaying: boolean
  speed: 1 | 2 | 4
  weather: string
  temperature: string
  linkStatus: string
}

export type MapLayers = Record<'drones' | 'survivors' | 'hazards' | 'teams' | 'coverage' | 'routes' | 'terrain' | 'satellite' | 'grid' | 'restricted' | 'videoDetections', boolean>

export interface MissionEvent {
  time: string
  seconds: number
  title: string
  description: string
  severity: Severity | 'INFO'
  icon: 'takeoff' | 'search' | 'hazard' | 'survivor' | 'route' | 'rescue'
}

export type ExpandedFeedType = 'RGB' | 'THERMAL' | 'ODOMETRY' | 'VITALS' | null
export type MapStyleMode = 'SATELLITE' | 'STREETS'
export type RouteComparisonMode = 'SAFE_CORRIDOR' | 'DIRECT_VECTOR'

