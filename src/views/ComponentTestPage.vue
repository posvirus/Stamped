<template>
  <div class="component-test-page">
    <div class="test-header">
      <h1>公共组件测试页面</h1>
      <p>测试所有已开发的公共组件功能和效果</p>
    </div>

    <div class="test-sections">
      <!-- TaskCard 组件测试 -->
      <section class="test-section">
        <h2>TaskCard 组件</h2>
        <div class="test-grid">
          <TaskCard
            title="学习Vue3新特性"
            description="深入学习Vue3的Composition API和新的响应式系统"
            :created-at="new Date('2024-01-15')"
            :is-completed="false"
            @click="handleTaskCardClick"
          />
          <TaskCard
            title="完成项目重构，将旧版本的代码迁移到新架构"
            :created-at="new Date('2024-01-10')"
            :completed-at="new Date('2024-01-12')"
            :is-completed="true"
            @click="handleTaskCardClick"
          />
          <TaskCard
            title="阅读技术文档"
            :created-at="new Date(Date.now() - 24 * 60 * 60 * 1000)"
            :is-completed="false"
            :show-description="true"
            description="阅读最新的前端技术文档，了解行业发展趋势"
            @click="handleTaskCardClick"
          />
        </div>
      </section>

      <!-- CustomButton 组件测试 -->
      <section class="test-section">
        <h2>CustomButton 组件</h2>
        <div class="test-grid">
          <div class="button-group">
            <h4>按钮类型</h4>
            <CustomButton type="primary" text="主要按钮" @click="handleButtonClick" />
            <CustomButton type="secondary" text="次要按钮" @click="handleButtonClick" />
            <CustomButton type="danger" text="危险按钮" @click="handleButtonClick" />
            <CustomButton type="ghost" text="幽灵按钮" @click="handleButtonClick" />
            <CustomButton type="text" text="文字按钮" @click="handleButtonClick" />
          </div>
          
          <div class="button-group">
            <h4>按钮大小</h4>
            <CustomButton size="small" text="小按钮" @click="handleButtonClick" />
            <CustomButton size="medium" text="中按钮" @click="handleButtonClick" />
            <CustomButton size="large" text="大按钮" @click="handleButtonClick" />
          </div>
          
          <div class="button-group">
            <h4>按钮状态</h4>
            <CustomButton text="正常按钮" @click="handleButtonClick" />
            <CustomButton text="禁用按钮" :disabled="true" />
            <CustomButton text="加载中" :loading="buttonLoading" @click="handleLoadingButton" />
            <CustomButton text="块级按钮" :block="true" @click="handleButtonClick" />
          </div>
          
          <div class="button-group">
            <h4>测试功能</h4>
            <CustomButton 
              type="primary" 
              text="创建已完成任务" 
              @click="createCompletedTask" 
            />
            <p class="test-note">点击后将创建一个已完成的测试任务，可在首页查看效果</p>
          </div>
        </div>
      </section>

      <!-- FloatingActionButton 组件测试 -->
      <section class="test-section">
        <h2>FloatingActionButton 组件</h2>
        <div class="test-content">
          <p>浮动操作按钮会显示在页面右下角，点击测试不同效果：</p>
          <div class="fab-controls">
            <CustomButton 
              text="切换FAB图标" 
              type="secondary" 
              @click="toggleFabIcon" 
            />
            <CustomButton 
              text="切换FAB位置" 
              type="secondary" 
              @click="toggleFabPosition" 
            />
            <CustomButton 
              text="切换扩展模式" 
              type="secondary" 
              @click="toggleFabExtended" 
            />
          </div>
          <p>当前FAB状态：图标={{ fabIcon }}，位置={{ fabPosition }}，扩展={{ fabExtended }}</p>
        </div>
      </section>

      <!-- Loading 组件测试 -->
      <section class="test-section">
        <h2>Loading 组件</h2>
        <div class="test-grid">
          <div class="loading-group">
            <h4>不同类型的加载器</h4>
            <div class="loading-row">
              <Loading type="spinner" text="旋转加载" />
              <Loading type="dots" text="点状加载" />
              <Loading type="bars" text="条状加载" />
              <Loading type="circle" text="圆环加载" />
              <Loading type="pulse" text="脉冲加载" />
            </div>
          </div>
          
          <div class="loading-group">
            <h4>不同大小</h4>
            <div class="loading-row">
              <Loading size="small" text="小" />
              <Loading size="medium" text="中" />
              <Loading size="large" text="大" />
            </div>
          </div>
          
          <div class="loading-group">
            <h4>遮罩加载</h4>
            <CustomButton 
              text="显示遮罩加载" 
              @click="showOverlayLoading" 
            />
          </div>
        </div>
      </section>

      <!-- Toast 组件测试 -->
      <section class="test-section">
        <h2>Toast 组件</h2>
        <div class="test-grid">
          <div class="toast-group">
            <h4>不同类型的提示</h4>
            <CustomButton text="成功提示" type="secondary" @click="showToast('success')" />
            <CustomButton text="错误提示" type="secondary" @click="showToast('error')" />
            <CustomButton text="警告提示" type="secondary" @click="showToast('warning')" />
            <CustomButton text="信息提示" type="secondary" @click="showToast('info')" />
            <CustomButton text="加载提示" type="secondary" @click="showToast('loading')" />
          </div>
          
          <div class="toast-group">
            <h4>不同位置</h4>
            <CustomButton text="顶部中央" type="ghost" @click="showPositionToast('top-center')" />
            <CustomButton text="底部右侧" type="ghost" @click="showPositionToast('bottom-right')" />
            <CustomButton text="中央" type="ghost" @click="showPositionToast('middle-center')" />
          </div>
        </div>
      </section>

      <!-- Modal 组件测试 -->
      <section class="test-section">
        <h2>Modal 组件</h2>
        <div class="test-grid">
          <div class="modal-group">
            <h4>不同类型的弹窗</h4>
            <CustomButton text="基础弹窗" type="secondary" @click="showModal('basic')" />
            <CustomButton text="确认弹窗" type="secondary" @click="showModal('confirm')" />
            <CustomButton text="大尺寸弹窗" type="secondary" @click="showModal('large')" />
            <CustomButton text="无头部弹窗" type="secondary" @click="showModal('no-header')" />
          </div>
        </div>
      </section>

      <!-- ImageUploader 组件测试 -->
      <section class="test-section">
        <h2>ImageUploader 组件</h2>
        <div class="test-content">
          <h4>图片上传测试</h4>
          <ImageUploader
            v-model="uploadedImages"
            :max-count="3"
            :auto-upload="false"
            @change="handleImageChange"
            @remove="handleImageRemove"
          />
          <p v-if="uploadedImages.length > 0">
            已选择 {{ uploadedImages.length }} 张图片
          </p>
        </div>
      </section>
    </div>

    <!-- 浮动操作按钮 -->
    <FloatingActionButton
      :icon="fabIcon"
      :position="fabPosition"
      :extended="fabExtended"
      :label="fabExtended ? 'FAB测试' : ''"
      :is-rotated="fabIcon === 'close'"
      @click="handleFabClick"
    />

    <!-- Toast组件容器 -->
    <component
      v-for="toast in toasts"
      :key="toast.id"
      :is="Toast"
      v-bind="toast"
      @close="removeToast(toast.id)"
    />

    <!-- Modal组件 -->
    <Modal
      v-model="modalVisible"
      :title="modalConfig.title"
      :content="modalConfig.content"
      :size="modalConfig.size"
      :show-header="modalConfig.showHeader"
      :confirm-type="modalConfig.confirmType"
      @confirm="handleModalConfirm"
      @cancel="handleModalCancel"
    />

    <!-- 遮罩Loading -->
    <Loading
      v-if="overlayLoadingVisible"
      overlay
      text="正在加载中..."
      type="spinner"
    />
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import TaskCard from '../components/TaskCard.vue'
import CustomButton from '../components/CustomButton.vue'
import FloatingActionButton from '../components/FloatingActionButton.vue'
import Loading from '../components/Loading.vue'
import Toast from '../components/Toast.vue'
import Modal from '../components/Modal.vue'
import ImageUploader from '../components/ImageUploader.vue'
import { useTaskStore } from '../stores/taskStore.js'

