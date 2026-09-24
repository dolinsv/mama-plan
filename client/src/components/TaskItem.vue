<template>
  <article class="task" :class="{ done: task.done, editing }" :style="{ '--cat': category.color }">
    <button
      class="check"
      :class="{ checked: task.done }"
      :aria-label="task.done ? 'Вернуть в работу' : 'Отметить выполненной'"
      @click="$emit('toggle', task.id)"
    >
      <span v-if="task.done" class="mark">✓</span>
    </button>

    <div class="body" @dblclick="startEdit">
      <div v-if="!editing" class="content">
        <p class="text">{{ task.text }}</p>
        <p v-if="task.note" class="note">{{ task.note }}</p>
        <div class="meta">
          <span class="chip cat">{{ category.icon }} {{ category.name }}</span>
          <span class="chip pri" :style="{ color: priority.tone }">{{ priority.name }}</span>
        </div>
      </div>

      <form v-else class="edit-form" @submit.prevent="save">
        <input
          ref="inputEl"
          v-model="draft"
          class="edit-input"
          maxlength="120"
          placeholder="Название задачи"
          @keydown.esc.prevent="cancel"
        />
        <textarea
          v-model="draftNote"
          class="edit-note"
          maxlength="200"
          rows="2"
          placeholder="Заметка (необязательно)"
          @keydown.esc.prevent="cancel"
        />
        <div class="edit-actions">
          <button type="submit" class="mini save">Сохранить</button>
          <button type="button" class="mini ghost" @click="cancel">Отмена</button>
        </div>
      </form>
    </div>

    <div class="side">
      <button class="icon-btn" aria-label="Редактировать" @click="startEdit">✎</button>
      <button class="icon-btn danger" aria-label="Удалить" @click="$emit('remove', task.id)">✕</button>
    </div>
  </article>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import { categoryById, priorityById } from '../utils/planner'

const props = defineProps({
  task: { type: Object, required: true }
})

const emit = defineEmits(['toggle', 'remove', 'update'])

const editing = ref(false)
const draft = ref('')
const draftNote = ref('')
const inputEl = ref(null)

const category = computed(() => categoryById(props.task.category))
const priority = computed(() => priorityById(props.task.priority))

async function startEdit() {
  draft.value = props.task.text
  draftNote.value = props.task.note || ''
  editing.value = true
  await nextTick()
  inputEl.value?.focus()
  inputEl.value?.select()
}

function cancel() {
  editing.value = false
}

function save() {
  const text = draft.value.trim()
  if (!text) return
  emit('update', props.task.id, {
    text,
    note: draftNote.value.trim()
  })
  editing.value = false
}
</script>

<style scoped>
.task {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 12px;
  align-items: start;
  padding: 14px 14px 14px 12px;
  border-radius: 18px;
  background: var(--surface-strong);
  border: 1px solid var(--line);
  box-shadow: 0 8px 24px rgba(31, 79, 67, 0.05);
  position: relative;
  overflow: hidden;
  transition: transform 0.25s var(--ease), box-shadow 0.25s var(--ease), opacity 0.25s;
}

.task::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--cat);
}

.task:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 28px rgba(31, 79, 67, 0.1);
}

.task.done {
  opacity: 0.72;
}

.task.done .text {
  text-decoration: line-through;
  color: var(--muted);
}

.check {
  width: 28px;
  height: 28px;
  border-radius: 10px;
  border: 2px solid rgba(47, 111, 94, 0.28);
  display: grid;
  place-items: center;
  margin-top: 2px;
  transition: all 0.25s var(--ease);
  color: #fff;
  flex-shrink: 0;
}

.check.checked {
  background: var(--brand);
  border-color: var(--brand);
  animation: check-bounce 0.35s var(--ease);
}

.mark {
  font-size: 15px;
  font-weight: 800;
}

.text {
  font-size: 1rem;
  font-weight: 700;
  color: var(--ink);
  word-break: break-word;
}

.note {
  margin-top: 6px;
  color: var(--ink-soft);
  font-size: 0.86rem;
  font-weight: 600;
  line-height: 1.35;
  word-break: break-word;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.chip {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(47, 111, 94, 0.08);
  color: var(--ink-soft);
}

.chip.pri {
  background: transparent;
  padding-left: 0;
}

.side {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  color: var(--muted);
  transition: color 0.2s, background 0.2s;
}

.icon-btn:hover {
  background: rgba(47, 111, 94, 0.08);
  color: var(--brand-deep);
}

.icon-btn.danger:hover {
  background: var(--accent-soft);
  color: var(--accent);
}

.edit-form {
  display: grid;
  gap: 8px;
}

.edit-input,
.edit-note {
  width: 100%;
  border: 1px solid rgba(47, 111, 94, 0.25);
  border-radius: 12px;
  padding: 10px 12px;
  background: #fff;
  outline: none;
  user-select: text;
  font: inherit;
  color: var(--ink);
  resize: vertical;
}

.edit-input:focus,
.edit-note:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 3px rgba(47, 111, 94, 0.12);
}

.edit-actions {
  display: flex;
  gap: 8px;
}

.mini {
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 0.8rem;
  font-weight: 700;
}

.mini.save {
  background: var(--brand);
  color: #fff;
}

.mini.ghost {
  color: var(--muted);
}
</style>
