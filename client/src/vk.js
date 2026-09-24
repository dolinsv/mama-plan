import vkBridge from '@vkontakte/vk-bridge'

function resolveBridge(mod) {
  const seen = new Set()
  let current = mod
  for (let i = 0; i < 4 && current && typeof current === 'object' && !seen.has(current); i++) {
    seen.add(current)
    if (typeof current.send === 'function' && typeof current.subscribe === 'function') {
      return {
        send: current.send.bind(current),
        subscribe: current.subscribe.bind(current)
      }
    }
    current = current.default
  }
  return null
}

const bridge = resolveBridge(vkBridge) || (typeof window !== 'undefined' ? resolveBridge(window.vkBridge) : null)

export function getVkBridge() {
  return bridge
}

export function isVkLaunch() {
  const params = new URLSearchParams(window.location.search)
  return params.has('vk_platform') || params.has('vk_app_id') || params.has('sign')
}

function markEmbedded(insets) {
  const root = document.documentElement
  root.classList.add('vk-app')
  const platform = new URLSearchParams(window.location.search).get('vk_platform') ?? ''
  root.classList.toggle('vk-mobile', platform.startsWith('mobile'))
  root.classList.toggle('vk-desktop', platform === 'desktop_web' || platform === 'web')
  if (!insets) return
  if (typeof insets.top === 'number') {
    root.style.setProperty('--vk-inset-top', `${Math.max(0, insets.top)}px`)
  }
  if (typeof insets.right === 'number') {
    root.style.setProperty('--vk-inset-right', `${Math.max(0, insets.right)}px`)
  }
  if (typeof insets.bottom === 'number') {
    root.style.setProperty('--vk-inset-bottom', `${Math.max(0, insets.bottom)}px`)
  }
  if (typeof insets.left === 'number') {
    root.style.setProperty('--vk-inset-left', `${Math.max(0, insets.left)}px`)
  }
}

function readInsets(data) {
  if (!data || typeof data !== 'object' || !('insets' in data)) return undefined
  const insets = data.insets
  return insets && typeof insets === 'object' ? insets : undefined
}

function applyConfig(data) {
  markEmbedded(readInsets(data))
}

let initPromise = null

export function ensureVkReady() {
  if (!isVkLaunch() || !bridge) return Promise.resolve(false)
  if (initPromise) return initPromise
  initPromise = bridge
    .send('VKWebAppInit')
    .then(() => true)
    .catch(() => false)
  return initPromise
}

export function syncVkChrome() {
  if (!bridge || !document.documentElement.classList.contains('vk-app')) return
  void bridge
    .send('VKWebAppSetViewSettings', {
      status_bar_style: 'dark',
      action_bar_color: '#eef6f2',
      navigation_bar_color: '#ffffff'
    })
    .catch(() => {})
}

export function startVkApp() {
  if (isVkLaunch()) markEmbedded()
  if (!bridge) return

  bridge.subscribe((event) => {
    if (event.detail.type === 'VKWebAppUpdateConfig') applyConfig(event.detail.data)
  })

  void bridge.send('VKWebAppGetConfig').then(applyConfig, () => {})

  void ensureVkReady().then((ok) => {
    if (!ok) return
    markEmbedded()
    syncVkChrome()
    void bridge.send('VKWebAppGetConfig').then(applyConfig, () => {})
  })
}