// Store
const taskStore = useTaskStore()

// 响应式数据
const buttonLoading = ref(false)
const overlayLoadingVisible = ref(false)
const uploadedImages = ref([])

// FAB状态
const fabIcon = ref('plus')
const fabPosition = ref('bottom-right')
const fabExtended = ref(false)

// Toast状态
const toasts = ref([])
let toastId = 0

// Modal状态
const modalVisible = ref(false)
const modalConfig = reactive({
  title: '提示',
  content: '这是一个测试弹窗',
  size: 'medium',
  showHeader: true,
  confirmType: 'primary'
})

// 方法
const handleTaskCardClick = (taskData) => {
  console.log('点击任务卡片:', taskData)
  addToast({
    type: 'info',
    message: `点击了任务: ${taskData.title}`,
    duration: 2000
  })
}

const handleButtonClick = () => {
  console.log('按钮被点击')
  addToast({
    type: 'success',
    message: '按钮点击成功！',
    duration: 2000
  })
}

const handleLoadingButton = () => {
  buttonLoading.value = true
  setTimeout(() => {
    buttonLoading.value = false
    addToast({
      type: 'success',
      message: '加载完成！',
      duration: 2000
    })
  }, 2000)
}

const toggleFabIcon = () => {
  fabIcon.value = fabIcon.value === 'plus' ? 'close' : 'plus'
}

