import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // MapLibre is loaded only by the map route; its self-contained renderer is intentionally larger than the app shell.
    chunkSizeWarningLimit: 1200,
  },
  server: {
    hmr: {
      overlay: false,
    },
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
    watch: {
      ignored: ['**/public/models/**', '**/public/onnx/**', '**/*.onnx', '**/*.wasm', '**/*.pt'],
    },
  },
  optimizeDeps: {
    exclude: ['maplibre-gl', 'onnxruntime-web'],
  },
})
