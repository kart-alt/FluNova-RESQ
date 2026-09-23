/**
 * Generates a realistic looping aerial drone reconnaissance video using HTML5 Canvas & MediaRecorder.
 * This provides an immediate, zero-dependency demo video if the user doesn't have a local video file ready.
 */
export async function generateSampleReconVideo(): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 640
      canvas.height = 360
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        throw new Error('Canvas 2D context not available')
      }

      const stream = canvas.captureStream(30)
      const recordedChunks: Blob[] = []
      
      // Determine supported mime type
      let mimeType = 'video/webm'
      if (typeof MediaRecorder.isTypeSupported === 'function') {
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
          mimeType = 'video/webm;codecs=vp9'
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
          mimeType = 'video/webm;codecs=vp8'
        } else if (MediaRecorder.isTypeSupported('video/mp4')) {
          mimeType = 'video/mp4'
        }
      }

      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2500000 })

      recorder.ondataavailable = e => {
        if (e.data && e.data.size > 0) {
          recordedChunks.push(e.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: mimeType })
        const url = URL.createObjectURL(blob)
        resolve(url)
      }

      recorder.start()

      // Render 90 frames (~3 seconds at 30 fps) of high-contrast aerial drone footage
      const totalFrames = 90
      let frame = 0

      const drawFrame = () => {
        const progress = frame / totalFrames
        const angle = progress * Math.PI * 2
        const panX = Math.sin(angle) * 30
        const panY = Math.cos(angle) * 15

        // Earthy terrain / earthquake ruins background
        const grad = ctx.createLinearGradient(0, 0, 640, 360)
        grad.addColorStop(0, '#2b302c')
        grad.addColorStop(0.5, '#3b3f3a')
        grad.addColorStop(1, '#252926')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, 640, 360)

        // Ground texture & road fractures
        ctx.save()
        ctx.translate(panX, panY)

        // Cracked roads
        ctx.strokeStyle = '#525950'
        ctx.lineWidth = 14
        ctx.beginPath()
        ctx.moveTo(-50, 80)
        ctx.lineTo(250, 160)
        ctx.lineTo(400, 120)
        ctx.lineTo(700, 220)
        ctx.stroke()

        // Damaged building outlines (ruins)
        ctx.fillStyle = '#454a43'
        ctx.fillRect(80, 40, 120, 80)
        ctx.fillStyle = '#5c6359'
        ctx.fillRect(95, 55, 90, 50)

        ctx.fillStyle = '#3a3f38'
        ctx.fillRect(320, 180, 140, 110)
        ctx.fillStyle = '#4c524a'
        ctx.fillRect(340, 200, 100, 70)

        // Debris piles
        ctx.fillStyle = '#786e5e'
        for (let i = 0; i < 25; i++) {
          const rx = 180 + ((i * 37) % 240)
          const ry = 90 + ((i * 53) % 180)
          const rSize = 5 + (i % 8)
          ctx.beginPath()
          ctx.arc(rx, ry, rSize, 0, Math.PI * 2)
          ctx.fill()
        }

        // Simulated survivor silhouette
        const survivorX = 380 + Math.sin(progress * 4) * 2
        const survivorY = 230
        ctx.fillStyle = '#d97706' // High-vis vest orange
        ctx.fillRect(survivorX, survivorY, 12, 6)
        ctx.fillStyle = '#1e293b' // Head & limbs
        ctx.beginPath()
        ctx.arc(survivorX - 3, survivorY + 3, 3, 0, Math.PI * 2)
        ctx.fill()

        // Drone spotlight / search cone moving smoothly
        const spotlightX = 320 + Math.sin(angle) * 80
        const spotlightY = 180 + Math.cos(angle) * 40
        const spotGrad = ctx.createRadialGradient(spotlightX, spotlightY, 10, spotlightX, spotlightY, 130)
        spotGrad.addColorStop(0, 'rgba(255, 255, 255, 0.35)')
        spotGrad.addColorStop(0.6, 'rgba(14, 165, 233, 0.15)')
        spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = spotGrad
        ctx.beginPath()
        ctx.arc(spotlightX, spotlightY, 130, 0, Math.PI * 2)
        ctx.fill()

        ctx.restore()

        // Lens vignette and scanlines
        ctx.fillStyle = 'rgba(15, 23, 42, 0.15)'
        ctx.fillRect(0, 0, 640, 360)

        frame++
        if (frame < totalFrames) {
          requestAnimationFrame(drawFrame)
        } else {
          recorder.stop()
        }
      }

      drawFrame()
    } catch (err) {
      reject(err)
    }
  })
}
