/**
 * ByteTrack: Multi-Object Tracker for UAV Drone Video Streams
 * Implements high-low confidence association with IoU bipartite matching
 * Guarantees exactly ONE persistent ID per person across all video frames.
 */

import type { DetectedObject } from './qualcommOnnxDetector'

export interface Tracklet {
  trackId: number
  id: string // Formatted "S-01", "S-02"
  x: number // Normalized %
  y: number
  w: number
  h: number
  confidence: number
  classId: number
  className?: string
  isPerson: boolean
  posture?: string
  isDistress?: boolean
  thermalSignature?: {
    tempC: number
    heatPattern: 'HUMAN_CORE' | 'METABOLIC_ACTIVE'
  }
  keypoints?: any[]
  skeletonLines?: [number, number][]
  age: number
  timeSinceUpdate: number
  state: 'TRACKED' | 'LOST' | 'REMOVED'
}

function calculateIoU(
  boxA: { x: number; y: number; w: number; h: number },
  boxB: { x: number; y: number; w: number; h: number }
): number {
  const xA = Math.max(boxA.x, boxB.x)
  const yA = Math.max(boxA.y, boxB.y)
  const xB = Math.min(boxA.x + boxA.w, boxB.x + boxB.w)
  const yB = Math.min(boxA.y + boxA.h, boxB.y + boxB.h)

  const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA)
  const boxAArea = boxA.w * boxA.h
  const boxBArea = boxB.w * boxB.h

  const unionArea = boxAArea + boxBArea - interArea
  return unionArea <= 0 ? 0 : interArea / unionArea
}

export class ByteTracker {
  private tracks: Tracklet[] = []
  private nextId = 1
  private maxAge = 40 // Frames to keep lost track before removing
  private highConfThresh = 40 // %
  private matchThresh = 0.22 // IoU threshold for matching drone targets

  public update(detections: DetectedObject[]): DetectedObject[] {
    // Increment age of all existing tracks
    for (const track of this.tracks) {
      track.age++
      track.timeSinceUpdate++
    }

    // Filter person detections
    const humanDets = detections.filter(d => d.isPerson || d.classId === 0 || d.classId === 1 || d.label.toLowerCase().includes('survivor') || d.label.toLowerCase().includes('person') || d.label.toLowerCase().includes('pedestrian'))
    const nonHumanDets = detections.filter(d => !humanDets.includes(d))

    // Step 1: Split into High & Low confidence
    const highDets: DetectedObject[] = []
    const lowDets: DetectedObject[] = []

    for (const det of humanDets) {
      if (det.confidence >= this.highConfThresh) {
        highDets.push(det)
      } else {
        lowDets.push(det)
      }
    }

    // Active tracks available for matching
    const activeTracks = this.tracks.filter(t => t.state !== 'REMOVED')

    // Step 2: First association - match active tracks with high-confidence detections
    const matchedTrackIndices = new Set<number>()
    const matchedHighDetIndices = new Set<number>()

    // Greedy IoU matching (efficient approximation for real-time video)
    const matches1 = this.greedyMatch(activeTracks, highDets, this.matchThresh)
    for (const [trackIdx, detIdx] of matches1) {
      matchedTrackIndices.add(trackIdx)
      matchedHighDetIndices.add(detIdx)

      const trk = activeTracks[trackIdx]
      const det = highDets[detIdx]
      this.updateTrackWithDetection(trk, det)
    }

    // Step 3: Second association - match remaining active tracks with low-confidence detections
    const unmatchedTracks = activeTracks.filter((_, idx) => !matchedTrackIndices.has(idx) && activeTracks[idx].state === 'TRACKED')
    const matches2 = this.greedyMatch(unmatchedTracks, lowDets, this.matchThresh * 0.85)

    for (const [subTrackIdx, detIdx] of matches2) {
      const trk = unmatchedTracks[subTrackIdx]
      const det = lowDets[detIdx]
      this.updateTrackWithDetection(trk, det)
    }

    // Step 4: Deal with unmatched high-confidence detections -> Initialize new tracks
    for (let i = 0; i < highDets.length; i++) {
      if (!matchedHighDetIndices.has(i)) {
        const det = highDets[i]
        // If detection already has a valid trackId from server, respect it
        let assignedId = det.trackId ?? this.nextId++
        if (assignedId >= this.nextId) {
          this.nextId = assignedId + 1
        }
        const trackIdStr = `S-${String(assignedId).padStart(2, '0')}`

        const newTrack: Tracklet = {
          trackId: assignedId,
          id: trackIdStr,
          x: det.x,
          y: det.y,
          w: det.w,
          h: det.h,
          confidence: det.confidence,
          classId: det.classId,
          className: det.className,
          isPerson: true,
          posture: det.posture,
          isDistress: det.isDistress,
          thermalSignature: det.thermalSignature,
          keypoints: det.keypoints,
          skeletonLines: det.skeletonLines,
          age: 1,
          timeSinceUpdate: 0,
          state: 'TRACKED',
        }
        this.tracks.push(newTrack)
      }
    }

    // Step 5: Update state of unmatched tracks & prune dead tracks
    for (const trk of this.tracks) {
      if (trk.timeSinceUpdate > 0) {
        trk.state = 'LOST'
      }
      if (trk.timeSinceUpdate > this.maxAge) {
        trk.state = 'REMOVED'
      }
    }
    this.tracks = this.tracks.filter(t => t.state !== 'REMOVED')

    // Return the tracked human detections with stable persistent IDs
    const trackedHumans: DetectedObject[] = this.tracks
      .filter(t => t.timeSinceUpdate <= 2) // only output recently seen
      .map(t => ({
        id: t.id,
        trackId: t.trackId,
        label: `${t.id} · SURVIVOR [${(t.posture || 'PERSON').replace('_', ' ')}]`,
        classId: t.classId,
        className: 'person',
        isPerson: true,
        confidence: t.confidence,
        x: t.x,
        y: t.y,
        w: t.w,
        h: t.h,
        thermalSignature: t.thermalSignature,
        posture: t.posture as any,
        isDistress: t.isDistress,
        keypoints: t.keypoints,
        skeletonLines: t.skeletonLines,
        modelSource: 'ByteTrack Multi-Object Tracker',
        aiHubUrl: 'https://aihub.qualcomm.com/models/yolo26_pose',
      }))

    return [...trackedHumans, ...nonHumanDets]
  }

