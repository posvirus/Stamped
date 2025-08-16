<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTaskStore, useAppStore } from '@/stores'
import { verifyTaskCompletion } from '@/api/ai.js'
import { updateTaskStatus } from '@/api/task.js'
// import Toast from '@/components/Toast.vue' // 暂时未使用，已使用appStore的Toast功能

const router = useRouter()
const route = useRoute()
const taskStore = useTaskStore()
const appStore = useAppStore()

const task = ref(null)
const loading = ref(true)
const showTaskInfo = ref(false)
const verificationText = ref('')
const uploadedImages = ref([])
const isVerifying = ref(false)

// 获取任务ID
const taskId = route.params.id

onMounted(async () => {
  await loadTaskDetail()
})

// 加载任务详情
const loadTaskDetail = async () => {
  try {
    taskStore.setLoading(true)
    
    // 从taskStore获取任务详情
    const foundTask = taskStore.getTaskById(taskId)
    
    if (!foundTask) {
      throw new Error('任务不存在')
    }
    
    task.value = foundTask
  } catch (error) {
    console.error('加载任务详情失败:', error)
    taskStore.setError('加载任务详情失败')
    alert('加载任务详情失败，请返回重试')
    router.back()
  } finally {
    loading.value = false
    taskStore.setLoading(false)
  }
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 处理图片上传
const handleImageUpload = (event) => {
  const files = Array.from(event.target.files)
  
  if (uploadedImages.value.length + files.length > 3) {
    alert('最多只能上传3张图片')
    return
  }

  files.forEach(file => {
    if (file.type.startsWith('image/')) {
      // 验证文件大小（5MB限制）
      if (file.size > 5 * 1024 * 1024) {
        alert(`图片 ${file.name} 超过5MB大小限制`)
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target.result
        // 将DataURL转换为Base64编码
        const base64 = dataUrl.split(',')[1] // 移除data:image/...;base64,前缀
        
        uploadedImages.value.push({
          id: Date.now() + Math.random(),
          file,
          url: dataUrl, // 用于预览显示
          base64, // 用于AI验证
          name: file.name,
          size: file.size,
          type: file.type
        })
      }
      reader.readAsDataURL(file)
    }
  })
  
  // 清空input值，允许重新选择相同文件
  event.target.value = ''
}

// 删除图片
const removeImage = (imageId) => {
  uploadedImages.value = uploadedImages.value.filter(img => img.id !== imageId)
}

// 将Base64图片转换为DataURL格式（AI接口需要）
const convertBase64ToDataUrl = (base64, type) => {
  return `data:${type};base64,${base64}`
}

// 解析任务DDL
const parseTaskDeadline = (agreementText) => {
  const ddlMatch = agreementText.match(/验证DDL：(.+?)(?:\n|$)/)
  if (!ddlMatch) {
    return null // 没有找到DDL信息
  }
  
  const ddlText = ddlMatch[1].trim()
  if (ddlText === '无限期') {
    return null // 无限期任务
  }
  
  // 解析中文日期格式，例如："2024年1月1日 18:00"
  const dateMatch = ddlText.match(/(\d{4})年(\d{1,2})月(\d{1,2})日\s+(\d{1,2}):(\d{2})/)
  if (dateMatch) {
    const [, year, month, day, hour, minute] = dateMatch
    return new Date(year, month - 1, day, hour, minute)
  }
  
  return null // 无法解析的格式
}

// 检查任务是否过期
const checkTaskExpired = () => {
  if (!task.value || !task.value.agreement) {
    return false
  }
  
  const deadline = parseTaskDeadline(task.value.agreement)
  if (!deadline) {
    return false // 无DDL或无限期任务不过期
  }
  
  return new Date() > deadline
}

// 提交验证
const submitVerification = async () => {
  if (uploadedImages.value.length === 0) {
    alert('请至少上传一张图片')
    return
  }

  // 检查任务是否过期
  if (checkTaskExpired()) {
    appStore.showError('该任务已过期啦，验证失败！', 4000)
    
    // 删除过期任务
    try {
      await taskStore.deleteTask(taskId)
      console.log('过期任务已删除')
    } catch (error) {
      console.error('删除过期任务失败:', error)
    }
    
    // 延迟跳转，让用户看到错误消息
    setTimeout(() => {
      router.push('/')
    }, 2000)
    return
  }

  isVerifying.value = true
  taskStore.clearError()

  try {
    // 准备验证数据
    const imageUrls = uploadedImages.value.map(img => 
      convertBase64ToDataUrl(img.base64, img.type)
    )

    const verificationData = {
      goal: task.value.title,
      agreement: task.value.agreement,
      description: verificationText.value.trim(),
      imageUrls
    }

    // 调用AI验证接口
    const result = await verifyTaskCompletion(verificationData)
    
    if (result.success) {
      // 验证成功，先更新服务器状态，再更新本地状态
      try {
        // 1. 先调用API更新服务器端任务状态
        await updateTaskStatus(taskId, 'completed')
        console.log('✅ 服务器端任务状态更新成功')
        
        // 2. 服务器更新成功后，再更新本地状态
        const updateSuccess = taskStore.completeTask(taskId)
        
        if (updateSuccess) {
          appStore.showSuccess('任务完成！恭喜您达成目标！', 4000)
          
          // 延迟跳转，让用户看到成功消息
          setTimeout(() => {
            router.push('/')
          }, 1500)
        } else {
          throw new Error('更新本地任务状态失败')
        }
      } catch (statusUpdateError) {
        console.error('❌ 更新任务状态失败:', statusUpdateError)
        // 如果状态更新失败，仍然更新本地状态作为备选
        taskStore.completeTask(taskId)
        appStore.showSuccess('任务验证成功！但状态同步可能有延迟', 4000)
        
        setTimeout(() => {
          router.push('/')
        }, 1500)
      }
    } else {
      // 验证失败，显示具体原因
      alert(`验证未通过：${result.reason}`)
    }
  } catch (error) {
    console.error('验证失败:', error)
    taskStore.setError(error.message)
    
    if (error.message.includes('API密钥')) {
      alert('AI服务配置错误，请联系管理员')
    } else {
      alert('验证失败，请检查网络连接后重试')
    }
  } finally {
    isVerifying.value = false
  }
}
</script>

<template>
  <div class="task-verify-page">
    <!-- 顶部导航栏 -->
    <header class="header">
      <button class="back-button" @click="goBack">
        <span class="back-icon"><</span>
      </button>
      <h1 class="page-title">任务验证</h1>
      <div class="header-placeholder"></div>
    </header>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 验证内容 -->
    <main v-else-if="task" class="main-content">
      <!-- 目标与协议折叠面板 -->
      <div class="task-info-panel">
        <button 
          class="panel-toggle"
          @click="showTaskInfo = !showTaskInfo"
        >
          <span class="panel-title">查看目标与任务</span>
          <span class="toggle-icon" :class="{ open: showTaskInfo }">▼</span>
        </button>
        
        <div v-show="showTaskInfo" class="panel-content">
          <div class="task-summary">
            <h3>{{ task.title }}</h3>
          </div>
          <div class="agreement-summary">
            <pre class="agreement-text">{{ task.agreement }}</pre>
          </div>
        </div>
      </div>

      <!-- 验证材料上传 -->
      <div class="verification-section">
        <h3 class="section-title">验证材料</h3>
        
        <!-- 文字描述 -->
        <div class="input-group">
          <label for="verification-text" class="input-label">完成情况描述（可选）</label>
          <textarea
            id="verification-text"
            v-model="verificationText"
            class="verification-input"
            placeholder="请描述你的完成情况……"
            rows="1"
            maxlength="100"
          ></textarea>
          <div class="char-count">
            {{ verificationText.length }}/100
          </div>
        </div>

        <!-- 图片上传 -->
        <div class="image-upload-section">
          <label class="input-label">上传照片（最多3张）</label>
          
          <div class="image-grid">
            <!-- 已上传的图片 -->
            <div 
              v-for="image in uploadedImages" 
              :key="image.id"
              class="image-item"
            >
              <img :src="image.url" :alt="image.name" class="uploaded-image">
              <button 
                class="remove-button"
                @click="removeImage(image.id)"
              >
                ×
              </button>
            </div>
            
            <!-- 上传按钮 -->
            <label 
              v-if="uploadedImages.length < 3"
              class="upload-button"
            >
              <input
                type="file"
                accept="image/*"
                multiple
                class="file-input"
                @change="handleImageUpload"
              >
              <div class="upload-content">
                <span class="upload-icon">+</span>
              </div>
            </label>
          </div>
          
          <p class="upload-hint">
            支持JPG、PNG格式，单张图片不超过5MB
          </p>
        </div>
      </div>

      <!-- 提交按钮 -->
      <div class="submit-section">
        <button 
          class="submit-button"
          :disabled="uploadedImages.length === 0 || isVerifying"
          @click="submitVerification"
        >
          <span v-if="isVerifying" class="loading-text">
            AI验证中...
          </span>
          <span v-else>
            提交验证
          </span>
        </button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.task-verify-page {
  min-height: 100vh;
  background-color: #FFF4E1;
  padding-bottom: 100px;
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

.loading-container {
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

.main-content {
  padding: 24px 20px;
  max-width: 600px;
  margin: 0 auto;
}

.task-info-panel {
  background-color: white;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.panel-toggle {
  width: 100%;
  padding: 20px 24px;
  background: none;
  border: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  text-align: left;
}

.panel-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
}

.toggle-icon {
  transition: transform 0.2s;
  color: #666;
}

.toggle-icon.open {
  transform: rotate(180deg);
}

.panel-content {
  padding: 0 24px 24px;
  border-top: 1px solid #f0f0f0;
}

.task-summary h3 {
  margin: 16px 0 8px;
  font-size: 18px;
  color: var(--text-primary);
}

.task-summary p {
  margin: 0 0 16px;
  color: #666;
  line-height: 1.5;
}

.agreement-summary h4 {
  margin: 16px 0 8px;
  font-size: 16px;
  color: var(--text-primary);
}

.agreement-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: #666;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: inherit;
  max-height: 200px;
  overflow-y: auto;
}

.verification-section {
  background-color: white;
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.section-title {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.input-group {
  margin-bottom: 32px;
}

.input-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.verification-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  line-height: 1.5;
  resize: vertical;
  transition: border-color 0.2s;
  font-family: inherit;
}

.verification-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.char-count {
  text-align: right;
  margin-top: 4px;
  font-size: 12px;
  color: #666;
}

.image-upload-section {
  margin-top: 24px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.image-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
}

.uploaded-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-button {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 16px !important;
  height: 16px !important;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-size: 10px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: unset !important;
  min-height: unset !important;
}

.upload-button {
  aspect-ratio: 1;
  border: 2px dashed #ccc;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s;
  display: block;
}

.upload-button:hover {
  border-color: var(--primary-color);
}

.file-input {
  display: none;
}

.upload-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px;
}

.upload-icon {
  font-size: 24px;
  color: #ccc;
  margin-bottom: 4px;
}

.upload-text {
  font-size: 12px;
  color: #666;
}

.upload-hint {
  margin: 0;
  font-size: 12px;
  color: #999;
}

.submit-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: white;
  padding: 16px 20px;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}

.submit-button {
  width: 100%;
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

.submit-button:hover:not(:disabled) {
  background-color: #388e3c;
  transform: translateY(-1px);
}

.submit-button:active:not(:disabled) {
  transform: translateY(0);
}

.submit-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  transform: none;
}

.loading-text {
  position: relative;
}

.loading-text::after {
  content: '';
  display: inline-block;
  width: 12px;
  height: 12px;
  margin-left: 8px;
  border: 2px solid transparent;
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
</style>
