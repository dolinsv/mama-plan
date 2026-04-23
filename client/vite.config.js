import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 🔥 Имя репозитория (должно совпадать с GitHub)
const REPO_NAME = 'mama-plan'

export default defineConfig({
    plugins: [vue()],

    // 🔥 Базовый путь для GitHub Pages
    base: process.env.NODE_ENV === 'production' ? `/${REPO_NAME}/` : '/',

    server: {
        port: 5173,
        host: true,
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
                secure: false
            }
        }
    },

    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: false
    }
})