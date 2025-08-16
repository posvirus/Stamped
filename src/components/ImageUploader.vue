<template>
  <div class="image-uploader" :class="uploaderClasses">
    <!-- 上传区域 -->
    <div class="image-uploader__upload-area">
      <!-- 已上传的图片列表 -->
      <div v-if="imageList.length > 0" class="image-uploader__list">
        <div
          v-for="(image, index) in imageList"
          :key="image.id"
          class="image-uploader__item"
          :class="{ 'image-uploader__item--uploading': image.uploading }"
        >
          <!-- 图片预览 -->
          <div class="image-uploader__preview" @click="handlePreview(image, index)">
            <OptimizedImage
              :src="image.url || image.dataUrl"
              :alt="`图片 ${index + 1}`"
              class="image-uploader__image"
              :enable-lazy-load="false"
              :enable-progressive-load="true"
              :show-loading-state="true"
              :show-error-state="true"
              object-fit="cover"
              @load="handleImageLoad(image)"
              @error="handleImageError(image)"
            />
            
            <!-- 上传进度 -->
            <div v-if="image.uploading" class="image-uploader__progress">
              <div class="image-uploader__progress-bar" :style="{ width: `${image.progress}%` }"></div>
              <span class="image-uploader__progress-text">{{ image.progress }}%</span>
            </div>
            
            <!-- 上传状态 -->
            <div v-if="image.error" class="image-uploader__status image-uploader__status--error">
              <svg viewBox="0 0 24 24" class="image-uploader__status-icon">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </div>
            
            <div v-else-if="image.success" class="image-uploader__status image-uploader__status--success">
              <svg viewBox="0 0 24 24" class="image-uploader__status-icon">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
            </div>
          </div>
          
          <!-- 删除按钮 -->
          <button
            class="image-uploader__remove"
            @click="handleRemove(index)"
            :disabled="image.uploading"
            aria-label="删除图片"
          >
            <svg viewBox="0 0 24 24" class="image-uploader__remove-icon">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
      </div>
      
      <!-- 上传按钮 -->
      <div
        v-if="canAddMore"
        class="image-uploader__trigger"
        :class="{ 'image-uploader__trigger--dragover': isDragOver }"
        @click="handleTriggerClick"
        @dragover.prevent="handleDragOver"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
      >
        <div class="image-uploader__trigger-content">
          <svg class="image-uploader__trigger-icon" viewBox="0 0 24 24">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
          </svg>
          <p class="image-uploader__trigger-text">
            {{ imageList.length === 0 ? '点击或拖拽上传图片' : `添加图片 (${imageList.length}/${maxCount})` }}
          </p>
          <p class="image-uploader__trigger-desc">
            支持 JPG、PNG、WebP 格式，单张不超过 {{ formatFileSize(maxSize) }}
          </p>
        </div>
      </div>
    </div>
    
    <!-- 隐藏的文件输入框 -->
    <input
      ref="fileInput"
      type="file"
      :accept="accept"
      :multiple="multiple"
      class="image-uploader__input"
      @change="handleFileChange"
    />
    
    <!-- 图片预览弹窗 -->
    <Modal
      v-model="previewVisible"
      :title="`图片预览 (${previewIndex + 1}/${imageList.length})`"
      size="large"
      :show-footer="false"
      :mask-closable="true"
    >
      <div class="image-uploader__preview-modal">
        <OptimizedImage
          v-if="previewImage"
          :src="previewImage.url || previewImage.dataUrl"
          :alt="`图片 ${previewIndex + 1}`"
          class="image-uploader__preview-image"
          :enable-lazy-load="false"
          :enable-progressive-load="true"
          :show-loading-state="true"
          :show-error-state="true"
          object-fit="contain"
        />
        
        <!-- 预览导航 -->
        <div v-if="imageList.length > 1" class="image-uploader__preview-nav">
          <button
            class="image-uploader__preview-btn"
            :disabled="previewIndex === 0"
            @click="handlePrevPreview"
          >
            <svg viewBox="0 0 24 24">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
          </button>
          <span class="image-uploader__preview-counter">
            {{ previewIndex + 1 }} / {{ imageList.length }}
          </span>
          <button
            class="image-uploader__preview-btn"
            :disabled="previewIndex === imageList.length - 1"
            @click="handleNextPreview"
          >
            <svg viewBox="0 0 24 24">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import Modal from './Modal.vue'
