<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTaskStore, useAppStore } from '../stores'
import { getTaskById } from '../api/task.js'
import Modal from '../components/Modal.vue'

const router = useRouter()
const route = useRoute()
const taskStore = useTaskStore()
const appStore = useAppStore()

const task = ref(null)
const loading = ref(true)
const error = ref(null)

// 删除功能相关状态
const showDeleteModal = ref(false)
const deleting = ref(false)

// 获取任务ID
const taskId = route.params.id

onMounted(async () => {
  await loadTaskDetail()
  
  // 设置页面标题
  appStore.setPageTitle('自律工具 - 任务详情')
})

// 监听 store 中任务数据的变化
watch(
  () => taskStore.getTaskById(taskId),
  (newTask) => {
    if (newTask && task.value) {
      // 任务状态发生变化时更新本地数据
      task.value = { ...newTask }
      console.log('任务状态已更新:', newTask)
    }
  },
  { deep: true }
)

// 加载任务详情
const loadTaskDetail = async () => {
  try {
    loading.value = true
    error.value = null
    
    // 首先尝试从本地store获取任务
    const localTask = taskStore.getTaskById(taskId)
    if (localTask) {
      task.value = localTask
      return
    }
    
    // 如果本地没有，则调用API获取任务详情
    try {
      const response = await getTaskById(taskId)
      task.value = response.data || response
      
      // 更新本地store（如果API返回了数据）
      if (task.value) {
        taskStore.setCurrentTask(task.value)
      }
    } catch (apiError) {
      console.warn('API获取任务详情失败，使用本地存储:', apiError)
      
      // API失败时使用本地存储数据
      taskStore.loadFromLocalStorage()
      const fallbackTask = taskStore.getTaskById(taskId)
      
      if (fallbackTask) {
        task.value = fallbackTask
      } else {
        throw new Error('任务不存在')
      }
    }
  } catch (error) {
    console.error('加载任务详情失败:', error)
    error.value = error.message || '加载任务详情失败'
    task.value = null
  } finally {
    loading.value = false
  }
}

// 返回首页
const goBack = () => {
  router.back()
}

