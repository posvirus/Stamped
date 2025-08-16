<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTaskStore, useAppStore } from '../stores'
import Toast from '../components/Toast.vue'
import PullRefresh from '../components/PullRefresh.vue'
import TaskCard from '../components/TaskCard.vue'

const router = useRouter()
const taskStore = useTaskStore()
const appStore = useAppStore()

// 轮播相关状态
const pendingCarouselIndex = ref(0)
const completedCarouselIndex = ref(0)
const tasksPerPage = 2

// 搜索相关状态
const pendingSearchKeyword = ref('')
const completedSearchKeyword = ref('')

// 分页和加载状态
const currentPage = ref(1)
// const pageSize = ref(10) // 暂时未使用，保留用于未来分页功能
const hasMoreTasks = ref(true)

// 获取任务数据 - 支持搜索过滤
const pendingTasks = computed(() => {
  const allPendingTasks = taskStore.pendingTasks
  if (!pendingSearchKeyword.value.trim()) {
    return allPendingTasks
  }
  const keyword = pendingSearchKeyword.value.toLowerCase().trim()
  return allPendingTasks.filter(task => 
    task.title.toLowerCase().includes(keyword) || 
    task.agreement.toLowerCase().includes(keyword)
  )
})

const completedTasks = computed(() => {
  const allCompletedTasks = taskStore.completedTasks
  if (!completedSearchKeyword.value.trim()) {
    return allCompletedTasks
  }
  const keyword = completedSearchKeyword.value.toLowerCase().trim()
  return allCompletedTasks.filter(task => 
    task.title.toLowerCase().includes(keyword) || 
    task.agreement.toLowerCase().includes(keyword)
  )
})

// 轮播显示的任务数据 - 每次切换一个任务，但显示三个任务
const displayedPendingTasks = computed(() => {
  const start = pendingCarouselIndex.value
  return pendingTasks.value.slice(start, start + tasksPerPage)
})

const displayedCompletedTasks = computed(() => {
  const start = completedCarouselIndex.value
  return completedTasks.value.slice(start, start + tasksPerPage)
})

// 是否可以向前/向后切换
const canPrevPending = computed(() => pendingCarouselIndex.value > 0)
const canNextPending = computed(() => pendingCarouselIndex.value + tasksPerPage < pendingTasks.value.length)
const canPrevCompleted = computed(() => completedCarouselIndex.value > 0)
const canNextCompleted = computed(() => completedCarouselIndex.value + tasksPerPage < completedTasks.value.length)

// 跳转到创建目标页面
const goToCreateGoal = () => {
  router.push({
    name: 'confirmAgreement',
    query: {
      mode: 'create'
    }
  })
}

// 跳转到任务详情页面
const goToTaskDetail = (taskId) => {
  router.push(`/task-detail/${taskId}`)
}

// 处理任务卡片点击
const handleTaskClick = (taskData) => {
  goToTaskDetail(taskData._id)
}

// 轮播控制方法
const prevPendingTasks = () => {
  if (canPrevPending.value) {
    pendingCarouselIndex.value--
  }
}

const nextPendingTasks = () => {
  if (canNextPending.value) {
    pendingCarouselIndex.value++
  }
}

const prevCompletedTasks = () => {
  if (canPrevCompleted.value) {
    completedCarouselIndex.value--
  }
}

const nextCompletedTasks = () => {
  if (canNextCompleted.value) {
    completedCarouselIndex.value++
  }
}

// 重置轮播索引
const resetCarouselIndices = () => {
  pendingCarouselIndex.value = 0
  completedCarouselIndex.value = 0
}

// 搜索相关方法
const clearPendingSearch = () => {
  pendingSearchKeyword.value = ''
  pendingCarouselIndex.value = 0
}

const clearCompletedSearch = () => {
  completedSearchKeyword.value = ''
  completedCarouselIndex.value = 0
}

// 当搜索关键词变化时重置轮播索引
const handlePendingSearch = () => {
  pendingCarouselIndex.value = 0
}

const handleCompletedSearch = () => {
  completedCarouselIndex.value = 0
}

// 跳转到组件测试页面（开发环境）
const goToComponentTest = () => {
  router.push('/component-test')
}