const toggleFabPosition = () => {
  const positions = ['bottom-right', 'bottom-left', 'bottom-center', 'top-right']
  const currentIndex = positions.indexOf(fabPosition.value)
  fabPosition.value = positions[(currentIndex + 1) % positions.length]
}

const toggleFabExtended = () => {
  fabExtended.value = !fabExtended.value
}

const handleFabClick = () => {
  addToast({
    type: 'info',
    message: '浮动按钮被点击！',
    duration: 2000
  })
}

const showOverlayLoading = () => {
  overlayLoadingVisible.value = true
  setTimeout(() => {
    overlayLoadingVisible.value = false
  }, 3000)
}

const addToast = (options) => {
  const toast = {
    id: ++toastId,
    ...options
  }
  toasts.value.push(toast)
}

const removeToast = (id) => {
  const index = toasts.value.findIndex(toast => toast.id === id)
  if (index > -1) {
    toasts.value.splice(index, 1)
  }
}

const showToast = (type) => {
  const messages = {
    success: '操作成功完成！',
    error: '操作失败，请重试',
    warning: '请注意检查输入内容',
    info: '这是一条信息提示',
    loading: '正在处理中...'
  }
  
  addToast({
    type,
    message: messages[type],
    duration: type === 'loading' ? 0 : 3000,
    showProgress: type !== 'loading'
  })
}

const showPositionToast = (position) => {
  addToast({
    type: 'info',
    message: `这是${position}位置的提示`,
    position,
    duration: 3000
  })
}

// 创建已完成任务（测试用）
const createCompletedTask = () => {
  const completedTask = {
    title: '每天早上7点前起床',
    agreement: `基于您的目标："每天早上7点前起床，坚持一周"，我为您制定以下协议：

1. 目标执行时间：每天早上7:00前起床
2. 执行周期：连续7天
3. 验证标准：
   - 每天拍照记录起床时间（显示时钟或手机时间）
   - 时间必须在7:00之前
   - 连续7天无间断

4. 成功标准：
   - 提供7张起床时间照片
   - 每张照片时间戳在7:00之前
   - 照片清晰可见时间显示

5. 验证方式：
   通过上传照片和文字说明进行验证，AI将根据时间戳和照片内容判定完成情况。`,
  }
  
  // 添加任务到store
  const newTask = taskStore.addTask(completedTask)
  
  // 将任务标记为已完成
  taskStore.completeTask(newTask.id)
  
  addToast({
    type: 'success',
    message: '已完成任务创建成功！可以在首页查看效果',
    duration: 4000
  })
  
  console.log('已完成任务创建成功:', newTask)
}

