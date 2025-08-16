import './styles/index.css'

import { createApp, nextTick } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAppStore, useTaskStore } from './stores'
import { printApiInfo } from './config/api.js'
import { exposeApiTestToWindow } from './utils/apiTest.js'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// 挂载应用
app.mount('#app')

// 应用挂载后初始化状态管理
nextTick(() => {
  const appStore = useAppStore()
  const taskStore = useTaskStore()
  
  // 显示API配置信息
  printApiInfo()
  
  // 在开发环境中暴露API测试工具
  if (import.meta.env.DEV) {
    exposeApiTestToWindow()
  }
  
  // 初始化应用设置和状态
  appStore.initializeApp()
  
  // 加载本地存储的任务数据
  taskStore.loadFromLocalStorage()
  
  // 添加页面可见性变化监听器
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && navigator.onLine) {
      // 页面重新变为可见且有网络时，刷新数据
      taskStore.loadFromLocalStorage()
      console.log('页面可见性变化，已刷新本地数据')
    }
  })
  
  // 添加网络状态变化处理
  const handleOnline = () => {
    appStore.setOnlineStatus(true)
    // 网络恢复时同步数据
    setTimeout(async () => {
      await taskStore.syncDataOnReconnect()
      console.log('网络连接恢复，数据同步完成')
    }, 1000)
  }
  
  const handleOffline = () => {
    appStore.setOnlineStatus(false)
  }
  
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  
  // 设置初始网络状态
  appStore.setOnlineStatus(navigator.onLine)
})
