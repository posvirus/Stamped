<template>
  <Teleport to="body">
    <Transition name="toast" appear>
      <div
        v-if="visible"
        class="toast"
        :class="toastClasses"
        @click="handleClick"
      >
        <!-- 图标 -->
        <div v-if="showIcon" class="toast__icon">
          <slot name="icon">
            <svg v-if="type === 'success'" viewBox="0 0 24 24" class="toast__icon-svg">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            <svg v-else-if="type === 'error'" viewBox="0 0 24 24" class="toast__icon-svg">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
            <svg v-else-if="type === 'warning'" viewBox="0 0 24 24" class="toast__icon-svg">
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
            </svg>
            <svg v-else-if="type === 'info'" viewBox="0 0 24 24" class="toast__icon-svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
            <svg v-else-if="type === 'loading'" viewBox="0 0 24 24" class="toast__icon-svg toast__icon-loading">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="31.416" stroke-dashoffset="31.416">
                <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
              </circle>
            </svg>
          </slot>
        </div>
        
        <!-- 内容 -->
        <div class="toast__content">
          <!-- 标题 -->
          <div v-if="title" class="toast__title">{{ title }}</div>
          
          <!-- 消息内容 -->
          <div class="toast__message">
            <slot>{{ message }}</slot>
          </div>
        </div>
        
        <!-- 关闭按钮 -->
        <button
          v-if="closable"
          class="toast__close"
          @click.stop="handleClose"
          aria-label="关闭"
        >
          <svg viewBox="0 0 24 24" class="toast__close-icon">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
        
        <!-- 进度条 -->
        <div v-if="showProgress && duration > 0" class="toast__progress">
          <div class="toast__progress-bar" :style="progressStyle"></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'

// 禁用属性继承，避免Teleport根节点的警告
defineOptions({
  inheritAttrs: false
})

// Props定义
const props = defineProps({
  // 消息类型
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['success', 'error', 'warning', 'info', 'loading'].includes(value)
  },
  // 消息内容
  message: {
    type: String,
    required: true
  },
  // 消息标题
  title: {
    type: String,
    default: ''
  },
  // 显示位置
  position: {
    type: String,
    default: 'top-center',
    validator: (value) => [
      'top-left', 'top-center', 'top-right',
      'middle-left', 'middle-center', 'middle-right',
      'bottom-left', 'bottom-center', 'bottom-right'
    ].includes(value)
  },
  // 自动关闭时间（毫秒，0表示不自动关闭）
  duration: {
    type: Number,
    default: 3000
  },
  // 是否显示图标
  showIcon: {
    type: Boolean,
    default: true
  },
  // 是否显示关闭按钮
  closable: {
    type: Boolean,
    default: false
  },
  // 是否显示进度条
  showProgress: {
    type: Boolean,
    default: false
  },
  // 是否可点击关闭
  clickToClose: {
    type: Boolean,
    default: false
  },
  // 自定义CSS类
  customClass: {
    type: [String, Array, Object],
    default: ''
  },
  // 偏移量
  offset: {
    type: [String, Number],
    default: 20
  }
})

// 事件定义
const emit = defineEmits(['close', 'click'])

// 响应式数据
const visible = ref(true)
const progress = ref(100)
let timer = null
let progressTimer = null

// 计算属性
const toastClasses = computed(() => {
  return [
    `toast--${props.type}`,
    `toast--${props.position}`,
    {
      'toast--with-title': props.title,
      'toast--closable': props.closable,
      'toast--clickable': props.clickToClose
    },
    props.customClass
  ]
})

const progressStyle = computed(() => {
  return {
    width: `${progress.value}%`,
    transition: props.duration > 0 ? `width ${props.duration}ms linear` : 'none'
  }
})

// 方法
const handleClose = () => {
  visible.value = false
  clearTimers()
  setTimeout(() => {
    emit('close')
  }, 300) // 等待动画完成
}

const handleClick = () => {
  emit('click')
  if (props.clickToClose) {
    handleClose()
  }
}

const startAutoClose = () => {
  if (props.duration > 0 && props.type !== 'loading') {
    timer = setTimeout(() => {
      handleClose()
    }, props.duration)
    
    if (props.showProgress) {
      progress.value = 0
    }
  }
}

const clearTimers = () => {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  if (progressTimer) {
    clearTimeout(progressTimer)
    progressTimer = null
  }
}

// 生命周期
onMounted(() => {
  startAutoClose()
})

onUnmounted(() => {
  clearTimers()
})

// 暴露方法给父组件
defineExpose({
  close: handleClose
})
</script>

