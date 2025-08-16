<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { generateAgreement as generateAgreementAPI, saveConfirmedTask } from '@/api'
import { useTaskStore, useAppStore } from '@/stores'

const router = useRouter()
const route = useRoute()
const taskStore = useTaskStore()
const appStore = useAppStore()

const goalDescription = ref('')
const agreementContent = ref('')
const modificationDescription = ref('')
const isRegenerating = ref(false)
const isSaving = ref(false)
const error = ref('')

// 截止时间相关状态
const deadlineEnabled = ref(false)
const deadlineDate = ref('')
const deadlineTime = ref('')
const showTimeModal = ref(false)
// 弹窗中的临时时间状态
const tempDeadlineDate = ref('')
const tempDeadlineTime = ref('')

// 检测是创建模式还是修改模式
const isCreateMode = computed(() => route.query.mode === 'create')
const isFirstRequest = ref(true)
// 追踪是否已经成功创建了任务
const hasCreatedSuccessfully = ref(false)

// 格式化截止时间显示
const formattedDeadline = computed(() => {
  if (!deadlineEnabled.value || !deadlineDate.value) {
    return '无限期'
  }
  
  const date = new Date(deadlineDate.value + (deadlineTime.value ? ` ${deadlineTime.value}` : ' 23:59'))
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

// 打开时间设置弹窗
const openTimeModal = () => {
  if (!deadlineEnabled.value) return
  
  // 将当前时间设置复制到临时状态
  tempDeadlineDate.value = deadlineDate.value
  tempDeadlineTime.value = deadlineTime.value
  showTimeModal.value = true
}

// 确认时间设置
const confirmTimeModal = () => {
  deadlineDate.value = tempDeadlineDate.value
  deadlineTime.value = tempDeadlineTime.value
  showTimeModal.value = false
}

// 取消时间设置
const cancelTimeModal = () => {
  showTimeModal.value = false
}

// 当启用截止时间时自动打开弹窗
const onDeadlineToggle = () => {
  if (deadlineEnabled.value) {
    // 延迟一点打开弹窗，让切换动画完成
    setTimeout(() => {
      openTimeModal()
    }, 100)
  }
}

// AI回复气泡状态
const aiReplyBubble = ref({
  visible: false, // 未响应时完全透明
  message: ''
})

// 显示AI回复气泡
const showAiReplyBubble = (message) => {
  aiReplyBubble.value.visible = true
  aiReplyBubble.value.message = message
  
  // 4秒后隐藏气泡
  setTimeout(() => {
    aiReplyBubble.value.visible = false
    aiReplyBubble.value.message = '' // 清空消息内容，让气泡恢复默认大小
  }, 4000)
}

onMounted(() => {
  // 初始化默认截止时间为明天
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  deadlineDate.value = tomorrow.toISOString().split('T')[0]
  deadlineTime.value = '18:00'
  
  if (isCreateMode.value) {
    // 创建模式：设置默认值
    goalDescription.value = '新的任务'
    agreementContent.value = ''
    isFirstRequest.value = true
    hasCreatedSuccessfully.value = false
    
    // 显示欢迎AI气泡
    setTimeout(() => {
      showAiReplyBubble('你好，让我们一起来创建任务吧！')
    }, 500) // 延迟500ms显示，让页面加载完成
  } else {
    // 修改模式：从路由参数获取目标描述和协议内容
    goalDescription.value = route.query.goal || ''
    agreementContent.value = route.query.agreement || ''
    isFirstRequest.value = false
    hasCreatedSuccessfully.value = true // 修改模式表示已经创建过了
    
    // 如果没有协议内容，返回首页
    if (!goalDescription.value || !agreementContent.value) {
      console.warn('缺少必要参数，返回首页')
      router.replace('/')
      return
    }
  }
})

// 返回上一页
const goBack = () => {
  router.back()
}

// 重新生成协议
const regenerateAgreement = async () => {
  // 检查是否有修改描述
  if (!modificationDescription.value.trim()) {
    if (isCreateMode.value && isFirstRequest.value) {
      error.value = '请输入目标描述'
    } else {
      error.value = '请输入修改要求'
    }
    return
  }

  error.value = ''
  isRegenerating.value = true
  
  // 设置AI回复气泡为完全透明（未响应状态）
  aiReplyBubble.value.visible = false
  
  try {
    let aiResponse
    
    if (isCreateMode.value && isFirstRequest.value) {
      // 创建模式的首次请求：只发送用户描述
      aiResponse = await generateAgreementAPI(modificationDescription.value.trim())
    } else {
      // 修改模式：发送修改描述和原始协议内容
      aiResponse = await generateAgreementAPI(
        goalDescription.value, 
        modificationDescription.value.trim(), 
        agreementContent.value
      )
    }
    
    let parsedResponse
    try {
      // 尝试解析JSON响应
      parsedResponse = typeof aiResponse === 'string' 
        ? JSON.parse(aiResponse) 
        : aiResponse
    } catch (parseError) {
      console.error('解析AI响应失败:', parseError)
      // 如果解析失败，按照旧的逻辑处理
      agreementContent.value = aiResponse
      showAiReplyBubble('协议已更新！')
      modificationDescription.value = ''
      
      // 如果是创建模式的首次请求，标记为非首次请求并设置为已成功创建
      if (isCreateMode.value && isFirstRequest.value) {
        isFirstRequest.value = false
        hasCreatedSuccessfully.value = true
      }
      return
    }
    
    // 检查是否有success字段
    if (parsedResponse && typeof parsedResponse.success === 'boolean') {
      // 无论success为true还是false，都显示reason字段
      if (parsedResponse.reason) {
        showAiReplyBubble(parsedResponse.reason)
      }
      
      // 只有当success为true时，才更新页面的目标标题与AI生成的协议
      if (parsedResponse.success) {
        if (parsedResponse.title) {
          goalDescription.value = parsedResponse.title
        }
        if (parsedResponse.content) {
          agreementContent.value = parsedResponse.content
        }
        
        // 清空修改描述框
        modificationDescription.value = ''
        
        // 如果是创建模式的首次请求，标记为非首次请求并设置为已成功创建
        if (isCreateMode.value && isFirstRequest.value) {
          isFirstRequest.value = false
          hasCreatedSuccessfully.value = true
        }
      }
      // success为false时，不更新页面内容，但仍然清空修改描述框
      if (!parsedResponse.success) {
        modificationDescription.value = ''
      }
    } else {
      // 如果没有success字段，按照旧的逻辑处理
      agreementContent.value = aiResponse
      showAiReplyBubble('协议已更新！')
      modificationDescription.value = ''
      
      // 如果是创建模式的首次请求，标记为非首次请求并设置为已成功创建
      if (isCreateMode.value && isFirstRequest.value) {
        isFirstRequest.value = false
        hasCreatedSuccessfully.value = true
      }
    }
    
  } catch (apiError) {
    console.error('重新生成协议失败:', apiError)
    
    // 显示错误提示的AI回复气泡
    showAiReplyBubble('修改失败，请稍后重试')
    
    // 根据错误类型显示不同的提示
    if (apiError.message.includes('API密钥')) {
      error.value = 'AI服务配置错误，请联系管理员'
    } else if (apiError.message.includes('timeout') || apiError.message.includes('超时')) {
      error.value = '请求超时，请检查网络连接后重试'
    } else if (apiError.message.includes('Network') || apiError.message.includes('网络')) {
      error.value = '网络连接失败，请检查网络设置'
    } else {
      error.value = apiError.message || '重新生成协议失败，请稍后重试'
    }
  } finally {
    isRegenerating.value = false
  }
}

// 清除错误信息
const clearError = () => {
  error.value = ''
}

// 确认协议并保存
const confirmAndSave = async () => {
  isSaving.value = true
  error.value = ''
  
  try {
    // 在任务内容最后添加截止日期信息
    let finalAgreementContent = agreementContent.value
    if (finalAgreementContent && !finalAgreementContent.endsWith('\n')) {
      finalAgreementContent += '\n'
    }
    finalAgreementContent += `\n验证DDL：${formattedDeadline.value}`
    
    // 调用API保存任务到数据库
    await saveConfirmedTask(goalDescription.value, finalAgreementContent)
    
    // 使用状态管理添加新任务到本地状态
    const newTask = taskStore.addTask({
      title: goalDescription.value,
      agreement: finalAgreementContent
    })
    
    console.log('新任务已添加到状态管理:', newTask)
    
    // 显示成功消息
    appStore.showSuccess('目标创建成功！')
    
    // 跳转到首页
    router.push('/')
    
  } catch (apiError) {
    console.error('保存任务失败:', apiError)
    
    // 根据错误类型显示不同的提示
    if (apiError.message.includes('网络')) {
      error.value = '网络连接失败，请检查网络设置后重试'
      appStore.showError('网络连接失败，请检查网络设置后重试')
    } else if (apiError.message.includes('timeout') || apiError.message.includes('超时')) {
      error.value = '请求超时，请稍后重试'
      appStore.showError('请求超时，请稍后重试')
    } else {
      error.value = apiError.message || '保存任务失败，请稍后重试'
      appStore.showError(error.value)
    }
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="confirm-agreement-page">
    <!-- 顶部导航栏 -->
    <header class="header">
      <button class="back-button" @click="goBack">
        <span class="back-icon"><</span>
      </button>
      <h1 class="page-title">{{ isCreateMode && !hasCreatedSuccessfully ? '创建任务' : '修改任务' }}</h1>
      <div class="header-placeholder"></div>
    </header>

    <!-- 页面内容 -->
    <main class="main-content">
      <!-- 目标标题 -->
      <div class="goal-title-container">
        <div class="goal-title">
          {{ goalDescription }}
        </div>
      </div>



      <!-- 协议内容展示 -->
      <section class="agreement-section" v-if="!isCreateMode || agreementContent">
        <h2 class="section-title">您的任务</h2>
        <div class="agreement-content">
          <pre class="agreement-text">{{ agreementContent }}</pre>
        </div>
      </section>

      <!-- AI回复气泡 -->
      <div class="ai-reply-bubble-container">
        <div class="avatar">
          <img src="@/assets/user.svg" alt="AI" />
        </div>
        <div 
          class="ai-reply-bubble"
          :class="{ 'visible': aiReplyBubble.visible }"
        >
          <div class="bubble-arrow"></div>
          <div class="bubble-content">
            {{ aiReplyBubble.message }}
          </div>
        </div>
      </div>

      <!-- 截止时间调整栏 -->
      <div class="deadline-section">
        <div class="deadline-bar" @click="openTimeModal">
          <div class="deadline-left">
            <div class="deadline-icon">⏰</div>
            <span class="deadline-time-display">{{ formattedDeadline }}</span>
          </div>
          <label class="deadline-toggle" @click.stop>
            <input 
              type="checkbox" 
              v-model="deadlineEnabled"
              @change="onDeadlineToggle"
              class="deadline-checkbox"
            />
            <span class="deadline-toggle-circle"></span>
          </label>
        </div>
      </div>

      <!-- 时间设置弹窗 -->
      <div v-if="showTimeModal" class="time-modal-overlay" @click="cancelTimeModal">
        <div class="time-modal" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">设置截止时间</h3>
          </div>
          
          <div class="modal-content">
            <div class="modal-input-group">
              <label class="modal-label">日期</label>
              <input 
                type="date" 
                v-model="tempDeadlineDate"
                class="modal-date-input"
                :min="new Date().toISOString().split('T')[0]"
              />
            </div>
            <div class="modal-input-group">
              <label class="modal-label">时间</label>
              <input 
                type="time" 
                v-model="tempDeadlineTime"
                class="modal-time-input"
              />
            </div>
          </div>
          
          <div class="modal-actions">
            <button class="modal-button cancel" @click="cancelTimeModal">
              取消
            </button>
            <button class="modal-button confirm" @click="confirmTimeModal">
              确认
            </button>
          </div>
        </div>
      </div>

      <!-- 聊天式修改输入框 -->
      <div class="chat-input-container">
        <div class="chat-input-wrapper">
          <input
            v-model="modificationDescription"
            class="chat-input"
            :placeholder="isCreateMode && isFirstRequest ? '描述您希望如何生成任务...' : '描述您希望如何修改任务...'"
            @keyup.enter="regenerateAgreement"
            @focus="clearError"
            :disabled="isRegenerating || isSaving"
          />
          <button 
            class="send-button"
            :disabled="!modificationDescription.trim() || isRegenerating || isSaving"
            @click="regenerateAgreement"
          >
            <span v-if="isRegenerating">⏳</span>
            <span v-else class="arrow-up"></span>
          </button>
        </div>
        <!-- 错误信息显示 -->
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
      </div>
      
      <!-- 确认按钮 -->
      <div class="confirm-actions">
        <button 
          class="action-button primary"
          :disabled="isRegenerating || isSaving || (isCreateMode && !agreementContent.trim())"
          @click="confirmAndSave"
        >
          <span v-if="isSaving">{{ isCreateMode ? '创建中...' : '保存中...' }}</span>
          <span v-else>{{ isCreateMode ? '创建任务' : '保存修改' }}</span>
        </button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.confirm-agreement-page {
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
}

.back-button {
  background: rgba(51, 51, 51, 0.1);
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
  background-color: rgba(51, 51, 51, 0.2);
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

.main-content {
  padding: 24px 20px;
  max-width: 600px;
  margin: 0 auto;
}

.agreement-section {
  margin-bottom: 32px;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  background: white;
  padding: 12px 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: inline-block;
}

.goal-title-container {
  display: flex;
  justify-content: center;
  margin-bottom: 32px;
}

.goal-title {
  background: rgba(255, 255, 255, 0.9);
  padding: 12px 20px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-size: 17px;
  font-weight: 600;
  color: #2c3e50;
  text-align: center;
  max-width: 80%;
  word-wrap: break-word;
  line-height: 1.4;
}

.agreement-content {
  background: rgba(248, 248, 248, 0.95);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(220, 220, 220, 0.3);
  max-height: 400px;
  overflow-y: auto;
}

.agreement-text {
  padding: 16px;
  margin: 0;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: inherit;
  color: var(--text-primary);
  background: white;
  border-radius: 8px;
  border: 2px solid #e0e0e0;
}



.error-message {
  margin-top: 8px;
  font-size: 14px;
  color: #f44336;
  display: flex;
  align-items: center;
}

.error-message::before {
  content: '⚠️';
  margin-right: 6px;
  font-size: 16px;
}

/* 聊天式输入框样式 */
.chat-input-container {
  margin: 32px 0;
}

.chat-input-wrapper {
  display: flex;
  align-items: center;
  background-color: white;
  border: 2px solid #e0e0e0;
  border-radius: 25px;
  padding: 8px 8px 8px 20px;
  transition: border-color 0.2s;
}

.chat-input-wrapper:focus-within {
  border-color: var(--primary-color);
}

.chat-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  padding: 8px 0;
  background: transparent;
  font-family: inherit;
}

.chat-input::placeholder {
  color: #999;
}

.send-button {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background-color: #FDE0DB;
  color: #333;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  margin-left: 8px;
}

.send-button:hover:not(:disabled) {
  background-color: #F5C2B8;
  transform: scale(1.05);
}

.send-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  transform: none;
}

.send-button:disabled .arrow-up::before {
  background-color: #666;
}

.send-button:disabled .arrow-up::after {
  border-bottom-color: #666;
}

/* 箭头样式 */
.arrow-up {
  position: relative;
  display: inline-block;
  width: 14px;
  height: 14px;
}

.arrow-up::before {
  content: '';
  position: absolute;
  width: 3px;
  height: 10px;
  background-color: #333;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  border-radius: 1px;
}

.arrow-up::after {
  content: '';
  position: absolute;
  width: 0;
  height: 0;
  left: 50%;
  top: 0;
  transform: translateX(-50%);
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-bottom: 6px solid #333;
}

/* 确认按钮容器 */
.confirm-actions {
  margin-top: 24px;
}

.action-button {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-button.primary {
  background-color: #F4624B;
  color: white;
}

.action-button.primary:hover:not(:disabled) {
  background-color: #E0553F;
  transform: translateY(-1px);
}



.action-button:active:not(:disabled) {
  transform: translateY(0);
}

.action-button:disabled {
  background-color: #ccc;
  color: #666;
  border-color: #ccc;
  cursor: not-allowed;
  transform: none;
}

/* 移动端适配 */
@media (max-width: 480px) {
  .chat-input-wrapper {
    padding: 6px 6px 6px 16px;
  }
  
  .send-button {
    width: 32px;
    height: 32px;
  }
  
  .arrow-up {
    width: 12px;
    height: 12px;
  }
  
  .arrow-up::before {
    width: 2.5px;
    height: 8px;
  }
  
  .arrow-up::after {
    border-left-width: 3px;
    border-right-width: 3px;
    border-bottom-width: 5px;
  }
}

/* AI回复气泡样式 */
.ai-reply-bubble-container {
  margin: 16px 0;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 0 16px;
}

.avatar {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
}

.avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.ai-reply-bubble {
  flex: 1;
  max-width: calc(100% - 64px);
  position: relative;
  opacity: 0;
  transform: translateY(-10px) scale(0.9);
  transition: all 0.3s ease-in-out;
  pointer-events: none;
}

.ai-reply-bubble.visible {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}

.bubble-content {
  background-color: white;
  border-radius: 18px;
  padding: 12px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  font-size: 11px;
  line-height: 1.4;
  color: #333;
  border: 1px solid #e0e0e0;
  position: relative;
  word-wrap: break-word;
}

.bubble-arrow {
  position: absolute;
  top: 15px;
  left: -6px;
  width: 0;
  height: 0;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  border-right: 6px solid white;
  z-index: 1;
}

.bubble-arrow::before {
  content: '';
  position: absolute;
  top: -6px;
  left: 1px;
  width: 0;
  height: 0;
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  border-right: 6px solid #e0e0e0;
  z-index: -1;
}

/* 小屏设备高度优化 */
@media (max-height: 600px) {
  .ai-reply-bubble-container {
    padding: 0 12px;
    gap: 8px;
  }
  
  .avatar {
    width: 32px;
    height: 32px;
  }
  
  .ai-reply-bubble {
    max-width: calc(100% - 52px);
  }
  
  .bubble-content {
    font-size: 11px;
    padding: 10px 14px;
  }
}

/* 截止时间调整栏样式 */
.deadline-section {
  margin: 20px 0;
}

.deadline-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  border-radius: 20px;
  padding: 14px 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e8e8e8;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.deadline-bar:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}

.deadline-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.deadline-icon {
  font-size: 20px;
  line-height: 1;
}

.deadline-time-display {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  letter-spacing: 0.3px;
}

.deadline-toggle {
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
}

.deadline-checkbox {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.deadline-toggle-circle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid #ddd;
  background: white;
  position: relative;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.deadline-toggle-circle::after {
  content: '';
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #F4624B;
  transform: scale(0);
  transition: transform 0.2s ease;
}

.deadline-checkbox:checked + .deadline-toggle-circle {
  border-color: #F4624B;
  background: white;
}

.deadline-checkbox:checked + .deadline-toggle-circle::after {
  transform: scale(1);
}

/* 时间设置弹窗样式 */
.time-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.time-modal {
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  width: 90%;
  max-width: 400px;
  animation: modalSlideIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-30px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  padding: 24px 24px 16px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  text-align: center;
}

.modal-content {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.modal-input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.modal-label {
  font-size: 14px;
  font-weight: 600;
  color: #555;
}

.modal-date-input,
.modal-time-input {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  font-size: 16px;
  background: white;
  transition: all 0.2s ease;
  font-family: inherit;
  box-sizing: border-box;
}

.modal-date-input:focus,
.modal-time-input:focus {
  outline: none;
  border-color: #F4624B;
  box-shadow: 0 0 0 4px rgba(244, 98, 75, 0.1);
}

.modal-actions {
  display: flex;
  gap: 12px;
  padding: 16px 24px 24px 24px;
}

.modal-button {
  flex: 1;
  padding: 14px 20px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.modal-button.cancel {
  background: #f5f5f5;
  color: #666;
}

.modal-button.cancel:hover {
  background: #e8e8e8;
}

.modal-button.confirm {
  background: #F4624B;
  color: white;
}

.modal-button.confirm:hover {
  background: #E0553F;
  transform: translateY(-1px);
}

.modal-button:active {
  transform: translateY(0);
}

/* 移动端优化 */
@media (max-width: 480px) {
  .deadline-bar {
    padding: 12px 16px;
  }
  
  .deadline-time-display {
    font-size: 14px;
  }
  
  .deadline-toggle-circle {
    width: 22px;
    height: 22px;
  }
  
  .deadline-toggle-circle::after {
    width: 10px;
    height: 10px;
  }
  
  .time-modal {
    width: 95%;
    margin: 20px;
  }
  
  .modal-header {
    padding: 20px 20px 12px 20px;
  }
  
  .modal-title {
    font-size: 16px;
  }
  
  .modal-content {
    padding: 20px;
    gap: 16px;
  }
  
  .modal-date-input,
  .modal-time-input {
    padding: 12px 14px;
    font-size: 14px;
  }
  
  .modal-actions {
    padding: 12px 20px 20px 20px;
    gap: 10px;
  }
  
  .modal-button {
    padding: 12px 16px;
    font-size: 14px;
  }
}
</style>
