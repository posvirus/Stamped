/**
 * 系统相关API接口
 */

import http, { requestWithRetry } from './http.js'

/**
 * 健康检查接口
 * @returns {Promise<Object>} 健康检查结果
 */
export const healthCheck = async () => {
  return requestWithRetry({
    method: 'GET',
    url: '/health',
  })
}

/**
 * 获取API信息接口
 * @returns {Promise<Object>} API信息和端点列表
 */
export const getApiInfo = async () => {
  return requestWithRetry({
    method: 'GET',
    url: '/',
  })
}
