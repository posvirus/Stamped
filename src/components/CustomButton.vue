<template>
  <button
    class="custom-button"
    :class="buttonClasses"
    :disabled="disabled || loading"
    :type="htmlType"
    @click="handleClick"
    @focus="handleFocus"
    @blur="handleBlur"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
    @touchcancel="handleTouchCancel"
  >
    <!-- Loading状态 -->
    <div v-if="loading" class="custom-button__loading">
      <svg class="custom-button__spinner" viewBox="0 0 24 24">
        <circle class="custom-button__spinner-path" cx="12" cy="12" r="10" />
      </svg>
    </div>
    
    <!-- 图标前缀 -->
    <span v-if="prefixIcon && !loading" class="custom-button__prefix-icon">
      <slot name="prefix-icon">
        <i :class="prefixIcon"></i>
      </slot>
    </span>
    
    <!-- 按钮内容 -->
    <span class="custom-button__content" :class="{ 'custom-button__content--hidden': loading }">
      <slot>{{ text }}</slot>
    </span>
    
    <!-- 图标后缀 -->
    <span v-if="suffixIcon && !loading" class="custom-button__suffix-icon">
      <slot name="suffix-icon">
        <i :class="suffixIcon"></i>
      </slot>
    </span>
  </button>
</template>

<script setup>
import { computed, useSlots } from 'vue'

// Props定义
const props = defineProps({
  // 按钮类型
  type: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'danger', 'ghost', 'text'].includes(value)
  },
  // 按钮大小
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },
  // 按钮文本
  text: {
    type: String,
    default: ''
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
  // 是否块级元素
  block: {
    type: Boolean,
    default: false
  },
  // 是否圆形按钮
  round: {
    type: Boolean,
    default: false
  },
  // HTML按钮类型
  htmlType: {
    type: String,
    default: 'button',
    validator: (value) => ['button', 'submit', 'reset'].includes(value)
  },
  // 前缀图标
  prefixIcon: {
    type: String,
    default: ''
  },
  // 后缀图标
  suffixIcon: {
    type: String,
    default: ''
  },
  // 自定义CSS类
  customClass: {
    type: [String, Array, Object],
    default: ''
  }
})

// 事件定义
const emit = defineEmits(['click', 'focus', 'blur', 'touchstart', 'touchend'])

// 获取插槽
const slots = useSlots()

// 计算属性
const buttonClasses = computed(() => {
  return [
    `custom-button--${props.type}`,
    `custom-button--${props.size}`,
    {
      'custom-button--disabled': props.disabled,
      'custom-button--loading': props.loading,
      'custom-button--block': props.block,
      'custom-button--round': props.round,
      'custom-button--icon-only': !props.text && !slots.default && (props.prefixIcon || props.suffixIcon || slots['prefix-icon'] || slots['suffix-icon'])
    },
    props.customClass
  ]
})

// 方法
const handleClick = (event) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}

const handleFocus = (event) => {
  emit('focus', event)
}

const handleBlur = (event) => {
  emit('blur', event)
}

const handleTouchStart = (event) => {
  if (!props.disabled && !props.loading) {
    emit('touchstart', event)
  }
}

const handleTouchEnd = (event) => {
  if (!props.disabled && !props.loading) {
    emit('touchend', event)
  }
}

const handleTouchCancel = (event) => {
  if (!props.disabled && !props.loading) {
    // 触摸取消时也触发touchend事件
    emit('touchend', event)
  }
}
</script>

<style scoped>
.custom-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: var(--border-radius-medium);
  font-family: inherit;
  font-weight: 500;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
  user-select: none;
  touch-action: manipulation;
  outline: none;
  box-sizing: border-box;
  white-space: nowrap;
  line-height: 1;
}

/* 按钮类型样式 */
/* 主按钮 */
.custom-button--primary {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
  color: var(--text-white);
}

.custom-button--primary:hover:not(.custom-button--disabled):not(.custom-button--loading) {
  background-color: var(--primary-light);
  border-color: var(--primary-light);
}

.custom-button--primary:active:not(.custom-button--disabled):not(.custom-button--loading) {
  background-color: var(--primary-dark);
  border-color: var(--primary-dark);
}

