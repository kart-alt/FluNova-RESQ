import { useEffect, useRef, useState } from 'react'
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Mic,
  Play,
  Square,
  Volume2,
  VolumeX,
  AudioWaveform,
  Zap,
} from 'lucide-react'
import type { AcousticSignature } from '../../types'

interface AcousticSpectrogramProps {
  acoustic?: AcousticSignature
  survivorId: string
}

export function AcousticSpectrogram({ acoustic, survivorId }: AcousticSpectrogramProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const oscillatorTimerRef = useRef<number | null>(null)

  const signature: AcousticSignature = acoustic ?? {
    detected: true,
    confidence: 94,
    classification: 'VOCAL_DISTRESS',
    peakFrequency: 1840,
    soundLevelDb: 68.4,
    snrDb: 14.8,
    dspNoiseReductionDb: -38,
    cadenceDescription: 'Repeated vocal distress call ("Help!") detected at 4.2s intervals',
    audioSnippetAvailable: true,
  }

  // Real-time Canvas Animated Spectrogram
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let step = 0
    const numBars = 48

    const render = () => {
      step += 0.08
      const width = canvas.width
      const height = canvas.height

      ctx.clearRect(0, 0, width, height)

      // Background grid lines
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)'
      ctx.lineWidth = 1
      for (let y = 15; y < height; y += 20) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }

      const barWidth = width / numBars - 2

      for (let i = 0; i < numBars; i++) {
        // Base frequency simulation
        const freqNorm = i / numBars
        const isDistressBand =
          signature.classification === 'VOCAL_DISTRESS'
            ? freqNorm > 0.35 && freqNorm < 0.65 // ~1.2kHz - 2.8kHz
            : signature.classification === 'SOS_TAPPING'
            ? freqNorm > 0.15 && freqNorm < 0.35 // ~400Hz - 800Hz
            : freqNorm > 0.2 && freqNorm < 0.5

        let amplitude = Math.sin(step * 1.5 + i * 0.4) * 0.25 + 0.35
        if (isDistressBand && signature.detected) {
          // Boosted pulsating energy in the detected distress frequency band
          const pulse = (Math.sin(step * 3) + 1) * 0.35
          amplitude += pulse + Math.random() * 0.2
        } else {
          amplitude += Math.random() * 0.1
        }
        amplitude = Math.max(0.08, Math.min(0.96, amplitude))

        const barHeight = amplitude * (height - 18)
        const x = i * (barWidth + 2)
        const y = height - barHeight - 4

        // Tactical military spectrogram gradient (Cyan -> Amber -> Bright Coral Red)
        const grad = ctx.createLinearGradient(0, height, 0, y)
        if (isDistressBand && signature.detected) {
          grad.addColorStop(0, '#0284c7')
          grad.addColorStop(0.5, '#f59e0b')
          grad.addColorStop(1, '#ef4444')
        } else {
          grad.addColorStop(0, '#0f172a')
          grad.addColorStop(0.6, '#0369a1')
          grad.addColorStop(1, '#38bdf8')
        }

        ctx.fillStyle = grad
        ctx.fillRect(x, y, barWidth, barHeight)

        // Peak cap
        ctx.fillStyle = isDistressBand && signature.detected ? '#ffffff' : '#38bdf8'
        ctx.fillRect(x, y - 2, barWidth, 1.5)
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [signature])

  // Synthesized Web Audio API SOS / Distress Beep playback
  const toggleAudioPlayback = () => {
    if (isPlayingAudio) {
      stopAudioPlayback()
      return
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioCtx()
      audioCtxRef.current = ctx

      setIsPlayingAudio(true)

      // Play pattern based on classification
      if (signature.classification === 'SOS_TAPPING') {
        // Morse SOS pattern: 3 dots, 3 dashes, 3 dots
        const pattern = [
          { freq: 520, dur: 120, pause: 100 },
          { freq: 520, dur: 120, pause: 100 },
          { freq: 520, dur: 120, pause: 260 },
          { freq: 520, dur: 360, pause: 120 },
          { freq: 520, dur: 360, pause: 120 },
          { freq: 520, dur: 360, pause: 260 },
          { freq: 520, dur: 120, pause: 100 },
          { freq: 520, dur: 120, pause: 100 },
          { freq: 520, dur: 120, pause: 800 },
        ]
        let currentIdx = 0

        const playNextTone = () => {
          if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return
          const note = pattern[currentIdx]
          currentIdx = (currentIdx + 1) % pattern.length

          const osc = audioCtxRef.current.createOscillator()
          const gain = audioCtxRef.current.createGain()
          osc.type = 'sine'
          osc.frequency.setValueAtTime(note.freq, audioCtxRef.current.currentTime)

          const vol = isMuted ? 0 : 0.15
          gain.gain.setValueAtTime(vol, audioCtxRef.current.currentTime)
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + note.dur / 1000)

          osc.connect(gain)
          gain.connect(audioCtxRef.current.destination)
          osc.start()
          osc.stop(audioCtxRef.current.currentTime + note.dur / 1000)

          oscillatorTimerRef.current = window.setTimeout(playNextTone, note.dur + note.pause)
        }

        playNextTone()
      } else {
        // Vocal distress / harmonic warble at ~1.8kHz filtered band
        const playVocalWarble = () => {
          if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return
          const osc1 = audioCtxRef.current.createOscillator()
          const osc2 = audioCtxRef.current.createOscillator()
          const bandpass = audioCtxRef.current.createBiquadFilter()
          const gain = audioCtxRef.current.createGain()

          bandpass.type = 'bandpass'
          bandpass.frequency.value = signature.peakFrequency
          bandpass.Q.value = 4.0

          osc1.type = 'triangle'
          osc1.frequency.setValueAtTime(signature.peakFrequency - 40, audioCtxRef.current.currentTime)
          osc1.frequency.linearRampToValueAtTime(signature.peakFrequency + 60, audioCtxRef.current.currentTime + 0.4)

          osc2.type = 'sine'
          osc2.frequency.setValueAtTime(signature.peakFrequency * 0.5, audioCtxRef.current.currentTime)

          const vol = isMuted ? 0 : 0.12
          gain.gain.setValueAtTime(0.001, audioCtxRef.current.currentTime)
          gain.gain.linearRampToValueAtTime(vol, audioCtxRef.current.currentTime + 0.1)
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.6)

          osc1.connect(bandpass)
          osc2.connect(bandpass)
          bandpass.connect(gain)
          gain.connect(audioCtxRef.current.destination)

          osc1.start()
          osc2.start()
          osc1.stop(audioCtxRef.current.currentTime + 0.65)
          osc2.stop(audioCtxRef.current.currentTime + 0.65)

          oscillatorTimerRef.current = window.setTimeout(playVocalWarble, 2200)
        }

        playVocalWarble()
      }
    } catch {
      setIsPlayingAudio(false)
    }
  }

  const stopAudioPlayback = () => {
    if (oscillatorTimerRef.current) {
      clearTimeout(oscillatorTimerRef.current)
      oscillatorTimerRef.current = null
    }
    if (audioCtxRef.current) {
      void audioCtxRef.current.close().catch(() => {})
      audioCtxRef.current = null
    }
    setIsPlayingAudio(false)
  }

  useEffect(() => {
    return () => {
      stopAudioPlayback()
    }
  }, [])

  return (
    <div className="acoustic-spectrogram-container">
      {/* Header bar */}
      <div className="acoustic-header">
        <div className="acoustic-title-group">
          <div className="sensor-icon-pill">
            <Mic size={14} className="mic-icon animate-pulse" />
            <span>BEAMFORMING MIC ARRAY · 8KHz</span>
          </div>
          <span className="acoustic-target-id">{survivorId} ACOUSTIC PERCEPTION</span>
        </div>

        <div className="acoustic-header-actions">
          <button
            type="button"
            className={`tactical-audio-btn ${isPlayingAudio ? 'is-playing' : ''}`}
            onClick={toggleAudioPlayback}
            title={isPlayingAudio ? 'Stop audio stream' : 'Listen to filtered acoustic signal'}
          >
            {isPlayingAudio ? (
              <>
                <Square size={12} fill="currentColor" />
                <span>STOP STREAM</span>
              </>
            ) : (
              <>
                <Play size={12} fill="currentColor" />
                <span>LISTEN FILTERED AUDIO</span>
              </>
            )}
          </button>

          <button
            type="button"
            className="tactical-mute-btn"
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
          </button>
        </div>
      </div>

      {/* DSP Rotor Cancellation Status Bar */}
      <div className="dsp-filter-strip">
        <div className="dsp-item">
          <small>ACTIVE ROTOR CANCELLATION</small>
          <strong className="text-emerald">{signature.dspNoiseReductionDb} dB ATTENUATION</strong>
        </div>
        <div className="dsp-item">
          <small>ACOUSTIC S.N.R.</small>
          <strong className="text-cyan">+{signature.snrDb} dB</strong>
        </div>
        <div className="dsp-item">
          <small>SOUND PRESSURE LEVEL</small>
          <span>{signature.soundLevelDb} dB SPL</span>
        </div>
        <div className="dsp-item">
          <small>PEAK ENERGY BAND</small>
          <strong className="text-amber">{signature.peakFrequency} Hz</strong>
        </div>
      </div>

      {/* Real-time Canvas Animated Spectrogram */}
      <div className="spectrogram-canvas-wrapper">
        <div className="spectrogram-frequency-axis">
          <span>8.0 kHz</span>
          <span>4.0 kHz</span>
          <span>2.0 kHz (VOCAL DISTRESS)</span>
          <span>500 Hz (TAPPING/SOS)</span>
          <span>50 Hz</span>
        </div>
        <canvas ref={canvasRef} width={520} height={140} className="spectrogram-canvas" />
        <div className="spectrogram-overlay-legend">
          <span className="legend-chip distress-band">
            <span className="color-dot red" /> DISTRESS DETECTION ZONE ({signature.peakFrequency} Hz)
          </span>
          <span className="legend-chip bg-band">
            <span className="color-dot blue" /> FILTERED BACKGROUND
          </span>
        </div>
      </div>

      {/* Classifier Result Banner */}
      <div className="classifier-result-card">
        <div className="classifier-top">
          <div className="classifier-status">
            <span className="tag-pulse-circle" />
            <strong className="classifier-class-name">
              {signature.classification.replace('_', ' ')}
            </strong>
          </div>
          <div className="classifier-confidence-score">
            <span>AI CLASSIFIER CONFIDENCE:</span>
            <strong>{signature.confidence}%</strong>
          </div>
        </div>
        <p className="classifier-cadence-desc">
          <Activity size={12} className="inline-icon" /> {signature.cadenceDescription}
        </p>
      </div>
    </div>
  )
}
