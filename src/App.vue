<script setup>
import { ref, onMounted } from 'vue'
import vkBridge from '@vkontakte/vk-bridge'
import axios from 'axios'

const tasks = ref([])
const userId = ref(null)
const newTaskText = ref('')
const isReady = ref(false)

const api = axios.create({ baseURL: '/api' })

onMounted(async () => {
  try {
    await vkBridge.send('VKWebAppInit')
    const userInfo = await vkBridge.send('VKWebAppGetUserInfo')
    userId.value = userInfo.id.toString()

    const res = await api.get('/tasks', { params: { user_id: userId.value } })
    tasks.value = res.data.map(t => ({ ...t, done: Boolean(t.done) }))
    isReady.value = true
  } catch (e) {
    console.warn('VK Bridge недоступен, режим оффлайн/локал:', e)
    isReady.value = true
  }
})

const toggleTask = async (task) => {
  task.done = !task.done
  await api.patch(`/tasks/${task.id}`, { done: task.done })
}

const addTask = async () => {
  if (!newTaskText.value.trim()) return
  try {
    const res = await api.post('/tasks', { user_id: userId.value, text: newTaskText.value })
    tasks.value.unshift({ ...res.data, done: false })
    newTaskText.value = ''
  } catch (e) {
    console.error('Ошибка добавления:', e)
  }
}
</script>

<template>
  <div v-if="!isReady" class="app-container">Загрузка...</div>

  <div v-else class="app-container">
    <h2>📅 MamaPlan</h2>
    <p>Задач на сегодня: {{ tasks.filter(t => !t.done).length }}</p>

    <div class="task-list">
      <div
          v-for="task in tasks"
          :key="task.id"
          class="task-item"
          :class="{ done: task.done }"
          @click="toggleTask(task)"
      >
        <input type="checkbox" :checked="task.done" @click.stop="toggleTask(task)" />
        <span>{{ task.text }}</span>
      </div>
      <p v-if="tasks.length === 0" style="text-align:center; opacity:0.6;">Нет задач</p>
    </div>

    <input
        v-model="newTaskText"
        placeholder="Новая задача..."
        style="width:100%; padding:10px; margin-top:12px; border:1px solid var(--vk-border); border-radius:8px;"
        @keyup.enter="addTask"
    />
    <button class="add-btn" @click="addTask">+ Добавить</button>
  </div>
</template>