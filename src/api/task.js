/**
 * 任务相关API接口
 * 基于后端API文档: https://hadeiqoanbmd.sealoshzh.site
 */

import http, { requestWithRetry } from './http.js'

/**
 * 创建新任务
 * 注意: 此接口不在后端API文档中，可能是旧版本接口或用于其他功能
 * @param {string} description - 目标描述
 * @returns {Promise<Object>} 包含协议内容的任务数据
 * @deprecated 建议使用saveConfirmedTask接口
 */
export const createTask = async (description) => {
  if (!description || typeof description !== 'string') {
    throw new Error('目标描述不能为空')
  }

  return requestWithRetry({
    method: 'POST',
    url: '/api/task',
    data: {
      description: description.trim(),
    },
  })
}

/**
 * 保存用户确认后的任务
 * API文档: POST /api/task/save
 * @param {string} description - 任务目标描述，最大长度1000字符
 * @param {string} agreement - 协议内容，最大长度2000字符
 * @returns {Promise<Object>} 保存结果，包含任务数据对象
 */
export const saveConfirmedTask = async (description, agreement) => {
  if (!description || typeof description !== 'string') {
    throw new Error('目标描述不能为空')
  }
  
  if (!agreement || typeof agreement !== 'string') {
    throw new Error('协议内容不能为空')
  }

  return requestWithRetry({
    method: 'POST',
    url: '/api/task/save',
    data: {
      description: description.trim(),
      agreement: agreement.trim(),
    },
  })
}

/**
 * 获取任务列表
 * API文档: GET /api/tasks
 * @param {string} status - 任务状态筛选，可选值: pending/completed，默认为pending
 * @returns {Promise<Object>} 包含任务列表数组、总数和消息的对象
 */
export const getTasks = async (status = 'pending') => {
  const validStatuses = ['pending', 'completed']
  
  if (!validStatuses.includes(status)) {
    throw new Error(`无效的状态参数: ${status}，必须是 ${validStatuses.join(' 或 ')}`)
  }

  return requestWithRetry({
    method: 'GET',
    url: '/api/tasks',
    params: {
      status,
    },
  })
}

/**
 * 获取单个任务详情
 * API文档: GET /api/task/:taskId
 * @param {string} taskId - 任务ID，必须为有效的MongoDB ObjectId格式(24位十六进制字符串)
 * @returns {Promise<Object>} 任务详情对象
 */
export const getTaskById = async (taskId) => {
  if (!taskId) {
    throw new Error('任务ID不能为空')
  }

  return requestWithRetry({
    method: 'GET',
    url: `/api/task/${taskId}`,
  })
}

/**
 * 验证任务完成情况
 * 注意: 此接口不在后端API文档中，可能是用于AI验证功能
 * @param {string} taskId - 任务ID
 * @param {Object} verificationData - 验证数据
 * @param {string} verificationData.description - 完成情况描述
 * @param {Array<File>} verificationData.images - 验证图片数组（可选）
 * @returns {Promise<Object>} 验证结果
 * @deprecated 建议根据实际需求确定是否保留
 */
export const verifyTask = async (taskId, verificationData) => {
  if (!taskId) {
    throw new Error('任务ID不能为空')
  }

  if (!verificationData?.description) {
    throw new Error('完成情况描述不能为空')
  }

  // 创建FormData以支持文件上传
  const formData = new FormData()
  formData.append('description', verificationData.description.trim())

  // 添加图片文件
  if (verificationData.images && Array.isArray(verificationData.images)) {
    verificationData.images.forEach((image, index) => {
      if (image instanceof File) {
        formData.append(`images`, image)
      }
    })
  }

  return requestWithRetry({
    method: 'POST',
    url: `/api/task/${taskId}/verify`,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

/**
 * 删除任务
 * API文档: DELETE /api/task/:taskId
 * @param {string} taskId - 任务ID，必须为有效的MongoDB ObjectId格式
 * @returns {Promise<Object>} 删除结果，包含被删除的任务信息
 */
export const deleteTask = async (taskId) => {
  if (!taskId) {
    throw new Error('任务ID不能为空')
  }

  return requestWithRetry({
    method: 'DELETE',
    url: `/api/task/${taskId}`,
  })
}

/**
 * 更新任务状态
 * API文档: PATCH /api/task/:taskId
 * @param {string} taskId - 任务ID，必须为有效的MongoDB ObjectId格式
 * @param {string} status - 新的任务状态，可选值: pending/completed
 * @returns {Promise<Object>} 更新后的任务信息
 */
export const updateTaskStatus = async (taskId, status) => {
  if (!taskId) {
    throw new Error('任务ID不能为空')
  }

  const validStatuses = ['pending', 'completed']
  if (!validStatuses.includes(status)) {
    throw new Error(`无效的状态: ${status}`)
  }

  return requestWithRetry({
    method: 'PATCH',
    url: `/api/task/${taskId}`,
    data: {
      status,
    },
  })
}