// 检查是否为开发环境
const isDev = import.meta.env.DEV

// 日历相关数据
const currentDate = ref(new Date())
const weekDays = ['日', '一', '二', '三', '四', '五', '六']

// 获取当前日期信息
const currentDateInfo = computed(() => {
  const date = currentDate.value
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    weekDay: date.getDay()
  }
})

// 获取本周的日期
const weekDates = computed(() => {
  const today = currentDate.value
  const currentDay = today.getDay() // 0=周日, 1=周一, ..., 6=周六
  const dates = []
  
  // 计算本周的开始日期（周日）
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - currentDay)
  
  // 生成本周7天的日期
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek)
    date.setDate(startOfWeek.getDate() + i)
    dates.push({
      day: date.getDate(),
      isToday: date.toDateString() === today.toDateString()
    })
  }
  
  return dates
})

// 注意：格式化日期和截取标题功能现在由TaskCard组件内部处理

// 刷新和加载更多函数
const handleRefresh = async () => {
  try {
    console.log('🔄 用户触发下拉刷新')
    
    // 重置分页和轮播索引
    currentPage.value = 1
    hasMoreTasks.value = true
    resetCarouselIndices()
    
    // 从服务器获取最新数据
    await taskStore.fetchAllTasks()
    
    console.log('✅ 下拉刷新完成，任务数量:', taskStore.totalTasks)
    appStore.showSuccess('数据已更新')
  } catch (error) {
    console.error('❌ 下拉刷新失败:', error)
    appStore.showError('刷新失败，请稍后重试')
    
    // 如果服务器请求失败，至少刷新本地数据
    taskStore.loadFromLocalStorage()
    throw error // 让PullRefresh组件知道刷新失败
  }
}

const handleLoadMore = async () => {
  try {
    // 模拟加载更多数据
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // 增加页码
    currentPage.value++
    
    // 模拟没有更多数据的情况（当页码大于3时）
    if (currentPage.value > 3) {
      hasMoreTasks.value = false
      appStore.showInfo('没有更多任务了')
      return false // 返回false表示没有更多数据
    }
    
    // 在实际应用中，这里会调用API加载更多任务
    // const newTasks = await taskAPI.getTasks(currentPage.value, pageSize.value)
    // taskStore.addTasks(newTasks)
    
    appStore.showSuccess('加载完成')
    return true // 返回true表示还有更多数据
  } catch (error) {
    appStore.showError('加载失败')
    throw error // 让PullRefresh组件知道加载失败
  }
}

// 测试状态管理功能
const testStores = () => {
  // 测试添加任务
  const testTask = taskStore.addTask({
    title: '测试目标：每天锻炼30分钟',
    agreement: '我承诺每天进行至少30分钟的有氧运动，包括跑步、游泳或骑行。如果当天无法完成，需要在次日补足60分钟的运动量。'
  })
  
  appStore.showSuccess('测试任务已创建')
  console.log('测试任务创建成功:', testTask)
}

// 状态栏按键点击处理
const handleNavButtonClick = (buttonName) => {
  appStore.showInfo('按键功能尚未开发')
}

// 用户头像点击处理
const handleUserAvatarClick = () => {
  appStore.showInfo('用户功能尚未开发')
}

onMounted(async () => {
  // 设置页面标题
  appStore.setPageTitle('自律工具 - 任务总览')
  appStore.setCurrentPage('home')
  
  console.log('🏠 首页加载开始')
  
  // 首先从本地存储加载数据，确保有基础数据显示
  taskStore.loadFromLocalStorage()
  console.log('📦 本地任务数量:', taskStore.totalTasks)
  
  // 然后从服务器获取最新数据
  try {
    await taskStore.fetchAllTasks()
    console.log('✅ 服务器任务数据已同步，总数量:', taskStore.totalTasks)
  } catch (error) {
    console.error('❌ 同步服务器数据失败:', error)
    appStore.showError('获取最新数据失败，显示本地缓存数据')
  }
  
  // 开发模式下添加测试按钮
  if (import.meta.env.DEV) {
    window.testStores = testStores
    window.testDeleteFunction = () => {
      console.log('🧪 测试删除功能:')
      console.log('1. 当前任务列表:', taskStore.tasks)
      console.log('2. 创建测试任务...')
      const testTask = taskStore.addTask({
        title: '测试删除功能',
        agreement: '这是一个用于测试删除功能的任务，创建后立即可以删除'
      })
      console.log('3. 测试任务已创建:', testTask)
      console.log('4. 现在可以点击删除按钮测试删除功能')
      appStore.showSuccess('测试任务已创建，现在可以测试删除功能')
    }
    console.log('开发模式：可以在控制台使用以下命令:')
    console.log('- testStores() - 测试状态管理')
    console.log('- testDeleteFunction() - 测试删除功能')
  }
})
</script>

