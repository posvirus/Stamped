import { ref, onMounted, onUnmounted, nextTick } from 'vue'

/**
 * 图片优化 Composable
 * 提供懒加载、WebP支持、压缩、缓存等功能
 */
export function useImageOptimization(options = {}) {
  const {
    quality = 0.8,          // 压缩质量
    maxWidth = 1920,        // 最大宽度
    maxHeight = 1080,       // 最大高度
    enableWebP = true,      // 启用WebP格式
    enableLazyLoad = true,  // 启用懒加载
    loadingThreshold = 100, // 懒加载触发距离
    enableCache = true,     // 启用缓存
    cacheMaxAge = 24 * 60 * 60 * 1000, // 缓存有效期（24小时）
    enableProgressiveLoad = true, // 启用渐进式加载
    placeholder = null      // 占位图
  } = options

  // 缓存管理
  const imageCache = new Map()
  const observer = ref(null)

  // WebP支持检测
  const webpSupported = ref(false)

  // 检测WebP支持
  const checkWebPSupport = () => {
    return new Promise((resolve) => {
      const webP = new Image()
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2)
      }
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
    })
  }

  // 初始化WebP支持检测
  onMounted(async () => {
    webpSupported.value = await checkWebPSupport()
  })

  // 生成缓存键
  const getCacheKey = (src, width, height, format) => {
    return `${src}_${width}_${height}_${format}_${quality}`
  }

  // 检查缓存是否有效
  const isCacheValid = (cacheItem) => {
    return cacheItem && (Date.now() - cacheItem.timestamp) < cacheMaxAge
  }

  // 从缓存获取图片
  const getFromCache = (key) => {
    if (!enableCache) return null
    
    const cacheItem = imageCache.get(key)
    if (isCacheValid(cacheItem)) {
      return cacheItem.data
    } else if (cacheItem) {
      // 清理过期缓存
      imageCache.delete(key)
      if (cacheItem.data.startsWith('blob:')) {
        URL.revokeObjectURL(cacheItem.data)
      }
    }
    return null
  }

  // 保存到缓存
  const saveToCache = (key, data) => {
    if (!enableCache) return
    
    imageCache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  // 压缩图片
  const compressImage = (file, targetWidth, targetHeight) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        try {
          // 计算目标尺寸
          let { width, height } = img
          
          if (targetWidth || targetHeight) {
            if (targetWidth && targetHeight) {
              width = targetWidth
              height = targetHeight
            } else if (targetWidth) {
              height = (height * targetWidth) / width
              width = targetWidth
            } else if (targetHeight) {
              width = (width * targetHeight) / height
              height = targetHeight
            }
          } else {
            // 使用默认最大尺寸
            if (width > maxWidth || height > maxHeight) {
              const ratio = Math.min(maxWidth / width, maxHeight / height)
              width *= ratio
              height *= ratio
            }
          }
          
          canvas.width = width
          canvas.height = height
          
          // 设置高质量缩放
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          
          // 绘制图片
          ctx.drawImage(img, 0, 0, width, height)
          
          // 选择输出格式
          let outputFormat = file.type
          if (enableWebP && webpSupported.value && !file.type.includes('gif')) {
            outputFormat = 'image/webp'
          }
          
          // 转换为Blob
          canvas.toBlob((blob) => {
            if (blob) {
              resolve({
                blob,
                width,
                height,
                format: outputFormat,
                originalSize: file.size,
                compressedSize: blob.size,
                compressionRatio: Math.round((1 - blob.size / file.size) * 100)
              })
            } else {
              reject(new Error('图片压缩失败'))
            }
          }, outputFormat, quality)
        } catch (error) {
          reject(error)
        }
      }
      
      img.onerror = () => {
        reject(new Error('图片加载失败'))
      }
      
      if (file instanceof File || file instanceof Blob) {
        img.src = URL.createObjectURL(file)
      } else {
        img.src = file
      }
    })
  }

  // 生成响应式图片URL
  const generateResponsiveUrl = (src, width, height) => {
    if (!src) return ''
    
    // 如果是本地文件路径，直接返回
    if (src.startsWith('blob:') || src.startsWith('data:')) {
      return src
    }
    
    // 如果支持URL参数的图片服务，可以在这里添加参数
    // 例如：return `${src}?w=${width}&h=${height}&q=${quality}&f=${format}`
    
    return src
  }

  // 懒加载观察器
  const createLazyLoadObserver = () => {
    if (!enableLazyLoad || !window.IntersectionObserver) return null
    
    return new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target
          const src = img.dataset.src
          const srcset = img.dataset.srcset
          
          if (src) {
            loadImage(img, src).then(() => {
              img.classList.add('loaded')
              img.classList.remove('loading')
            }).catch(() => {
              img.classList.add('error')
              img.classList.remove('loading')
            })
          }
          
          if (srcset) {
            img.srcset = srcset
          }
          
          observer.value.unobserve(img)
        }
      })
    }, {
      threshold: 0.1,
      rootMargin: `${loadingThreshold}px`
    })
  }

  // 加载图片
  const loadImage = (imgElement, src) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      
      img.onload = () => {
        imgElement.src = src
        resolve(img)
      }
      
      img.onerror = reject
      img.src = src
    })
  }

  // 渐进式加载
  const loadProgressively = (imgElement, src, placeholderSrc) => {
    if (!enableProgressiveLoad) {
      return loadImage(imgElement, src)
    }
    
    return new Promise((resolve, reject) => {
      // 首先加载占位图或模糊版本
      if (placeholderSrc) {
        const placeholder = new Image()
        placeholder.onload = () => {
          imgElement.src = placeholderSrc
          imgElement.classList.add('placeholder')
          
          // 然后加载高质量版本
          const highRes = new Image()
          highRes.onload = () => {
            imgElement.src = src
            imgElement.classList.remove('placeholder')
            imgElement.classList.add('loaded')
            resolve(highRes)
          }
          highRes.onerror = reject
          highRes.src = src
        }
        placeholder.src = placeholderSrc
      } else {
        // 直接加载原图
        loadImage(imgElement, src).then(resolve).catch(reject)
      }
    })
  }

  // 创建响应式图片集
  const createSrcSet = (src, sizes = [400, 800, 1200, 1600]) => {
    if (!src) return ''
    
    return sizes.map(size => {
      const url = generateResponsiveUrl(src, size)
      return `${url} ${size}w`
    }).join(', ')
  }

  // 清理缓存
  const clearCache = () => {
    imageCache.forEach((item) => {
      if (item.data.startsWith('blob:')) {
        URL.revokeObjectURL(item.data)
      }
    })
    imageCache.clear()
  }

  // 预加载图片
  const preloadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }

  // 批量预加载
  const preloadImages = (srcs) => {
    return Promise.all(srcs.map(src => preloadImage(src)))
  }

  // 获取图片信息
  const getImageInfo = (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
          aspectRatio: img.naturalWidth / img.naturalHeight,
          size: file.size,
          type: file.type
        })
      }
      
      img.onerror = reject
      
      if (file instanceof File || file instanceof Blob) {
        img.src = URL.createObjectURL(file)
      } else {
        img.src = file
      }
    })
  }

  // 生成缩略图
  const generateThumbnail = (file, size = 200) => {
    return compressImage(file, size, size)
  }

  // 初始化懒加载观察器
  onMounted(() => {
    if (enableLazyLoad) {
      observer.value = createLazyLoadObserver()
    }
  })

  // 清理资源
  onUnmounted(() => {
    if (observer.value) {
      observer.value.disconnect()
    }
    clearCache()
  })

  return {
    // 状态
    webpSupported,
    
    // 方法
    compressImage,
    generateResponsiveUrl,
    createSrcSet,
    loadImage,
    loadProgressively,
    preloadImage,
    preloadImages,
    getImageInfo,
    generateThumbnail,
    clearCache,
    
    // 懒加载
    observeImage: (element) => {
      if (observer.value && element) {
        observer.value.observe(element)
      }
    },
    unobserveImage: (element) => {
      if (observer.value && element) {
        observer.value.unobserve(element)
      }
    },
    
    // 缓存
    getFromCache,
    saveToCache,
    
    // 配置
    quality,
    maxWidth,
    maxHeight,
    enableWebP,
    enableLazyLoad
  }
}

