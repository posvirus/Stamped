<template>
  <Teleport to="body">
    <Transition name="modal" appear>
      <div
        v-if="modelValue"
        class="modal"
        :class="modalClasses"
        @click="handleMaskClick"
      >
        <div
          class="modal__container"
          :class="containerClasses"
          @click.stop
        >
          <!-- 头部 -->
          <div v-if="showHeader" class="modal__header">
            <div class="modal__title">
              <slot name="title">
                <h3>{{ title }}</h3>
              </slot>
            </div>
            <button
              v-if="closable"
              class="modal__close"
              @click="handleClose"
              aria-label="关闭"
            >
              <svg viewBox="0 0 24 24" class="modal__close-icon">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
          
          <!-- 内容 -->
          <div class="modal__body" :class="bodyClasses">
            <slot>
              <p v-if="content">{{ content }}</p>
            </slot>
          </div>
          
          <!-- 底部 -->
          <div v-if="showFooter" class="modal__footer">
            <slot name="footer">
              <div class="modal__actions">
                <CustomButton
                  v-if="showCancelButton"
                  type="secondary"
                  :loading="cancelLoading"
                  @click="handleCancel"
                >
                  {{ cancelText }}
                </CustomButton>
                <CustomButton
                  v-if="showConfirmButton"
                  :type="confirmType"
                  :loading="confirmLoading"
                  @click="handleConfirm"
                >
                  {{ confirmText }}
                </CustomButton>
              </div>
            </slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, watch, nextTick } from 'vue'
import CustomButton from './CustomButton.vue'

// 禁用属性继承，避免Teleport根节点的警告
defineOptions({
  inheritAttrs: false
})

// Props定义
const props = defineProps({
  // v-model支持
  modelValue: {
    type: Boolean,
    default: false
  },
  // 标题
  title: {
    type: String,
    default: '提示'
  },
  // 内容
  content: {
    type: String,
    default: ''
  },
  // 模态框大小
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large', 'fullscreen'].includes(value)
  },
  // 是否显示头部
  showHeader: {
    type: Boolean,
    default: true
  },
  // 是否显示底部
  showFooter: {
    type: Boolean,
    default: true
  },
  // 是否显示关闭按钮
  closable: {
    type: Boolean,
    default: true
  },
  // 点击遮罩是否关闭
  maskClosable: {
    type: Boolean,
    default: true
  },
  // 按ESC是否关闭
  escClosable: {
    type: Boolean,
    default: true
  },
  // 是否显示取消按钮
  showCancelButton: {
    type: Boolean,
    default: true
  },
  // 是否显示确认按钮
  showConfirmButton: {
    type: Boolean,
    default: true
  },
  // 取消按钮文本
  cancelText: {
    type: String,
    default: '取消'
  },
  // 确认按钮文本
  confirmText: {
    type: String,
    default: '确认'
  },
  // 确认按钮类型
  confirmType: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'danger'].includes(value)
  },
  // 取消按钮加载状态
  cancelLoading: {
    type: Boolean,
    default: false
  },
  // 确认按钮加载状态
  confirmLoading: {
    type: Boolean,
    default: false
  },
  // 是否居中显示
  centered: {
    type: Boolean,
    default: true
  },
  // 自定义CSS类
  customClass: {
    type: [String, Array, Object],
    default: ''
  },
  // 内容区域自定义CSS类
  bodyClass: {
    type: [String, Array, Object],
    default: ''
  },
  // z-index
  zIndex: {
    type: Number,
    default: 1000
  }
})

// 事件定义
const emit = defineEmits(['update:modelValue', 'confirm', 'cancel', 'close', 'open'])

// 计算属性
const modalClasses = computed(() => {
  return [
    {
      'modal--centered': props.centered
    },
    props.customClass
  ]
})

const containerClasses = computed(() => {
  return [
    `modal__container--${props.size}`,
    {
      'modal__container--no-header': !props.showHeader,
      'modal__container--no-footer': !props.showFooter
    }
  ]
})

const bodyClasses = computed(() => {
  return [
    {
      'modal__body--scrollable': props.size !== 'fullscreen'
    },
    props.bodyClass
  ]
})

// 方法
const handleClose = () => {
  emit('update:modelValue', false)
  emit('close')
}

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
  if (!props.confirmLoading && !props.cancelLoading) {
    handleClose()
  }
}

const handleMaskClick = () => {
  if (props.maskClosable && !props.confirmLoading && !props.cancelLoading) {
    handleClose()
  }
}

const handleEscPress = (event) => {
  if (event.key === 'Escape' && props.escClosable && props.modelValue) {
    handleClose()
  }
}

