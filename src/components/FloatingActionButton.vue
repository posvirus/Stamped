<template>
  <Teleport to="body">
    <div class="fab-container" :class="containerClasses">
      <button
        class="fab"
        :class="fabClasses"
        :disabled="disabled"
        @click="handleClick"
        :aria-label="ariaLabel || '创建新任务'"
      >
        <!-- 加载状态 -->
        <div v-if="loading" class="fab__loading">
          <svg class="fab__spinner" viewBox="0 0 24 24">
            <circle class="fab__spinner-path" cx="12" cy="12" r="10" />
          </svg>
        </div>
        
        <!-- 图标内容 -->
        <div v-else class="fab__icon" :class="{ 'fab__icon--rotated': isRotated }">
          <slot name="icon">
            <svg v-if="icon === 'plus'" viewBox="0 0 24 24" class="fab__default-icon">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            <svg v-else-if="icon === 'close'" viewBox="0 0 24 24" class="fab__default-icon">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
            <svg v-else-if="icon === 'edit'" viewBox="0 0 24 24" class="fab__default-icon">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
            <i v-else-if="customIcon" :class="customIcon"></i>
          </slot>
        </div>
        
        <!-- 文字标签（可选） -->
        <span v-if="label && extended" class="fab__label">{{ label }}</span>
      </button>
      
      <!-- 阴影/背景遮罩 -->
      <div v-if="showBackdrop" class="fab__backdrop" @click="handleBackdropClick"></div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

// Props定义
const props = defineProps({
  // 图标类型
  icon: {
    type: String,
    default: 'plus',
    validator: (value) => ['plus', 'close', 'edit', 'custom'].includes(value)
  },
  // 自定义图标类名
  customIcon: {
    type: String,
    default: ''
  },
  // 按钮颜色类型
  type: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'success', 'danger'].includes(value)
  },
  // 按钮大小
  size: {
    type: String,
    default: 'normal',
    validator: (value) => ['small', 'normal', 'large'].includes(value)
  },
  // 位置
  position: {
    type: String,
    default: 'bottom-right',
    validator: (value) => [
      'bottom-right', 'bottom-left', 'bottom-center',
      'top-right', 'top-left', 'top-center'
    ].includes(value)
  },
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false
  },
  // 是否加载中
  loading: {
    type: Boolean,
    default: false
  },
  // 是否扩展显示（显示文字标签）
  extended: {
    type: Boolean,
    default: false
  },
  // 文字标签
  label: {
    type: String,
    default: ''
  },
  // 是否旋转图标
  isRotated: {
    type: Boolean,
    default: false
  },
  // 是否显示背景遮罩
  showBackdrop: {
    type: Boolean,
    default: false
  },
  // 无障碍标签
  ariaLabel: {
    type: String,
    default: ''
  },
  // 距离底部的偏移量
  bottomOffset: {
    type: [String, Number],
    default: 24
  },
  // 距离右侧的偏移量
  rightOffset: {
    type: [String, Number],
    default: 24
  },
  // 距离左侧的偏移量
  leftOffset: {
    type: [String, Number],
    default: 24
  },
  // 距离顶部的偏移量
  topOffset: {
    type: [String, Number],
    default: 24
  }
})

// 事件定义
const emit = defineEmits(['click', 'backdrop-click'])

// 计算属性
const containerClasses = computed(() => {
  return [
    `fab-container--${props.position}`,
    {
      'fab-container--backdrop': props.showBackdrop
    }
  ]
})

const fabClasses = computed(() => {
  return [
    `fab--${props.type}`,
    `fab--${props.size}`,
    {
      'fab--disabled': props.disabled,
      'fab--loading': props.loading,
      'fab--extended': props.extended
    }
  ]
})

const containerStyle = computed(() => {
  const style = {}
  
  if (props.position.includes('bottom')) {
    style.bottom = typeof props.bottomOffset === 'number' ? `${props.bottomOffset}px` : props.bottomOffset
  }
  if (props.position.includes('top')) {
    style.top = typeof props.topOffset === 'number' ? `${props.topOffset}px` : props.topOffset
  }
  if (props.position.includes('right')) {
    style.right = typeof props.rightOffset === 'number' ? `${props.rightOffset}px` : props.rightOffset
  }
  if (props.position.includes('left')) {
    style.left = typeof props.leftOffset === 'number' ? `${props.leftOffset}px` : props.leftOffset
  }
  if (props.position.includes('center')) {
    style.left = '50%'
    style.transform = 'translateX(-50%)'
  }
  
  return style
})

// 方法
const handleClick = (event) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}

const handleBackdropClick = (event) => {
  emit('backdrop-click', event)
}
</script>

<style scoped>
.fab-container {
  position: fixed;
  z-index: 1000;
}

/* 位置样式 */
.fab-container--bottom-right {
  bottom: v-bind('containerStyle.bottom');
  right: v-bind('containerStyle.right');
}

.fab-container--bottom-left {
  bottom: v-bind('containerStyle.bottom');
  left: v-bind('containerStyle.left');
}

.fab-container--bottom-center {
  bottom: v-bind('containerStyle.bottom');
  left: v-bind('containerStyle.left');
  transform: v-bind('containerStyle.transform');
}

