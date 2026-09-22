<template>
  <div class="app">
    <div class="blobs" aria-hidden="true">
      <span class="blob b1" />
      <span class="blob b2" />
      <span class="blob b3" />
    </div>

    <ConfettiBurst :active="celebrate" />

    <header class="hero">
      <div class="hero-top">
        <div>
          <p class="eyebrow">{{ greeting }}</p>
          <h1 class="brand">MamaPlan</h1>
          <p class="date">{{ currentDate }}</p>
        </div>
        <ProgressRing :done="completedCount" :total="totalCount" />
      </div>

      <p class="motivation">{{ motivation }}</p>

      <div class="hero-stats">
        <div class="stat">
          <strong>{{ activeCount }}</strong>
          <span>в работе</span>
        </div>
        <div class="stat">
          <strong>{{ completedCount }}</strong>
          <span>готово</span>
        </div>
        <div class="stat streak" :class="{ hot: streak.count > 0 }">
          <strong>{{ streak.count }}</strong>
          <span>дней подряд</span>
        </div>
      </div>
    </header>

    <main class="shell">
      <section class="panel filters">
        <p class="panel-label">Статус</p>
        <div class="segment" role="tablist" aria-label="Фильтр по статусу">
          <button
            v-for="f in statusFilters"
            :key="f.id"
            type="button"
            role="tab"
            class="segment-btn"
            :class="{ active: statusFilter === f.id }"
            :aria-selected="statusFilter === f.id"
            @click="statusFilter = f.id"
          >
            {{ f.label }}
          </button>
        </div>

        <p class="panel-label">Категория</p>
        <div class="cat-grid" role="tablist" aria-label="Фильтр по категории">
          <button
            type="button"
            class="cat-tile"
            :class="{ active: categoryFilter === 'all' }"
            @click="categoryFilter = 'all'"
          >
            <span class="cat-ico">✦</span>
            <span>Все</span>
          </button>
          <button
            v-for="cat in categories"
            :key="cat.id"
            type="button"
            class="cat-tile"
            :class="{ active: categoryFilter === cat.id }"
            :style="{ '--tone': cat.color }"
            @click="categoryFilter = cat.id"
          >
            <span class="cat-ico">{{ cat.icon }}</span>
            <span>{{ cat.name }}</span>
          </button>
        </div>
      </section>

      <section class="panel composer">
        <form class="add-form" @submit.prevent="addTask">
          <input
            v-model="newTaskText"
            class="input"
            maxlength="120"
            placeholder="Новая задача..."
            autocomplete="off"
          />

          <div class="field-block">
            <p class="panel-label">Категория</p>
            <div class="option-row">
              <button
                v-for="cat in categories"
                :key="cat.id"
                type="button"
                class="option-chip"
                :class="{ active: newCategory === cat.id }"
                :style="{ '--tone': cat.color }"
                @click="newCategory = cat.id"
              >
                {{ cat.icon }} {{ cat.name }}
              </button>
            </div>
          </div>

          <div class="field-block">
            <p class="panel-label">Приоритет</p>
            <div class="segment priority-segment" role="group" aria-label="Приоритет">
              <button
                v-for="p in priorities"
                :key="p.id"
                type="button"
                class="segment-btn"
                :class="{ active: newPriority === p.id }"
                :style="{ '--tone': p.tone }"
                @click="newPriority = p.id"
              >
                {{ p.name }}
              </button>
            </div>
          </div>

          <button class="btn-add" type="submit" :disabled="!newTaskText.trim()">
            Добавить задачу
          </button>
        </form>

        <div class="templates">
          <span class="templates-label">Быстрый старт</span>
          <div class="templates-list">
            <button
              v-for="(tpl, i) in templates"
              :key="i"
              class="template"
              type="button"
              @click="applyTemplate(tpl)"
            >
              {{ tpl.text }}
            </button>
          </div>
        </div>
      </section>

      <section class="list-head">
        <h2>Задачи</h2>
        <button
          v-if="completedCount > 0"
          class="clear-btn"
          type="button"
          @click="clearCompleted"
        >
          Очистить готовые
        </button>
      </section>

      <TransitionGroup name="list" tag="section" class="task-list">
        <TaskItem
          v-for="task in visibleTasks"
          :key="task.id"
          :task="task"
          @toggle="toggleTask"
          @remove="deleteTask"
          @update="updateTask"
        />
      </TransitionGroup>

      <div v-if="visibleTasks.length === 0" class="empty">
        <div class="empty-icon">{{ emptyIcon }}</div>
        <p>{{ emptyTitle }}</p>
        <span>{{ emptyHint }}</span>
      </div>
    </main>

    <footer class="footer">
      <p>
        Автор
        <a href="https://vk.com/dolina_public" target="_blank" rel="noopener" class="link">
          Семья Долиных
        </a>
      </p>
    </footer>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import ProgressRing from './components/ProgressRing.vue'
