<template>
  <Teleport to="body">
    <div v-if="active" class="confetti" aria-hidden="true">
      <span
        v-for="piece in pieces"
        :key="piece.id"
        class="piece"
        :style="piece.style"
      />
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  active: { type: Boolean, default: false }
})

const colors = ['#2f6f5e', '#d4637a', '#d4a04a', '#6ea8c9', '#7b6bb0', '#fff']

const pieces = computed(() =>
  Array.from({ length: 42 }, (_, i) => ({
    id: i,
    style: {
      left: `${Math.random() * 100}%`,
      background: colors[i % colors.length],
      animationDelay: `${Math.random() * 0.6}s`,
      animationDuration: `${2.2 + Math.random() * 1.6}s`,
      width: `${6 + Math.random() * 8}px`,
      height: `${8 + Math.random() * 12}px`,
      borderRadius: Math.random() > 0.5 ? '50%' : '3px'
    }
  }))
)
</script>

<style scoped>
.confetti {
  pointer-events: none;
  position: fixed;
  inset: 0;
  overflow: hidden;
  z-index: 100;
}

.piece {
  position: absolute;
  top: -20px;
  opacity: 0.95;
  animation-name: confetti-fall;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}
</style>