import OptimizedImage from './OptimizedImage.vue'
import { useImageOptimization } from '../composables/useImageOptimization'

// Props定义
const props = defineProps({
  // v-model支持
  modelValue: {
    type: Array,
    default: () => []
  },
  // 最大上传数量
  maxCount: {
    type: Number,
    default: 3
  },
  // 最大文件大小（字节）
  maxSize: {
    type: Number,
    default: 5 * 1024 * 1024 // 5MB
  },
  // 接受的文件类型
  accept: {
    type: String,
    default: 'image/jpeg,image/jpg,image/png,image/webp'
  },
  // 是否支持多选
  multiple: {
    type: Boolean,
    default: true
  },
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false
  },
  // 上传函数
  uploadFunction: {
    type: Function,
    default: null
  },
  // 是否自动上传
  autoUpload: {
    type: Boolean,
    default: true
  },
  // 图片压缩质量 (0-1)
  compressQuality: {
    type: Number,
    default: 0.8
  },
  // 压缩后的最大宽度
  compressMaxWidth: {
    type: Number,
    default: 1920
  },
  // 压缩后的最大高度
  compressMaxHeight: {
    type: Number,
    default: 1080
  }
})

// 事件定义
const emit = defineEmits(['update:modelValue', 'change', 'upload-success', 'upload-error', 'remove'])

// 响应式数据
const fileInput = ref(null)
const imageList = ref([...props.modelValue])
const isDragOver = ref(false)
const previewVisible = ref(false)
const previewIndex = ref(0)
const previewImage = ref(null)

// 使用图片优化composable
const imageOptimization = useImageOptimization({
  quality: props.compressQuality,
  maxWidth: props.compressMaxWidth,
  maxHeight: props.compressMaxHeight,
  enableWebP: true,
  enableCache: true
})

// 计算属性
const uploaderClasses = computed(() => {
  return {
    'image-uploader--disabled': props.disabled
  }
})

const canAddMore = computed(() => {
  return !props.disabled && imageList.value.length < props.maxCount
})

// 方法
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const compressImage = async (file, quality = props.compressQuality) => {
  try {
    const result = await imageOptimization.compressImage(file)
    return {
      blob: result.blob,
      info: {
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        compressionRatio: result.compressionRatio,
        width: result.width,
        height: result.height,
        format: result.format
      }
    }
  } catch (error) {
    console.error('图片压缩失败:', error)
    // 如果压缩失败，返回原文件
    return {
      blob: file,
      info: {
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 0,
        width: 0,
        height: 0,
        format: file.type
      }
    }
  }
}

const createImageObject = (file) => {
  return {
    id: generateId(),
    file,
    dataUrl: '',
    url: '',
    name: file.name,
    size: file.size,
    type: file.type,
    uploading: false,
    progress: 0,
    success: false,
    error: null
  }
}

const validateFile = (file) => {
  // 检查文件类型
  const acceptTypes = props.accept.split(',').map(type => type.trim())
  if (!acceptTypes.includes(file.type)) {
    return `不支持的文件格式，请选择 ${acceptTypes.join(', ')} 格式的图片`
  }
  
  // 检查文件大小
  if (file.size > props.maxSize) {
    return `文件大小不能超过 ${formatFileSize(props.maxSize)}`
  }
  
  return null
}

const handleFileChange = (event) => {
  const files = Array.from(event.target.files)
  handleFiles(files)
  // 清空input值，允许重复选择同一文件
  event.target.value = ''
}

