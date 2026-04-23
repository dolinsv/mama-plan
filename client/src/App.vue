<template>
  <div class="app">
    <!-- 🔥 ШАПКА (СЕРЫЙ ГРАДИЕНТ) -->
    <header class="header">
      <div class="header-content">
        <h1>📅 МамаПлан</h1>
        <span class="badge" :class="{ vk: auth.isVkMode, demo: !auth.isVkMode }">
          {{ auth.isVkMode ? '🔗 ВК' : '🧪 Демо' }}
        </span>
      </div>
      <!-- 🔥 ТЕКУЩАЯ ДАТА -->
      <p class="greeting">{{ currentDate }}</p>
    </header>

    <main class="container">

      <!-- 🔥 БЛОК СТАТИСТИКИ -->
      <div class="stats-card card">
        <div class="stat-item">
          <span class="stat-value">{{ tasks.tasks.length }}</span>
          <span class="stat-label">ВСЕГО</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-value green">{{ completedCount }}</span>
          <span class="stat-label">✓ ВЫПОЛНЕНО</span>
        </div>
      </div>

      <!-- 🔥 СПИСОК ЗАДАЧ -->
      <div class="tasks-section">
        <div class="section-header">
          <span class="section-title">Задачи</span>
          <button
              v-if="completedCount > 0"
              class="btn-clear"
              @click="clearCompleted"
          >
            Очистить ✓
          </button>
        </div>

        <div class="task-list card">
          <div
              v-for="task in tasks.filteredTasks"
              :key="task.id"
              class="task-item"
              :class="{ done: task.status === 'done' }"
          >
            <!-- Чекбокс -->
            <div
                class="checkbox"
                :class="{ checked: task.status === 'done' }"
                @click.stop="toggleTask(task)"
            >
              <span v-if="task.status === 'done'" class="check-icon">✓</span>
            </div>

            <!-- Текст -->
            <span class="task-text" @click="toggleTask(task)">{{ task.title }}</span>

            <!-- Кнопка удаления -->
            <button
                class="btn-del"
                @click.stop="deleteTask(task.id)"
                title="Удалить"
            >
              {{ task.deleting ? '...' : '✕' }}
            </button>
          </div>

          <div v-if="tasks.filteredTasks.length === 0" class="empty">
            📭 Нет задач. Добавьте первую!
          </div>
        </div>
      </div>

      <!-- 🔥 ФОРМА ДОБАВЛЕНИЯ -->
      <form @submit.prevent="handleAdd" class="add-form card">
        <input
            v-model="newTaskTitle"
            class="input"
            placeholder="Что нужно сделать? Например:"
            autocomplete="off"
        />
        <button type="submit" class="btn-add" :disabled="!newTaskTitle.trim()">
          + Добавить
        </button>
      </form>

      <!-- 🔥 ФУТЕР С ССЫЛКОЙ -->
      <footer class="footer">
        <p>
          Автор <a href="https://vk.com/dolina_public" target="_blank" rel="noopener noreferrer" class="footer-link">
          <strong>Семья Долиных ❤️</strong>
        </a>
        </p>
      </footer>

    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import { useTasksStore } from './stores/tasks'

const auth = useAuthStore()
const tasks = useTasksStore()
const newTaskTitle = ref('')

// 🔥 ПЕРЕМЕННАЯ ДЛЯ ДАТЫ
const currentDate = ref('')

const completedCount = computed(() =>
    tasks.tasks.filter(t => t.status === 'done').length
)

onMounted(async () => {
  // 1. Устанавливаем дату при загрузке
  const date = new Date()
  // Формат: "23 апреля 2026 г."
  currentDate.value = date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  // 2. Инициализируем приложение
  await auth.init()
  if (auth.isReady) await tasks.fetchTasks()
})

// Добавить
const handleAdd = async () => {
  const text = newTaskTitle.value.trim()
  if (!text) return
  await tasks.createTask({ title: text, status: 'todo', priority: 'medium' })
  newTaskTitle.value = ''
}

// Переключить статус
const toggleTask = async (task) => {
  const newStatus = task.status === 'done' ? 'todo' : 'done'
  task.status = newStatus // Мгновенный UI
  try {
    await tasks.updateTask(task.id, { status: newStatus })
  } catch (e) {
    task.status = newStatus === 'done' ? 'todo' : 'done' // Откат
  }
}

// Удалить одну
const deleteTask = async (id) => {
  const task = tasks.tasks.find(t => t.id === id)
  if (task) task.deleting = true

  try {
    const index = tasks.tasks.findIndex(t => t.id === id)
    if (index !== -1) tasks.tasks.splice(index, 1)

    try { await tasks.archiveTask(id) } catch {}
    localStorage.setItem('mama_tasks_backup', JSON.stringify(tasks.tasks))
  } catch (e) {
    if (task) task.deleting = false
    await tasks.fetchTasks()
  }
}