/**
 * 懒加载图片Hook
 */
export function useLazyImage(src, options = {}) {
  const {
    placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0yMCAyOEwyMCAyNEwyNCAyOEgyMFoiIGZpbGw9IiNDQ0NDQ0MiLz4KPC9zdmc+',
    loadingClass = 'loading',
    loadedClass = 'loaded',
    errorClass = 'error'
  } = options

  const imageRef = ref(null)
  const isLoading = ref(true)
  const isLoaded = ref(false)
  const hasError = ref(false)
  const currentSrc = ref(placeholder)
  
  const imageOptimization = useImageOptimization()

  const loadImage = async () => {
    if (!src) return
    
    try {
      isLoading.value = true
      hasError.value = false
      
      await imageOptimization.preloadImage(src)
      
      currentSrc.value = src
      isLoaded.value = true
      isLoading.value = false
    } catch (error) {
      hasError.value = true
      isLoading.value = false
      console.error('图片加载失败:', error)
    }
  }

  const observeElement = () => {
    if (imageRef.value) {
      imageRef.value.dataset.src = src
      imageOptimization.observeImage(imageRef.value)
    }
  }

  return {
    imageRef,
    currentSrc,
    isLoading,
    isLoaded,
    hasError,
    loadImage,
    observeElement
  }
}
