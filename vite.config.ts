import { defineConfig } from 'vite'
import path from 'path'
import svgr from 'vite-plugin-svgr'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import envCompatible from 'vite-plugin-env-compatible'
import topLevelAwait from 'vite-plugin-top-level-await'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    envCompatible(),
    svgr({
      svgrOptions: {
        icon: true // Đảm bảo SVG được render như một React Component
      }
    }),
    topLevelAwait({
      // The export name of top-level await promise for each chunk module
      promiseExportName: '__tla',
      // The function to generate import names of top-level await promise in each chunk module
      promiseImportName: (i) => `__tla_${i}`
    })
  ],
  build: {
    minify: 'terser', // Dùng terser để minify mã
    cssCodeSplit: true, // Tách riêng CSS
    chunkSizeWarningLimit: 1500, //
    target: 'esnext' //browsers can handle the latest ES features
  },
  server: {
    port: 3000,
    hmr: true,
    proxy: {
      // Proxy all requests from /api to http://localhost:8082/api
      '/api': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        secure: false, // Nếu API chạy trên http, bạn có thể đặt `secure: false`
        rewrite: (path) => path.replace(/^\/api/, '/api') // Sửa URL khi proxy
      }
    }
  },
  css: {
    devSourcemap: true
  },
  resolve: {
    alias: [{ find: '@', replacement: path.resolve(__dirname, 'src') }]
  }
})
