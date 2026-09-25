import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import fs from 'node:fs'
import path from 'node:path'

function serveOnnxStaticPlugin() {
  return {
    name: 'serve-onnx-static',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url && req.url.startsWith('/onnx/')) {
          const cleanUrl = req.url.split('?')[0]
          const filePath = path.join(process.cwd(), 'public', cleanUrl)
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            if (filePath.endsWith('.mjs')) {
              res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
            } else if (filePath.endsWith('.wasm')) {
              res.setHeader('Content-Type', 'application/wasm')
            }
            res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
            res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless')
            return fs.createReadStream(filePath).pipe(res)
          }
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [serveOnnxStaticPlugin(), react(), tailwindcss()],
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
