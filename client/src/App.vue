<template>
  <div class="app">
    <div class="blobs" aria-hidden="true">
      <span class="blob b1" />
      <span class="blob b2" />
      <span class="blob b3" />
    </div>

    <ConfettiBurst :active="celebrate" />
    <WelcomeModal :open="showWelcome" @close="closeWelcome" />

    <header class="topbar">
      <div class="topbar-text">
        <h1 class="brand">MamaPlan</h1>
        <p class="sub">{{ greeting }} · {{ currentDate }}</p>
      </div>
      <div class="progress-pill" :title="`${completedCount} из ${totalCount}`">
        <strong>{{ progressPercent }}%</strong>
        <span>готово</span>
      </div>
    </header>

    <section class="composer" aria-label="Создать задачу">
      <form class="composer-bar" @submit.prevent="addTask">
        <input
          ref="inputRef"
          v-model="newTaskText"
          class="input"
          maxlength="120"
          placeholder="Напишите задачу и нажмите «Добавить»"
          autocomplete="off"
        />
        <button class="btn-add" type="submit" :disabled="!newTaskText.trim()">
          Добавить
        </button>
      </form>

      <input
        v-model="newTaskNote"
        class="note-input"
        maxlength="200"
        placeholder="Заметка к задаче (необязательно)"
        autocomplete="off"
      />

      <div class="composer-meta">
        <div class="meta-scroll" role="group" aria-label="Категория новой задачи">
          <button
            v-for="cat in categories"
            :key="cat.id"
            type="button"
            class="meta-chip"
            :class="{ active: newCategory === cat.id }"
            :style="{ '--tone': cat.color }"
            @click="newCategory = cat.id"
          >
            {{ cat.icon }} {{ cat.name }}
          </button>
        </div>
        <div class="priority-row" role="group" aria-label="Приоритет">
          <button
            v-for="p in priorities"
            :key="p.id"
            type="button"
            class="prio-btn"
            :class="{ active: newPriority === p.id }"
            :style="{ '--tone': p.tone }"
            @click="newPriority = p.id"
          >
            {{ p.name }}
          </button>
        </div>
      </div>
    </section>

    <main class="shell">
      <section class="list-panel">
        <div class="list-toolbar">
          <div class="tabs" role="tablist" aria-label="Показать задачи">
            <button
              v-for="f in statusFilters"
              :key="f.id"
              type="button"
              class="tab"
              :class="{ active: statusFilter === f.id }"
              @click="statusFilter = f.id"
            >
              {{ f.label }}
              <span class="count">{{ statusCounts[f.id] }}</span>
            </button>
          </div>

          <button
            v-if="completedCount > 0"
            class="clear-btn"
            type="button"
            @click="clearCompleted"
          >
            Очистить готовые
          </button>
        </div>

        <div class="filter-scroll" role="tablist" aria-label="Фильтр категории">
          <button
            type="button"
            class="filter-chip"
            :class="{ active: categoryFilter === 'all' }"
            @click="categoryFilter = 'all'"
          >
            Все
          </button>
          <button
            v-for="cat in categories"
            :key="cat.id"
            type="button"
            class="filter-chip"
            :class="{ active: categoryFilter === cat.id }"
            :style="{ '--tone': cat.color }"
            @click="categoryFilter = cat.id"
          >
            {{ cat.icon }} {{ cat.name }}
          </button>
        </div>

        <TransitionGroup
          name="list"
          tag="div"
          class="task-list"
          ref="listRef"
        >
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
          <p class="empty-title">{{ emptyTitle }}</p>
          <p class="empty-hint">{{ emptyHint }}</p>

          <div v-if="tasks.length === 0" class="empty-templates">
            <p class="empty-label">Или возьмите готовый вариант:</p>
            <button
              v-for="(tpl, i) in templates"
              :key="i"
              type="button"
              class="template"
              @click="quickAdd(tpl)"
            >
              {{ tpl.text }}
            </button>
          </div>
        </div>
      </section>
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
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import TaskItem from './components/TaskItem.vue'
import ConfettiBurst from './components/ConfettiBurst.vue'
import WelcomeModal from './components/WelcomeModal.vue'
import { startVkApp, isVkLaunch } from './vk'
import { loadVkState, saveVkState, isVkStorageAvailable } from './utils/vkStorage'
import {
  CATEGORIES,
  PRIORITIES,
  QUICK_TEMPLATES,
  loadTasks,
  saveTasks,
  loadStreak,
  saveStreak,
  touchStreak,
  greetingForNow,
  formatDateRu,
  hasSeenWelcome,
  markWelcomeSeen,
  getLocalUpdatedAt,
  setLocalUpdatedAt
} from './utils/planner'

