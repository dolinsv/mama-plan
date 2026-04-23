// client/src/utils/storage.js
import vkBridge from '@vkontakte/vk-bridge'

export const saveToVKStorage = async (data) => {
    try {
        await vkBridge.send('VKWebAppStorageSet', { key: 'tasks', value: JSON.stringify(data) })
    } catch (e) { console.warn('VK Storage недоступен') }
}

export const loadFromVKStorage = async () => {
    try {
        const res = await vkBridge.send('VKWebAppStorageGet', { key: 'tasks' })
        return res.key ? JSON.parse(res.value) : []
    } catch { return [] }
}