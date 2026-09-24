import { ensureVkReady, getVkBridge, isVkLaunch } from '../vk'

const META_KEY = 'mp_meta'
const TASKS_PREFIX = 'mp_tasks_'
const STREAK_KEY = 'mp_streak'
const WELCOME_KEY = 'mp_welcome'
const MAX_CHARS = 3200

function packChunks(items) {
  if (!items.length) return ['[]']
  const chunks = []
  let bucket = []

  for (const item of items) {
    const trial = JSON.stringify([...bucket, item])
    if (trial.length > MAX_CHARS && bucket.length > 0) {
      chunks.push(JSON.stringify(bucket))
      bucket = [item]
      if (JSON.stringify(bucket).length > MAX_CHARS) {
        chunks.push(JSON.stringify(bucket))
        bucket = []
      }
    } else {
      bucket.push(item)
    }
  }

  if (bucket.length > 0 || chunks.length === 0) {
    chunks.push(JSON.stringify(bucket))
  }
  return chunks
}

async function storageSet(key, value) {
  const bridge = getVkBridge()
  if (!bridge) throw new Error('VK Bridge недоступен')
  await bridge.send('VKWebAppStorageSet', { key, value })
}

async function storageGet(keys) {
  const bridge = getVkBridge()
  if (!bridge || keys.length === 0) return {}
  const out = {}
  for (let i = 0; i < keys.length; i += 10) {
    const batch = keys.slice(i, i + 10)
    const raw = await bridge.send('VKWebAppStorageGet', { keys: batch })
    const list = raw && Array.isArray(raw.keys) ? raw.keys : []
    for (const item of list) {
      if (item.key) out[item.key] = item.value ?? ''
    }
  }
  return out
}

function parseJson(raw, fallback) {
  if (!raw) return fallback
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function isVkStorageAvailable() {
  return isVkLaunch() && !!getVkBridge()
}

export async function loadVkState() {
  if (!isVkStorageAvailable()) return null
  const ready = await ensureVkReady()
  if (!ready) return null

  const metaMap = await storageGet([META_KEY, STREAK_KEY, WELCOME_KEY])
  const meta = parseJson(metaMap[META_KEY], null)
  if (!meta || meta.v !== 1 || !meta.updatedAt) return null

  const count = Math.max(1, Number(meta.parts || 1))
  const keys = Array.from({ length: count }, (_, i) => `${TASKS_PREFIX}${i}`)
  const values = await storageGet(keys)
  const tasks = []
  for (let i = 0; i < count; i++) {
    const part = parseJson(values[`${TASKS_PREFIX}${i}`], [])
    if (Array.isArray(part)) tasks.push(...part)
  }

  return {
    tasks,
    streak: parseJson(metaMap[STREAK_KEY], { count: 0, lastDate: null }),
    welcomeSeen: metaMap[WELCOME_KEY] === '1',
    updatedAt: meta.updatedAt
  }
}

export async function saveVkState({ tasks, streak, welcomeSeen, updatedAt }) {
  if (!isVkStorageAvailable()) return
  const ready = await ensureVkReady()
  if (!ready) return

  const chunks = packChunks(tasks || [])
  const writes = chunks.map((chunk, index) => storageSet(`${TASKS_PREFIX}${index}`, chunk))

  for (let i = chunks.length; i < chunks.length + 3; i++) {
    writes.push(storageSet(`${TASKS_PREFIX}${i}`, ''))
  }

  writes.push(
    storageSet(
      META_KEY,
      JSON.stringify({ v: 1, updatedAt, parts: chunks.length })
    )
  )
  writes.push(storageSet(STREAK_KEY, JSON.stringify(streak || { count: 0, lastDate: null })))
  writes.push(storageSet(WELCOME_KEY, welcomeSeen ? '1' : '0'))

  await Promise.all(writes)
}