import TaskItem from './components/TaskItem.vue'
import ConfettiBurst from './components/ConfettiBurst.vue'
import {
  CATEGORIES,
  PRIORITIES,
  QUICK_TEMPLATES,
  MOTIVATIONS,
  loadTasks,
  saveTasks,
  loadStreak,
  touchStreak,
  greetingForNow,
  formatDateRu
} from './utils/planner'

const tasks = ref([])
const newTaskText = ref('')
const newCategory = ref('home')
const newPriority = ref('medium')
const statusFilter = ref('active')
const categoryFilter = ref('all')
const currentDate = ref('')
const greeting = ref('')
const motivation = ref('')
const streak = ref({ count: 0, lastDate: null })
const celebrate = ref(false)
const isVkMode = ref(false)

const categories = CATEGORIES
const priorities = PRIORITIES
const templates = QUICK_TEMPLATES

const statusFilters = [
  { id: 'active', label: 'В работе' },
  { id: 'all', label: 'Все' },
  { id: 'done', label: 'Готово' }
]

const totalCount = computed(() => tasks.value.length)
const completedCount = computed(() => tasks.value.filter((t) => t.done).length)
const activeCount = computed(() => totalCount.value - completedCount.value)

const visibleTasks = computed(() => {
  let list = [...tasks.value]

  if (statusFilter.value === 'active') list = list.filter((t) => !t.done)
  if (statusFilter.value === 'done') list = list.filter((t) => t.done)
  if (categoryFilter.value !== 'all') {
    list = list.filter((t) => t.category === categoryFilter.value)
  }

  const weight = { high: 0, medium: 1, low: 2 }
  return list.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    return (weight[a.priority] ?? 1) - (weight[b.priority] ?? 1)
  })
})

const emptyIcon = computed(() => {
  if (tasks.value.length === 0) return '🌱'
  if (statusFilter.value === 'done') return '✨'
  if (activeCount.value === 0) return '🎉'
  return '🔎'
})

const emptyTitle = computed(() => {
  if (tasks.value.length === 0) return 'Пока нет задач'
  if (activeCount.value === 0 && statusFilter.value === 'active') return 'Всё сделано'
  if (statusFilter.value === 'done') return 'Ещё ничего не отмечено'
  return 'Нет задач в этом фильтре'
})

const emptyHint = computed(() => {
  if (tasks.value.length === 0) return 'Напишите задачу выше или выберите шаблон'
  if (activeCount.value === 0) return 'Отличная работа — можно отдохнуть'
  return 'Смените фильтр или добавьте новую'
})

onMounted(() => {
  const now = new Date()
  currentDate.value = formatDateRu(now)
  greeting.value = greetingForNow(now)
  motivation.value = MOTIVATIONS[now.getDate() % MOTIVATIONS.length]
  tasks.value = loadTasks()
  streak.value = loadStreak()

  if (typeof window.vkBridge !== 'undefined') {
    Promise.race([
      window.vkBridge.send('VKWebAppInit'),
      new Promise((_, reject) => setTimeout(() => reject(), 1200))
    ])
      .then(() => {
        isVkMode.value = true
      })
      .catch(() => {
        isVkMode.value = false
      })
  }
})

watch(
  tasks,
  (value) => {
    saveTasks(value)
  },
  { deep: true }
)

function addTask() {
  const text = newTaskText.value.trim()
  if (!text) return

  tasks.value.unshift({
    id: Date.now() + Math.random(),
    text,
    done: false,
    category: newCategory.value,
    priority: newPriority.value,
    createdAt: new Date().toISOString()
  })

  newTaskText.value = ''
}

function applyTemplate(tpl) {
  newTaskText.value = tpl.text
  newCategory.value = tpl.category
  newPriority.value = tpl.priority
}

