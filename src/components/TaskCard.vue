<template>
  <div 
    class="task-card" 
    :class="{ 'task-card--completed': isCompleted }"
    @click="handleClick"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
    @touchcancel="handleTouchEnd"
    tabindex="0"
    role="button"
    :aria-label="`任务: ${title}`"
  >
    <div class="task-card__header">
      <h3 class="task-card__title">{{ displayTitle }}</h3>
      <div class="task-card__actions">
        <div class="task-card__status" v-if="isCompleted">
          <img src="../assets/acc.svg" alt="已完成" class="task-card__stamp-icon" />
        </div>
        <button
          v-if="showDeleteButton"
          class="task-card__delete-btn"
          @click="handleDelete"
          @touchstart.stop
          @touchend.stop
          aria-label="删除任务"
          title="删除任务"
          type="button"
        >
          <svg viewBox="0 0 24 24" class="task-card__delete-icon">
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        </button>
      </div>
    </div>
    
    <div class="task-card__meta">
      <span class="task-card__date">
        {{ isCompleted ? `完成于 ${formattedCompletedDate}` : `创建于 ${formattedCreatedDate}` }}
      </span>
      <span class="task-card__agreement-preview">
        {{ agreementPreview }}
      </span>
    </div>
    
    <div class="task-card__description" v-if="description && showDescription">
      <p>{{ description }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// Props定义
const props = defineProps({
  // 任务标题
  title: {
    type: String,
    required: true
  },
  // 任务描述
  description: {
    type: String,
    default: ''
  },
  // 创建时间
  createdAt: {
    type: [String, Date],
    required: true
  },
  // 完成时间
  completedAt: {
    type: [String, Date],
    default: null
  },
  // 是否已完成
  isCompleted: {
    type: Boolean,
    default: false
  },
  // 是否显示类型标签
  showType: {
    type: Boolean,
    default: true
  },
  // 是否显示描述
  showDescription: {
    type: Boolean,
    default: false
  },
  // 标题最大长度
  maxTitleLength: {
    type: Number,
    default: 20
  },
  // 是否显示删除按钮
  showDeleteButton: {
    type: Boolean,
    default: false
  },
  // 任务ID
  taskId: {
    type: [String, Number],
    default: null
  }
})

// 事件定义
const emit = defineEmits(['click', 'longpress', 'delete'])

// 计算属性
const displayTitle = computed(() => {
  // 根据任务状态设置不同的截断长度
  const maxLength = props.isCompleted ? 4 : 6
  
  if (props.title.length <= maxLength) {
    return props.title
  }
  return props.title.substring(0, maxLength) + '...'
})

const formattedCreatedDate = computed(() => {
  return formatDate(props.createdAt)
})

const formattedCompletedDate = computed(() => {
  return props.completedAt ? formatDate(props.completedAt) : ''
})

// 协议预览 - 显示前几个字符
const agreementPreview = computed(() => {
  if (!props.description) return ''
  
  // 截取前12个字符（可以根据需要调整）
  const maxLength = 12
  if (props.description.length <= maxLength) {
    return props.description
  }
  return props.description.substring(0, maxLength) + '...'
})

// 方法
const handleClick = () => {
  emit('click', {
    _id: props.taskId,
    title: props.title,
    description: props.description,
    createdAt: props.createdAt,
    completedAt: props.completedAt,
    isCompleted: props.isCompleted
  })
}

const handleDelete = (event) => {
  event.preventDefault()
  event.stopPropagation()
  emit('delete', {
    _id: props.taskId,
    title: props.title,
    description: props.description,
    createdAt: props.createdAt,
    completedAt: props.completedAt,
    isCompleted: props.isCompleted
  })
}

let touchStartTime = 0

const handleTouchStart = (event) => {
  touchStartTime = Date.now()
  event.currentTarget.classList.add('task-card--touching')
}

const handleTouchEnd = (event) => {
  const touchDuration = Date.now() - touchStartTime
  event.currentTarget.classList.remove('task-card--touching')
  
  // 如果是长按（超过500ms），触发长按事件
  if (touchDuration > 500) {
    emit('longpress', {
      _id: props.taskId,
      title: props.title,
      description: props.description,
      createdAt: props.createdAt,
      completedAt: props.completedAt,
      isCompleted: props.isCompleted
    })
  }
}

const formatDate = (date) => {
  const d = new Date(date)
  const now = new Date()
  const diff = now - d
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) {
    return '今天'
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return d.toLocaleDateString('zh-CN', {
      month: 'numeric',
      day: 'numeric'
    })
  }
}
</script>

<style scoped>
.task-card {
  background: var(--bg-white);
  border-radius: var(--border-radius-medium);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
  box-shadow: var(--shadow-light);
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  position: relative;
  width: 160px; /* 固定宽度 */
  height: 120px; /* 缩小高度，使宽高比为4:3 (160:120 = 4:3) */
  flex-shrink: 0; /* 防止卡片被压缩 */
}

