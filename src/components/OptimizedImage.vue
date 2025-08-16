<template>
  <div 
    class="optimized-image"
    :class="imageClasses"
    :style="containerStyle"
  >
    <!-- 懒加载图片 -->
    <img
      v-if="enableLazyLoad"
      ref="imageRef"
      :data-src="src"
      :data-srcset="srcSet"
      :src="placeholder"
      :alt="alt"
      :class="imageClasses"
      :style="imageStyle"
      @load="handleLoad"
      @error="handleError"
    />
    
    <!-- 普通图片 -->
    <img
      v-else
      ref="imageRef"
      :src="currentSrc"
      :srcset="srcSet"
      :sizes="sizes"
      :alt="alt"
      :class="imageClasses"
      :style="imageStyle"
      @load="handleLoad"
      @error="handleError"
    />
    
    <!-- 加载中状态 -->
    <div 
      v-if="isLoading && showLoadingState"
      class="optimized-image__loading"
    >
      <slot name="loading">
        <div class="optimized-image__loading-spinner">
          <svg viewBox="0 0 24 24" class="optimized-image__spinner">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="31.416" stroke-dashoffset="31.416">
              <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
              <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
            </circle>
          </svg>
        </div>
        <p class="optimized-image__loading-text">加载中...</p>
      </slot>
    </div>
    
    <!-- 错误状态 -->
    <div 
      v-if="hasError && showErrorState"
      class="optimized-image__error"
    >
      <slot name="error">
        <div class="optimized-image__error-icon">
          <svg viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </div>
        <p class="optimized-image__error-text">图片加载失败</p>
        <button 
          v-if="enableRetry"
          class="optimized-image__retry-btn"
          @click="handleRetry"
        >
          重试
        </button>
      </slot>
    </div>
    
    <!-- 渐进式加载遮罩 -->
    <div 
      v-if="enableProgressiveLoad && isLoading"
      class="optimized-image__progressive-overlay"
      :style="{ opacity: progressiveOpacity }"
    >
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useImageOptimization } from '../composables/useImageOptimization'

// Props定义
const props = defineProps({
  // 图片源
  src: {
    type: String,
    required: true
  },
  // 替代文本
  alt: {
    type: String,
    default: ''
  },
  // 图片宽度
  width: {
    type: [Number, String],
    default: null
  },
  // 图片高度
  height: {
    type: [Number, String],
    default: null
  },
  // 响应式尺寸
  sizes: {
    type: String,
    default: '100vw'
  },
  // 占位图
  placeholder: {
    type: String,
    default: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0yMCAyOEwyMCAyNEwyNCAyOEgyMFoiIGZpbGw9IiNDQ0NDQ0MiLz4KPC9zdmc+'
  },
  // 是否启用懒加载
  enableLazyLoad: {
    type: Boolean,
    default: true
  },
  // 是否启用渐进式加载
  enableProgressiveLoad: {
    type: Boolean,
    default: true
  },
  // 是否显示加载状态
  showLoadingState: {
    type: Boolean,
    default: true
  },
  // 是否显示错误状态
  showErrorState: {
    type: Boolean,
    default: true
  },
  // 是否启用重试
  enableRetry: {
    type: Boolean,
    default: true
  },
  // 对象适应方式
  objectFit: {
    type: String,
    default: 'cover',
    validator: (value) => ['fill', 'contain', 'cover', 'none', 'scale-down'].includes(value)
  },
  // 边框半径
  borderRadius: {
    type: [Number, String],
    default: null
  },
  // 宽高比
  aspectRatio: {
    type: [Number, String],
    default: null
  },
  // 自定义样式类
  customClass: {
    type: [String, Array, Object],
    default: ''
  },
  // 响应式断点
  breakpoints: {
    type: Array,
    default: () => [400, 800, 1200, 1600]
  },
  // 压缩质量
  quality: {
    type: Number,
    default: 0.8
  },
  // 加载优先级
  loading: {
    type: String,
    default: 'lazy',
    validator: (value) => ['lazy', 'eager'].includes(value)
  }
})

// 事件定义
const emit = defineEmits(['load', 'error', 'retry'])

// 响应式数据
const imageRef = ref(null)
const isLoading = ref(true)
const isLoaded = ref(false)
const hasError = ref(false)
const retryCount = ref(0)
const maxRetries = 3
const progressiveOpacity = ref(1)

// 使用图片优化composable
const imageOptimization = useImageOptimization({
  quality: props.quality,
  enableLazyLoad: props.enableLazyLoad,
  enableProgressiveLoad: props.enableProgressiveLoad
})

// 计算属性
const currentSrc = computed(() => {
  if (hasError.value) return props.placeholder
  if (isLoading.value && !props.enableLazyLoad) return props.placeholder
  return props.src
})

const srcSet = computed(() => {
  if (!props.src || hasError.value) return ''
  return imageOptimization.createSrcSet(props.src, props.breakpoints)
})

const imageClasses = computed(() => {
  return [
    'optimized-image__img',
    {
      'optimized-image__img--loading': isLoading.value,
      'optimized-image__img--loaded': isLoaded.value,
      'optimized-image__img--error': hasError.value,
      'optimized-image__img--lazy': props.enableLazyLoad
    },
    props.customClass
  ]
})

const containerStyle = computed(() => {
  const style = {}
  
  if (props.width) {
    style.width = typeof props.width === 'number' ? `${props.width}px` : props.width
  }
  
  if (props.height) {
    style.height = typeof props.height === 'number' ? `${props.height}px` : props.height
  }
  
  if (props.aspectRatio) {
    style.aspectRatio = props.aspectRatio
  }
  
  if (props.borderRadius) {
    style.borderRadius = typeof props.borderRadius === 'number' ? `${props.borderRadius}px` : props.borderRadius
  }
  
  return style
})