const handleFiles = async (files) => {
  if (!canAddMore.value) return
  
  const remainingSlots = props.maxCount - imageList.value.length
  const filesToProcess = files.slice(0, remainingSlots)
  
  for (const file of filesToProcess) {
    const error = validateFile(file)
    if (error) {
      // 可以通过事件通知错误
      emit('upload-error', { file, error })
      continue
    }
    
    try {
      // 压缩图片
      const { blob: compressedFile, info } = await compressImage(file)
      const imageObj = createImageObject(compressedFile)
      
      // 添加压缩信息
      imageObj.compressionInfo = info
      
      // 生成预览图和缩略图
      imageObj.dataUrl = URL.createObjectURL(compressedFile)
      
      // 生成缩略图用于快速预览
      try {
        const thumbnailResult = await imageOptimization.generateThumbnail(compressedFile, 200)
        imageObj.thumbnailUrl = URL.createObjectURL(thumbnailResult.blob)
      } catch (thumbnailError) {
        console.warn('缩略图生成失败:', thumbnailError)
        imageObj.thumbnailUrl = imageObj.dataUrl
      }
      
      imageList.value.push(imageObj)
      
      // 自动上传
      if (props.autoUpload && props.uploadFunction) {
        uploadImage(imageObj)
      }
    } catch (compressionError) {
      console.error('图片处理失败:', compressionError)
      emit('upload-error', { file, error: '图片处理失败' })
    }
  }
  
  updateModelValue()
}

const uploadImage = async (imageObj) => {
  if (!props.uploadFunction) return
  
  imageObj.uploading = true
  imageObj.progress = 0
  
  try {
    const result = await props.uploadFunction(imageObj.file, (progress) => {
      imageObj.progress = Math.round(progress * 100)
    })
    
    imageObj.success = true
    imageObj.uploading = false
    imageObj.url = result.url || result
    
    emit('upload-success', { image: imageObj, result })
  } catch (error) {
    imageObj.error = error.message || '上传失败'
    imageObj.uploading = false
    
    emit('upload-error', { image: imageObj, error })
  }
  
  updateModelValue()
}

const handleTriggerClick = () => {
  if (canAddMore.value && fileInput.value) {
    fileInput.value.click()
  }
}

const handleRemove = (index) => {
  const removedImage = imageList.value.splice(index, 1)[0]
  
  // 清理URL对象
  if (removedImage.dataUrl) {
    URL.revokeObjectURL(removedImage.dataUrl)
  }
  if (removedImage.thumbnailUrl && removedImage.thumbnailUrl !== removedImage.dataUrl) {
    URL.revokeObjectURL(removedImage.thumbnailUrl)
  }
  
  emit('remove', removedImage)
  updateModelValue()
}

const handleDragOver = (event) => {
  event.preventDefault()
  isDragOver.value = true
}

const handleDragLeave = (event) => {
  event.preventDefault()
  isDragOver.value = false
}

const handleDrop = (event) => {
  event.preventDefault()
  isDragOver.value = false
  
  const files = Array.from(event.dataTransfer.files).filter(file => 
    file.type.startsWith('image/')
  )
  
  if (files.length > 0) {
    handleFiles(files)
  }
}

const handlePreview = (image, index) => {
  previewImage.value = image
  previewIndex.value = index
  previewVisible.value = true
}

const handlePrevPreview = () => {
  if (previewIndex.value > 0) {
    previewIndex.value--
    previewImage.value = imageList.value[previewIndex.value]
  }
}

const handleNextPreview = () => {
  if (previewIndex.value < imageList.value.length - 1) {
    previewIndex.value++
    previewImage.value = imageList.value[previewIndex.value]
  }
}

const handleImageLoad = (image) => {
  // 图片加载成功
}

const handleImageError = (image) => {
  image.error = '图片加载失败'
}

const updateModelValue = () => {
  emit('update:modelValue', [...imageList.value])
  emit('change', [...imageList.value])
}

// 暴露方法给父组件
defineExpose({
  uploadAll: () => {
    imageList.value.forEach(image => {
      if (!image.success && !image.uploading && !image.error) {
        uploadImage(image)
      }
    })
  },
  clearAll: () => {
    imageList.value.forEach(image => {
      if (image.dataUrl) {
        URL.revokeObjectURL(image.dataUrl)
      }
      if (image.thumbnailUrl && image.thumbnailUrl !== image.dataUrl) {
        URL.revokeObjectURL(image.thumbnailUrl)
      }
    })
    imageList.value = []
    updateModelValue()
  },
  // 新增：获取压缩统计信息
  getCompressionStats: () => {
    return imageList.value.reduce((stats, image) => {
      if (image.compressionInfo) {
        stats.totalOriginalSize += image.compressionInfo.originalSize
        stats.totalCompressedSize += image.compressionInfo.compressedSize
        stats.totalSavings += (image.compressionInfo.originalSize - image.compressionInfo.compressedSize)
      }
      return stats
    }, {
      totalOriginalSize: 0,
      totalCompressedSize: 0,
      totalSavings: 0,
      compressionRatio: 0
    })
  }
})
</script>

