// client/src/api/http.js - минимальная версия для отладки
import axios from 'axios'

const http = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    headers: { 'Content-Type': 'application/json' },
    timeout: 3000
})

// 🔥 Упрощённый интерцептор без VK Bridge для локальной разработки
http.interceptors.request.use((config) => {
    // В демо-режиме не добавляем заголовок, чтобы не ломать запрос
    if (import.meta.env.DEV) {
        // Можно добавить тестовый заголовок для бэкенда
        config.headers['X-Dev-Mode'] = 'true'
    }
    return config
})

export default http