const imageStyle = computed(() => {
  return {
    objectFit: props.objectFit,
    loading: props.loading
  }
})

// 方法
const handleLoad = (event) => {
  isLoading.value = false
  isLoaded.value = true
  hasError.value = false
  
  // 渐进式加载动画
  if (props.enableProgressiveLoad) {
    progressiveOpacity.value = 0
  }
  
  emit('load', event)
}

const handleError = (event) => {
  isLoading.value = false
  hasError.value = true
  
  emit('error', event)
}

const handleRetry = async () => {
  if (retryCount.value >= maxRetries) return
  
  retryCount.value++
  isLoading.value = true
  hasError.value = false
  
  emit('retry', retryCount.value)
  
  // 延迟重试，避免快速连续请求
  await new Promise(resolve => setTimeout(resolve, 1000 * retryCount.value))
  
  if (imageRef.value) {
    imageRef.value.src = props.src
  }
}

const loadImage = async () => {
  if (!props.src) return
  
  try {
    isLoading.value = true
    hasError.value = false
    
    if (props.enableProgressiveLoad) {
      progressiveOpacity.value = 1
    }
    
    // 预加载图片
    await imageOptimization.preloadImage(props.src)
    
    if (imageRef.value) {
      imageRef.value.src = props.src
    }
  } catch (error) {
    handleError(error)
  }
}

// 监听src变化
watch(() => props.src, (newSrc) => {
  if (newSrc) {
    retryCount.value = 0
    if (!props.enableLazyLoad) {
      loadImage()
    }
  }
}, { immediate: true })

// 生命周期
onMounted(() => {
  nextTick(() => {
    if (props.enableLazyLoad && imageRef.value) {
      imageOptimization.observeImage(imageRef.value)
    }
  })
})

onUnmounted(() => {
  if (props.enableLazyLoad && imageRef.value) {
    imageOptimization.unobserveImage(imageRef.value)
  }
})

// 暴露方法给父组件
defineExpose({
  reload: loadImage,
  retry: handleRetry
})
</script>

<style scoped>
.optimized-image {
  position: relative;
  display: inline-block;
  overflow: hidden;
  background-color: var(--bg-gray);
}

.optimized-image__img {
  width: 100%;
  height: 100%;
  display: block;
  transition: opacity 0.3s ease, filter 0.3s ease;
}

.optimized-image__img--loading {
  opacity: 0.7;
  filter: blur(1px);
}

.optimized-image__img--loaded {
  opacity: 1;
  filter: none;
}

.optimized-image__img--error {
  opacity: 0;
}

/* 加载状态 */
.optimized-image__loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg-gray);
  color: var(--text-secondary);
}

.optimized-image__loading-spinner {
  width: 32px;
  height: 32px;
  margin-bottom: 8px;
  color: var(--primary-color);
}

.optimized-image__spinner {
  width: 100%;
  height: 100%;
}

.optimized-image__loading-text {
  margin: 0;
  font-size: var(--font-size-sm);
}

/* 错误状态 */
.optimized-image__error {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg-gray);
  color: var(--text-secondary);
  text-align: center;
  padding: var(--spacing-md);
}

.optimized-image__error-icon {
  width: 32px;
  height: 32px;
  margin-bottom: 8px;
  color: #f44336;
}

.optimized-image__error-icon svg {
  width: 100%;
  height: 100%;
  fill: currentColor;
}

.optimized-image__error-text {
  margin: 0 0 8px 0;
  font-size: var(--font-size-sm);
}

.optimized-image__retry-btn {
  padding: 4px 12px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--border-radius-small);
  font-size: var(--font-size-xs);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.optimized-image__retry-btn:hover {
  background: var(--primary-dark);
}

/* 渐进式加载遮罩 */
.optimized-image__progressive-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, 
    rgba(255, 255, 255, 0.1) 25%, 
    transparent 25%, 
    transparent 50%, 
    rgba(255, 255, 255, 0.1) 50%, 
    rgba(255, 255, 255, 0.1) 75%, 
    transparent 75%
  );
  background-size: 20px 20px;
  animation: progressive-shimmer 1.5s infinite linear;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

@keyframes progressive-shimmer {
  0% {
    background-position: -20px 0;
  }
  100% {
    background-position: 20px 0;
  }
}

/* 懒加载动画 */
.optimized-image__img--lazy {
  opacity: 0;
  transform: scale(1.05);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.optimized-image__img--lazy.loaded {
  opacity: 1;
  transform: scale(1);
}

/* 移动端优化 */
@media (max-width: 768px) {
  .optimized-image__loading,
  .optimized-image__error {
    padding: var(--spacing-sm);
  }
  
  .optimized-image__loading-spinner,
  .optimized-image__error-icon {
    width: 24px;
    height: 24px;
  }
}

/* 无障碍访问 */
@media (prefers-reduced-motion: reduce) {
  .optimized-image__img,
  .optimized-image__progressive-overlay {
    transition: none !important;
    animation: none !important;
  }
  
  .optimized-image__img--lazy {
    transform: none;
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .optimized-image__loading,
  .optimized-image__error {
    border: 1px solid var(--text-primary);
  }
}

/* 深色模式 */
@media (prefers-color-scheme: dark) {
  .optimized-image {
    background-color: #2d2d2d;
  }
  
  .optimized-image__loading,
  .optimized-image__error {
    background: #2d2d2d;
  }
}
</style>
