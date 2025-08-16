<template>
  <div class="loading" :class="loadingClasses">
    <!-- 全屏遮罩 -->
    <div v-if="overlay" class="loading__overlay" @click="handleOverlayClick">
      <div class="loading__content" @click.stop>
        <LoadingIcon :type="type" :size="size" :color="color" />
        <p v-if="text" class="loading__text">{{ text }}</p>
      </div>
    </div>
    
    <!-- 内联加载 -->
    <template v-else>
      <LoadingIcon :type="type" :size="size" :color="color" />
      <p v-if="text" class="loading__text">{{ text }}</p>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import LoadingIcon from './LoadingIcon.vue'

// Props定义
const props = defineProps({
  // 加载指示器类型
  type: {
    type: String,
    default: 'spinner',
    validator: (value) => ['spinner', 'dots', 'bars', 'circle', 'pulse'].includes(value)
  },
  // 大小
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },
  // 颜色
  color: {
    type: String,
    default: 'primary'
  },
  // 加载文本
  text: {
    type: String,
    default: ''
  },
  // 是否显示遮罩层
  overlay: {
    type: Boolean,
    default: false
  },
  // 是否居中显示
  centered: {
    type: Boolean,
    default: false
  },
  // 是否可点击遮罩关闭
  maskClosable: {
    type: Boolean,
    default: false
  }
})

// 事件定义
const emit = defineEmits(['overlay-click'])

// 计算属性
const loadingClasses = computed(() => {
  return [
    {
      'loading--overlay': props.overlay,
      'loading--centered': props.centered && !props.overlay
    }
  ]
})

// 方法
const handleOverlayClick = () => {
  if (props.maskClosable) {
    emit('overlay-click')
  }
}
</script>



<style scoped>
.loading {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.loading--centered {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.loading--overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
}

.loading__overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
  background: var(--bg-white);
  border-radius: var(--border-radius-medium);
  box-shadow: var(--shadow-medium);
  max-width: 200px;
}

.loading__text {
  margin: var(--spacing-md) 0 0 0;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  text-align: center;
  line-height: 1.4;
}



/* 移动端适配 */
@media (max-width: 768px) {
  .loading__content {
    padding: var(--spacing-md);
    margin: var(--spacing-md);
  }
  
  .loading__text {
    font-size: var(--font-size-xs);
  }
}



/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .loading__overlay {
    background-color: rgba(0, 0, 0, 0.8);
  }
  
  .loading__content {
    background: #1a1a1a;
    color: var(--text-white);
  }
}
</style>