const showModal = (type) => {
  const configs = {
    basic: {
      title: '基础弹窗',
      content: '这是一个基础的弹窗示例，包含标准的确认和取消按钮。',
      size: 'medium',
      showHeader: true,
      confirmType: 'primary'
    },
    confirm: {
      title: '确认操作',
      content: '您确定要执行此操作吗？此操作不可撤销。',
      size: 'small',
      showHeader: true,
      confirmType: 'danger'
    },
    large: {
      title: '大尺寸弹窗',
      content: '这是一个大尺寸的弹窗，适合展示更多内容。可以用于复杂的表单或详细的信息展示。',
      size: 'large',
      showHeader: true,
      confirmType: 'primary'
    },
    'no-header': {
      title: '',
      content: '这是一个没有头部的弹窗，更加简洁。',
      size: 'medium',
      showHeader: false,
      confirmType: 'primary'
    }
  }
  
  Object.assign(modalConfig, configs[type])
  modalVisible.value = true
}

const handleModalConfirm = () => {
  addToast({
    type: 'success',
    message: '确认操作成功！',
    duration: 2000
  })
  modalVisible.value = false
}

const handleModalCancel = () => {
  addToast({
    type: 'info',
    message: '取消操作',
    duration: 2000
  })
}

const handleImageChange = (images) => {
  console.log('图片列表更新:', images)
  addToast({
    type: 'success',
    message: `已选择 ${images.length} 张图片`,
    duration: 2000
  })
}

const handleImageRemove = (image) => {
  console.log('移除图片:', image)
  addToast({
    type: 'warning',
    message: '图片已移除',
    duration: 2000
  })
}
</script>

<style scoped>
.component-test-page {
  min-height: 100vh;
  background: var(--bg-color);
  padding: var(--spacing-lg);
}

.test-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: var(--bg-white);
  border-radius: var(--border-radius-large);
  box-shadow: var(--shadow-light);
}

.test-header h1 {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--primary-color);
  font-size: var(--font-size-xxl);
}

.test-header p {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--font-size-md);
}

.test-sections {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.test-section {
  background: var(--bg-white);
  border-radius: var(--border-radius-large);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-light);
}

.test-section h2 {
  margin: 0 0 var(--spacing-lg) 0;
  color: var(--text-primary);
  font-size: var(--font-size-xl);
  border-bottom: 2px solid var(--border-color);
  padding-bottom: var(--spacing-sm);
}

.test-section h4 {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--text-primary);
  font-size: var(--font-size-md);
}

.test-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-lg);
  align-items: start;
}

.test-content {
  width: 100%;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-medium);
}

.button-group .custom-button {
  align-self: flex-start;
}

.loading-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-medium);
}

.loading-row {
  display: flex;
  gap: var(--spacing-lg);
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
}

.toast-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-medium);
}

.modal-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-medium);
}

.fab-controls {
  display: flex;
  gap: var(--spacing-sm);
  margin: var(--spacing-md) 0;
  flex-wrap: wrap;
}

.test-note {
  font-size: 12px;
  color: #666;
  margin: 8px 0 0 0;
  font-style: italic;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .component-test-page {
    padding: var(--spacing-md);
  }
  
  .test-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }
  
  .loading-row {
    justify-content: center;
  }
  
  .fab-controls {
    flex-direction: column;
  }
  
  .button-group .custom-button {
    align-self: stretch;
  }
}
</style>