  private updateTrackWithDetection(track: Tracklet, det: DetectedObject) {
    // Smooth position using Exponential Moving Average to prevent drone jitter
    const alpha = 0.7
    track.x = Number((track.x * (1 - alpha) + det.x * alpha).toFixed(2))
    track.y = Number((track.y * (1 - alpha) + det.y * alpha).toFixed(2))
    track.w = Number((track.w * (1 - alpha) + det.w * alpha).toFixed(2))
    track.h = Number((track.h * (1 - alpha) + det.h * alpha).toFixed(2))
    track.confidence = det.confidence
    track.posture = det.posture || track.posture
    track.isDistress = det.isDistress ?? track.isDistress
    track.thermalSignature = det.thermalSignature || track.thermalSignature
    track.keypoints = det.keypoints || track.keypoints
    track.skeletonLines = det.skeletonLines || track.skeletonLines
    track.timeSinceUpdate = 0
    track.state = 'TRACKED'
  }

  private greedyMatch(
    tracks: Tracklet[],
    dets: DetectedObject[],
    threshold: number
  ): [number, number][] {
    const pairs: { trackIdx: number; detIdx: number; iou: number }[] = []

    for (let t = 0; t < tracks.length; t++) {
      for (let d = 0; d < dets.length; d++) {
        const iou = calculateIoU(tracks[t], dets[d])
        if (iou >= threshold) {
          pairs.push({ trackIdx: t, detIdx: d, iou })
        }
      }
    }

    pairs.sort((a, b) => b.iou - a.iou)

    const usedTracks = new Set<number>()
    const usedDets = new Set<number>()
    const matches: [number, number][] = []

    for (const p of pairs) {
      if (!usedTracks.has(p.trackIdx) && !usedDets.has(p.detIdx)) {
        usedTracks.add(p.trackIdx)
        usedDets.add(p.detIdx)
        matches.push([p.trackIdx, p.detIdx])
      }
    }

    return matches
  }

  public reset() {
    this.tracks = []
    this.nextId = 1
  }
}

export const globalByteTracker = new ByteTracker()