.task-card:hover {
  box-shadow: var(--shadow-medium);
  transform: translateY(-1px);
}

.task-card:active {
  transform: translateY(0);
  box-shadow: var(--shadow-light);
}

.task-card--completed {
  background: linear-gradient(135deg, var(--bg-white) 0%, #f8f9fa 100%);
  border-color: var(--success-color);
}

.task-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-sm);
}

.task-card__actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-shrink: 0;
}

.task-card__title {
  font-size: var(--font-size-md);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  line-height: 1.4;
  flex: 1;
  word-break: break-word;
}

.task-card__status {
  display: flex;
  align-items: center;
}

.task-card__stamp-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.task-card__delete-btn {
  /* 按钮基础样式 */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  border-radius: var(--border-radius-medium);
  font-family: inherit;
  font-weight: 500;
  text-align: center;
  cursor: pointer;
  user-select: none;
  touch-action: manipulation;
  outline: none;
  box-sizing: border-box;
  white-space: nowrap;
  line-height: 1;
  transition: all 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
  
  /* 小尺寸按钮样式 */
  height: 28px;
  width: 28px;
  padding: 0;
  font-size: 12px;
  
  /* 危险按钮样式 */
  background-color: #f44336;
  border-color: #f44336;
  color: white;
  
  /* 默认状态下稍微透明 */
  opacity: 0.7;
}

.task-card__delete-btn:hover:not(:disabled) {
  background-color: #ef5350;
  border-color: #ef5350;
  opacity: 1;
}

.task-card__delete-btn:active:not(:disabled) {
  background-color: #d32f2f;
  border-color: #d32f2f;
  transform: scale(0.98);
}

.task-card__delete-btn:focus {
  box-shadow: 0 0 0 2px rgba(244, 67, 54, 0.2);
}

.task-card__delete-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.task-card:hover .task-card__delete-btn {
  opacity: 1;
}

.task-card__delete-icon {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

.task-card__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.task-card__date {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.task-card__agreement-preview {
  font-size: 9px;
  color: var(--text-secondary);
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: var(--border-radius-small);
  line-height: 1.2;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-card__description {
  margin-top: var(--spacing-sm);
}

.task-card__description p {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
  word-break: break-word;
}

/* 触摸状态 */
.task-card--touching {
  transform: scale(0.98);
  box-shadow: var(--shadow-light);
  transition: all 0.1s ease;
}

.task-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(30, 136, 229, 0.05);
  border-radius: inherit;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.task-card--touching::before {
  opacity: 1;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .task-card {
    width: 120px; /* 移动端宽度保持不变 */
    height: 90px; /* 移动端缩小高度，保持4:3比例 (120:90 = 4:3) */
    margin-bottom: var(--spacing-xs);
    padding: var(--spacing-sm) var(--spacing-md);
    overflow: hidden;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    min-height: 60px; /* 确保足够的触摸区域 */
  }
  
  .task-card__title {
    font-size: var(--font-size-sm);
  }
  
  .task-card__meta {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
  }
  
  /* 移动端删除按钮优化 */
  .task-card__delete-btn {
    min-height: 44px;
    min-width: 44px;
    height: 36px;
    width: 36px;
    overflow: hidden;
  }
  
  /* 移动端触摸反馈 */
  .task-card__delete-btn {
    position: relative;
  }
  
  .task-card__delete-btn::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    transform: translate(-50%, -50%);
    transition: width 0.3s ease, height 0.3s ease;
    pointer-events: none;
  }
  
  .task-card__delete-btn:active:not(:disabled)::after {
    width: 200%;
    height: 200%;
    transition: width 0.1s ease, height 0.1s ease;
  }
  
  /* 触摸反馈优化 */
  .task-card:active {
    transform: scale(0.98);
    transition: transform 0.1s ease;
  }
}

/* 无障碍访问 */
.task-card:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .task-card {
    transition: none;
  }
  
  .task-card:hover {
    transform: none;
  }
  
  .task-card__delete-btn {
    transition: none;
  }
  
  .task-card__delete-btn:active {
    transform: none;
  }
  
  .task-card__delete-btn::after {
    transition: none;
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .task-card__delete-btn {
    border-width: 2px;
  }
}

/* 专门针对HomePage中的任务卡片标题 */
:deep(.task-card__title) {
  font-size: 12px;        /* 调整字体大小 */
}

/* 专门针对HomePage中的任务卡片创建时间 */
:deep(.task-card__date) {
  font-size: 12px;         /* 调整创建时间字体大小 */
  font-weight: 400;       /* 可选：调整字体粗细 */
  color: #999;            /* 可选：调整字体颜色 */
}

</style>
