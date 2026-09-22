<template>
  <Teleport to="body">
    <Transition name="welcome">
      <div
        v-if="open"
        class="overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        @click.self="$emit('close')"
      >
        <div class="card">
          <p class="eyebrow">Добро пожаловать</p>
          <h2 id="welcome-title" class="title">MamaPlan</h2>
          <p class="lead">
            Простой планировщик дел для мам: записывайте задачи, отмечайте выполненное
            и держите день под контролем.
          </p>

          <ul class="features">
            <li>
              <span class="ico">✍️</span>
              <div>
                <strong>Быстрое создание</strong>
                <p>Напишите задачу сверху и нажмите «Добавить»</p>
              </div>
            </li>
            <li>
              <span class="ico">🏷️</span>
              <div>
                <strong>Категории и приоритеты</strong>
                <p>Дети, дом, работа, покупки, отдых — и уровень важности</p>
              </div>
            </li>
            <li>
              <span class="ico">📋</span>
              <div>
                <strong>Удобный список</strong>
                <p>Вкладки «Сейчас», «Все» и «Готово» помогают не путаться</p>
              </div>
            </li>
            <li>
              <span class="ico">💾</span>
              <div>
                <strong>Всё сохраняется</strong>
                <p>Задачи остаются в браузере — можно закрыть вкладку и вернуться</p>
              </div>
            </li>
          </ul>

          <button type="button" class="cta" @click="$emit('close')">
            Начать планировать
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  open: { type: Boolean, default: false }
})

defineEmits(['close'])
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(18, 32, 28, 0.45);
  backdrop-filter: blur(8px);
}

.card {
  width: min(100%, 420px);
  max-height: min(92vh, 680px);
  overflow: auto;
  padding: 28px 22px 22px;
  border-radius: 28px;
  background:
    radial-gradient(420px 180px at 10% 0%, rgba(191, 227, 213, 0.7), transparent 60%),
    radial-gradient(360px 160px at 100% 0%, rgba(240, 200, 211, 0.55), transparent 55%),
    #fff;
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 28px 60px rgba(18, 32, 28, 0.28);
  animation: pop 0.4s var(--ease);
}

.eyebrow {
  margin: 0 0 6px;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--brand);
}

.title {
  margin: 0 0 10px;
  font-family: var(--font-display);
  font-size: 2rem;
  line-height: 1.05;
  color: var(--brand-deep);
}

.lead {
  margin: 0 0 18px;
  color: var(--ink-soft);
  font-size: 0.98rem;
  font-weight: 600;
  line-height: 1.45;
}

.features {
  list-style: none;
  display: grid;
  gap: 12px;
  margin: 0 0 22px;
  padding: 0;
}

.features li {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  align-items: start;
  padding: 12px;
  border-radius: 16px;
  background: rgba(47, 111, 94, 0.05);
  border: 1px solid rgba(47, 111, 94, 0.08);
}

.ico {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 4px 12px rgba(31, 79, 67, 0.08);
  font-size: 1.05rem;
}

.features strong {
  display: block;
  margin-bottom: 2px;
  color: var(--ink);
  font-size: 0.92rem;
}

.features p {
  margin: 0;
  color: var(--muted);
  font-size: 0.82rem;
  font-weight: 600;
  line-height: 1.35;
}

.cta {
  width: 100%;
  min-height: 52px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--brand), var(--brand-deep));
  color: #fff;
  font-weight: 800;
  font-size: 1rem;
  box-shadow: 0 12px 28px rgba(47, 111, 94, 0.3);
  transition: transform 0.2s var(--ease);
}

.cta:hover {
  transform: translateY(-1px);
}

.welcome-enter-active,
.welcome-leave-active {
  transition: opacity 0.28s var(--ease);
}

.welcome-enter-active .card,
.welcome-leave-active .card {
  transition: transform 0.28s var(--ease), opacity 0.28s var(--ease);
}

.welcome-enter-from,
.welcome-leave-to {
  opacity: 0;
}

.welcome-enter-from .card,
.welcome-leave-to .card {
  opacity: 0;
  transform: translateY(16px) scale(0.97);
}
</style>
