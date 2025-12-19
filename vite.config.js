import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173, // 前端开发服务器端口（改为 5173，避免与后端 8081 冲突）
    headers: {
      'Content-Security-Policy': "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: http://localhost:* ws://localhost:* wss://localhost:*; script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:*; style-src 'self' 'unsafe-inline' http://localhost:*;"
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8081', // 后端服务在 8081 端口
        changeOrigin: true,
        secure: false
      }
    }
  }
})