// 监听键盘事件
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    document.addEventListener('keydown', handleEscPress)
    document.body.style.overflow = 'hidden'
    nextTick(() => {
      emit('open')
    })
  } else {
    document.removeEventListener('keydown', handleEscPress)
    document.body.style.overflow = ''
  }
}, { immediate: true })

// 组件卸载时清理
import { onUnmounted } from 'vue'
onUnmounted(() => {
  document.removeEventListener('keydown', handleEscPress)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: v-bind('zIndex');
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: var(--spacing-lg);
  overflow-y: auto;
}

.modal--centered {
  align-items: center;
}

.modal__container {
  position: relative;
  background: var(--bg-white);
  border-radius: var(--border-radius-large);
  box-shadow: var(--shadow-heavy);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 2 * var(--spacing-lg));
  margin: auto 0;
}

/* 容器大小 */
.modal__container--small {
  width: 100%;
  max-width: 400px;
}

.modal__container--medium {
  width: 100%;
  max-width: 600px;
}

.modal__container--large {
  width: 100%;
  max-width: 800px;
}

.modal__container--fullscreen {
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  border-radius: 0;
  margin: 0;
}

/* 头部 */
.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg) var(--spacing-lg) 0;
  flex-shrink: 0;
}

.modal__title h3 {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.4;
}

.modal__close {
  padding: var(--spacing-xs);
  background: none;
  border: none;
  border-radius: var(--border-radius-small);
  cursor: pointer;
  color: var(--text-disabled);
  transition: all 0.2s ease;
  flex-shrink: 0;
  margin-left: var(--spacing-md);
}

.modal__close:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: var(--text-secondary);
}

.modal__close-icon {
  width: 20px;
  height: 20px;
  fill: currentColor;
}

/* 内容区域 */
.modal__body {
  flex: 1;
  padding: var(--spacing-lg);
  color: var(--text-primary);
  line-height: 1.6;
  min-height: 0;
}

.modal__container--no-header .modal__body {
  padding-top: var(--spacing-lg);
}

.modal__container--no-footer .modal__body {
  padding-bottom: var(--spacing-lg);
}

.modal__body--scrollable {
  overflow-y: auto;
}

.modal__body p {
  margin: 0 0 var(--spacing-md) 0;
}

.modal__body p:last-child {
  margin-bottom: 0;
}

/* 底部 */
.modal__footer {
  padding: 0 var(--spacing-lg) var(--spacing-lg);
  flex-shrink: 0;
}

.modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
}

/* 过渡动画 */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-active .modal__container,
.modal-leave-active .modal__container {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal__container,
.modal-leave-to .modal__container {
  opacity: 0;
  transform: scale(0.9) translateY(-20px);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .modal {
    padding: var(--spacing-md);
    align-items: flex-end;
  }
  
  .modal--centered {
    align-items: center;
  }
  
  .modal__container {
    max-height: calc(100vh - 2 * var(--spacing-md));
    border-radius: var(--border-radius-large) var(--border-radius-large) 0 0;
  }
  
  .modal--centered .modal__container {
    border-radius: var(--border-radius-large);
  }
  
  .modal__container--small,
  .modal__container--medium,
  .modal__container--large {
    width: 100%;
    max-width: none;
  }
  
  .modal__container--fullscreen {
    border-radius: 0;
    margin: calc(-1 * var(--spacing-md));
    max-height: 100vh;
  }
  
  .modal__header {
    padding: var(--spacing-md) var(--spacing-md) 0;
  }
  
  .modal__body {
    padding: var(--spacing-md);
  }
  
  .modal__footer {
    padding: 0 var(--spacing-md) var(--spacing-md);
  }
  
  .modal__actions {
    flex-direction: column-reverse;
    gap: var(--spacing-xs);
  }
  
  .modal__actions :deep(.custom-button) {
    width: 100%;
  }
  
  /* 移动端安全区域适配 */
  .modal {
    padding-bottom: calc(var(--spacing-md) + env(safe-area-inset-bottom, 0px));
  }
  
  .modal__container--fullscreen {
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
}

/* 无障碍访问 */
@media (prefers-reduced-motion: reduce) {
  .modal,
  .modal__container,
  .modal__close {
    transition: none;
  }
  
  .modal-enter-active,
  .modal-leave-active,
  .modal-enter-active .modal__container,
  .modal-leave-active .modal__container {
    transition: none;
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .modal {
    background-color: rgba(0, 0, 0, 0.7);
  }
  
  .modal__container {
    background: #2d2d2d;
  }
  
  .modal__title h3 {
    color: var(--text-white);
  }
  
  .modal__body {
    color: #cccccc;
  }
  
  .modal__close:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .modal__container {
    border: 2px solid var(--text-primary);
  }
  
  .modal__close {
    border: 1px solid var(--text-disabled);
  }
}
</style>
