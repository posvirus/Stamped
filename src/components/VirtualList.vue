<template>
  <div 
    class="virtual-list"
    :style="containerStyle"
    @scroll="handleScroll"
    ref="containerRef"
  >
    <!-- 占位容器，用于维持正确的滚动条高度 -->
    <div 
      class="virtual-list__placeholder"
      :style="{ height: totalHeight + 'px' }"
    >
      <!-- 可见项目容器 -->
      <div 
        class="virtual-list__content"
        :style="contentStyle"
      >
        <div
          v-for="(item, index) in visibleItems"
          :key="getItemKey(item, startIndex + index)"
          class="virtual-list__item"
          :style="getItemStyle(startIndex + index)"
          :data-index="startIndex + index"
        >
          <slot 
            :item="item" 
            :index="startIndex + index"
            :isVisible="true"
          >
            {{ item }}
          </slot>
        </div>
      </div>
    </div>
    
    <!-- 加载更多指示器 -->
    <div 
      v-if="showLoadMore && hasMore"
      class="virtual-list__load-more"
      ref="loadMoreRef"
    >
      <slot name="load-more">
        <div class="virtual-list__load-more-content">
          <div class="virtual-list__load-more-spinner">
            <svg viewBox="0 0 24 24" class="virtual-list__spinner">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="31.416" stroke-dashoffset="31.416">
                <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
              </circle>
            </svg>
          </div>
          <span>加载更多...</span>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

// Props定义
const props = defineProps({
  // 数据列表
  items: {
    type: Array,
    required: true
  },
  // 项目高度（固定高度）
  itemHeight: {
    type: Number,
    default: 60
  },
  // 动态高度函数
  getItemHeight: {
    type: Function,
    default: null
  },
  // 容器高度
  height: {
    type: [Number, String],
    default: 400
  },
  // 缓冲区大小（额外渲染的项目数量）
  buffer: {
    type: Number,
    default: 5
  },
  // 项目key生成函数
  keyField: {
    type: [String, Function],
    default: 'id'
  },
  // 是否启用无限滚动
  enableInfiniteScroll: {
    type: Boolean,
    default: false
  },
  // 是否还有更多数据
  hasMore: {
    type: Boolean,
    default: true
  },
  // 触发加载更多的距离
  loadMoreThreshold: {
    type: Number,
    default: 100
  },
  // 是否显示加载更多
  showLoadMore: {
    type: Boolean,
    default: true
  },
  // 滚动节流延迟
  scrollThrottle: {
    type: Number,
    default: 16
  },
  // 是否启用估算高度
  estimatedItemHeight: {
    type: Number,
    default: null
  }
})

// 事件定义
const emit = defineEmits(['scroll', 'load-more', 'visible-change'])

// 响应式数据
const containerRef = ref(null)
const loadMoreRef = ref(null)
const scrollTop = ref(0)
const containerHeight = ref(0)
const startIndex = ref(0)
const endIndex = ref(0)
const itemHeights = ref(new Map()) // 动态高度缓存
const totalHeight = ref(0)
const isLoadingMore = ref(false)

// 节流函数（本地实现）
const throttle = (func, wait) => {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, wait)
    }
  }
}

// 计算属性
const containerStyle = computed(() => {
  return {
    height: typeof props.height === 'number' ? `${props.height}px` : props.height,
    overflow: 'auto'
  }
})

const visibleItems = computed(() => {
  return props.items.slice(startIndex.value, endIndex.value + 1)
})

const contentStyle = computed(() => {
  let transform = 0
  
  if (props.getItemHeight || props.estimatedItemHeight) {
    // 动态高度：计算累计偏移
    for (let i = 0; i < startIndex.value; i++) {
      transform += getItemHeightByIndex(i)
    }
  } else {
    // 固定高度
    transform = startIndex.value * props.itemHeight
  }
  
  return {
    transform: `translateY(${transform}px)`
  }
})

// 方法
const getItemKey = (item, index) => {
  if (typeof props.keyField === 'function') {
    return props.keyField(item, index)
  }
  return item[props.keyField] || index
}

const getItemHeightByIndex = (index) => {
  if (props.getItemHeight) {
    const cached = itemHeights.value.get(index)
    if (cached !== undefined) return cached
    
    const height = props.getItemHeight(props.items[index], index)
    itemHeights.value.set(index, height)
    return height
  }
  
  return props.estimatedItemHeight || props.itemHeight
}

const getItemStyle = (index) => {
  const height = getItemHeightByIndex(index)
  return {
    height: `${height}px`,
    overflow: 'hidden'
  }
}

// 计算总高度
const calculateTotalHeight = () => {
  if (props.getItemHeight || props.estimatedItemHeight) {
    let height = 0
    for (let i = 0; i < props.items.length; i++) {
      height += getItemHeightByIndex(i)
    }
    totalHeight.value = height
  } else {
    totalHeight.value = props.items.length * props.itemHeight
  }
}