const tasks = ref([])
const newTaskText = ref('')
const newTaskNote = ref('')
const newCategory = ref('home')
const newPriority = ref('medium')
const statusFilter = ref('active')
const categoryFilter = ref('all')
const currentDate = ref('')
const greeting = ref('')
const streak = ref({ count: 0, lastDate: null })
const celebrate = ref(false)
const showWelcome = ref(false)
const inputRef = ref(null)
const syncReady = ref(false)
let syncTimer = null
let applyingRemote = false

const categories = CATEGORIES
const priorities = PRIORITIES
const templates = QUICK_TEMPLATES

const statusFilters = [
  { id: 'active', label: 'Сейчас' },
  { id: 'all', label: 'Все' },
  { id: 'done', label: 'Готово' }
]

const totalCount = computed(() => tasks.value.length)
const completedCount = computed(() => tasks.value.filter((t) => t.done).length)
const activeCount = computed(() => totalCount.value - completedCount.value)
const progressPercent = computed(() =>
  totalCount.value ? Math.round((completedCount.value / totalCount.value) * 100) : 0
)

const statusCounts = computed(() => ({
  active: activeCount.value,
  all: totalCount.value,
  done: completedCount.value
}))

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

const emptyTitle = computed(() => {
  if (tasks.value.length === 0) return 'Список пуст'
  if (activeCount.value === 0 && statusFilter.value === 'active') return 'Все текущие задачи сделаны'
  if (statusFilter.value === 'done') return 'Пока нет выполненных'
  return 'В этом разделе пусто'
})

const emptyHint = computed(() => {
  if (tasks.value.length === 0) return 'Напишите задачу сверху и нажмите «Добавить»'
  if (activeCount.value === 0) return 'Можно добавить новую или открыть вкладку «Все»'
  return 'Смените фильтр выше'
})

function persistLocal(updatedAt = Date.now()) {
  saveTasks(tasks.value)
  saveStreak(streak.value)
  setLocalUpdatedAt(updatedAt)
  return updatedAt
}

function scheduleVkSync(updatedAt) {
  if (!isVkStorageAvailable() || !syncReady.value) return
  clearTimeout(syncTimer)
  syncTimer = setTimeout(() => {
    void saveVkState({
      tasks: tasks.value,
      streak: streak.value,
      welcomeSeen: hasSeenWelcome(),
      updatedAt
    }).catch(() => {})
  }, 400)
}

async function hydrateFromVk() {
  if (!isVkStorageAvailable()) return
  try {
    const remote = await loadVkState()
    const localUpdatedAt = getLocalUpdatedAt()

    if (remote && remote.updatedAt > localUpdatedAt) {
      applyingRemote = true
      tasks.value = Array.isArray(remote.tasks) ? remote.tasks : []
      streak.value = remote.streak || { count: 0, lastDate: null }
      if (remote.welcomeSeen) markWelcomeSeen()
      persistLocal(remote.updatedAt)
      showWelcome.value = !hasSeenWelcome()
      applyingRemote = false
      return
    }

    const updatedAt = localUpdatedAt || Date.now()
    persistLocal(updatedAt)
    await saveVkState({
      tasks: tasks.value,
      streak: streak.value,
      welcomeSeen: hasSeenWelcome(),
      updatedAt
    })
  } catch {
    /* offline / bridge fail — local data stays */
  }
}

onMounted(async () => {
  startVkApp()

  const now = new Date()
  currentDate.value = formatDateRu(now)
  greeting.value = greetingForNow(now)
  tasks.value = loadTasks()
  streak.value = loadStreak()
  showWelcome.value = !hasSeenWelcome()

  if (isVkLaunch()) {
    await hydrateFromVk()
  }
  syncReady.value = true

  if (!showWelcome.value) {
    nextTick(() => inputRef.value?.focus())
  }
})