function toggleTask(id) {
  const task = tasks.value.find((t) => t.id === id)
  if (!task) return

  const wasDone = task.done
  task.done = !task.done

  if (!wasDone && task.done) {
    streak.value = touchStreak()
    const remaining = tasks.value.filter((t) => !t.done).length
    if (remaining === 0 && tasks.value.length > 0) {
      celebrate.value = true
      setTimeout(() => {
        celebrate.value = false
      }, 2800)
    }
  }
}

function deleteTask(id) {
  tasks.value = tasks.value.filter((t) => t.id !== id)
}

function updateTask(id, patch) {
  const task = tasks.value.find((t) => t.id === id)
  if (!task) return
  Object.assign(task, patch)
}

function clearCompleted() {
  tasks.value = tasks.value.filter((t) => !t.done)
}
</script>

<style scoped>
.app {
  position: relative;
  min-height: 100vh;
  max-width: 520px;
  margin: 0 auto;
  padding: 20px 16px 40px;
  overflow: clip;
  animation: rise-in 0.55s var(--ease);
}

.blobs {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(30px);
  opacity: 0.45;
  animation: float-blob 10s ease-in-out infinite;
}

.b1 {
  width: 220px;
  height: 220px;
  background: #bfe3d5;
  top: 8%;
  left: -60px;
}

.b2 {
  width: 180px;
  height: 180px;
  background: #f0c8d3;
  top: 18%;
  right: -40px;
  animation-delay: -3s;
}

.b3 {
  width: 240px;
  height: 240px;
  background: #c9dff0;
  bottom: 8%;
  left: 20%;
  animation-delay: -6s;
}

.hero,
.shell,
.footer {
  position: relative;
  z-index: 1;
}

.hero {
  padding: 8px 4px 18px;
}

.hero-top {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.eyebrow {
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--brand);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.brand {
  font-family: var(--font-display);
  font-size: clamp(2.1rem, 8vw, 2.7rem);
  font-weight: 700;
  line-height: 1.05;
  color: var(--brand-deep);
  margin: 4px 0 6px;
}

.date {
  color: var(--muted);
  font-size: 0.95rem;
  text-transform: capitalize;
}

.motivation {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 16px;
  background: linear-gradient(120deg, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.35));
  border: 1px solid var(--line);
  color: var(--ink-soft);
  font-weight: 600;
  font-size: 0.95rem;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 14px;
}

.stat {
  padding: 12px 10px;
  border-radius: 16px;
  background: var(--surface);
  border: 1px solid var(--line);
  text-align: center;
  backdrop-filter: blur(10px);
}

.stat strong {
  display: block;
  font-family: var(--font-display);
  font-size: 1.35rem;
  color: var(--brand-deep);
  line-height: 1.1;
}

.stat span {
  font-size: 0.72rem;
  color: var(--muted);
  font-weight: 700;
  text-transform: lowercase;
}

.stat.hot strong {
  color: var(--accent);
}

.shell {
  display: grid;
  gap: 14px;
}

.panel {
  padding: 16px;
  border-radius: 24px;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.88), rgba(255, 255, 255, 0.62));
  border: 1px solid rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(16px);
  box-shadow: 0 16px 40px rgba(31, 79, 67, 0.1);
}

.panel-label {
  margin: 0 0 8px;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}

.panel-label + .segment,
.panel-label + .cat-grid,
.panel-label + .option-row {
  margin-bottom: 14px;
}

.field-block:last-of-type .panel-label + .segment {
  margin-bottom: 0;
}

.segment {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  padding: 4px;
  border-radius: 16px;
  background: rgba(28, 43, 38, 0.06);
}

.segment-btn {
  min-height: 40px;
  border-radius: 12px;
  font-weight: 800;
  font-size: 0.86rem;
  color: var(--ink-soft);
  transition: transform 0.2s var(--ease), background 0.2s, color 0.2s, box-shadow 0.2s;
}

.segment-btn.active {
  background: #fff;
  color: var(--brand-deep);
  box-shadow: 0 6px 16px rgba(31, 79, 67, 0.14);
}

.priority-segment .segment-btn.active {
  color: var(--tone, var(--brand-deep));
}

.cat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 0;
}

.cat-tile {
  display: grid;
  gap: 4px;
  justify-items: center;
  padding: 12px 6px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(28, 43, 38, 0.06);
  color: var(--ink-soft);
  font-size: 0.78rem;
  font-weight: 800;
  transition: transform 0.2s var(--ease), background 0.2s, border-color 0.2s, box-shadow 0.2s;
}

