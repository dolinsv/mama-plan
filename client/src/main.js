import { createApp } from 'vue'
import App from './App.vue'
import './assets/main.css'
import { startVkApp } from './vk'

startVkApp()
createApp(App).mount('#app')