<style scoped>
.toast {
  position: fixed;
  z-index: 10000;
  display: flex;
  align-items: flex-start;
  min-width: 280px;
  max-width: 400px;
  padding: var(--spacing-md);
  background: var(--bg-white);
  border-radius: var(--border-radius-medium);
  box-shadow: var(--shadow-heavy);
  border-left: 4px solid transparent;
  pointer-events: auto;
  word-wrap: break-word;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 位置样式 */
.toast--top-left {
  top: v-bind('`${offset}px`');
  left: v-bind('`${offset}px`');
}

.toast--top-center {
  top: v-bind('`${offset}px`');
  left: 50%;
  transform: translateX(-50%);
}

.toast--top-right {
  top: v-bind('`${offset}px`');
  right: v-bind('`${offset}px`');
}

.toast--middle-left {
  top: 50%;
  left: v-bind('`${offset}px`');
  transform: translateY(-50%);
}

.toast--middle-center {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.toast--middle-right {
  top: 50%;
  right: v-bind('`${offset}px`');
  transform: translateY(-50%);
}

.toast--bottom-left {
  bottom: v-bind('`${offset}px`');
  left: v-bind('`${offset}px`');
}

.toast--bottom-center {
  bottom: v-bind('`${offset}px`');
  left: 50%;
  transform: translateX(-50%);
}

.toast--bottom-right {
  bottom: v-bind('`${offset}px`');
  right: v-bind('`${offset}px`');
}

/* 类型样式 */
.toast--success {
  border-left-color: var(--success-color);
}

.toast--success .toast__icon {
  color: var(--success-color);
}

.toast--error {
  border-left-color: #f44336;
}

.toast--error .toast__icon {
  color: #f44336;
}

.toast--warning {
  border-left-color: #ff9800;
}

.toast--warning .toast__icon {
  color: #ff9800;
}

.toast--info {
  border-left-color: var(--primary-color);
}

.toast--info .toast__icon {
  color: var(--primary-color);
}

.toast--loading {
  border-left-color: var(--text-secondary);
}

.toast--loading .toast__icon {
  color: var(--text-secondary);
}

/* 可点击样式 */
.toast--clickable {
  cursor: pointer;
}

.toast--clickable:hover {
  transform: translateX(-50%) scale(1.02);
  box-shadow: var(--shadow-heavy);
}

.toast--top-center.toast--clickable:hover,
.toast--bottom-center.toast--clickable:hover {
  transform: translateX(-50%) scale(1.02);
}

.toast--middle-center.toast--clickable:hover {
  transform: translate(-50%, -50%) scale(1.02);
}

/* 图标样式 */
.toast__icon {
  flex-shrink: 0;
  margin-right: var(--spacing-sm);
  margin-top: 2px;
}

.toast__icon-svg {
  width: 20px;
  height: 20px;
  fill: currentColor;
}

.toast__icon-loading {
  animation: toast-loading-spin 1s linear infinite;
}

@keyframes toast-loading-spin {
  to {
    transform: rotate(360deg);
  }
}

/* 内容样式 */
.toast__content {
  flex: 1;
  min-width: 0;
}

.toast__title {
  font-size: var(--font-size-md);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
  line-height: 1.4;
}

.toast__message {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: 1.5;
  word-break: break-word;
}

.toast--with-title .toast__message {
  color: var(--text-secondary);
}

/* 关闭按钮 */
.toast__close {
  flex-shrink: 0;
  margin-left: var(--spacing-sm);
  margin-top: 2px;
  padding: 2px;
  background: none;
  border: none;
  border-radius: var(--border-radius-small);
  cursor: pointer;
  color: var(--text-disabled);
  transition: all 0.2s ease;
}

.toast__close:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: var(--text-secondary);
}

.toast__close-icon {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

/* 进度条 */
.toast__progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 0 0 var(--border-radius-medium) var(--border-radius-medium);
  overflow: hidden;
}

.toast__progress-bar {
  height: 100%;
  background-color: var(--primary-color);
  border-radius: inherit;
}

.toast--success .toast__progress-bar {
  background-color: var(--success-color);
}

.toast--error .toast__progress-bar {
  background-color: #f44336;
}

.toast--warning .toast__progress-bar {
  background-color: #ff9800;
}

/* 过渡动画 */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.9);
}

.toast--top-center.toast-enter-from {
  transform: translateX(-50%) translateY(-20px) scale(0.9);
}

.toast--middle-center.toast-enter-from {
  transform: translate(-50%, -50%) scale(0.9);
}

.toast--bottom-center.toast-enter-from {
  transform: translateX(-50%) translateY(20px) scale(0.9);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.9);
}

.toast--top-center.toast-leave-to {
  transform: translateX(-50%) translateY(-20px) scale(0.9);
}

.toast--middle-center.toast-leave-to {
  transform: translate(-50%, -50%) scale(0.9);
}

.toast--bottom-center.toast-leave-to {
  transform: translateX(-50%) translateY(20px) scale(0.9);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .toast {
    min-width: 260px;
    max-width: calc(100vw - 40px);
    margin: 0 var(--spacing-md);
  }
  
  .toast--top-left,
  .toast--top-right,
  .toast--middle-left,
  .toast--middle-right,
  .toast--bottom-left,
  .toast--bottom-right {
    left: var(--spacing-md);
    right: var(--spacing-md);
    transform: none;
  }
  
  .toast--top-center {
    left: var(--spacing-md);
    right: var(--spacing-md);
    transform: none;
  }
  
  .toast--bottom-center {
    left: var(--spacing-md);
    right: var(--spacing-md);
    transform: none;
  }
  
  .toast--middle-center {
    left: var(--spacing-md);
    right: var(--spacing-md);
    transform: translateY(-50%);
  }
  
  /* 移动端安全区域适配 */
  .toast--top-left,
  .toast--top-center,
  .toast--top-right {
    top: calc(v-bind('`${offset}px`') + env(safe-area-inset-top, 0px));
  }
  
  .toast--bottom-left,
  .toast--bottom-center,
  .toast--bottom-right {
    bottom: calc(v-bind('`${offset}px`') + env(safe-area-inset-bottom, 0px));
  }
}

/* 无障碍访问 */
@media (prefers-reduced-motion: reduce) {
  .toast,
  .toast__progress-bar,
  .toast__close {
    transition: none;
  }
  
  .toast-enter-active,
  .toast-leave-active {
    transition: none;
  }
  
  .toast__icon-loading {
    animation: none;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .toast {
    background: #2d2d2d;
    color: var(--text-white);
  }
  
  .toast__title {
    color: var(--text-white);
  }
  
  .toast__message {
    color: #cccccc;
  }
  
  .toast__close:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
}
</style>
