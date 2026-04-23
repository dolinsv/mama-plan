import { defineStore } from 'pinia'
import vkBridge from '@vkontakte/vk-bridge'
import http from '../api/http'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: null,
        isReady: false,
        isVkMode: false
    }),

    actions: {
        async init() {
            try {
                await Promise.race([
                    vkBridge.send('VKWebAppInit'),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
                ])

                this.isVkMode = true

                const { access_token, user } = await vkBridge.send('VKWebAppGetAuthToken', {
                    app_id: import.meta.env.VITE_VK_APP_ID,
                    scope: 'email'
                }).catch(() => ({}))

                if (access_token) {
                    const { data } = await http.post('/auth/verify', { initData: access_token })
                    this.user = data.user
                }
            } catch (e) {
                console.warn('VK auth failed, demo mode:', e.message)
                this.isVkMode = false
                this.user = { vkId: 'demo', firstName: 'Демо', settings: {} }
            } finally {
                this.isReady = true
            }
        }
    },

    persist: { enabled: true, strategies: [{ key: 'mama_auth', storage: localStorage }] }
})