.cat-tile:hover {
  transform: translateY(-1px);
}

.cat-tile.active {
  background: color-mix(in srgb, var(--tone, var(--brand)) 16%, white);
  border-color: color-mix(in srgb, var(--tone, var(--brand)) 40%, white);
  color: var(--ink);
  box-shadow: 0 8px 18px color-mix(in srgb, var(--tone, var(--brand)) 22%, transparent);
}

.cat-ico {
  font-size: 1.15rem;
  line-height: 1;
}

.add-form {
  display: grid;
  gap: 14px;
}

.input {
  width: 100%;
  border-radius: 16px;
  border: 1px solid rgba(47, 111, 94, 0.14);
  background: rgba(255, 255, 255, 0.92);
  padding: 14px 16px;
  outline: none;
  color: var(--ink);
  user-select: text;
  font-size: 1rem;
  font-weight: 600;
}

.input:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 4px rgba(47, 111, 94, 0.12);
}

.option-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.option-chip {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(28, 43, 38, 0.08);
  color: var(--ink-soft);
  font-size: 0.82rem;
  font-weight: 800;
  transition: transform 0.2s var(--ease), background 0.2s, border-color 0.2s, color 0.2s;
}

.option-chip.active {
  background: color-mix(in srgb, var(--tone, var(--brand)) 18%, white);
  border-color: color-mix(in srgb, var(--tone, var(--brand)) 45%, white);
  color: var(--ink);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--tone, var(--brand)) 20%, transparent);
}

.btn-add {
  width: 100%;
  min-height: 50px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--brand), var(--brand-deep));
  color: #fff;
  font-weight: 800;
  font-size: 0.98rem;
  letter-spacing: 0.01em;
  box-shadow: 0 12px 28px rgba(47, 111, 94, 0.28);
  transition: transform 0.2s var(--ease), opacity 0.2s, box-shadow 0.2s;
}

.btn-add:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn-add:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  box-shadow: none;
}

.templates {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid rgba(28, 43, 38, 0.06);
}

.templates-label {
  display: block;
  margin-bottom: 8px;
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.templates-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.template {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(212, 99, 122, 0.08);
  color: var(--accent);
  font-size: 0.8rem;
  font-weight: 700;
  border: 1px solid rgba(212, 99, 122, 0.12);
  transition: background 0.2s, transform 0.2s var(--ease);
}

.template:hover {
  background: rgba(212, 99, 122, 0.14);
  transform: translateY(-1px);
}

.pill,
.cat-chip,
.clear-btn {
  transition: transform 0.2s var(--ease), background 0.2s, color 0.2s, border-color 0.2s;
}

.list-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px;
}

.list-head h2 {
  font-family: var(--font-display);
  font-size: 1.25rem;
  color: var(--brand-deep);
}

.clear-btn {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--accent);
  padding: 6px 10px;
  border-radius: 999px;
}

.clear-btn:hover {
  background: var(--accent-soft);
}

.task-list {
  display: grid;
  gap: 10px;
}

.empty {
  text-align: center;
  padding: 36px 16px;
  border-radius: var(--radius);
  background: rgba(255, 255, 255, 0.45);
  border: 1px dashed rgba(47, 111, 94, 0.2);
}

.empty-icon {
  font-size: 2rem;
  margin-bottom: 8px;
  animation: pop 0.45s var(--ease);
}

.empty p {
  font-family: var(--font-display);
  font-size: 1.2rem;
  color: var(--brand-deep);
  margin-bottom: 4px;
}

.empty span {
  color: var(--muted);
  font-size: 0.9rem;
}

.footer {
  text-align: center;
  margin-top: 28px;
  color: var(--muted);
  font-size: 0.85rem;
}

.link {
  color: var(--brand-deep);
  font-weight: 800;
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}

.list-enter-active,
.list-leave-active {
  transition: all 0.35s var(--ease);
}

.list-enter-from {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(20px) scale(0.96);
}

.list-move {
  transition: transform 0.35s var(--ease);
}

@media (max-width: 420px) {
  .hero-top {
    align-items: flex-start;
  }

  .cat-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .segment-btn {
    font-size: 0.8rem;
  }
}
</style>