<template>
  <div class="home-page">
    <PullRefresh
      class="home-page-content"
      :can-load-more="hasMoreTasks"
      @refresh="handleRefresh"
      @load-more="handleLoadMore"
    >

    <!-- 主要内容区域 -->
    <main class="main-content">

      <!-- 任务展示区域 -->
      <div class="task-sections">
        <!-- 用户欢迎区域 -->
        <div class="user-welcome-section">
          <div class="user-avatar" @click="handleUserAvatarClick">
            <div class="avatar-icon">👤</div>
          </div>
          <div class="welcome-content">
            <div class="greeting">嗨，Stella。</div>
            <div class="subtitle">开始今天的打卡吧！</div>
          </div>
        </div>
        
        <!-- 日历组件 -->
        <div class="calendar-widget">
          <div class="calendar-week">
            <div 
              v-for="(weekDay, index) in weekDays" 
              :key="index"
              class="week-day-header"
            >
              {{ weekDay }}
            </div>
          </div>
          <div class="calendar-dates">
            <div 
              v-for="(date, index) in weekDates" 
              :key="index"
              class="calendar-date"
              :class="{ 'today': date.isToday }"
            >
              {{ date.day }}
            </div>
          </div>
        </div>
        <!-- 未完成任务展示栏 -->
        <section class="task-carousel-section">
          <div class="section-header">
            <h2 class="section-title">
              <img src="../assets/flag.svg" alt="未完成" class="title-icon" />
              To-Do
            </h2>
            <div class="search-bar">
              <input 
                v-model="pendingSearchKeyword"
                @input="handlePendingSearch"
                type="text" 
                placeholder="搜索未完成任务..."
                class="search-input"
              />
              <button 
                v-if="pendingSearchKeyword"
                @click="clearPendingSearch"
                class="clear-search-btn"
                aria-label="清除搜索"
              >
                ✕
              </button>
              <div class="search-icon">🔍</div>
            </div>
          </div>
          
          <div class="task-carousel">
            <div v-if="pendingTasks.length === 0" class="empty-state">
              <div v-if="pendingSearchKeyword.trim()" class="search-empty">
                <div class="empty-icon">🔍</div>
                <h3>没有找到匹配的任务</h3>
                <p>尝试使用其他关键词搜索</p>
                <button @click="clearPendingSearch" class="clear-search-hint">清除搜索条件</button>
              </div>
              <div v-else>
                <p>设定第一个自律目标，开始改变自己！</p>
              </div>
            </div>
            <div v-else class="task-carousel-with-nav">
              <button 
                class="carousel-btn-side prev" 
                :disabled="!canPrevPending"
                @click="prevPendingTasks"
              >
                ‹
              </button>
              <div class="task-cards">
                <TaskCard
                  v-for="task in displayedPendingTasks" 
                  :key="task._id"
                  :task-id="task._id"
                  :title="task.title"
                  :description="task.agreement"
                  :created-at="task.createdAt"
                  :completed-at="task.completedAt"
                  :is-completed="false"
                  :show-delete-button="false"
                  :max-title-length="6"
                  @click="handleTaskClick"
                />
              </div>
              <button 
                class="carousel-btn-side next" 
                :disabled="!canNextPending"
                @click="nextPendingTasks"
              >
                ›
              </button>
            </div>
          </div>
        </section>

        <!-- 已完成任务展示栏 -->
        <section class="task-carousel-section">
          <div class="section-header">
            <h2 class="section-title">
              <img src="../assets/tick.svg" alt="已完成" class="title-icon" />
              Stamped! 
            </h2>
            <div class="search-bar">
              <input 
                v-model="completedSearchKeyword"
                @input="handleCompletedSearch"
                type="text" 
                placeholder="搜索已完成任务..."
                class="search-input"
              />
              <button 
                v-if="completedSearchKeyword"
                @click="clearCompletedSearch"
                class="clear-search-btn"
                aria-label="清除搜索"
              >
                ✕
              </button>
              <div class="search-icon">🔍</div>
            </div>
          </div>
          
          <div class="task-carousel">
            <div v-if="completedTasks.length === 0" class="empty-state">
              <div v-if="completedSearchKeyword.trim()" class="search-empty">
                <div class="empty-icon">🔍</div>
                <h3>没有找到匹配的任务</h3>
                <p>尝试使用其他关键词搜索</p>
                <button @click="clearCompletedSearch" class="clear-search-hint">清除搜索条件</button>
              </div>
              <div v-else>
                <p>完成任务后，这里会显示你的成就！</p>
              </div>
            </div>
            <div v-else class="task-carousel-with-nav">
              <button 
                class="carousel-btn-side prev" 
                :disabled="!canPrevCompleted"
                @click="prevCompletedTasks"
              >
                ‹
              </button>
              <div class="task-cards">
                <TaskCard
                  v-for="task in displayedCompletedTasks" 
                  :key="task._id"
                  :task-id="task._id"
                  :title="task.title"
                  :description="task.agreement"
                  :created-at="task.createdAt"
                  :completed-at="task.completedAt"
                  :is-completed="true"
                  :show-delete-button="false"
                  :max-title-length="6"
                  @click="handleTaskClick"
                />
              </div>
              <button 
                class="carousel-btn-side next" 
                :disabled="!canNextCompleted"
                @click="nextCompletedTasks"
              >
                ›
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- 浮动操作按钮 -->
    <button class="fab" @click="goToCreateGoal">
      <span class="fab-icon"></span>
    </button>

    <!-- 底部状态栏 -->
    <div class="bottom-nav-bar">
      <div class="nav-button-group left">
        <button class="nav-button" @click="handleNavButtonClick('button1')">
        </button>
        <button class="nav-button" @click="handleNavButtonClick('button2')">
        </button>
      </div>
      
      <div class="nav-button-group right">
        <button class="nav-button" @click="handleNavButtonClick('button3')">
        </button>
        <button class="nav-button" @click="handleNavButtonClick('button4')">
        </button>
      </div>
    </div>

    </PullRefresh>

    <!-- Toast 消息提示 -->
    <Toast 
      v-if="appStore.shouldShowToast"
      :message="appStore.toast.message"
      :type="appStore.toast.type"
      :visible="appStore.toast.visible"
      @close="appStore.hideToast"
    />
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  background: #FFF4E1;
  position: relative;
  overflow-x: visible;
}

