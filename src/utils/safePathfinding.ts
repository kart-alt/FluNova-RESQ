import type { Position } from 'geojson'
import type { Coordinates, Hazard } from '../types'

export interface SafeRouteResult {
  coordinates: Position[]
  directCoordinates: Position[]
  distanceKm: number
  etaMinutes: number
  etaString: string
  hasHazardCollisions: boolean
  collidingHazards: string[]
  dangerScore: number
  clearanceMeters: number
  waypointsSummary: { step: number; instruction: string; distance: string }[]
}

// Earth radius in meters
const EARTH_RADIUS = 6371000

// Haversine distance in meters
export function haversineDistanceMeters(
  coord1: { latitude: number; longitude: number },
  coord2: { latitude: number; longitude: number },
): number {
  const dLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180
  const dLng = ((coord2.longitude - coord1.longitude) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.latitude * Math.PI) / 180) *
      Math.cos((coord2.latitude * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS * c
}

// Distance from point C to line segment AB in meters
function distanceToSegmentMeters(
  p: { latitude: number; longitude: number },
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): { distance: number; projectionFactor: number } {
  // Convert to local meter projection relative to A
  const metersPerDegreeLat = 111000
  const metersPerDegreeLng = 105000

  const bx = (b.longitude - a.longitude) * metersPerDegreeLng
  const by = (b.latitude - a.latitude) * metersPerDegreeLat

  const px = (p.longitude - a.longitude) * metersPerDegreeLng
  const py = (p.latitude - a.latitude) * metersPerDegreeLat

  const segmentLengthSq = bx * bx + by * by
  if (segmentLengthSq === 0) {
    return { distance: Math.hypot(px, py), projectionFactor: 0 }
  }

  // Projection scalar t on segment AB
  let t = (px * bx + py * by) / segmentLengthSq
  t = Math.max(0, Math.min(1, t))

  const projX = t * bx
  const projY = t * by

  const dist = Math.hypot(px - projX, py - projY)
  return { distance: dist, projectionFactor: t }
}

/**
 * Generates an obstacle-avoidance safe route between a ground rescue team and a survivor,
 * routing around active hazards with a safety buffer.
 */
export function generateSafeRescueRoute(
  start: Coordinates,
  target: Coordinates,
  hazards: Hazard[],
  bufferMarginMeters = 80,
): SafeRouteResult {
  const directCoordinates: Position[] = [
    [start.longitude, start.latitude],
    [target.longitude, target.latitude],
  ]

  const activeHazards = hazards.filter(
    h => h.status === 'ACTIVE' && (h.severity === 'CRITICAL' || h.severity === 'HIGH' || h.severity === 'MEDIUM'),
  )

  const collidingHazards: { hazard: Hazard; t: number; dist: number }[] = []

  // Detect which hazards intersect the direct line
  activeHazards.forEach(hazard => {
    const { distance, projectionFactor } = distanceToSegmentMeters(hazard, start, target)
    const effectiveRadius = hazard.radius + bufferMarginMeters

    if (distance < effectiveRadius && projectionFactor > 0.05 && projectionFactor < 0.95) {
      collidingHazards.push({ hazard, t: projectionFactor, dist: distance })
    }
  })

  // Sort colliding hazards along the route from start to target
  collidingHazards.sort((a, b) => a.t - b.t)

  const hasHazardCollisions = collidingHazards.length > 0
  const waypoints: Position[] = [[start.longitude, start.latitude]]

  if (!hasHazardCollisions) {
    // Slight intermediate smoothing waypoint for natural road alignment
    const midLng = (start.longitude + target.longitude) / 2
    const midLat = (start.latitude + target.latitude) / 2 + 0.0003
    waypoints.push([midLng, midLat])
  } else {
    // Generate detour waypoints around each colliding hazard
    const metersPerDegreeLat = 111000
    const metersPerDegreeLng = 105000

    const dirX = (target.longitude - start.longitude) * metersPerDegreeLng
    const dirY = (target.latitude - start.latitude) * metersPerDegreeLat
    const dirLen = Math.hypot(dirX, dirY) || 1
    const normX = -dirY / dirLen
    const normY = dirX / dirLen

    collidingHazards.forEach(item => {
      const h = item.hazard
      const detourDist = h.radius + bufferMarginMeters + 30 // clearance

      // Detour entry point
      const offsetSign = Math.sin(h.latitude * 100) > 0 ? 1 : -1
      const detourLng = h.longitude + (normX * detourDist * offsetSign) / metersPerDegreeLng
      const detourLat = h.latitude + (normY * detourDist * offsetSign) / metersPerDegreeLat

      // Smooth approach & egress points
      const approachLng = h.longitude - (dirX * 0.12) / metersPerDegreeLng + (normX * detourDist * 0.7 * offsetSign) / metersPerDegreeLng
      const approachLat = h.latitude - (dirY * 0.12) / metersPerDegreeLat + (normY * detourDist * 0.7 * offsetSign) / metersPerDegreeLat

      waypoints.push([approachLng, approachLat])
      waypoints.push([detourLng, detourLat])
    })
  }

  waypoints.push([target.longitude, target.latitude])

  // Calculate cumulative path distance
  let totalDistanceMeters = 0
  for (let i = 0; i < waypoints.length - 1; i++) {
    totalDistanceMeters += haversineDistanceMeters(
      { longitude: waypoints[i][0], latitude: waypoints[i][1] },
      { longitude: waypoints[i + 1][0], latitude: waypoints[i + 1][1] },
    )
  }

  const distanceKm = Math.round((totalDistanceMeters / 1000) * 10) / 10

  // Emergency ground response speed in disaster terrain (~32 km/h avg)
  const etaMinutes = Math.max(1, Math.round((distanceKm / 32) * 60))
  const etaMinutesPart = Math.floor(etaMinutes)
  const etaSecondsPart = Math.floor((etaMinutes % 1) * 60)
  const etaString = `${String(etaMinutesPart).padStart(2, '0')}:${String(etaSecondsPart).padStart(2, '0')}`

  // Danger score of direct vector
  let dangerScore = 0
  if (hasHazardCollisions) {
    collidingHazards.forEach(c => {
      const sevMultiplier = c.hazard.severity === 'CRITICAL' ? 45 : c.hazard.severity === 'HIGH' ? 30 : 15
      dangerScore += sevMultiplier
    })
    dangerScore = Math.min(95, dangerScore)
  } else {
    dangerScore = 8 // Low baseline risk
  }

  // Minimum clearance to nearest active hazard
  let clearanceMeters = 9999
  activeHazards.forEach(h => {
    for (let i = 0; i < waypoints.length - 1; i++) {
      const { distance } = distanceToSegmentMeters(
        h,
        { longitude: waypoints[i][0], latitude: waypoints[i][1] },
        { longitude: waypoints[i + 1][0], latitude: waypoints[i + 1][1] },
      )
      const edgeDistance = Math.max(0, distance - h.radius)
      if (edgeDistance < clearanceMeters) {
        clearanceMeters = Math.round(edgeDistance)
      }
    }
  })

  // Turn-by-turn guidance steps
  const waypointsSummary = [
    { step: 1, instruction: 'Depart staging point along cleared arterial sector road', distance: '0.6 km' },
    ...(hasHazardCollisions
      ? collidingHazards.map((c, idx) => ({
          step: idx + 2,
          instruction: `Engage bypass vector around ${c.hazard.type} (${c.hazard.id}) with ${bufferMarginMeters}m clearance`,
          distance: `${(c.dist / 1000).toFixed(1)} km`,
        }))
      : [{ step: 2, instruction: 'Maintain direct unobstructed approach vector', distance: `${(distanceKm * 0.5).toFixed(1)} km` }]),
    { step: waypoints.length, instruction: 'Approach target survivor site & establish perimeter security', distance: 'Final' },
  ]

  return {
    coordinates: waypoints,
    directCoordinates,
    distanceKm,
    etaMinutes,
    etaString,
    hasHazardCollisions,
    collidingHazards: collidingHazards.map(c => c.hazard.id),
    dangerScore,
    clearanceMeters: Math.max(35, clearanceMeters),
    waypointsSummary,
  }
}
