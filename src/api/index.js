/**
 * API模块统一导出
 */

// HTTP客户端
export { default as http, requestWithRetry } from './http.js'

// 任务相关API
export {
  createTask,
  saveConfirmedTask,
  getTasks,
  getTaskById,
  verifyTask,
  deleteTask,
  updateTaskStatus,
} from './task.js'

// AI相关API
export {
  generateAgreement,
  verifyTaskCompletion,
} from './ai.js'

// 系统相关API
export {
  healthCheck,
  getApiInfo,
} from './system.js'



// Loading状态管理
export {
  addLoading,
  removeLoading,
  hasLoading,
  getLoading,
  clearAllLoading,
  isGlobalLoading,
  currentLoadingMessage,
  allLoadingStates,
  withLoading,
  wrapWithLoading,
  createLoadingApi,
  usePresetLoading,
  LOADING_KEYS,
  LOADING_MESSAGES,
} from './loading.js'
