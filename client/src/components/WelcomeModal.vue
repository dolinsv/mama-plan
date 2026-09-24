<template>
  <Teleport to="body">
    <Transition name="welcome">
      <div
        v-if="open"
        class="overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
      >
        <div class="card">
          <p class="eyebrow">Первый запуск</p>
          <h2 id="welcome-title" class="title">MamaPlan</h2>
          <p class="lead">
            Планировщик дел для мам. За 30 секунд — как пользоваться:
          </p>

          <ol class="steps">
            <li>
              <span class="num">1</span>
              <div>
                <strong>Создайте задачу</strong>
                <p>В поле сверху напишите дело и нажмите «Добавить». При желании добавьте заметку.</p>
              </div>
            </li>
            <li>
              <span class="num">2</span>
              <div>
                <strong>Выберите категорию и важность</strong>
                <p>Дети, дом, работа, покупки, отдых — и приоритет: обычно / важно / срочно.</p>
              </div>
            </li>
            <li>
              <span class="num">3</span>
              <div>
                <strong>Смотрите список ниже</strong>
                <p>Вкладки «Сейчас», «Все» и «Готово». Отмечайте выполненные галочкой.</p>
              </div>
            </li>
            <li>
              <span class="num">4</span>
              <div>
                <strong>Данные синхронизируются</strong>
                <p>В VK Mini App задачи сохраняется между телефонами и vk.ru. В браузере — локально.</p>
              </div>
            </li>
          </ol>

          <button type="button" class="cta" @click="$emit('close')">
            Понятно, начать
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
  padding:
    calc(20px + var(--vk-chrome-top, 0px))
    calc(20px + var(--vk-chrome-right, 0px))
    calc(20px + var(--vk-chrome-bottom, 0px))
    20px;
  background: rgba(18, 32, 28, 0.45);
  backdrop-filter: blur(8px);
}

.card {
  width: min(100%, 420px);
  max-height: min(92vh, 720px);
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

.steps {
  list-style: none;
  display: grid;
  gap: 12px;
  margin: 0 0 22px;
  padding: 0;
  counter-reset: none;
}

.steps li {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  align-items: start;
  padding: 12px;
  border-radius: 16px;
  background: rgba(47, 111, 94, 0.05);
  border: 1px solid rgba(47, 111, 94, 0.08);
}

.num {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: var(--brand);
  color: #fff;
  font-size: 0.85rem;
  font-weight: 800;
}

.steps strong {
  display: block;
  margin-bottom: 2px;
  color: var(--ink);
  font-size: 0.92rem;
}

.steps p {
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
