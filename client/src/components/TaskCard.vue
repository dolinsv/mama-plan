<template>
  <div class="task-card" :class="[`priority-${task.priority}`, { done: task.status === 'done' }]">
    <div class="task-header">
      <span v-if="task.category_icon" class="category-icon">{{ task.category_icon }}</span>
      <span class="category-name" :style="{ color: task.category_color }">
        {{ task.category_name || '📌 Без категории' }}
      </span>
      <span v-if="task.due_date" class="due-date" :class="{ overdue: isOverdue }">
        {{ formatDate(task.due_date) }}
      </span>
    </div>
    <h3 class="task-title">{{ task.title }}</h3>
    <p v-if="task.description" class="task-desc">{{ task.description }}</p>
    <div class="task-actions">
      <button class="btn-toggle" @click="$emit('toggle', task)">
        {{ task.status === 'done' ? '↩ Вернуть' : '✓ Готово' }}
      </button>
      <button class="btn-archive" @click="$emit('archive', task.id)">🗑️</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({ task: { type: Object, required: true } })
defineEmits(['toggle', 'archive'])

const isOverdue = computed(() => {
  if (!props.task.due_date) return false
  return new Date(props.task.due_date) < new Date() && props.task.status !== 'done'
})
const formatDate = (iso) => new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
</script>

<style scoped>
/* Стили из main.css уже определяют .task-card, здесь только специфичные */
.task-card { cursor: pointer; }
.task-actions { margin-top: 8px; }
</style>