// Очистить выполненные
const clearCompleted = async () => {
  const completed = tasks.tasks.filter(t => t.status === 'done')
  completed.forEach(t => {
    const index = tasks.tasks.indexOf(t)
    if (index !== -1) tasks.tasks.splice(index, 1)
  })

  try {
    await Promise.all(completed.map(t => tasks.archiveTask(t.id)))
    localStorage.setItem('mama_tasks_backup', JSON.stringify(tasks.tasks))
  } catch {}
}
</script>

<style>
/* 🔥 ГЛОБАЛЬНЫЕ СТИЛИ */
* { box-sizing: border-box; margin: 0; padding: 0; user-select: none; }

body, html {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #F8F9FA;
  color: #2D3748;
}

.app { min-height: 100vh; display: flex; flex-direction: column; }
.container { max-width: 480px; margin: 0 auto; padding: 16px; width: 100%; flex: 1; }

/* 🔥 ШАПКА (СЕРЫЙ ГРАДИЕНТ) */
.header {
  background: linear-gradient(135deg, #4A5568, #2D3748);
  padding: 24px 16px 20px;
  border-radius: 0 0 16px 16px;
  color: white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.header h1 {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}
.badge.demo { background: rgba(255,255,255,0.15); }
.badge.vk { background: rgba(255,255,255,0.25); }

.greeting {
  font-size: 14px;
  opacity: 0.9;
  margin: 0;
  font-weight: 500;
}

/* 🔥 СТАТИСТИКА */
.stats-card {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-value {
  font-size: 28px;
  font-weight: 800;
  color: #2D3748;
}
.stat-value.green { color: #38A169; }

.stat-label {
  font-size: 10px;
  font-weight: 600;
  color: #A0AEC0;
  letter-spacing: 1px;
}

.stat-divider {
  width: 1px;
  height: 30px;
  background: #E2E8F0;
  margin: 0 20px;
}

/* 🔥 ЗАДАЧИ */
.tasks-section { margin-bottom: 20px; }

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px;
  margin-bottom: 10px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #4A5568;
}

.btn-clear {
  background: none;
  border: none;
  color: #718096;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}
.btn-clear:hover { text-decoration: underline; }

.task-list { padding: 4px 0; }

.task-item {
  display: flex;
  align-items: center;
  padding: 14px 12px;
  border-bottom: 1px solid #EDF2F7;
}

.task-item:last-child { border-bottom: none; }

/* Чекбокс */
.checkbox {
  width: 24px;
  height: 24px;
  border: 2px solid #CBD5E0;
  border-radius: 6px;
  margin-right: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.checkbox.checked {
  background: #38A169;
  border-color: #38A169;
}

.check-icon {
  color: white;
  font-size: 16px;
  font-weight: bold;
}

.task-text {
  flex: 1;
  font-size: 16px;
  color: #2D3748;
  cursor: pointer;
  line-height: 1.4;
}

.task-item.done .task-text {
  color: #A0AEC0;
  text-decoration: line-through;
}

.btn-del {
  background: none;
  border: none;
  color: #CBD5E0;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
  transition: color 0.2s;
}
.btn-del:hover { color: #E53E3E; }

.empty {
  text-align: center;
  padding: 24px;
  color: #A0AEC0;
  font-size: 14px;
}

/* 🔥 ФОРМА ДОБАВЛЕНИЯ */
.add-form {
  display: flex;
  gap: 12px;
  padding: 12px;
}

.input {
  flex: 1;
  padding: 14px 16px;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  font-size: 16px;
  background: #F7FAFC;
  outline: none;
  user-select: text;
  color: #2D3748;
}

.input:focus {
  border-color: #4A5568;
  background: white;
}

/* Кнопка добавления */
.btn-add {
  background: #4A5568;
  color: white;
  border: none;
  padding: 0 20px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s;
}

.btn-add:hover:not(:disabled) {
  background: #2D3748;
}

.btn-add:disabled {
  background: #CBD5E0;
  cursor: not-allowed;
}

/* 🔥 ФУТЕР С ССЫЛКОЙ */
.footer {
  text-align: center;
  padding: 24px 0;
  font-size: 13px;
  color: #A0AEC0;
}

.footer-link {
  color: #4A5568;
  text-decoration: none;
  transition: color 0.2s;
  border-bottom: 1px dashed transparent;
}

.footer-link:hover {
  color: #2D3748;
  border-bottom-color: #2D3748;
}

.footer-link strong {
  font-weight: 600;
}

/* Адаптив */
@media (max-width: 380px) {
  .add-form { flex-direction: column; }
  .btn-add { width: 100%; padding: 14px; }
}
</style>