/* 次要按钮 */
.custom-button--secondary {
  background-color: var(--bg-white);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.custom-button--secondary:hover:not(.custom-button--disabled):not(.custom-button--loading) {
  background-color: var(--primary-color);
  color: var(--text-white);
}

.custom-button--secondary:active:not(.custom-button--disabled):not(.custom-button--loading) {
  background-color: var(--primary-dark);
  border-color: var(--primary-dark);
  color: var(--text-white);
}

/* 危险按钮 */
.custom-button--danger {
  background-color: #f44336;
  border-color: #f44336;
  color: var(--text-white);
}

.custom-button--danger:hover:not(.custom-button--disabled):not(.custom-button--loading) {
  background-color: #ef5350;
  border-color: #ef5350;
}

.custom-button--danger:active:not(.custom-button--disabled):not(.custom-button--loading) {
  background-color: #d32f2f;
  border-color: #d32f2f;
}

/* 幽灵按钮 */
.custom-button--ghost {
  background-color: transparent;
  border-color: var(--border-color);
  color: var(--text-primary);
}

.custom-button--ghost:hover:not(.custom-button--disabled):not(.custom-button--loading) {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

/* 文字按钮 */
.custom-button--text {
  background-color: transparent;
  border-color: transparent;
  color: var(--primary-color);
  box-shadow: none;
}

.custom-button--text:hover:not(.custom-button--disabled):not(.custom-button--loading) {
  background-color: rgba(30, 136, 229, 0.1);
}

/* 按钮大小 */
.custom-button--small {
  height: var(--button-height-small);
  padding: 0 var(--spacing-sm);
  font-size: var(--font-size-sm);
}

.custom-button--medium {
  height: var(--button-height-medium);
  padding: 0 var(--spacing-md);
  font-size: var(--font-size-md);
}

.custom-button--large {
  height: var(--button-height-large);
  padding: 0 var(--spacing-lg);
  font-size: var(--font-size-lg);
}

/* 块级按钮 */
.custom-button--block {
  width: 100%;
}

/* 圆形按钮 */
.custom-button--round {
  border-radius: calc(var(--button-height-medium) / 2);
}

.custom-button--round.custom-button--small {
  border-radius: calc(var(--button-height-small) / 2);
}

.custom-button--round.custom-button--large {
  border-radius: calc(var(--button-height-large) / 2);
}

/* 只有图标的按钮 */
.custom-button--icon-only {
  width: var(--button-height-medium);
  padding: 0;
}

.custom-button--icon-only.custom-button--small {
  width: var(--button-height-small);
}

.custom-button--icon-only.custom-button--large {
  width: var(--button-height-large);
}

/* 禁用状态 */
.custom-button--disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 加载状态 */
.custom-button--loading {
  cursor: default;
  pointer-events: none;
}

/* 按钮内容 */
.custom-button__content {
  display: inline-flex;
  align-items: center;
  transition: opacity 0.2s;
}

.custom-button__content--hidden {
  opacity: 0;
}

/* 图标 */
.custom-button__prefix-icon,
.custom-button__suffix-icon {
  display: inline-flex;
  align-items: center;
  font-size: inherit;
}

.custom-button__prefix-icon {
  margin-right: var(--spacing-xs);
}

.custom-button__suffix-icon {
  margin-left: var(--spacing-xs);
}

.custom-button--icon-only .custom-button__prefix-icon,
.custom-button--icon-only .custom-button__suffix-icon {
  margin: 0;
}

/* 加载动画 */
.custom-button__loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.custom-button__spinner {
  width: 16px;
  height: 16px;
  animation: custom-button-spin 1s linear infinite;
}

.custom-button__spinner-path {
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-dasharray: 90;
  stroke-dashoffset: 0;
  animation: custom-button-dash 1.5s ease-in-out infinite;
}

@keyframes custom-button-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes custom-button-dash {
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

/* 焦点状态 */
.custom-button:focus {
  box-shadow: 0 0 0 2px rgba(30, 136, 229, 0.2);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .custom-button {
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    position: relative;
    overflow: hidden;
  }
  
  /* 增加移动端的触摸区域 */
  .custom-button--small {
    min-height: 44px;
  }
  
  .custom-button--medium {
    min-height: 48px;
  }
  
  .custom-button--large {
    min-height: 56px;
  }
  
  /* 触摸反馈效果 */
  .custom-button::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: translate(-50%, -50%);
    transition: width 0.3s ease, height 0.3s ease;
    pointer-events: none;
    z-index: 1;
  }
  
  .custom-button:active:not(.custom-button--disabled):not(.custom-button--loading)::after {
    width: 200%;
    height: 200%;
    transition: width 0.1s ease, height 0.1s ease;
  }
  
  /* 主按钮的触摸反馈 */
  .custom-button--primary::after {
    background: rgba(255, 255, 255, 0.2);
  }
  
  /* 次要按钮的触摸反馈 */
  .custom-button--secondary::after {
    background: rgba(30, 136, 229, 0.2);
  }
  
  /* 危险按钮的触摸反馈 */
  .custom-button--danger::after {
    background: rgba(255, 255, 255, 0.2);
  }
  
  /* 文字按钮的触摸反馈 */
  .custom-button--text::after {
    background: rgba(30, 136, 229, 0.1);
  }
  
  /* 触摸时的缩放效果 */
  .custom-button:active:not(.custom-button--disabled):not(.custom-button--loading) {
    transform: scale(0.98);
    transition: transform 0.1s ease;
  }
}

/* 无障碍访问 */
@media (prefers-reduced-motion: reduce) {
  .custom-button,
  .custom-button__content,
  .custom-button__spinner {
    transition: none;
    animation-duration: 0.001s;
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .custom-button {
    border-width: 2px;
  }
}
</style>