/* PullRefresh组件样式 */
.home-page-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.refresh-text {
  font-size: 14px;
  font-weight: 500;
}

/* 主要内容区域 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: visible;
}



/* 用户欢迎区域样式 */
.user-welcome-section {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 12px 16px;
  margin: 0 20px 8px 20px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #F4624B, #e55842);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 3px 12px rgba(244, 98, 75, 0.25);
  flex-shrink: 0;
}

.user-avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 16px rgba(244, 98, 75, 0.35);
}

.user-avatar:active {
  transform: scale(0.95);
}

.avatar-icon {
  font-size: 24px;
  color: white;
}

.welcome-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.greeting {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  line-height: 1.2;
}

.subtitle {
  font-size: 14px;
  color: #7a8aa1;
  font-weight: 400;
  line-height: 1.3;
}

/* 移动端适配 */
@media (max-width: 480px) {
  .user-welcome-section {
    margin: 0 15px 6px 15px;
    padding: 10px 14px;
    gap: 12px;
  }
  
  .user-avatar {
    width: 42px;
    height: 42px;
  }
  
  .avatar-icon {
    font-size: 20px;
  }
  
  .greeting {
    font-size: 16px;
  }
  
  .subtitle {
    font-size: 13px;
  }
}

/* 小屏设备高度优化 */
@media (max-height: 700px) {
  .user-welcome-section {
    margin: 0 15px 6px 15px;
    padding: 8px 12px;
  }
  
  .user-avatar {
    width: 40px;
    height: 40px;
  }
  
  .avatar-icon {
    font-size: 18px;
  }
  
  .greeting {
    font-size: 15px;
  }
  
  .subtitle {
    font-size: 12px;
  }
}

