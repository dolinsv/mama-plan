import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
    plugins: [vue()],
    base: process.env.NODE_ENV === 'production' ? `/${REPO_NAME}/` : '/',
    server: {
        port: 5173,
        host: true,
        allowedHosts: ['.loca.lt', '.ngrok.io', '.lcl.dev'],
        hmr: false, // ⚠️ Отключаем WebSocket/HMR для работы через туннель
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
                secure: false
            }
        }
    },
    // Отключаем пре-рендеринг, который может ломаться в туннелях
    optimizeDeps: {
        esbuildOptions: {
            target: 'es2020'
        }
    }
})