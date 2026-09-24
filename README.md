# MamaPlan — Планировщик для мам

Уютный планировщик задач для мам: категории, приоритеты, заметки, прогресс дня и онбординг.

**Демо (GitHub Pages):** https://dolinsv.github.io/mama-plan/

**VK Mini App ID:** `54558269`

## Возможности

- Задачи с категориями, приоритетами и заметками (заметки видны в списке)
- Фильтры «Сейчас / Все / Готово» и по категориям
- Онбординг при первом запуске
- Локальное сохранение + **синхронизация через VK Storage** между vk.ru и мобильным клиентом
- Отступы под системный хедер VK (п. 3.2.1 правил мини-приложений)

## Запуск

```bash
cd client
npm install
npm run dev
```

## Деплой

```bash
cd client
# GitHub Pages
npm run deploy

# VK Mini Apps hosting (нужен токен / авторизация VK)
npm run deploy:vk
```

В [dev.vk.com](https://dev.vk.com) для приложения `54558269` укажите URL приложения
(GitHub Pages или URL после `vk-miniapps-deploy`).
