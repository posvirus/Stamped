import { defineStore } from 'pinia'

export const useAppStore = defineStore('app', {
  state: () => ({
    // 应用加载状态
    appLoading: false,
    // 全局错误信息
    globalError: null,
    // Toast消息
    toast: {
      visible: false,
      message: '',
      type: 'info', // 'success', 'error', 'warning', 'info'
      duration: 3000
    },
    // 网络状态
    isOnline: navigator.onLine,
    // 应用设置
    settings: {
      theme: 'light', // 'light', 'dark' - 预留深色模式
      language: 'zh-CN'
    },
    // 页面标题
    pageTitle: '自律工具',
    // 是否显示底部导航
    showBottomNav: true,
    // 当前页面
    currentPage: 'home'
  }),

  getters: {
    // 是否有全局错误
    hasGlobalError: (state) => !!state.globalError,

    // 是否显示Toast
    shouldShowToast: (state) => state.toast.visible,

    // 应用是否在加载中
    isAppLoading: (state) => state.appLoading,

    // 是否为深色主题
    isDarkTheme: (state) => state.settings.theme === 'dark',

    // 获取当前语言
    currentLanguage: (state) => state.settings.language
  },

  actions: {
    // 设置应用加载状态
    setAppLoading(loading) {
      this.appLoading = loading
    },

    // 设置全局错误
    setGlobalError(error) {
      this.globalError = error
    },

    // 清除全局错误
    clearGlobalError() {
      this.globalError = null
    },

    // 显示Toast消息
    showToast(message, type = 'info', duration = 3000) {
      this.toast = {
        visible: true,
        message,
        type,
        duration
      }

      // 自动隐藏Toast
      setTimeout(() => {
        this.hideToast()
      }, duration)
    },

    // 隐藏Toast
    hideToast() {
      this.toast.visible = false
    },

    // 显示成功消息
    showSuccess(message, duration = 3000) {
      this.showToast(message, 'success', duration)
    },

    // 显示错误消息
    showError(message, duration = 5000) {
      this.showToast(message, 'error', duration)
    },

    // 显示警告消息
    showWarning(message, duration = 4000) {
      this.showToast(message, 'warning', duration)
    },

    // 显示信息消息
    showInfo(message, duration = 3000) {
      this.showToast(message, 'info', duration)
    },

    // 更新网络状态
    setOnlineStatus(isOnline) {
      const wasOffline = !this.isOnline
      this.isOnline = isOnline
      
      // 保存网络状态到本地存储
      try {
        localStorage.setItem('app-network-status', JSON.stringify(isOnline))
      } catch (error) {
        console.error('保存网络状态失败:', error)
      }
      
      if (!isOnline) {
        this.showError('网络连接已断开，请检查网络设置')
      } else if (wasOffline) {
        // 只有从离线恢复到在线时才显示恢复消息
        this.showSuccess('网络连接已恢复')
      }
    },

    // 更新主题设置
    setTheme(theme) {
      this.settings.theme = theme
      this.saveSettingsToStorage()
    },

    // 更新语言设置
    setLanguage(language) {
      this.settings.language = language
      this.saveSettingsToStorage()
    },

    // 设置页面标题
    setPageTitle(title) {
      this.pageTitle = title
      // 同时更新浏览器标题
      document.title = title
    },

    // 设置底部导航显示状态
    setBottomNavVisibility(visible) {
      this.showBottomNav = visible
    },

    // 设置当前页面
    setCurrentPage(page) {
      this.currentPage = page
    },

    // 保存设置到本地存储
    saveSettingsToStorage() {
      try {
        localStorage.setItem('app-settings', JSON.stringify(this.settings))
      } catch (error) {
        console.error('保存应用设置失败:', error)
        this.showError('保存设置失败')
      }
    },

    // 从本地存储加载设置
    loadSettingsFromStorage() {
      try {
        const savedSettings = localStorage.getItem('app-settings')
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings)
          // 确保设置格式正确
          if (parsedSettings && typeof parsedSettings === 'object') {
            this.settings = { ...this.settings, ...parsedSettings }
            console.log('从本地存储加载应用设置成功:', this.settings)
          } else {
            console.warn('本地存储的设置数据格式不正确，使用默认设置')
          }
        }
        
        // 加载网络状态
        const savedNetworkStatus = localStorage.getItem('app-network-status')
        if (savedNetworkStatus) {
          this.isOnline = JSON.parse(savedNetworkStatus)
        }
      } catch (error) {
        console.error('加载应用设置失败:', error)
        // 不在初始化时显示错误，避免启动时的干扰
        console.warn('将使用默认应用设置')
      }
    },

    // 初始化应用
    initializeApp() {
      // 加载设置
      this.loadSettingsFromStorage()
      
      // 监听网络状态变化
      window.addEventListener('online', () => this.setOnlineStatus(true))
      window.addEventListener('offline', () => this.setOnlineStatus(false))
      
      // 设置初始网络状态
      this.isOnline = navigator.onLine
    },

    // 重置应用状态
    resetAppState() {
      this.appLoading = false
      this.globalError = null
      this.toast = {
        visible: false,
        message: '',
        type: 'info',
        duration: 3000
      }
      this.settings = {
        theme: 'light',
        language: 'zh-CN'
      }
      this.pageTitle = '自律工具'
      this.showBottomNav = true
      this.currentPage = 'home'
      
      // 清除本地存储的设置
      localStorage.removeItem('app-settings')
    }
  }
})
