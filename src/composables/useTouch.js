import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 触摸手势增强 Composable
 * 提供滑动、长按、双击等手势支持
 */
export function useTouch(element, options = {}) {
  const {
    swipeThreshold = 50, // 滑动最小距离
    longPressDelay = 500, // 长按延迟时间
    doubleTapDelay = 300, // 双击最大间隔
    preventScroll = false // 是否阻止滚动
  } = options

  // 触摸状态
  const isTouch = ref(false)
  const startPos = ref({ x: 0, y: 0 })
  const currentPos = ref({ x: 0, y: 0 })
  const startTime = ref(0)
  const lastTapTime = ref(0)
  const longPressTimer = ref(null)

  // 事件回调
  const callbacks = {
    touchStart: [],
    touchMove: [],
    touchEnd: [],
    tap: [],
    doubleTap: [],
    longPress: [],
    swipeLeft: [],
    swipeRight: [],
    swipeUp: [],
    swipeDown: [],
    pinchStart: [],
    pinchMove: [],
    pinchEnd: []
  }

  // 触摸开始
  const handleTouchStart = (event) => {
    if (preventScroll && event.cancelable) {
      event.preventDefault()
    }

    const touch = event.touches[0]
    isTouch.value = true
    startPos.value = { x: touch.clientX, y: touch.clientY }
    currentPos.value = { x: touch.clientX, y: touch.clientY }
    startTime.value = Date.now()

    // 设置长按定时器
    longPressTimer.value = setTimeout(() => {
      if (isTouch.value) {
        callbacks.longPress.forEach(callback => {
          callback({
            event,
            position: currentPos.value,
            duration: Date.now() - startTime.value
          })
        })
      }
    }, longPressDelay)

    // 触发touchStart事件
    callbacks.touchStart.forEach(callback => {
      callback({
        event,
        position: startPos.value,
        touches: event.touches.length
      })
    })

    // 检测捏合手势
    if (event.touches.length === 2) {
      const touch1 = event.touches[0]
      const touch2 = event.touches[1]
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )

      callbacks.pinchStart.forEach(callback => {
        callback({
          event,
          distance,
          center: {
            x: (touch1.clientX + touch2.clientX) / 2,
            y: (touch1.clientY + touch2.clientY) / 2
          }
        })
      })
    }
  }

  // 触摸移动
  const handleTouchMove = (event) => {
    if (!isTouch.value) return

    if (preventScroll && event.cancelable) {
      event.preventDefault()
    }

    const touch = event.touches[0]
    currentPos.value = { x: touch.clientX, y: touch.clientY }

    // 移动时清除长按定时器
    if (longPressTimer.value) {
      clearTimeout(longPressTimer.value)
      longPressTimer.value = null
    }

    const deltaX = currentPos.value.x - startPos.value.x
    const deltaY = currentPos.value.y - startPos.value.y

    // 触发touchMove事件
    callbacks.touchMove.forEach(callback => {
      callback({
        event,
        position: currentPos.value,
        delta: { x: deltaX, y: deltaY },
        distance: Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      })
    })

    // 检测捏合手势移动
    if (event.touches.length === 2) {
      const touch1 = event.touches[0]
      const touch2 = event.touches[1]
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )

      callbacks.pinchMove.forEach(callback => {
        callback({
          event,
          distance,
          center: {
            x: (touch1.clientX + touch2.clientX) / 2,
            y: (touch1.clientY + touch2.clientY) / 2
          }
        })
      })
    }
  }

  // 触摸结束
  const handleTouchEnd = (event) => {
    if (!isTouch.value) return

    isTouch.value = false
    const endTime = Date.now()
    const duration = endTime - startTime.value

    // 清除长按定时器
    if (longPressTimer.value) {
      clearTimeout(longPressTimer.value)
      longPressTimer.value = null
    }

    const deltaX = currentPos.value.x - startPos.value.x
    const deltaY = currentPos.value.y - startPos.value.y
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    // 触发touchEnd事件
    callbacks.touchEnd.forEach(callback => {
      callback({
        event,
        position: currentPos.value,
        delta: { x: deltaX, y: deltaY },
        distance,
        duration
      })
    })

    // 检测滑动手势
    if (distance > swipeThreshold) {
      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)

      if (absX > absY) {
        // 水平滑动
        if (deltaX > 0) {
          callbacks.swipeRight.forEach(callback => {
            callback({ event, distance: deltaX, duration })
          })
        } else {
          callbacks.swipeLeft.forEach(callback => {
            callback({ event, distance: Math.abs(deltaX), duration })
          })
        }
      } else {
        // 垂直滑动
        if (deltaY > 0) {
          callbacks.swipeDown.forEach(callback => {
            callback({ event, distance: deltaY, duration })
          })
        } else {
          callbacks.swipeUp.forEach(callback => {
            callback({ event, distance: Math.abs(deltaY), duration })
          })
        }
      }
    } else if (distance < 10 && duration < 300) {
      // 检测点击或双击
      const now = Date.now()
      if (now - lastTapTime.value < doubleTapDelay) {
        // 双击
        callbacks.doubleTap.forEach(callback => {
          callback({ event, position: currentPos.value })
        })
        lastTapTime.value = 0 // 重置，避免三击
      } else {
        // 单击
        setTimeout(() => {
          if (lastTapTime.value === now) {
            callbacks.tap.forEach(callback => {
              callback({ event, position: currentPos.value })
            })
          }
        }, doubleTapDelay)
        lastTapTime.value = now
      }
    }

    // 检测捏合手势结束
    if (event.changedTouches.length === 2 || event.touches.length === 0) {
      callbacks.pinchEnd.forEach(callback => {
        callback({ event })
      })
    }
  }

  // 添加事件监听器
  const on = (eventType, callback) => {
    if (callbacks[eventType]) {
      callbacks[eventType].push(callback)
    }
    return () => off(eventType, callback)
  }

  // 移除事件监听器
  const off = (eventType, callback) => {
    if (callbacks[eventType]) {
      const index = callbacks[eventType].indexOf(callback)
      if (index > -1) {
        callbacks[eventType].splice(index, 1)
      }
    }
  }

  // 初始化事件监听
  const initEvents = () => {
    if (element.value) {
      element.value.addEventListener('touchstart', handleTouchStart, { passive: !preventScroll })
      element.value.addEventListener('touchmove', handleTouchMove, { passive: !preventScroll })
      element.value.addEventListener('touchend', handleTouchEnd, { passive: true })
      element.value.addEventListener('touchcancel', handleTouchEnd, { passive: true })
    }
  }

  // 清理事件监听
  const cleanupEvents = () => {
    if (element.value) {
      element.value.removeEventListener('touchstart', handleTouchStart)
      element.value.removeEventListener('touchmove', handleTouchMove)
      element.value.removeEventListener('touchend', handleTouchEnd)
      element.value.removeEventListener('touchcancel', handleTouchEnd)
    }
    if (longPressTimer.value) {
      clearTimeout(longPressTimer.value)
    }
  }

  onMounted(() => {
    initEvents()
  })

  onUnmounted(() => {
    cleanupEvents()
  })

  return {
    isTouch,
    position: currentPos,
    startPosition: startPos,
    on,
    off,
    initEvents,
    cleanupEvents
  }
}

/**
 * 简化的触摸手势hooks
 */
export function useSwipe(element, options = {}) {
  const { threshold = 50 } = options
  const touch = useTouch(element, { swipeThreshold: threshold, ...options })
  
  return {
    onSwipeLeft: (callback) => touch.on('swipeLeft', callback),
    onSwipeRight: (callback) => touch.on('swipeRight', callback),
    onSwipeUp: (callback) => touch.on('swipeUp', callback),
    onSwipeDown: (callback) => touch.on('swipeDown', callback)
  }
}

export function useLongPress(element, options = {}) {
  const { delay = 500 } = options
  const touch = useTouch(element, { longPressDelay: delay, ...options })
  
  return {
    onLongPress: (callback) => touch.on('longPress', callback)
  }
}

export function useDoubleTap(element, options = {}) {
  const { delay = 300 } = options
  const touch = useTouch(element, { doubleTapDelay: delay, ...options })
  
  return {
    onDoubleTap: (callback) => touch.on('doubleTap', callback),
    onTap: (callback) => touch.on('tap', callback)
  }
}
