import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// Cloud Run / K8s: PORT ortam değişkeni (çoğunlukla 8080). Yerelde genelde yok → Vite varsayılanı 5173.
const devPort = Number(process.env.PORT) || 5173

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  // Cloud Run (ve benzeri) ters vekil Host başlığı; Vite 6+ bilinmeyen host’u engeller
  server: {
    host: '0.0.0.0',
    port: devPort,
    // Cloud Run’da yanlış porta bağlanmayı hemen görmek için sıkı; yerelde 5173 doluysa bir sonrakine geçebilsin
    strictPort: Boolean(process.env.PORT),
    allowedHosts: [
      'graduation-project-tugcealtacli-742447243952.europe-west1.run.app',
      '.run.app',
      'localhost',
      '.localhost',
    ],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