@media (max-height: 600px) {
  .user-welcome-section {
    margin: 0 12px 4px 12px;
    padding: 6px 10px;
    gap: 8px;
  }
  
  .user-avatar {
    width: 36px;
    height: 36px;
  }
  
  .avatar-icon {
    font-size: 16px;
  }
  
  .greeting {
    font-size: 14px;
  }
  
  .subtitle {
    font-size: 11px;
  }
}

@media (max-height: 500px) {
  .user-welcome-section {
    margin: 0 10px 4px 10px;
    padding: 4px 8px;
    gap: 6px;
  }
  
  .user-avatar {
    width: 32px;
    height: 32px;
  }
  
  .avatar-icon {
    font-size: 14px;
  }
  
  .greeting {
    font-size: 13px;
  }
  
  .subtitle {
    font-size: 10px;
  }
}

/* 日历组件样式 */
.calendar-widget {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 12px 16px;
  margin: 0 20px 8px 20px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}



.calendar-week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
  margin-bottom: 8px;
}

.week-day-header {
  text-align: center;
  font-size: 12px;
  font-weight: 500;
  color: #666;
  padding: 4px 2px;
}

.calendar-dates {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}

.calendar-date {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
  border-radius: 6px;
  transition: all 0.2s ease;
  cursor: pointer;
  min-height: 28px;
}

.calendar-date.today {
  background: #F4624B;
  color: white;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(244, 98, 75, 0.3);
}

.calendar-date:hover:not(.today) {
  background: rgba(244, 98, 75, 0.1);
  color: #F4624B;
}

/* 移动端优化 */
@media (max-width: 480px) {
  .task-sections {
    padding: 10px 0 80px 0;
    gap: 8px;
    min-height: calc(100vh - 100px);
  }
  
  .calendar-widget {
    margin: 0 12px 6px 12px;
    padding: 8px 12px;
    border-radius: 10px;
  }
  
  .week-day-header {
    font-size: 11px;
    padding: 3px 1px;
  }
  
  .calendar-date {
    font-size: 12px;
    min-height: 24px;
  }
  
  .calendar-week {
    gap: 4px;
    margin-bottom: 6px;
  }
  
  .calendar-dates {
    gap: 4px;
  }
}

/* 任务展示区域 */
.task-sections {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  padding: 20px 0 100px 0;
  gap: 12px;
  min-height: calc(100vh - 140px);
  overflow: visible;
}

/* 小屏设备高度优化 */
@media (max-height: 800px) {
  .task-sections {
    padding: 10px 0 70px 0;
    gap: 10px;
    min-height: calc(100vh - 85px);
  }
}

@media (max-height: 700px) {
  .task-sections {
    padding: 8px 0 60px 0;
    gap: 8px;
    min-height: calc(100vh - 70px);
    justify-content: flex-start;
  }
  
  .calendar-widget {
    padding: 8px 12px;
    margin: 0 15px 8px 15px;
  }
}

@media (max-height: 600px) {
  .task-sections {
    padding: 6px 0 60px 0;
    gap: 6px;
    min-height: auto;
    justify-content: flex-start;
  }
  
  .calendar-widget {
    padding: 6px 10px;
    margin: 0 12px 6px 12px;
  }
  
  .calendar-date {
    min-height: 22px;
    font-size: 12px;
  }
  
  .week-day-header {
    font-size: 10px;
    padding: 2px 1px;
  }
}

/* 超小屏幕优化 */
@media (max-height: 500px) {
  .task-sections {
    padding: 4px 0 50px 0;
    gap: 4px;
  }
  
  .calendar-widget {
    padding: 4px 8px;
    margin: 0 10px 4px 10px;
  }
  
  .calendar-date {
    min-height: 20px;
    font-size: 11px;
  }
  
  .calendar-week {
    gap: 3px;
    margin-bottom: 4px;
  }
  
  .calendar-dates {
    gap: 3px;
  }
}

