<template>
  <div 
    class="pull-refresh-container"
    :class="{ 'pull-refresh-container--disabled': disabled }"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove" 
    @touchend="handleTouchEnd"
    ref="containerRef"
  >
    <!-- 下拉刷新指示器 -->
    <div 
      class="pull-refresh-indicator"
      :class="[
        `pull-refresh-indicator--${refreshStatus}`,
        { 'pull-refresh-indicator--visible': pullDistance > 0 || isRefreshing }
      ]"
      :style="indicatorStyle"
    >
      <div class="pull-refresh-content">
        <!-- 刷新图标 -->
        <div class="pull-refresh-icon" :class="{ 'pull-refresh-icon--spinning': isRefreshing }">
          <slot name="refresh-icon">
            <svg viewBox="0 0 24 24" class="default-refresh-icon">
              <path d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z"/>
            </svg>
          </slot>
        </div>
        
        <!-- 刷新文本 -->
        <div class="pull-refresh-text">
          <slot name="refresh-text" :status="refreshStatus" :text="getRefreshText()">
            {{ getRefreshText() }}
          </slot>
        </div>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="pull-refresh-content-wrapper" :style="contentStyle">
      <slot></slot>
    </div>

    <!-- 上拉加载指示器 -->
    <div 
      v-if="enableLoadMore"
      class="load-more-indicator"
      :class="[
        `load-more-indicator--${loadStatus}`,
        { 'load-more-indicator--visible': showLoadMore }
      ]"
    >
      <div class="load-more-content">
        <!-- 加载图标 -->
        <div class="load-more-icon" :class="{ 'load-more-icon--spinning': isLoading }">
          <slot name="load-icon">
            <svg viewBox="0 0 24 24" class="default-load-icon">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="31.416" stroke-dashoffset="31.416">
                <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
              </circle>
            </svg>
          </slot>
        </div>
        
        <!-- 加载文本 -->
        <div class="load-more-text">
          <slot name="load-text" :status="loadStatus" :text="getLoadText()">
            {{ getLoadText() }}
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, nextTick } from 'vue'
import { usePullRefresh } from '../composables/usePullRefresh'

// Props定义
const props = defineProps({
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false
  },
  // 是否启用下拉刷新
  enablePullRefresh: {
    type: Boolean,
    default: true
  },
  // 是否启用上拉加载
  enableLoadMore: {
    type: Boolean,
    default: true
  },
  // 下拉刷新触发阈值
  refreshThreshold: {
    type: Number,
    default: 80
  },
  // 最大下拉距离
  maxPullDistance: {
    type: Number,
    default: 120
  },
  // 阻尼系数
  damping: {
    type: Number,
    default: 0.5
  },
  // 是否可以加载更多
  canLoadMore: {
    type: Boolean,
    default: true
  },
  // 自动重置时间
  autoResetTime: {
    type: Number,
    default: 1000
  }
})

// 事件定义
const emit = defineEmits(['refresh', 'load-more'])

// 容器引用
const containerRef = ref(null)

// 使用下拉刷新和上拉加载composable
const {
  isPulling,
  isRefreshing,
  isLoading,
  pullDistance,
  canLoadMore,
  refreshStatus,
  loadStatus,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  getRefreshText,
  getLoadText,
  setOnRefresh,
  setOnLoadMore,
  setCanLoadMore,
  setContainer
} = usePullRefresh({
  refreshThreshold: props.refreshThreshold,
  maxPullDistance: props.maxPullDistance,
  damping: props.damping,
  disabled: props.disabled,
  enablePullRefresh: props.enablePullRefresh,
  enableLoadMore: props.enableLoadMore,
  autoResetTime: props.autoResetTime
})

// 计算属性
const indicatorStyle = computed(() => {
  const distance = Math.min(pullDistance.value, props.maxPullDistance)
  return {
    transform: `translateY(${distance - props.refreshThreshold}px)`,
    opacity: Math.min(distance / props.refreshThreshold, 1)
  }
})

const contentStyle = computed(() => {
  if (isRefreshing.value) {
    return {
      transform: `translateY(${props.refreshThreshold}px)`,
      transition: 'transform 0.3s ease'
    }
  }
  
  if (pullDistance.value > 0) {
    return {
      transform: `translateY(${Math.min(pullDistance.value, props.maxPullDistance)}px)`
    }
  }
  
  return {}
})

