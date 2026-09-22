<template>
  <div class="ring" :style="{ '--pct': percent }">
    <svg viewBox="0 0 96 96" aria-hidden="true">
      <circle class="track" cx="48" cy="48" r="38" />
      <circle
        class="value"
        cx="48"
        cy="48"
        r="38"
        :style="{ strokeDasharray: circumference, strokeDashoffset: offset }"
      />
    </svg>
    <div class="center">
      <strong>{{ percent }}%</strong>
      <span>готово</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  done: { type: Number, default: 0 },
  total: { type: Number, default: 0 }
})

const circumference = 2 * Math.PI * 38
const percent = computed(() =>
  props.total ? Math.round((props.done / props.total) * 100) : 0
)
const offset = computed(() => circumference - (percent.value / 100) * circumference)
</script>

<style scoped>
.ring {
  position: relative;
  width: 96px;
  height: 96px;
  flex-shrink: 0;
}

svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

circle {
  fill: none;
  stroke-width: 8;
}

.track {
  stroke: rgba(47, 111, 94, 0.12);
}

.value {
  stroke: url(#none);
  stroke: var(--brand);
  stroke-linecap: round;
  transition: stroke-dashoffset 0.7s var(--ease);
  filter: drop-shadow(0 4px 10px rgba(47, 111, 94, 0.25));
}

.center {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  text-align: center;
  gap: 0;
}

.center strong {
  font-family: var(--font-display);
  font-size: 1.25rem;
  line-height: 1;
  color: var(--brand-deep);
}

.center span {
  font-size: 0.7rem;
  color: var(--muted);
  text-transform: lowercase;
  letter-spacing: 0.04em;
}
</style>
