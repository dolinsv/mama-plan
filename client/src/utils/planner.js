export const CATEGORIES = [
  { id: 'kids', name: 'Дети', icon: '👶', color: '#6ea8c9' },
  { id: 'home', name: 'Дом', icon: '🏠', color: '#2f6f5e' },
  { id: 'self', name: 'Отдых', icon: '🌿', color: '#d4637a' },
  { id: 'work', name: 'Работа', icon: '💼', color: '#d4a04a' },
  { id: 'shop', name: 'Покупки', icon: '🛒', color: '#7b6bb0' }
]

export const PRIORITIES = [
  { id: 'low', name: 'Обычно', tone: '#7a9489' },
  { id: 'medium', name: 'Важно', tone: '#d4a04a' },
  { id: 'high', name: 'Срочно', tone: '#d4637a' }
]

export const QUICK_TEMPLATES = [
  { text: 'Собрать ребёнка в сад', category: 'kids', priority: 'high' },
  { text: 'Приготовить ужин', category: 'home', priority: 'medium' },
  { text: '10 минут для себя', category: 'self', priority: 'medium' },
  { text: 'Купить продукты', category: 'shop', priority: 'low' },
  { text: 'Ответить на сообщения', category: 'work', priority: 'low' }
]

const STORAGE_KEY = 'mama_plan_v2'
const LEGACY_KEY = 'mama_tasks'
const STREAK_KEY = 'mama_plan_streak'
const WELCOME_KEY = 'mama_plan_welcome_seen_v2'
const UPDATED_AT_KEY = 'mama_plan_updated_at'

export function hasSeenWelcome() {
  try {
    return localStorage.getItem(WELCOME_KEY) === '1'
  } catch {
    return false
  }
}

export function markWelcomeSeen() {
  try {
    localStorage.setItem(WELCOME_KEY, '1')
  } catch {
    /* ignore */
  }
}

export function getLocalUpdatedAt() {
  try {
    return Number(localStorage.getItem(UPDATED_AT_KEY) || 0)
  } catch {
    return 0
  }
}

export function setLocalUpdatedAt(ts) {
  try {
    localStorage.setItem(UPDATED_AT_KEY, String(ts))
  } catch {
    /* ignore */
  }
}

function normalizeTask(t) {
  return {
    id: t.id || Date.now() + Math.random(),
    text: String(t.text || '').trim(),
    note: typeof t.note === 'string' ? t.note.trim() : '',
    done: Boolean(t.done),
    category: t.category || 'home',
    priority: t.priority || 'medium',
    createdAt: t.createdAt || new Date().toISOString()
  }
}

function isValidTask(task) {
  return task && typeof task.text === 'string' && task.text.trim() !== ''
}

export function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.filter(isValidTask).map(normalizeTask)
    }

    const legacy = localStorage.getItem(LEGACY_KEY)
    if (legacy) {
      const parsed = JSON.parse(legacy)
      if (Array.isArray(parsed)) {
        return parsed
          .filter((t) => typeof t?.text === 'string' && t.text.trim())
          .map(normalizeTask)
      }
    }
  } catch {
    /* ignore */
  }
  return []
}

export function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}

export function greetingForNow(date = new Date()) {
  const h = date.getHours()
  if (h < 6) return 'Доброй ночи'
  if (h < 12) return 'Доброе утро'
  if (h < 18) return 'Добрый день'
  return 'Добрый вечер'
}

export function formatDateRu(date = new Date()) {
  return date.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })
}

export function loadStreak() {
  try {
    const raw = localStorage.getItem(STREAK_KEY)
    if (!raw) return { count: 0, lastDate: null }
    return JSON.parse(raw)
  } catch {
    return { count: 0, lastDate: null }
  }
}

export function saveStreak(streak) {
  localStorage.setItem(STREAK_KEY, JSON.stringify(streak))
}

export function touchStreak() {
  const today = new Date().toISOString().slice(0, 10)
  const streak = loadStreak()
  if (streak.lastDate === today) return streak

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const y = yesterday.toISOString().slice(0, 10)

  const next = {
    count: streak.lastDate === y ? streak.count + 1 : 1,
    lastDate: today
  }
  saveStreak(next)
  return next
}

export function categoryById(id) {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[1]
}

export function priorityById(id) {
  return PRIORITIES.find((p) => p.id === id) || PRIORITIES[1]
}
