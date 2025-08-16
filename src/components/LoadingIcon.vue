<template>
  <div class="loading-icon" :class="iconClasses" :style="iconStyle">
    <!-- 旋转加载器 -->
    <svg v-if="type === 'spinner'" class="loading-icon__spinner" viewBox="0 0 50 50">
      <circle class="loading-icon__spinner-path" cx="25" cy="25" r="20" />
    </svg>
    
    <!-- 点状加载器 -->
    <div v-else-if="type === 'dots'" class="loading-icon__dots">
      <div class="loading-icon__dot"></div>
      <div class="loading-icon__dot"></div>
      <div class="loading-icon__dot"></div>
    </div>
    
    <!-- 条状加载器 -->
    <div v-else-if="type === 'bars'" class="loading-icon__bars">
      <div class="loading-icon__bar"></div>
      <div class="loading-icon__bar"></div>
      <div class="loading-icon__bar"></div>
      <div class="loading-icon__bar"></div>
      <div class="loading-icon__bar"></div>
    </div>
    
    <!-- 圆环加载器 -->
    <div v-else-if="type === 'circle'" class="loading-icon__circle">
      <div class="loading-icon__circle-inner"></div>
    </div>
    
    <!-- 脉冲加载器 -->
    <div v-else-if="type === 'pulse'" class="loading-icon__pulse">
      <div class="loading-icon__pulse-inner"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Props定义
const props = defineProps({
  type: {
    type: String,
    default: 'spinner',
    validator: (value) => ['spinner', 'dots', 'bars', 'circle', 'pulse'].includes(value)
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },
  color: {
    type: String,
    default: 'primary'
  }
})

// 计算属性
const iconClasses = computed(() => {
  return [
    `loading-icon--${props.type}`,
    `loading-icon--${props.size}`,
    `loading-icon--${props.color}`
  ]
})

const iconStyle = computed(() => {
  // 如果color是hex色值，直接使用
  if (props.color.startsWith('#')) {
    return { color: props.color }
  }
  return {}
})
</script>

<style scoped>
/* Loading Icon 样式 */
.loading-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 大小 */
.loading-icon--small {
  width: 20px;
  height: 20px;
}

.loading-icon--medium {
  width: 32px;
  height: 32px;
}

.loading-icon--large {
  width: 48px;
  height: 48px;
}

/* 颜色 */
.loading-icon--primary {
  color: var(--primary-color);
}

.loading-icon--success {
  color: var(--success-color);
}

.loading-icon--white {
  color: var(--text-white);
}

.loading-icon--gray {
  color: var(--text-secondary);
}

/* 旋转加载器 */
.loading-icon__spinner {
  width: 100%;
  height: 100%;
  animation: loading-rotate 2s linear infinite;
}

.loading-icon__spinner-path {
  fill: none;
  stroke: currentColor;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-dasharray: 90;
  stroke-dashoffset: 0;
  animation: loading-dash 1.5s ease-in-out infinite;
}

@keyframes loading-rotate {
  to {
    transform: rotate(360deg);
  }
}

@keyframes loading-dash {
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

/* 点状加载器 */
.loading-icon__dots {
  display: flex;
  align-items: center;
  gap: 4px;
}

.loading-icon__dot {
  width: 25%;
  height: 25%;
  background-color: currentColor;
  border-radius: 50%;
  animation: loading-dots 1.4s ease-in-out infinite both;
}

.loading-icon__dot:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-icon__dot:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes loading-dots {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 条状加载器 */
.loading-icon__bars {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 100%;
}

.loading-icon__bar {
  width: 15%;
  height: 100%;
  background-color: currentColor;
  border-radius: 2px;
  animation: loading-bars 1.2s infinite ease-in-out;
}

.loading-icon__bar:nth-child(1) {
  animation-delay: -1.2s;
}

.loading-icon__bar:nth-child(2) {
  animation-delay: -1.1s;
}

.loading-icon__bar:nth-child(3) {
  animation-delay: -1.0s;
}

.loading-icon__bar:nth-child(4) {
  animation-delay: -0.9s;
}

.loading-icon__bar:nth-child(5) {
  animation-delay: -0.8s;
}

@keyframes loading-bars {
  0%, 40%, 100% {
    transform: scaleY(0.4);
    opacity: 0.5;
  }
  20% {
    transform: scaleY(1.0);
    opacity: 1;
  }
}

/* 圆环加载器 */
.loading-icon__circle {
  width: 100%;
  height: 100%;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: loading-circle 1s linear infinite;
}

.loading-icon__circle-inner {
  width: 100%;
  height: 100%;
}

@keyframes loading-circle {
  to {
    transform: rotate(360deg);
  }
}

/* 脉冲加载器 */
.loading-icon__pulse {
  width: 100%;
  height: 100%;
  background-color: currentColor;
  border-radius: 50%;
  animation: loading-pulse 1.5s ease-in-out infinite;
}

.loading-icon__pulse-inner {
  width: 100%;
  height: 100%;
}

@keyframes loading-pulse {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}
</style>
