import { FastForward, Pause, Play, RotateCcw } from 'lucide-react'
import { useCommandStore } from '../../store/commandStore'

export function DemoControls() {
  const mission = useCommandStore(state => state.mission)
  const setPlaying = useCommandStore(state => state.setPlaying)
  const setSpeed = useCommandStore(state => state.setSpeed)
  const setDemoMode = useCommandStore(state => state.setDemoMode)
  const resetDemo = useCommandStore(state => state.resetDemo)

  return (
    <div className="demo-controls-bar">
      {/* Demo Mode Status Toggle */}
      <button
        type="button"
        className={`demo-mode-pill ${mission.demoMode ? 'active' : ''}`}
        onClick={() => setDemoMode(!mission.demoMode)}
        title="Toggle automated real-time demo mode"
      >
        <span className={`status-orb ${mission.demoMode && mission.isPlaying ? 'pulsing-green' : 'paused'}`} />
        <span className="demo-text">DEMO MODE</span>
        <span className="demo-sub">{mission.demoMode && mission.isPlaying ? 'RUNNING' : 'PAUSED'}</span>
      </button>

      {/* Play / Pause Toggle */}
      <button
        type="button"
        className="demo-btn play-pause-btn"
        onClick={() => setPlaying(!mission.isPlaying)}
        aria-label={mission.isPlaying ? 'Pause simulation' : 'Play simulation'}
      >
        {mission.isPlaying ? <Pause size={13} /> : <Play size={13} />}
        <span>{mission.isPlaying ? 'PAUSE' : 'PLAY'}</span>
      </button>

      {/* Reset simulation */}
      <button
        type="button"
        className="demo-btn reset-btn"
        onClick={resetDemo}
        aria-label="Reset simulation to initial state"
        title="Reset simulation"
      >
        <RotateCcw size={13} />
        <span>RESET</span>
      </button>

      {/* Speed Multiplier */}
      <div className="speed-selector">
        {([1, 2, 4] as const).map(spd => (
          <button
            key={spd}
            type="button"
            className={`speed-btn ${mission.speed === spd ? 'active' : ''}`}
            onClick={() => setSpeed(spd)}
            title={`Set simulation speed to ${spd}x`}
          >
            {spd}×
          </button>
        ))}
      </div>
    </div>
  )
}