/* 任务轮播区域 */
.task-carousel-section {
  background: transparent;
  border-radius: 0;
  padding: 4px 0;
  box-shadow: none;
  backdrop-filter: none;
  margin: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  padding: 0 20px;
  gap: 16px;
}

.section-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  background: rgba(255, 255, 255, 0.9);
  padding: 8px 16px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  min-width: fit-content;
}

.title-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}



.task-carousel-with-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
  width: 100%;
  position: relative;
  min-height: 120px;
  padding: 0 60px;
}

/* 小屏设备优化轮播高度 */
@media (max-height: 700px) {
  .task-carousel-with-nav {
    min-height: 85px;
    padding: 0 45px;
  }
}

@media (max-height: 600px) {
  .task-carousel-with-nav {
    min-height: 75px;
    padding: 0 40px;
  }
}

.carousel-btn-side {
  width: 48px;
  height: 48px;
  border: 1.5px solid rgba(139, 116, 95, 0.3);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  color: rgba(91, 77, 62, 0.8);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 600;
  transition: all 0.3s ease;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 100;
  box-shadow: 0 3px 12px rgba(139, 116, 95, 0.15);
  backdrop-filter: blur(8px);
}

/* 小屏设备轮播按钮优化 */
@media (max-height: 600px) {
  .carousel-btn-side {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }
}

@media (max-height: 500px) {
  .carousel-btn-side {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }
  
  .task-carousel-with-nav {
    min-height: 70px;
    padding: 0 40px;
  }
}

.carousel-btn-side.prev {
  left: 10px;
}

.carousel-btn-side.next {
  right: 10px;
}

.carousel-btn-side:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.85);
  color: rgba(25, 118, 210, 0.9);
  border-color: rgba(25, 118, 210, 0.4);
  transform: translateY(-50%) scale(1.05);
  box-shadow: 0 4px 16px rgba(25, 118, 210, 0.2);
}

.carousel-btn-side:disabled {
  opacity: 0.3;
  cursor: not-allowed;
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(139, 116, 95, 0.15);
  color: rgba(91, 77, 62, 0.4);
  transform: translateY(-50%);
}

.task-carousel {
  overflow: visible;
  background: white;
  border-radius: 16px;
  padding: 15px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  margin: 0 20px;
}

@media (max-height: 600px) {
  .task-carousel {
    padding: 12px;
    border-radius: 12px;
    margin: 0 15px;
  }
}

@media (max-height: 500px) {
  .task-carousel {
    padding: 10px;
    border-radius: 10px;
    margin: 0 12px;
  }
}

.empty-state {
  text-align: center;
  padding: 20px 15px;
  color: #666;
  background: transparent;
  border-radius: 0;
  backdrop-filter: none;
  box-shadow: none;
}

/* 小屏设备空状态优化 */
@media (max-height: 700px) {
  .empty-state {
    padding: 12px 15px;
  }
}

@media (max-height: 600px) {
  .empty-state {
    padding: 8px 15px;
  }
  
  .empty-icon {
    font-size: 32px !important;
    margin-bottom: 10px !important;
  }
  
  .empty-state h3 {
    font-size: 15px !important;
    margin: 10px 0 5px 0 !important;
  }
  
  .empty-state p {
    font-size: 13px !important;
    line-height: 1.4 !important;
  }
}