const showLoadMore = computed(() => {
  return props.enableLoadMore && (isLoading.value || loadStatus.value !== 'idle')
})

// 设置回调函数
setOnRefresh(async () => {
  await emit('refresh')
})

setOnLoadMore(async () => {
  const result = await emit('load-more')
  return result !== false // 如果返回false表示没有更多数据
})

// 监听canLoadMore变化
const updateCanLoadMore = (value) => {
  setCanLoadMore(value)
}

// 初始化
nextTick(() => {
  setContainer(containerRef.value)
  updateCanLoadMore(props.canLoadMore)
})

// 监听props变化
const watchCanLoadMore = () => {
  updateCanLoadMore(props.canLoadMore)
}

// 暴露方法给父组件
defineExpose({
  manualRefresh: () => setOnRefresh,
  manualLoadMore: () => setOnLoadMore,
  resetPullState: () => {},
  resetLoadState: () => {}
})
</script>

<style scoped>
.pull-refresh-container {
  position: relative;
  overflow: hidden;
  height: 100%;
}

.pull-refresh-container--disabled {
  pointer-events: none;
}

/* 下拉刷新指示器 */
.pull-refresh-indicator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-white);
  border-radius: 0 0 12px 12px;
  box-shadow: var(--shadow-light);
  transform: translateY(-80px);
  transition: opacity 0.2s ease;
  z-index: 10;
}

.pull-refresh-indicator--visible {
  opacity: 1;
}

.pull-refresh-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.pull-refresh-icon {
  width: 24px;
  height: 24px;
  color: var(--primary-color);
  transition: transform 0.3s ease;
}

.pull-refresh-icon--spinning {
  animation: spin 1s linear infinite;
}

.default-refresh-icon {
  width: 100%;
  height: 100%;
  fill: currentColor;
}

.pull-refresh-text {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  white-space: nowrap;
}

/* 状态样式 */
.pull-refresh-indicator--ready .pull-refresh-icon {
  transform: rotate(180deg);
}

.pull-refresh-indicator--success .pull-refresh-icon {
  color: var(--success-color);
}

.pull-refresh-indicator--error .pull-refresh-icon {
  color: #f44336;
}

/* 内容区域 */
.pull-refresh-content-wrapper {
  min-height: 100%;
  transition: none;
}

/* 上拉加载指示器 */
.load-more-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60px;
  background: var(--bg-white);
  border-top: 1px solid var(--border-color);
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.load-more-indicator--visible {
  opacity: 1;
  transform: translateY(0);
}

.load-more-content {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
}

.load-more-icon {
  width: 20px;
  height: 20px;
  color: var(--primary-color);
}

.load-more-icon--spinning {
  animation: spin 1s linear infinite;
}

.default-load-icon {
  width: 100%;
  height: 100%;
}

.load-more-text {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

/* 状态样式 */
.load-more-indicator--success .load-more-icon {
  color: var(--success-color);
}

.load-more-indicator--error .load-more-icon {
  color: #f44336;
}

.load-more-indicator--nomore .load-more-icon {
  color: var(--text-disabled);
}

.load-more-indicator--nomore .load-more-text {
  color: var(--text-disabled);
}

/* 动画 */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 移动端优化 */
@media (max-width: 768px) {
  .pull-refresh-indicator {
    height: 60px;
    transform: translateY(-60px);
  }
  
  .pull-refresh-icon {
    width: 20px;
    height: 20px;
  }
  
  .load-more-indicator {
    height: 50px;
  }
  
  .load-more-icon {
    width: 16px;
    height: 16px;
  }
}

/* 无障碍访问 */
@media (prefers-reduced-motion: reduce) {
  .pull-refresh-icon,
  .load-more-icon,
  .pull-refresh-content-wrapper,
  .load-more-indicator {
    transition: none !important;
    animation: none !important;
  }
  
  .pull-refresh-icon--spinning,
  .load-more-icon--spinning {
    animation: none !important;
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .pull-refresh-indicator,
  .load-more-indicator {
    border: 1px solid var(--text-primary);
  }
}
</style>
