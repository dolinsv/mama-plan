<template>
  <div class="app">
    <header class="header">
      <div class="header-content">
        <h1>📅 Планировщик для мам</h1>
        <span class="badge">{{ isVkMode ? '🔗 ВК' : '🧪 Демо' }}</span>
      </div>
      <p class="greeting">{{ currentDate }}</p>
    </header>

    <main class="container">
      <div class="stats-card card">
        <div class="stat-item">
          <span class="stat-value">{{ totalCount }}</span>
          <span class="stat-label">ВСЕГО</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value green">{{ completedCount }}</span>
          <span class="stat-label">✓ ВЫПОЛНЕНО</span>
        </div>
      </div>

      <div class="tasks-section">
        <div class="section-header">
          <span class="section-title">Задачи</span>
          <button v-if="completedCount > 0" class="btn-clear" @click="clearCompleted">
            Очистить ✓
          </button>
        </div>

        <div class="task-list card">
          <div v-for="task in tasks" :key="task.id" class="task-item" :class="{ done: task.done }">
            <div class="checkbox" :class="{ checked: task.done }" @click.stop="toggleTask(task)">
              <span v-if="task.done" class="check-icon">✓</span>
            </div>
            <span class="task-text" @click="toggleTask(task)">{{ task.text }}</span>
            <button class="btn-del" @click.stop="deleteTask(task.id)">✕</button>
          </div>
          <div v-if="tasks.length === 0" class="empty">📭 Нет задач. Добавьте первую!</div>
        </div>
      </div>

      <form @submit.prevent="addTask" class="add-form card">
        <input v-model="newTaskText" class="input" placeholder="Что нужно сделать?" autocomplete="off" />
        <button type="submit" class="btn-add" :disabled="!newTaskText.trim()">+ Добавить</button>
      </form>

      <footer class="footer">
        <p>Автор <a href="https://vk.com/dolina_public" target="_blank" rel="noopener" class="footer-link"><strong>Семья Долиных</strong></a></p>
      </footer>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const tasks = ref([])
const newTaskText = ref('')
const currentDate = ref('')
const isVkMode = ref(false)

const totalCount = computed(() => tasks.value.length)
const completedCount = computed(() => tasks.value.filter(t => t.done).length)

onMounted(() => {
  const d = new Date()
  currentDate.value = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

  try {
    const stored = localStorage.getItem('mama_tasks')
    if (stored) {
      const parsed = JSON.parse(stored)
      tasks.value = Array.isArray(parsed)
          ? parsed.filter(t => typeof t.text === 'string' && t.text.trim() !== '')
          : []
    }
  } catch {
    tasks.value = []
  }

  if (typeof window.vkBridge !== 'undefined') {
    Promise.race([
      window.vkBridge.send('VKWebAppInit'),
      new Promise((_, reject) => setTimeout(() => reject(), 1500))
    ]).then(() => { isVkMode.value = true }).catch(() => { isVkMode.value = false })
  }
})

const addTask = () => {
  const text = newTaskText.value.trim()
  if (!text) return
  tasks.value.unshift({ id: Date.now(), text, done: false })
  newTaskText.value = ''
  saveTasks()
}

const toggleTask = (task) => {
  task.done = !task.done
  saveTasks()
}

const deleteTask = (id) => {
  tasks.value = tasks.value.filter(t => t.id !== id)
  saveTasks()
}

const clearCompleted = () => {
  tasks.value = tasks.value.filter(t => !t.done)
  saveTasks()
}

const saveTasks = () => {
  localStorage.setItem('mama_tasks', JSON.stringify(tasks.value))
}
</script>

<style>
* { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }
body, html { height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #F8F9FA; color: #2D3748; }
.app { min-height: 100vh; display: flex; flex-direction: column; }
.container { max-width: 480px; margin: 0 auto; padding: 16px; width: 100%; flex: 1; }

.header { background: linear-gradient(135deg, #4A5568, #2D3748); padding: 24px 16px 20px; border-radius: 0 0 16px 16px; color: white; margin-bottom: 24px; }
.header-content { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.header h1 { font-size: 22px; font-weight: 700; line-height: 1.2; }
.badge { padding: 4px 10px; border-radius: 12px; font-size: 12px; background: rgba(255,255,255,0.2); }
.greeting { font-size: 14px; opacity: 0.9; margin: 0; }

.stats-card { display: flex; justify-content: center; padding: 20px; background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); margin-bottom: 20px; }
.stat-item { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.stat-value { font-size: 28px; font-weight: 800; }
.stat-value.green { color: #38A169; }
.stat-label { font-size: 10px; color: #A0AEC0; text-transform: uppercase; letter-spacing: 1px; }
.stat-divider { width: 1px; height: 30px; background: #E2E8F0; margin: 0 20px; }

.task-list { background: white; border-radius: 12px; padding: 4px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); margin-bottom: 20px; }
.task-item { display: flex; align-items: center; padding: 14px 12px; border-bottom: 1px solid #EDF2F7; }
.task-item:last-child { border-bottom: none; }
.task-item.done { opacity: 0.6; }
.task-item.done .task-text { text-decoration: line-through; color: #A0AEC0; }

.checkbox { width: 24px; height: 24px; border: 2px solid #CBD5E0; border-radius: 6px; margin-right: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.checkbox.checked { background: #38A169; border-color: #38A169; }
.check-icon { color: white; font-size: 16px; font-weight: bold; }

.task-text { flex: 1; font-size: 16px; cursor: pointer; }
.btn-del { background: none; border: none; color: #CBD5E0; font-size: 18px; cursor: pointer; padding: 4px 8px; }
.btn-del:hover { color: #E53E3E; }
.empty { text-align: center; padding: 24px; color: #A0AEC0; }

.add-form { display: flex; gap: 12px; padding: 12px; background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.input { flex: 1; padding: 14px 16px; border: 1px solid #E2E8F0; border-radius: 10px; font-size: 16px; background: #F7FAFC; outline: none; user-select: text; }
.input:focus { border-color: #4A5568; background: white; }
.btn-add { background: #4A5568; color: white; border: none; padding: 0 20px; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; white-space: nowrap; }
.btn-add:hover:not(:disabled) { background: #2D3748; }
.btn-add:disabled { background: #CBD5E0; cursor: not-allowed; }

.footer { text-align: center; padding: 24px 0; font-size: 13px; color: #A0AEC0; }
.footer-link { color: #4A5568; text-decoration: none; }
.footer-link:hover { text-decoration: underline; }

@media (max-width: 380px) { .add-form { flex-direction: column; } .btn-add { width: 100%; padding: 14px; } }
</style>