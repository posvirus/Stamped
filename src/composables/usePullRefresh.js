import { ref, onMounted, onUnmounted, nextTick } from 'vue'

/**
 * 下拉刷新和上拉加载 Composable
 * 提供完整的拉拽刷新和无限滚动功能
 */
export function usePullRefresh(options = {}) {
  const {
    refreshThreshold = 80,     // 下拉刷新触发阈值
    loadThreshold = 100,       // 上拉加载触发阈值
    damping = 0.5,            // 阻尼系数
    maxPullDistance = 120,    // 最大下拉距离
    disabled = false,         // 是否禁用
    enablePullRefresh = true, // 是否启用下拉刷新
    enableLoadMore = true,    // 是否启用上拉加载
    autoResetTime = 1000     // 自动重置时间
  } = options

  // 状态管理
  const isPulling = ref(false)          // 是否正在下拉
  const isRefreshing = ref(false)       // 是否正在刷新
  const isLoading = ref(false)          // 是否正在加载更多
  const pullDistance = ref(0)           // 下拉距离
  const loadDistance = ref(0)           // 上拉距离
  const canLoadMore = ref(true)         // 是否可以加载更多
  const refreshStatus = ref('idle')     // 刷新状态: idle, pulling, ready, refreshing, success, error
  const loadStatus = ref('idle')        // 加载状态: idle, loading, success, error, nomore
  
  // 触摸状态
  const startY = ref(0)
  const currentY = ref(0)
  const isTracking = ref(false)
  const container = ref(null)

  // 状态文本映射
  const statusTexts = {
    refresh: {
      idle: '下拉刷新',
      pulling: '下拉刷新',
      ready: '释放刷新',
      refreshing: '正在刷新...',
      success: '刷新成功',
      error: '刷新失败'
    },
    load: {
      idle: '上拉加载更多',
      loading: '正在加载...',
      success: '加载成功',
      error: '加载失败',
      nomore: '没有更多数据'
    }
  }

  // 事件回调
  const onRefresh = ref(null)
  const onLoadMore = ref(null)

  // 检查是否可以下拉刷新
  const canPullRefresh = () => {
    if (!enablePullRefresh || disabled || isRefreshing.value || isLoading.value) return false
    
    // 检查容器是否已滚动到顶部
    if (container.value) {
      return container.value.scrollTop <= 0
    }
    
    // 检查页面是否已滚动到顶部
    return window.scrollY <= 0
  }

  // 检查是否可以上拉加载
  const canPullLoad = () => {
    if (!enableLoadMore || disabled || isRefreshing.value || isLoading.value || !canLoadMore.value) return false
    
    // 检查是否滚动到底部
    if (container.value) {
      const { scrollTop, scrollHeight, clientHeight } = container.value
      return scrollHeight - scrollTop - clientHeight <= loadThreshold
    }
    
    // 检查页面是否滚动到底部
    const { scrollY, innerHeight } = window
    const { scrollHeight } = document.documentElement
    return scrollHeight - scrollY - innerHeight <= loadThreshold
  }

  // 触摸开始
  const handleTouchStart = (event) => {
    if (disabled) return
    
    const touch = event.touches[0]
    startY.value = touch.clientY
    currentY.value = touch.clientY
    isTracking.value = true
    isPulling.value = false
  }

  // 触摸移动
  const handleTouchMove = (event) => {
    if (!isTracking.value || disabled) return
    
    const touch = event.touches[0]
    currentY.value = touch.clientY
    const deltaY = currentY.value - startY.value

    // 下拉刷新
    if (deltaY > 0 && canPullRefresh()) {
      event.preventDefault()
      isPulling.value = true
      
      const distance = Math.min(deltaY * damping, maxPullDistance)
      pullDistance.value = distance
      
      if (distance >= refreshThreshold) {
        refreshStatus.value = 'ready'
      } else {
        refreshStatus.value = 'pulling'
      }
    }
    
    // 上拉加载检查在滚动事件中处理
  }

  // 触摸结束
  const handleTouchEnd = () => {
    if (!isTracking.value || disabled) return
    
    isTracking.value = false
    
    // 处理下拉刷新
    if (isPulling.value && pullDistance.value >= refreshThreshold && !isRefreshing.value) {
      triggerRefresh()
    } else {
      resetPullState()
    }
    
    isPulling.value = false
  }

  // 触发刷新
  const triggerRefresh = async () => {
    if (isRefreshing.value || !onRefresh.value) return
    
    isRefreshing.value = true
    refreshStatus.value = 'refreshing'
    pullDistance.value = refreshThreshold
    
    try {
      await onRefresh.value()
      refreshStatus.value = 'success'
      
      // 延迟重置状态
      setTimeout(() => {
        resetPullState()
      }, autoResetTime)
    } catch (error) {
      refreshStatus.value = 'error'
      console.error('刷新失败:', error)
      
      // 错误状态也会自动重置
      setTimeout(() => {
        resetPullState()
      }, autoResetTime)
    }
  }

  // 触发加载更多
  const triggerLoadMore = async () => {
    if (isLoading.value || !onLoadMore.value || !canLoadMore.value) return
    
    isLoading.value = true
    loadStatus.value = 'loading'
    
    try {
      const hasMore = await onLoadMore.value()
      
      if (hasMore === false) {
        canLoadMore.value = false
        loadStatus.value = 'nomore'
      } else {
        loadStatus.value = 'success'
      }
    } catch (error) {
      loadStatus.value = 'error'
      console.error('加载失败:', error)
    } finally {
      isLoading.value = false
      
      // 成功或错误状态都会在短时间后重置为idle
      if (loadStatus.value !== 'nomore') {
        setTimeout(() => {
          loadStatus.value = 'idle'
        }, autoResetTime)
      }
    }
  }

  // 重置下拉状态
  const resetPullState = () => {
    pullDistance.value = 0
    isRefreshing.value = false
    refreshStatus.value = 'idle'
  }

  // 重置加载状态
  const resetLoadState = () => {
    isLoading.value = false
    loadStatus.value = 'idle'
    canLoadMore.value = true
  }

  // 滚动事件处理
  const handleScroll = () => {
    if (disabled || !enableLoadMore) return
    
    // 检查是否需要触发上拉加载
    if (canPullLoad() && !isLoading.value && canLoadMore.value) {
      triggerLoadMore()
    }
  }

  // 获取当前状态文本
  const getRefreshText = () => {
    return statusTexts.refresh[refreshStatus.value] || statusTexts.refresh.idle
  }

  const getLoadText = () => {
    return statusTexts.load[loadStatus.value] || statusTexts.load.idle
  }

  // 手动触发刷新
  const manualRefresh = () => {
    if (!disabled && !isRefreshing.value) {
      triggerRefresh()
    }
  }

  // 手动触发加载更多
  const manualLoadMore = () => {
    if (!disabled && !isLoading.value && canLoadMore.value) {
      triggerLoadMore()
    }
  }

  // 设置容器引用
  const setContainer = (el) => {
    container.value = el
  }

  // 初始化事件监听
  const initEventListeners = () => {
    const target = container.value || window
    
    if (target === window) {
      window.addEventListener('scroll', handleScroll, { passive: true })
    } else {
      target.addEventListener('scroll', handleScroll, { passive: true })
    }
  }

  // 清理事件监听
  const cleanupEventListeners = () => {
    const target = container.value || window
    
    if (target === window) {
      window.removeEventListener('scroll', handleScroll)
    } else {
      target.removeEventListener('scroll', handleScroll)
    }
  }

  // 生命周期钩子
  onMounted(() => {
    nextTick(() => {
      initEventListeners()
    })
  })

  onUnmounted(() => {
    cleanupEventListeners()
  })

  return {
    // 状态
    isPulling,
    isRefreshing,
    isLoading,
    pullDistance,
    loadDistance,
    canLoadMore,
    refreshStatus,
    loadStatus,
    
    // 方法
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleScroll,
    manualRefresh,
    manualLoadMore,
    resetPullState,
    resetLoadState,
    setContainer,
    getRefreshText,
    getLoadText,
    
    // 配置
    setOnRefresh: (callback) => { onRefresh.value = callback },
    setOnLoadMore: (callback) => { onLoadMore.value = callback },
    setCanLoadMore: (value) => { canLoadMore.value = value },
    
    // 计算属性
    refreshThreshold,
    maxPullDistance
  }
}