// 跳转到验证页面
const goToVerify = () => {
  router.push(`/task-verify/${taskId}`)
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

// 处理删除任务
const handleDeleteTask = () => {
  console.log('🗑️ 准备删除任务:', task.value)
  
  if (!task.value) {
    appStore.showError('删除失败：任务数据为空')
    return
  }
  
  if (!task.value._id) {
    appStore.showError('删除失败：任务ID为空')
    return
  }
  
  showDeleteModal.value = true
}

// 确认删除任务
const confirmDeleteTask = async () => {
  console.log('🗑️ 开始删除任务:', task.value)
  
  if (!task.value?._id) {
    appStore.showError('删除失败：任务ID为空')
    return
  }
  
  try {
    deleting.value = true
    console.log('🗑️ 调用deleteTask，taskId:', task.value._id)
    
    const success = await taskStore.deleteTask(task.value._id)
    if (success) {
      appStore.showSuccess('任务已删除')
      console.log('✅ 任务删除成功')
      
      // 删除成功后返回首页
      router.push('/')
    } else {
      appStore.showError('删除失败，任务不存在')
      console.log('❌ 任务删除失败，返回false')
    }
  } catch (error) {
    console.error('删除任务失败:', error)
    appStore.showError('删除失败: ' + error.message)
  } finally {
    deleting.value = false
    showDeleteModal.value = false
  }
}

// 取消删除
const cancelDeleteTask = () => {
  showDeleteModal.value = false
}
</script>

<template>
  <div class="task-detail-page">
    <!-- 顶部导航栏 -->
    <header class="header">
      <button class="back-button" @click="goBack">
        <span class="back-icon"><</span>
      </button>
      <h1 class="page-title">任务详情</h1>
      <div class="header-placeholder"></div>
    </header>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 任务详情内容 -->
    <main v-else-if="task" class="main-content">
      <!-- 任务状态标识 -->
      <div class="status-badge" :class="task.status">
        {{ task.status === 'completed' ? '已完成' : '未完成' }}
      </div>

      <!-- 任务基本信息 -->
      <section class="task-info">
        <h2 class="task-title">{{ task.title || task.description }}</h2>
        <p v-if="task.description && task.title !== task.description" class="task-description">{{ task.description }}</p>
        
        <div class="task-meta">
          <div class="meta-item">
            <span class="meta-label">创建时间：</span>
            <span class="meta-value">{{ formatDate(task.createdAt) }}</span>
          </div>
          <div v-if="task.completedAt" class="meta-item">
            <span class="meta-label">完成时间：</span>
            <span class="meta-value">{{ formatDate(task.completedAt) }}</span>
          </div>
        </div>
      </section>

      <!-- 协议内容 -->
      <section class="agreement-section">
        <h3 class="section-title">验证协议</h3>
        <div class="agreement-content">
          <pre class="agreement-text">{{ task.agreement }}</pre>
        </div>
      </section>

      <!-- 操作按钮 -->
      <div class="actions">
        <!-- 未完成任务的验证按钮 -->
        <button 
          v-if="task.status === 'pending'" 
          class="verify-button" 
          @click="goToVerify"
        >
          验证
        </button>
        

        
        <!-- 删除按钮 -->
        <button 
          class="delete-button" 
          @click="handleDeleteTask"
          :disabled="deleting"
        >
          {{ deleting ? '删除中...' : '删除' }}
        </button>
      </div>
    </main>

    <!-- 错误状态 -->
    <div v-else class="error-container">
      <p>{{ error || '任务不存在或加载失败' }}</p>
      <button class="retry-button" @click="loadTaskDetail">重试</button>
    </div>

    <!-- 删除确认对话框 -->
    <Modal
      v-model="showDeleteModal"
      title="确认删除"
      confirm-type="danger"
      confirm-text="删除"
      cancel-text="取消"
      :mask-closable="true"
      :confirm-loading="deleting"
      @confirm="confirmDeleteTask"
      @cancel="cancelDeleteTask"
    >
      <p style="margin: 0; line-height: 1.6;">
        确定要删除任务"<strong>{{ task?.title || task?.description }}</strong>"吗？
      </p>
      <p style="margin: 8px 0 0 0; font-size: 14px; color: #666;">
        此操作不可撤销，任务数据将被永久删除。
      </p>
    </Modal>
  </div>
</template>

<style scoped>
.task-detail-page {
  min-height: 100vh;
  background-color: #FFF4E1;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background-color: transparent;
  color: #333;
  box-shadow: none;
}

.back-button {
  background: rgba(0, 0, 0, 0.1);
  border: none;
  color: #333;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.back-button:hover {
  background-color: rgba(0, 0, 0, 0.2);
}

.back-icon {
  display: block;
  line-height: 1;
  font-weight: bold;
}

.page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.header-placeholder {
  width: 36px;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: #666;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e0e0e0;
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.retry-button {
  margin-top: 16px;
  padding: 12px 24px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.main-content {
  padding: 24px 20px 100px;
  max-width: 600px;
  margin: 0 auto;
}

.status-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 20px;
}

.status-badge.pending {
  background-color: #ffebee;
  color: #c62828;
}

.status-badge.completed {
  background-color: #e8f5e8;
  color: var(--success-color);
}

.task-info {
  background-color: white;
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.task-title {
  margin: 0 0 12px 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.task-description {
  margin: 0 0 20px 0;
  line-height: 1.6;
  color: #666;
}

.task-meta {
  border-top: 1px solid #f0f0f0;
  padding-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.meta-item {
  display: block !important;
  width: 100% !important;
  margin-bottom: 0;
  line-height: 1.5;
  text-align: left;
}

.meta-label {
  color: #666;
  font-size: 14px;
  display: inline;
}

.meta-value {
  color: var(--text-primary);
  font-size: 14px;
  display: inline;
  margin-left: 0;
}

.agreement-section {
  background-color: white;
  border-radius: 12px;
  margin-bottom: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.section-title {
  margin: 0;
  padding: 20px 24px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.agreement-content {
  padding: 16px 24px 24px;
  max-height: 400px;
  overflow-y: auto;
}

.agreement-text {
  margin: 0;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: inherit;
  color: var(--text-primary);
}

.actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: white;
  padding: 16px 20px;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: row;
  gap: 12px;
}

.verify-button {
  flex: 1;
  padding: 16px;
  background-color: var(--success-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.verify-button:hover {
  background-color: #388e3c;
  transform: translateY(-1px);
}

.verify-button:active {
  transform: translateY(0);
}

.delete-button {
  flex: 1;
  padding: 16px;
  background-color: #f44336;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.delete-button:hover:not(:disabled) {
  background-color: #d32f2f;
  transform: translateY(-1px);
}

.delete-button:active:not(:disabled) {
  transform: translateY(0);
}

.delete-button:disabled {
  background-color: #bdbdbd;
  cursor: not-allowed;
  transform: none;
}


</style>