<style scoped>
.image-uploader {
  width: 100%;
}

.image-uploader--disabled {
  opacity: 0.6;
  pointer-events: none;
}

.image-uploader__upload-area {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.image-uploader__list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: var(--spacing-sm);
}

.image-uploader__item {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--border-radius-medium);
  overflow: hidden;
  background: var(--bg-gray);
}

.image-uploader__item--uploading {
  pointer-events: none;
}

.image-uploader__preview {
  position: relative;
  width: 100%;
  height: 100%;
  cursor: pointer;
  overflow: hidden;
}

.image-uploader__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;
}

.image-uploader__preview:hover .image-uploader__image {
  transform: scale(1.05);
}

.image-uploader__progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: var(--spacing-xs);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.image-uploader__progress-bar {
  flex: 1;
  height: 4px;
  background: var(--primary-color);
  border-radius: 2px;
}

.image-uploader__progress-text {
  font-size: var(--font-size-xs);
  white-space: nowrap;
}

.image-uploader__status {
  position: absolute;
  top: var(--spacing-xs);
  right: var(--spacing-xs);
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-uploader__status--success {
  background: var(--success-color);
  color: white;
}

.image-uploader__status--error {
  background: #f44336;
  color: white;
}

.image-uploader__status-icon {
  width: 12px;
  height: 12px;
  fill: currentColor;
}

.image-uploader__remove {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f44336;
  color: white;
  border: 2px solid white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.image-uploader__remove:hover {
  background: #d32f2f;
  transform: scale(1.1);
}

.image-uploader__remove-icon {
  width: 12px;
  height: 12px;
  fill: currentColor;
}

.image-uploader__trigger {
  border: 2px dashed var(--border-color);
  border-radius: var(--border-radius-medium);
  padding: var(--spacing-xl);
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--bg-white);
}

.image-uploader__trigger:hover {
  border-color: var(--primary-color);
  background: rgba(30, 136, 229, 0.02);
}

.image-uploader__trigger--dragover {
  border-color: var(--primary-color);
  background: rgba(30, 136, 229, 0.05);
}

.image-uploader__trigger-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
}

.image-uploader__trigger-icon {
  width: 48px;
  height: 48px;
  fill: var(--text-disabled);
}

.image-uploader__trigger-text {
  margin: 0;
  font-size: var(--font-size-md);
  color: var(--text-primary);
  font-weight: 500;
}

.image-uploader__trigger-desc {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.image-uploader__input {
  display: none;
}

.image-uploader__preview-modal {
  text-align: center;
}

.image-uploader__preview-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: var(--border-radius-medium);
}

.image-uploader__preview-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
}

.image-uploader__preview-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--bg-gray);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.image-uploader__preview-btn:hover:not(:disabled) {
  background: var(--primary-color);
  color: white;
}

.image-uploader__preview-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.image-uploader__preview-btn svg {
  width: 20px;
  height: 20px;
  fill: currentColor;
}

.image-uploader__preview-counter {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  min-width: 60px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .image-uploader__list {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: var(--spacing-xs);
  }
  
  .image-uploader__trigger {
    padding: var(--spacing-lg);
  }
  
  .image-uploader__trigger-icon {
    width: 40px;
    height: 40px;
  }
  
  .image-uploader__preview-image {
    max-height: 60vh;
  }
}

/* 无障碍访问 */
@media (prefers-reduced-motion: reduce) {
  .image-uploader__image,
  .image-uploader__remove,
  .image-uploader__trigger,
  .image-uploader__preview-btn {
    transition: none;
  }
  
  .image-uploader__preview:hover .image-uploader__image {
    transform: none;
  }
}
</style>