.fab-container--top-right {
  top: v-bind('containerStyle.top');
  right: v-bind('containerStyle.right');
}

.fab-container--top-left {
  top: v-bind('containerStyle.top');
  left: v-bind('containerStyle.left');
}

.fab-container--top-center {
  top: v-bind('containerStyle.top');
  left: v-bind('containerStyle.left');
  transform: v-bind('containerStyle.transform');
}

/* FAB按钮样式 */
.fab {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--border-radius-round);
  cursor: pointer;
  font-family: inherit;
  font-weight: 500;
  text-decoration: none;
  user-select: none;
  outline: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow-medium);
}

/* 按钮大小 */
.fab--small {
  width: 40px;
  height: 40px;
}

.fab--normal {
  width: var(--fab-size);
  height: var(--fab-size);
}

.fab--large {
  width: 64px;
  height: 64px;
}

/* 扩展按钮 */
.fab--extended {
  border-radius: var(--border-radius-large);
  padding: 0 var(--spacing-md);
  width: auto;
  min-width: var(--fab-size);
}

.fab--extended.fab--small {
  min-width: 40px;
  padding: 0 var(--spacing-sm);
}

.fab--extended.fab--large {
  min-width: 64px;
  padding: 0 var(--spacing-lg);
}

/* 按钮类型颜色 */
.fab--primary {
  background-color: var(--primary-color);
  color: var(--text-white);
}

.fab--primary:hover:not(.fab--disabled):not(.fab--loading) {
  background-color: var(--primary-light);
  box-shadow: var(--shadow-heavy);
  transform: scale(1.05);
}

.fab--primary:active:not(.fab--disabled):not(.fab--loading) {
  background-color: var(--primary-dark);
  transform: scale(0.95);
}

.fab--secondary {
  background-color: var(--bg-white);
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
}

.fab--secondary:hover:not(.fab--disabled):not(.fab--loading) {
  background-color: var(--primary-color);
  color: var(--text-white);
  transform: scale(1.05);
}

.fab--success {
  background-color: var(--success-color);
  color: var(--text-white);
}

.fab--success:hover:not(.fab--disabled):not(.fab--loading) {
  background-color: var(--success-light);
  transform: scale(1.05);
}

.fab--danger {
  background-color: #f44336;
  color: var(--text-white);
}

.fab--danger:hover:not(.fab--disabled):not(.fab--loading) {
  background-color: #ef5350;
  transform: scale(1.05);
}

/* 禁用状态 */
.fab--disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: var(--shadow-light);
}

.fab--disabled:hover {
  transform: none;
}

/* 加载状态 */
.fab--loading {
  cursor: default;
  pointer-events: none;
}

/* 图标样式 */
.fab__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fab__icon--rotated {
  transform: rotate(45deg);
}

.fab__default-icon {
  width: 24px;
  height: 24px;
  fill: currentColor;
}

.fab--small .fab__default-icon {
  width: 20px;
  height: 20px;
}

.fab--large .fab__default-icon {
  width: 28px;
  height: 28px;
}

/* 标签样式 */
.fab__label {
  margin-left: var(--spacing-sm);
  font-size: var(--font-size-sm);
  white-space: nowrap;
}

.fab--small .fab__label {
  font-size: var(--font-size-xs);
}

.fab--large .fab__label {
  font-size: var(--font-size-md);
}

/* 加载动画 */
.fab__loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.fab__spinner {
  width: 20px;
  height: 20px;
  animation: fab-spin 1s linear infinite;
}

.fab__spinner-path {
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-dasharray: 90;
  stroke-dashoffset: 0;
  animation: fab-dash 1.5s ease-in-out infinite;
}

@keyframes fab-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes fab-dash {
  0% {
    stroke-dasharray: 1, 200;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 200;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 200;
    stroke-dashoffset: -124;
  }
}

/* 背景遮罩 */
.fab__backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: -1;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.fab-container--backdrop .fab__backdrop {
  opacity: 1;
  pointer-events: auto;
}

/* 焦点状态 */
.fab:focus {
  box-shadow: var(--shadow-heavy), 0 0 0 2px rgba(30, 136, 229, 0.3);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .fab {
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
  }
  
  /* 确保移动端有足够的触摸区域 */
  .fab--small {
    min-width: 44px;
    min-height: 44px;
  }
  
  /* 调整移动端的位置偏移 */
  .fab-container--bottom-right,
  .fab-container--bottom-left {
    bottom: calc(v-bind('containerStyle.bottom') + env(safe-area-inset-bottom, 0px));
  }
  
  .fab-container--bottom-right {
    right: calc(v-bind('containerStyle.right') + env(safe-area-inset-right, 0px));
  }
  
  .fab-container--bottom-left {
    left: calc(v-bind('containerStyle.left') + env(safe-area-inset-left, 0px));
  }
}

/* 无障碍访问 */
@media (prefers-reduced-motion: reduce) {
  .fab,
  .fab__icon,
  .fab__spinner {
    transition: none;
    animation-duration: 0.001s;
  }
  
  .fab:hover {
    transform: none;
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .fab {
    border: 2px solid currentColor;
  }
}
</style>