function closeWelcome() {
  showWelcome.value = false
  markWelcomeSeen()
  const updatedAt = persistLocal()
  scheduleVkSync(updatedAt)
  nextTick(() => inputRef.value?.focus())
}

watch(
  [tasks, streak],
  () => {
    if (applyingRemote) return
    const updatedAt = persistLocal()
    scheduleVkSync(updatedAt)
  },
  { deep: true }
)

async function addTask() {
  const text = newTaskText.value.trim()
  if (!text) return

  tasks.value.unshift({
    id: Date.now() + Math.random(),
    text,
    note: newTaskNote.value.trim(),
    done: false,
    category: newCategory.value,
    priority: newPriority.value,
    createdAt: new Date().toISOString()
  })

  newTaskText.value = ''
  newTaskNote.value = ''
  statusFilter.value = 'active'
  categoryFilter.value = 'all'

  await nextTick()
  inputRef.value?.focus()
}

function quickAdd(tpl) {
  newTaskText.value = tpl.text
  newTaskNote.value = ''
  newCategory.value = tpl.category
  newPriority.value = tpl.priority
  addTask()
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
  padding: 16px 14px 36px;
  overflow: clip;
  animation: rise-in 0.45s var(--ease);
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
  opacity: 0.4;
  animation: float-blob 10s ease-in-out infinite;
}

.b1 {
  width: 220px;
  height: 220px;
  background: #bfe3d5;
  top: 6%;
  left: -70px;
}

.b2 {
  width: 180px;
  height: 180px;
  background: #f0c8d3;
  top: 12%;
  right: -50px;
  animation-delay: -3s;
}

.b3 {
  width: 220px;
  height: 220px;
  background: #c9dff0;
  bottom: 10%;
  left: 30%;
  animation-delay: -6s;
}

.topbar,
.composer,
.shell,
.footer {
  position: relative;
  z-index: 1;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  padding: 4px 2px;
}

.brand {
  font-family: var(--font-display);
  font-size: 1.85rem;
  line-height: 1;
  color: var(--brand-deep);
  margin: 0 0 4px;
}

.sub {
  margin: 0;
  color: var(--muted);
  font-size: 0.86rem;
  font-weight: 600;
  text-transform: capitalize;
}

.progress-pill {
  display: grid;
  justify-items: center;
  min-width: 72px;
  padding: 10px 12px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(47, 111, 94, 0.12);
  box-shadow: 0 10px 24px rgba(31, 79, 67, 0.08);
}

.progress-pill strong {
  font-family: var(--font-display);
  font-size: 1.2rem;
  color: var(--brand-deep);
  line-height: 1;
}

.progress-pill span {
  font-size: 0.68rem;
  font-weight: 800;
  color: var(--muted);
  text-transform: lowercase;
}

.composer {
  position: sticky;
  top: 8px;
  z-index: 5;
  margin-bottom: 14px;
  padding: 12px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(16px);
  box-shadow: 0 16px 36px rgba(31, 79, 67, 0.12);
}

.composer-bar {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
}

.input {
  width: 100%;
  min-height: 48px;
  border-radius: 14px;
  border: 1px solid rgba(47, 111, 94, 0.16);
  background: #fff;
  padding: 12px 14px;
  outline: none;
  color: var(--ink);
  font-size: 1rem;
  font-weight: 600;
  user-select: text;
}

.input:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 4px rgba(47, 111, 94, 0.12);
}

.note-input {
  width: 100%;
  margin-top: 8px;
  min-height: 40px;
  border-radius: 12px;
  border: 1px solid rgba(47, 111, 94, 0.12);
  background: rgba(255, 255, 255, 0.85);
  padding: 10px 12px;
  outline: none;
  color: var(--ink);
  font-size: 0.9rem;
  font-weight: 600;
  user-select: text;
}

.note-input:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 3px rgba(47, 111, 94, 0.1);
}