/**
 * 简化版下拉刷新
 */
export function useSimplePullRefresh(onRefresh, options = {}) {
  const pullRefresh = usePullRefresh({
    enableLoadMore: false,
    ...options
  })
  
  pullRefresh.setOnRefresh(onRefresh)
  
  return {
    isRefreshing: pullRefresh.isRefreshing,
    pullDistance: pullRefresh.pullDistance,
    refreshStatus: pullRefresh.refreshStatus,
    handleTouchStart: pullRefresh.handleTouchStart,
    handleTouchMove: pullRefresh.handleTouchMove,
    handleTouchEnd: pullRefresh.handleTouchEnd,
    getRefreshText: pullRefresh.getRefreshText,
    manualRefresh: pullRefresh.manualRefresh,
    setContainer: pullRefresh.setContainer
  }
}

/**
 * 简化版无限滚动
 */
export function useInfiniteScroll(onLoadMore, options = {}) {
  const pullRefresh = usePullRefresh({
    enablePullRefresh: false,
    ...options
  })
  
  pullRefresh.setOnLoadMore(onLoadMore)
  
  return {
    isLoading: pullRefresh.isLoading,
    canLoadMore: pullRefresh.canLoadMore,
    loadStatus: pullRefresh.loadStatus,
    getLoadText: pullRefresh.getLoadText,
    manualLoadMore: pullRefresh.manualLoadMore,
    setCanLoadMore: pullRefresh.setCanLoadMore,
    setContainer: pullRefresh.setContainer
  }
}
