import { defineStore } from 'pinia'

export const useTaskStore = defineStore('task', {
  state: () => ({
    // 所有任务列表
    tasks: [],
    // 当前操作的任务
    currentTask: null,
    // 加载状态
    loading: false,
    // 错误信息
    error: null
  }),

  getters: {
    // 获取未完成任务
    pendingTasks: (state) => {
      return state.tasks.filter(task => task.status === 'pending')
    },

    // 获取已完成任务
    completedTasks: (state) => {
      return state.tasks.filter(task => task.status === 'completed')
    },

    // 根据ID获取任务
    getTaskById: (state) => {
      return (id) => state.tasks.find(task => task._id === id)
    },

    // 获取任务总数
    totalTasks: (state) => state.tasks.length,

    // 获取完成任务数量
    completedCount: (state) => {
      return state.tasks.filter(task => task.status === 'completed').length
    }
  },

  actions: {
    // 从服务器获取任务列表
    async fetchTasks(status = 'pending') {
      this.setLoading(true)
      this.clearError()
      
      try {
        const isMockMode = import.meta.env.VITE_MOCK_API === 'true'
        console.log(isMockMode ? '🎭 Mock模式：获取任务列表' : '🌐 真实API模式：从服务器获取任务列表', { status })
        
        // 动态导入API函数，避免循环依赖
        const { getTasks } = await import('../api/task.js')
        const response = await getTasks(status)
        
        if (response.success && Array.isArray(response.data)) {
          // 根据状态更新对应的任务
          if (status === 'pending') {
            // 更新待完成任务
            this.tasks = this.tasks.filter(task => task.status !== 'pending').concat(response.data)
          } else if (status === 'completed') {
            // 更新已完成任务
            this.tasks = this.tasks.filter(task => task.status !== 'completed').concat(response.data)
          } else {
            // 获取所有任务时替换整个列表
            this.tasks = response.data
          }
          
          // 同步到本地存储
          this.saveToLocalStorage()
          console.log('✅ 任务列表获取成功，数量:', response.data.length)
        } else {
          throw new Error(response.message || '获取任务列表失败')
        }
      } catch (error) {
        console.error('❌ 获取任务列表失败:', error)
        this.setError('获取任务列表失败: ' + error.message)
        
        // 如果API调用失败，从本地存储加载数据作为备选
        console.log('📦 API调用失败，使用本地存储数据')
        this.loadFromLocalStorage()
      } finally {
        this.setLoading(false)
      }
    },

    // 获取所有状态的任务
    async fetchAllTasks() {
      this.setLoading(true)
      this.clearError()
      
      try {
        // 并行获取待完成和已完成的任务
        const [pendingResponse, completedResponse] = await Promise.allSettled([
          this.fetchTasks('pending'),
          this.fetchTasks('completed')
        ])
        
        console.log('✅ 所有任务获取完成')
      } catch (error) {
        console.error('❌ 获取所有任务失败:', error)
        this.setError('获取任务数据失败')
      } finally {
        this.setLoading(false)
      }
    },

    // 添加新任务
    addTask(taskData) {
      const newTask = {
        _id: Date.now().toString(), // 简单的ID生成，实际项目中可能需要更复杂的ID生成策略
        title: taskData.title,
        agreement: taskData.agreement,
        status: 'pending',
        createdAt: new Date().toISOString(),
        completedAt: null
      }
      
      this.tasks.push(newTask)
      this.saveToLocalStorage()
      
      const isMockMode = import.meta.env.VITE_MOCK_API === 'true'
      console.log(isMockMode ? '🎭 Mock模式：任务已添加到本地存储' : '🌐 真实模式：任务已添加到本地存储', newTask._id)
      
      return newTask
    },

    // 完成任务
    completeTask(taskId) {
      const task = this.tasks.find(t => t._id === taskId)
      if (task && task.status === 'pending') {
        task.status = 'completed'
        task.completedAt = new Date().toISOString()
        this.saveToLocalStorage()
        
        const isMockMode = import.meta.env.VITE_MOCK_API === 'true'
        console.log(isMockMode ? '🎭 Mock模式：任务已完成' : '🌐 真实模式：任务已完成', taskId)
        
        return true
      }
      return false
    },

    // 删除任务
    async deleteTask(taskId) {
      // 验证taskId是否存在
      if (!taskId) {
        console.error('删除任务失败: taskId为空')
        throw new Error('任务ID不能为空')
      }

      // 检查任务是否存在于本地
      const existingTaskIndex = this.tasks.findIndex(t => t._id === taskId)
      if (existingTaskIndex === -1) {
        console.error('删除任务失败: 本地未找到任务', taskId)
        throw new Error('任务不存在')
      }

      // 在Mock模式下，直接操作本地数据，不调用API
      const isMockMode = import.meta.env.VITE_MOCK_API === 'true'
      
      if (isMockMode) {
        console.log('🎭 Mock模式：直接删除本地任务', taskId)
        try {
          // 模拟API延迟
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // 直接删除本地任务
          this.tasks.splice(existingTaskIndex, 1)
          this.saveToLocalStorage()
          console.log('✅ Mock模式删除成功:', taskId)
          return true
        } catch (error) {
          console.error('❌ Mock模式删除失败:', error)
          throw new Error('删除失败: ' + error.message)
        }
      } else {
        // 真实模式：先调用API，再删除本地
        console.log('🌐 真实模式：调用API删除任务', taskId)
        try {
          const { deleteTask: deleteTaskAPI } = await import('../api/task.js')
          await deleteTaskAPI(taskId)
          console.log('✅ API删除成功:', taskId)
        } catch (error) {
          console.warn('⚠️ API删除失败，继续本地删除:', error.message)
          // API删除失败不应该阻止本地删除
        }

        // 删除本地数据
        try {
          this.tasks.splice(existingTaskIndex, 1)
          this.saveToLocalStorage()
          console.log('✅ 本地删除成功:', taskId)
          return true
        } catch (error) {
          console.error('❌ 本地删除失败:', error)
          throw new Error('本地删除失败: ' + error.message)
        }
      }
    },

    // 更新任务
    updateTask(taskId, updates) {
      const task = this.tasks.find(t => t._id === taskId)
      if (task) {
        Object.assign(task, updates)
        this.saveToLocalStorage()
        return task
      }
      return null
    },

    // 设置当前任务
    setCurrentTask(task) {
      this.currentTask = task
    },

    // 清空当前任务
    clearCurrentTask() {
      this.currentTask = null
    },

    // 设置加载状态
    setLoading(loading) {
      this.loading = loading
    },

    // 设置错误信息
    setError(error) {
      this.error = error
    },

    // 清空错误信息
    clearError() {
      this.error = null
    },

    // 保存到本地存储
    saveToLocalStorage() {
      try {
        localStorage.setItem('tasks', JSON.stringify(this.tasks))
      } catch (error) {
        console.error('保存任务到本地存储失败:', error)
        this.setError('保存数据失败')
      }
    },

    // 从本地存储加载数据
    loadFromLocalStorage() {
      try {
        const savedTasks = localStorage.getItem('tasks')
        if (savedTasks) {
          const parsedTasks = JSON.parse(savedTasks)
          // 确保数据格式正确
          if (Array.isArray(parsedTasks)) {
            this.tasks = parsedTasks
            console.log('从本地存储加载任务成功，数量:', parsedTasks.length)
          } else {
            console.warn('本地存储的任务数据格式不正确，重置为空数组')
            this.tasks = []
          }
        } else {
          this.tasks = []
        }
      } catch (error) {
        console.error('从本地存储加载任务失败:', error)
        this.setError('加载数据失败')
        this.tasks = []
      }
    },

    // 清空所有任务
    clearAllTasks() {
      this.tasks = []
      this.saveToLocalStorage()
    },

    // 网络重连后同步数据
    async syncDataOnReconnect() {
      try {
        console.log('网络重连，开始同步数据...')
        
        // 重新从本地存储加载最新数据
        this.loadFromLocalStorage()
        
        // 在真实项目中，这里会调用API获取服务器最新数据
        // 然后与本地数据进行比较和合并
        
        console.log('数据同步完成')
      } catch (error) {
        console.error('网络重连数据同步失败:', error)
        this.setError('数据同步失败，请手动刷新页面')
      }
    },

    // 强制刷新数据
    forceRefreshData() {
      this.loadFromLocalStorage()
      console.log('已强制刷新本地数据')
    },

    // 重置状态
    resetState() {
      this.tasks = []
      this.currentTask = null
      this.loading = false
      this.error = null
      localStorage.removeItem('tasks')
    }
  }
})