.btn-add {
  min-width: 108px;
  min-height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--brand), var(--brand-deep));
  color: #fff;
  font-weight: 800;
  box-shadow: 0 10px 22px rgba(47, 111, 94, 0.28);
  transition: transform 0.2s var(--ease), opacity 0.2s;
}

.btn-add:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn-add:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  box-shadow: none;
}

.composer-meta {
  display: grid;
  gap: 8px;
  margin-top: 10px;
}

.meta-scroll,
.filter-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: none;
}

.meta-scroll::-webkit-scrollbar,
.filter-scroll::-webkit-scrollbar {
  display: none;
}

.meta-chip,
.filter-chip {
  flex: 0 0 auto;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(28, 43, 38, 0.05);
  border: 1px solid transparent;
  color: var(--ink-soft);
  font-size: 0.82rem;
  font-weight: 800;
  white-space: nowrap;
  transition: background 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;
}

.meta-chip.active,
.filter-chip.active {
  background: color-mix(in srgb, var(--tone, var(--brand)) 18%, white);
  border-color: color-mix(in srgb, var(--tone, var(--brand)) 40%, white);
  color: var(--ink);
  box-shadow: 0 6px 14px color-mix(in srgb, var(--tone, var(--brand)) 18%, transparent);
}

.priority-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  padding: 4px;
  border-radius: 14px;
  background: rgba(28, 43, 38, 0.05);
}

.prio-btn {
  min-height: 36px;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 800;
  color: var(--ink-soft);
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
}

.prio-btn.active {
  background: #fff;
  color: var(--tone, var(--brand-deep));
  box-shadow: 0 4px 12px rgba(31, 79, 67, 0.12);
}

.list-panel {
  padding: 14px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(12px);
  box-shadow: 0 14px 34px rgba(31, 79, 67, 0.08);
}

.list-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  flex: 1;
  padding: 4px;
  border-radius: 14px;
  background: rgba(28, 43, 38, 0.05);
}

.tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  min-height: 38px;
  border-radius: 10px;
  font-size: 0.84rem;
  font-weight: 800;
  color: var(--ink-soft);
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
}

.tab.active {
  background: #fff;
  color: var(--brand-deep);
  box-shadow: 0 5px 14px rgba(31, 79, 67, 0.12);
}

.count {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: rgba(47, 111, 94, 0.1);
  color: var(--brand-deep);
  font-size: 0.7rem;
  line-height: 18px;
}

.tab.active .count {
  background: rgba(47, 111, 94, 0.14);
}

.clear-btn {
  flex-shrink: 0;
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--accent);
  padding: 8px 10px;
  border-radius: 999px;
  white-space: nowrap;
}

.clear-btn:hover {
  background: var(--accent-soft);
}

.filter-scroll {
  margin-bottom: 12px;
}

.task-list {
  display: grid;
  gap: 10px;
  min-height: 48px;
}

.empty {
  text-align: center;
  padding: 28px 10px 12px;
}

.empty-title {
  margin: 0 0 6px;
  font-family: var(--font-display);
  font-size: 1.25rem;
  color: var(--brand-deep);
}

.empty-hint {
  margin: 0;
  color: var(--muted);
  font-size: 0.92rem;
  font-weight: 600;
}

.empty-templates {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 18px;
}

.empty-label {
  width: 100%;
  margin: 0 0 4px;
  font-size: 0.78rem;
  font-weight: 800;
  color: var(--muted);
}

.template {
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(212, 99, 122, 0.08);
  color: var(--accent);
  font-size: 0.8rem;
  font-weight: 700;
  border: 1px solid rgba(212, 99, 122, 0.12);
}

.template:hover {
  background: rgba(212, 99, 122, 0.14);
}

.footer {
  text-align: center;
  margin-top: 22px;
  color: var(--muted);
  font-size: 0.84rem;
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
  transition: all 0.3s var(--ease);
}

.list-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(16px);
}

.list-move {
  transition: transform 0.3s var(--ease);
}

@media (max-width: 420px) {
  .composer-bar {
    grid-template-columns: 1fr;
  }

  .btn-add {
    width: 100%;
  }

  .list-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .clear-btn {
    align-self: flex-end;
  }
}
</style>