// 更新可见范围
const updateVisibleRange = () => {
  if (!containerRef.value || props.items.length === 0) return
  
  const containerHeight = containerRef.value.clientHeight
  const scrollTop = containerRef.value.scrollTop
  
  if (props.getItemHeight || props.estimatedItemHeight) {
    // 动态高度计算
    let accumulatedHeight = 0
    let start = 0
    let end = 0
    
    // 查找起始索引
    for (let i = 0; i < props.items.length; i++) {
      const itemHeight = getItemHeightByIndex(i)
      if (accumulatedHeight + itemHeight > scrollTop) {
        start = Math.max(0, i - props.buffer)
        break
      }
      accumulatedHeight += itemHeight
    }
    
    // 查找结束索引
    accumulatedHeight = 0
    for (let i = 0; i < props.items.length; i++) {
      accumulatedHeight += getItemHeightByIndex(i)
      if (accumulatedHeight > scrollTop + containerHeight) {
        end = Math.min(props.items.length - 1, i + props.buffer)
        break
      }
    }
    
    if (end === 0) end = props.items.length - 1
    
    startIndex.value = start
    endIndex.value = end
  } else {
    // 固定高度计算
    const start = Math.floor(scrollTop / props.itemHeight)
    const visibleCount = Math.ceil(containerHeight / props.itemHeight)
    
    startIndex.value = Math.max(0, start - props.buffer)
    endIndex.value = Math.min(
      props.items.length - 1, 
      start + visibleCount + props.buffer
    )
  }
  
  // 发送可见性变化事件
  emit('visible-change', {
    startIndex: startIndex.value,
    endIndex: endIndex.value,
    visibleItems: visibleItems.value
  })
}

// 滚动处理（节流）
const handleScroll = throttle((event) => {
  scrollTop.value = event.target.scrollTop
  updateVisibleRange()
  
  // 检查是否需要加载更多
  if (props.enableInfiniteScroll && props.hasMore && !isLoadingMore.value) {
    const { scrollTop, scrollHeight, clientHeight } = event.target
    const distanceToBottom = scrollHeight - scrollTop - clientHeight
    
    if (distanceToBottom <= props.loadMoreThreshold) {
      loadMore()
    }
  }
  
  emit('scroll', {
    scrollTop: scrollTop.value,
    scrollLeft: event.target.scrollLeft,
    isScrollingDown: scrollTop.value > (this.lastScrollTop || 0)
  })
  
  this.lastScrollTop = scrollTop.value
}, props.scrollThrottle)

// 加载更多
const loadMore = async () => {
  if (isLoadingMore.value || !props.hasMore) return
  
  isLoadingMore.value = true
  
  try {
    await emit('load-more')
  } catch (error) {
    console.error('加载更多失败:', error)
  } finally {
    isLoadingMore.value = false
  }
}

// 滚动到指定索引
const scrollToIndex = (index, behavior = 'smooth') => {
  if (!containerRef.value || index < 0 || index >= props.items.length) return
  
  let scrollTop = 0
  
  if (props.getItemHeight || props.estimatedItemHeight) {
    for (let i = 0; i < index; i++) {
      scrollTop += getItemHeightByIndex(i)
    }
  } else {
    scrollTop = index * props.itemHeight
  }
  
  containerRef.value.scrollTo({
    top: scrollTop,
    behavior
  })
}

// 滚动到顶部
const scrollToTop = (behavior = 'smooth') => {
  if (!containerRef.value) return
  
  containerRef.value.scrollTo({
    top: 0,
    behavior
  })
}

// 滚动到底部
const scrollToBottom = (behavior = 'smooth') => {
  if (!containerRef.value) return
  
  containerRef.value.scrollTo({
    top: totalHeight.value,
    behavior
  })
}

// 刷新高度缓存
const refreshHeights = () => {
  itemHeights.value.clear()
  calculateTotalHeight()
  updateVisibleRange()
}

// 初始化
const init = () => {
  if (!containerRef.value) return
  
  containerHeight.value = containerRef.value.clientHeight
  calculateTotalHeight()
  updateVisibleRange()
}

// 监听数据变化
watch(() => props.items, () => {
  nextTick(() => {
    refreshHeights()
  })
}, { deep: true })

watch(() => props.itemHeight, () => {
  calculateTotalHeight()
  updateVisibleRange()
})

// 监听容器大小变化
const resizeObserver = ref(null)

onMounted(() => {
  nextTick(() => {
    init()
    
    // 监听容器大小变化
    if (window.ResizeObserver) {
      resizeObserver.value = new ResizeObserver(() => {
        init()
      })
      resizeObserver.value.observe(containerRef.value)
    }
  })
})

onUnmounted(() => {
  if (resizeObserver.value) {
    resizeObserver.value.disconnect()
  }
})

// 暴露方法给父组件
defineExpose({
  scrollToIndex,
  scrollToTop,
  scrollToBottom,
  refreshHeights,
  updateVisibleRange,
  getVisibleRange: () => ({
    startIndex: startIndex.value,
    endIndex: endIndex.value
  })
})
</script>

<style scoped>
.virtual-list {
  position: relative;
  width: 100%;
}

.virtual-list__placeholder {
  position: relative;
  width: 100%;
}

.virtual-list__content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  will-change: transform;
}

.virtual-list__item {
  width: 100%;
  box-sizing: border-box;
}

.virtual-list__load-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-md);
  background: var(--bg-white);
  border-top: 1px solid var(--border-color);
}

.virtual-list__load-more-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.virtual-list__load-more-spinner {
  width: 16px;
  height: 16px;
  color: var(--primary-color);
}

.virtual-list__spinner {
  width: 100%;
  height: 100%;
}

/* 滚动条样式 */
.virtual-list::-webkit-scrollbar {
  width: 6px;
}

.virtual-list::-webkit-scrollbar-track {
  background: var(--bg-gray);
  border-radius: 3px;
}

.virtual-list::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
  transition: background-color 0.2s ease;
}

.virtual-list::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}

/* 移动端优化 */
@media (max-width: 768px) {
  .virtual-list {
    -webkit-overflow-scrolling: touch;
  }
  
  .virtual-list::-webkit-scrollbar {
    width: 3px;
  }
}

/* 无障碍访问 */
@media (prefers-reduced-motion: reduce) {
  .virtual-list__content {
    will-change: auto;
  }
}
</style>
