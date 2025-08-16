/**
 * Loading状态管理
 * 全局loading状态的管理和控制
 */

import { ref, computed } from 'vue'

// 全局loading状态
const loadingStates = ref(new Map())

/**
 * 添加loading状态
 * @param {string} key - loading状态的唯一标识
 * @param {string} message - loading消息
 */
export const addLoading = (key, message = '加载中...') => {
  loadingStates.value.set(key, {
    message,
    startTime: Date.now(),
  })
}

/**
 * 移除loading状态
 * @param {string} key - loading状态的唯一标识
 */
export const removeLoading = (key) => {
  loadingStates.value.delete(key)
}

/**
 * 检查是否存在指定的loading状态
 * @param {string} key - loading状态的唯一标识
 * @returns {boolean} 是否存在
 */
export const hasLoading = (key) => {
  return loadingStates.value.has(key)
}

/**
 * 获取指定loading状态的信息
 * @param {string} key - loading状态的唯一标识
 * @returns {Object|null} loading状态信息
 */
export const getLoading = (key) => {
  return loadingStates.value.get(key) || null
}

/**
 * 清除所有loading状态
 */
export const clearAllLoading = () => {
  loadingStates.value.clear()
}

/**
 * 全局loading状态（是否有任何loading）
 */
export const isGlobalLoading = computed(() => {
  return loadingStates.value.size > 0
})

/**
 * 获取当前活跃的loading消息
 */
export const currentLoadingMessage = computed(() => {
  const states = Array.from(loadingStates.value.values())
  if (states.length === 0) return ''
  
  // 返回最新添加的loading消息
  return states[states.length - 1].message
})

/**
 * 获取所有loading状态的数组
 */
export const allLoadingStates = computed(() => {
  return Array.from(loadingStates.value.entries()).map(([key, state]) => ({
    key,
    ...state,
  }))
})

/**
 * Loading装饰器 - 用于自动管理API调用的loading状态
 * @param {string} key - loading状态的唯一标识
 * @param {string} message - loading消息
 * @returns {Function} 装饰器函数
 */
export const withLoading = (key, message = '处理中...') => {
  return (target, propertyKey, descriptor) => {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args) {
      addLoading(key, message)
      
      try {
        const result = await originalMethod.apply(this, args)
        return result
      } finally {
        removeLoading(key)
      }
    }

    return descriptor
  }
}

/**
 * 包装异步函数，自动管理loading状态
 * @param {Function} asyncFn - 异步函数
 * @param {string} key - loading状态的唯一标识
 * @param {string} message - loading消息
 * @returns {Function} 包装后的函数
 */
export const wrapWithLoading = (asyncFn, key, message = '处理中...') => {
  return async (...args) => {
    addLoading(key, message)
    
    try {
      const result = await asyncFn(...args)
      return result
    } finally {
      removeLoading(key)
    }
  }
}

/**
 * 创建带loading状态的API调用函数
 * @param {Function} apiFn - API函数
 * @param {string} key - loading状态的唯一标识
 * @param {string} message - loading消息
 * @returns {Function} 带loading状态的API函数
 */
export const createLoadingApi = (apiFn, key, message) => {
  return wrapWithLoading(apiFn, key, message)
}

// 预定义的loading keys
export const LOADING_KEYS = {
  // 任务相关
  CREATE_TASK: 'create_task',
  LOAD_TASKS: 'load_tasks',
  LOAD_TASK_DETAIL: 'load_task_detail',
  VERIFY_TASK: 'verify_task',
  DELETE_TASK: 'delete_task',
  
  // AI相关
  GENERATE_AGREEMENT: 'generate_agreement',
  AI_VERIFY: 'ai_verify',
  
  // 文件上传
  UPLOAD_FILE: 'upload_file',
  UPLOAD_FILES: 'upload_files',
  
  // 页面加载
  PAGE_LOADING: 'page_loading',
  INIT_APP: 'init_app',
}

// 预定义的loading消息
export const LOADING_MESSAGES = {
  [LOADING_KEYS.CREATE_TASK]: '正在创建任务...',
  [LOADING_KEYS.LOAD_TASKS]: '正在加载任务列表...',
  [LOADING_KEYS.LOAD_TASK_DETAIL]: '正在加载任务详情...',
  [LOADING_KEYS.VERIFY_TASK]: '正在验证任务...',
  [LOADING_KEYS.DELETE_TASK]: '正在删除任务...',
  [LOADING_KEYS.GENERATE_AGREEMENT]: '正在生成协议...',
  [LOADING_KEYS.AI_VERIFY]: 'AI正在验证任务完成情况...',
  [LOADING_KEYS.UPLOAD_FILE]: '正在上传文件...',
  [LOADING_KEYS.UPLOAD_FILES]: '正在上传文件...',
  [LOADING_KEYS.PAGE_LOADING]: '正在加载页面...',
  [LOADING_KEYS.INIT_APP]: '正在初始化应用...',
}

/**
 * 使用预定义的loading状态
 * @param {string} key - 预定义的loading key
 */
export const usePresetLoading = (key) => {
  const message = LOADING_MESSAGES[key] || '处理中...'
  
  return {
    start: () => addLoading(key, message),
    stop: () => removeLoading(key),
    isLoading: computed(() => hasLoading(key)),
    wrap: (asyncFn) => wrapWithLoading(asyncFn, key, message),
  }
}
