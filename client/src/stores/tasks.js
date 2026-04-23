// client/src/stores/tasks.js
import { defineStore } from 'pinia'

export const useTasksStore = defineStore('tasks', {
    state: () => ({
        tasks: [],
        categories: [],
        filters: { status: 'all', category: null },
        lastSync: null
    }),

    getters: {
        filteredTasks: (state) => {
            let result = state.tasks.filter(t => t.status !== 'archived')
            if (state.filters.status !== 'all') {
                result = result.filter(t => t.status === state.filters.status)
            }
            if (state.filters.category) {
                result = result.filter(t => t.category_id === state.filters.category)
            }
            return result.sort((a, b) => new Date(b.created_at || b.id) - new Date(a.created_at || a.id))
        },
        stats: (state) => {
            const total = state.tasks.filter(t => t.status !== 'archived').length
            const done = state.tasks.filter(t => t.status === 'done').length
            const overdue = state.tasks.filter(t =>
                t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done'
            ).length
            return { total, done, overdue, percent: total ? Math.round(done/total*100) : 0 }
        }
    },

    actions: {
        // 🔥 Гибридное создание: сразу в UI, потом попытка в API
        async createTask(payload) {
            // 1. Создаём локальную задачу СРАЗУ (оптимистичный подход)
            const localTask = {
                id: Date.now(),
                ...payload,
                status: payload.status || 'todo',
                priority: payload.priority || 'medium',
                created_at: new Date().toISOString(),
                category_name: '📌',
                category_color: '#888'
            }

            // 2. Добавляем в интерфейс мгновенно
            this.tasks.unshift(localTask)
            this._saveToLocalStorage()

            // 3. В фоне пробуем отправить на сервер (не блокируя интерфейс)
            this._syncToServer('post', '/tasks', payload).catch(e => {
                console.log('📦 Задача сохранена локально (сервер недоступен)')
            })

            return localTask
        },

        async updateTask(id, payload) {
            const idx = this.tasks.findIndex(t => t.id === id)
            if (idx === -1) return

            // Сохраняем старое состояние для отката
            const oldTask = { ...this.tasks[idx] }

            // Обновляем локально сразу
            this.tasks[idx] = { ...this.tasks[idx], ...payload }
            this._saveToLocalStorage()

            // Пытаемся синхронизировать с сервером
            await this._syncToServer('put', `/tasks/${id}`, payload)
                .catch(() => {
                    // При ошибке откатываем изменение
                    this.tasks[idx] = oldTask
                    this._saveToLocalStorage()
                    console.warn('⚠️ Изменение не синхронизировано с сервером')
                })
        },

        async archiveTask(id) {
            const idx = this.tasks.findIndex(t => t.id === id)
            if (idx === -1) return

            // Удаляем локально сразу
            const removed = this.tasks.splice(idx, 1)[0]
            this._saveToLocalStorage()

            // Пытаемся удалить на сервере
            await this._syncToServer('delete', `/tasks/${id}`)
                .catch(() => {
                    // При ошибке возвращаем задачу
                    this.tasks.splice(idx, 0, removed)
                    this._saveToLocalStorage()
                    console.warn('⚠️ Удаление не синхронизировано')
                })
        },

        setFilter(key, value) {
            this.filters[key] = value
            // Фильтрация происходит через getter, данные не меняем
        },

        // 🔥 Загрузка задач: сначала из localStorage, потом попытка из API
        async fetchTasks() {
            // 1. Сначала загружаем из локального хранилища (мгновенно)
            this._loadFromLocalStorage()

            // 2. Потом пробуем получить свежие данные с сервера
            try {
                const params = new URLSearchParams()
                if (this.filters.status !== 'all') params.append('status', this.filters.status)
                if (this.filters.category) params.append('category', this.filters.category)

                // Используем прямой fetch без интерцепторов для надёжности
                const response = await fetch(`/api/tasks?${params}`, {
                    headers: { 'Content-Type': 'application/json' }
                })

                if (response.ok) {
                    const data = await response.json()
                    this.tasks = data
                    this.lastSync = new Date().toISOString()
                    this._saveToLocalStorage()
                }
            } catch (e) {
                console.log('📡 Сервер недоступен, используем локальные данные')
            }
        },

        async fetchCategories() {
            // Системные категории по умолчанию
            this.categories = [
                { id: 1, name: '👶 Дети', color: '#4C6EF5', icon: '👶', is_system: 1 },
                { id: 2, name: '🏠 Дом', color: '#D97706', icon: '🏠', is_system: 1 },
                { id: 3, name: '💼 Бизнес', color: '#2F855A', icon: '💼', is_system: 1 },
                { id: 4, name: '📱 Контент', color: '#805AD5', icon: '📱', is_system: 1 },
                { id: 5, name: '❤️ Себя', color: '#E53E3E', icon: '❤️', is_system: 1 },
            ]

            // Пытаемся загрузить пользовательские категории с сервера
            try {
                const response = await fetch('/api/categories', {
                    headers: { 'Content-Type': 'application/json' }
                })
                if (response.ok) {
                    const serverCats = await response.json()
                    // Объединяем: системные + пользовательские
                    this.categories = [...this.categories, ...serverCats.filter(c => !c.is_system)]
                }
            } catch (e) {
                console.log('📡 Категории загружены локально')
            }
        },

        // 🔥 Внутренний метод для синхронизации с сервером
        async _syncToServer(method, endpoint, body = null) {
            const response = await fetch(endpoint, {
                method: method.toUpperCase(),
                headers: { 'Content-Type': 'application/json' },
                body: body ? JSON.stringify(body) : null
            })

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`)
            }

            return response.json()
        },

        // 🔥 Сохранение в localStorage (резервная копия)
        _saveToLocalStorage() {
            try {
                localStorage.setItem('mama_tasks_backup', JSON.stringify({
                    tasks: this.tasks,
                    lastSave: new Date().toISOString()
                }))
            } catch (e) {
                console.warn('⚠️ Не удалось сохранить в localStorage')
            }
        },

        // 🔥 Загрузка из localStorage
        _loadFromLocalStorage() {
            try {
                const stored = localStorage.getItem('mama_tasks_backup')
                if (stored) {
                    const { tasks } = JSON.parse(stored)
                    if (Array.isArray(tasks) && tasks.length > 0) {
                        // Не перезаписываем, если задачи уже есть (из сервера)
                        if (this.tasks.length === 0) {
                            this.tasks = tasks
                        }
                    }
                }
            } catch (e) {
                console.warn('⚠️ Не удалось загрузить из localStorage')
            }
        }
    },

    // Pinia persistence для автоматического сохранения стейта
    persist: {
        enabled: true,
        strategies: [{
            key: 'mama_tasks_store',
            storage: localStorage,
            paths: ['tasks', 'filters']
        }]
    }
})