@media (max-height: 500px) {
  .empty-state {
    padding: 6px 12px;
  }
  
  .empty-icon {
    font-size: 28px !important;
    margin-bottom: 8px !important;
  }
  
  .empty-state h3 {
    font-size: 14px !important;
    margin: 8px 0 4px 0 !important;
  }
  
  .empty-state p {
    font-size: 12px !important;
    line-height: 1.3 !important;
  }
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state h3 {
  margin: 16px 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.empty-state p {
  margin: 8px 0;
  line-height: 1.5;
  color: #5a6c7d;
}

.empty-hint {
  font-size: 14px;
  color: #1976d2;
  font-weight: 500;
}

.task-cards {
  display: flex;
  flex-direction: row;
  gap: 16px;
  justify-content: center;
  align-items: stretch;
  flex-wrap: nowrap;
  overflow: visible;
  width: 100%;
  max-width: calc(2 * 280px + 1 * 16px);
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.fab {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  width: 77px;
  height: 77px;
  border-radius: 50%;
  background: #F4624B;
  border: 3px solid white;
  box-shadow: 0 8px 25px rgba(244, 98, 75, 0.4);
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 小屏设备FAB按钮优化 */
@media (max-height: 700px) {
  .fab {
    bottom: 25px;
    left: 50%;
    transform: translateX(-50%);
    width: 62px;
    height: 62px;
  }
}

@media (max-height: 600px) {
  .fab {
    bottom: 76px;
    left: 50%;
    transform: translateX(-50%);
    width: 58px;
    height: 58px;
  }
}

@media (max-height: 500px) {
  .fab {
    bottom: 67px;
    width: 53px;
    height: 53px;
  }
  
  .fab-icon {
    width: 24px;
    height: 24px;
  }
  
  .fab-icon::before {
    width: 5px;
    height: 24px;
  }
  
  .fab-icon::after {
    width: 24px;
    height: 5px;
  }
}

/* 搜索栏样式 */
.search-bar {
  position: relative;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  padding: 0 40px 0 16px;
  flex: 1;
  min-width: 150px;
  max-width: 300px;
  height: 36px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.search-bar:focus-within {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: #F4624B;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: #2c3e50;
  font-size: 14px;
  font-weight: 500;
  padding: 0;
  height: 100%;
}

.search-input::placeholder {
  color: #7a8aa1;
  font-weight: 400;
}

.search-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: #7a8aa1;
  pointer-events: none;
}

.clear-search-btn {
  position: absolute;
  right: 32px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #7a8aa1;
  font-size: 16px;
  cursor: pointer;
  padding: 2px;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.clear-search-btn:hover {
  background: rgba(244, 98, 75, 0.1);
  color: #F4624B;
}

/* 移动端适配 */
@media (max-width: 480px) {
  .section-header {
    padding: 0 15px;
    gap: 12px;
  }
  
  .section-title {
    font-size: 16px;
    padding: 6px 12px;
  }
  
  .title-icon {
    width: 20px;
    height: 20px;
  }
  
  .search-bar {
    min-width: 120px;
    max-width: none;
    height: 32px;
    padding: 0 36px 0 12px;
  }
  
  .search-input {
    font-size: 13px;
  }
  
  .search-icon {
    right: 10px;
    font-size: 12px;
  }
  
  .clear-search-btn {
    right: 28px;
    font-size: 14px;
    width: 18px;
    height: 18px;
  }
}

/* 小屏设备优化 */
@media (max-height: 600px) {
  .section-header {
    margin-bottom: 4px;
  }
  
  .section-title {
    font-size: 15px;
    padding: 5px 10px;
  }
  
  .title-icon {
    width: 18px;
    height: 18px;
  }
  
  .search-bar {
    height: 30px;
    padding: 0 34px 0 12px;
    min-width: 100px;
  }
  
  .search-input {
    font-size: 12px;
  }
  
  .search-icon {
    font-size: 11px;
    right: 10px;
  }
  
  .clear-search-btn {
    font-size: 13px;
    width: 16px;
    height: 16px;
    right: 26px;
  }
}

@media (max-height: 500px) {
  .section-header {
    margin-bottom: 3px;
  }
  
  .section-title {
    font-size: 14px;
    padding: 4px 8px;
  }
  
  .title-icon {
    width: 16px;
    height: 16px;
  }
  
  .search-bar {
    height: 28px;
    padding: 0 32px 0 10px;
    min-width: 80px;
  }
  
  .search-input {
    font-size: 11px;
  }
  
  .search-icon {
    font-size: 10px;
    right: 8px;
  }
  
  .clear-search-btn {
    font-size: 12px;
    width: 14px;
    height: 14px;
    right: 24px;
  }
}

/* 极小屏幕进一步优化 */
@media (max-height: 450px) {
  .task-sections {
    padding: 2px 0 50px 0;
    gap: 2px;
  }
  
  .user-welcome-section {
    margin: 0 8px 2px 8px;
    padding: 3px 6px;
    gap: 4px;
  }
  
  .user-avatar {
    width: 28px;
    height: 28px;
  }
  
  .avatar-icon {
    font-size: 12px;
  }
  
  .greeting {
    font-size: 12px;
  }
  
  .subtitle {
    font-size: 9px;
  }
  
  .calendar-widget {
    margin: 0 8px 2px 8px;
    padding: 3px 6px;
  }
  
  .calendar-date {
    min-height: 18px;
    font-size: 10px;
  }
  
  .week-day-header {
    font-size: 9px;
    padding: 1px;
  }
  
  .section-header {
    margin-bottom: 2px;
    padding: 0 8px;
  }
  
  .section-title {
    font-size: 13px;
    padding: 3px 6px;
  }
  
  .title-icon {
    width: 14px;
    height: 14px;
  }
  
  .task-carousel-section {
    padding: 2px 0;
  }
}

/* 搜索空状态样式 */
.search-empty {
  text-align: center;
}

.clear-search-hint {
  background: #F4624B;
  color: white;
  border: none;
  border-radius: 18px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 12px;
  transition: all 0.2s ease;
}

.clear-search-hint:hover {
  background: #e55842;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(244, 98, 75, 0.3);
}

.clear-search-hint:active {
  transform: translateY(0);
}

/* 移动端清除搜索按钮优化 */
@media (max-width: 480px) {
  .clear-search-hint {
    font-size: 13px;
    padding: 6px 12px;
    margin-top: 10px;
  }
}

@media (max-height: 600px) {
  .clear-search-hint {
    font-size: 12px;
    padding: 5px 10px;
    margin-top: 8px;
  }
}

@media (max-height: 500px) {
  .clear-search-hint {
    font-size: 11px;
    padding: 4px 8px;
    margin-top: 6px;
  }
}

.fab:hover {
  transform: translateX(-50%) scale(1.1);
  box-shadow: 0 12px 35px rgba(244, 98, 75, 0.6);
}

.fab:active {
  transform: translateX(-50%) scale(0.95);
}

.fab-icon {
  position: relative;
  width: 29px;
  height: 29px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fab-icon::before,
.fab-icon::after {
  content: '';
  position: absolute;
  background: white;
  border-radius: 2px;
}

/* 垂直线 */
.fab-icon::before {
  width: 7px;
  height: 29px;
}

/* 水平线 */
.fab-icon::after {
  width: 29px;
  height: 7px;
}

/* 底部状态栏样式 */
.bottom-nav-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: white;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 999;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.1);
}

.nav-button-group {
  display: flex;
  gap: 20px;
  align-items: center;
}

.nav-button-group.left {
  margin-right: auto;
}

.nav-button-group.right {
  margin-left: auto;
}

.nav-button {
  background: rgba(244, 98, 75, 0.1);
  border: 1.5px solid rgba(244, 98, 75, 0.3);
  border-radius: 20px;
  padding: 10px 16px;
  color: #F4624B;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 60px;
  text-align: center;
}

.nav-button:hover {
  background: rgba(244, 98, 75, 0.2);
  border-color: rgba(244, 98, 75, 0.5);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(244, 98, 75, 0.2);
}

.nav-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(244, 98, 75, 0.2);
}

/* 移动端适配 */
@media (max-width: 480px) {
  .bottom-nav-bar {
    height: 70px;
    padding: 0 15px;
  }
  
  .nav-button-group {
    gap: 15px;
  }
  
  .nav-button {
    padding: 8px 12px;
    font-size: 13px;
    min-width: 50px;
  }
}

/* 小屏设备适配 */
@media (max-height: 700px) {
  .bottom-nav-bar {
    height: 65px;
    padding: 0 15px;
  }
  
  .nav-button {
    padding: 8px 14px;
    font-size: 13px;
  }
}

@media (max-height: 600px) {
  .bottom-nav-bar {
    height: 60px;
    padding: 0 12px;
  }
  
  .nav-button-group {
    gap: 12px;
  }
  
  .nav-button {
    padding: 6px 10px;
    font-size: 12px;
    min-width: 45px;
  }
}

@media (max-height: 500px) {
  .bottom-nav-bar {
    height: 55px;
    padding: 0 10px;
  }
  
  .nav-button-group {
    gap: 10px;
  }
  
  .nav-button {
    padding: 5px 8px;
    font-size: 11px;
    min-width: 40px;
  }
}
</style>
