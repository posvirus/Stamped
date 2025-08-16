/**
 * HTTP客户端配置
 * 基于Axios封装的HTTP请求客户端
 */

import axios from 'axios'
import { mockInterceptor, enableMockMode } from './mock.js'

// Mock适配器
const mockAdapter = (config) => {
  return new Promise((resolve) => {
    // 直接返回Mock响应
    resolve(config._mockResponse)
  })
}

// 创建Axios实例
const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://hadeiqoanbmd.sealoshzh.site',
  timeout: 10000, // 10秒超时
  headers: {
    'Content-Type': 'application/json',
  }
})

// 使用请求拦截器来处理Mock逻辑，而不是自定义适配器
// 这样可以避免axios 1.x版本的适配器兼容性问题

// 请求拦截器
http.interceptors.request.use(
  async (config) => {
    // 检查是否启用Mock模式
    if (enableMockMode()) {
      const mockResult = await mockInterceptor(config)
      if (mockResult !== config) {
        // 如果返回的不是config，说明被Mock拦截了
        // 直接抛出一个特殊的错误，在响应拦截器中捕获并返回Mock数据
        const mockError = new Error('MOCK_RESPONSE')
        mockError.mockData = mockResult
        mockError.originalConfig = config
        throw mockError
      }
    }

    // 添加请求时间戳，用于防止缓存
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      }
    }

    // 打印请求信息（开发环境）
    if (import.meta.env.DEV) {
      console.log('🚀 API请求:', {
        url: config.url,
        method: config.method,
        data: config.data,
        params: config.params,
      })
    }

    return config
  },
  (error) => {
    console.error('❌ 请求配置错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
http.interceptors.response.use(
  async (response) => {
    // 打印响应信息（开发环境）
    if (import.meta.env.DEV) {
      console.log('✅ API响应:', {
        url: response.config.url,
        status: response.status,
        data: response.data,
      })
    }

    // 统一处理响应数据格式
    if (response.data && typeof response.data === 'object') {
      return response.data
    }

    return response
  },
  (error) => {
    // 处理Mock响应
    if (error.message === 'MOCK_RESPONSE') {
      if (import.meta.env.DEV) {
        console.log('🎭 Mock响应:', {
          url: error.originalConfig.url,
          data: error.mockData,
        })
      }
      return Promise.resolve(error.mockData)
    }
    // 统一错误处理
    const { response, message } = error

    let errorMessage = '网络请求失败'
    let errorCode = 'NETWORK_ERROR'

    if (response) {
      // 服务器响应错误
      const { status, data } = response
      
      switch (status) {
        case 400:
          errorMessage = data?.message || '请求参数错误'
          errorCode = 'BAD_REQUEST'
          break
        case 401:
          errorMessage = '身份验证失败'
          errorCode = 'UNAUTHORIZED'
          break
        case 403:
          errorMessage = '权限不足'
          errorCode = 'FORBIDDEN'
          break
        case 404:
          errorMessage = data?.message || '接口不存在'
          errorCode = 'NOT_FOUND'
          break
        case 422:
          errorMessage = data?.message || '数据验证失败'
          errorCode = 'VALIDATION_ERROR'
          break
        case 500:
          errorMessage = '服务器内部错误'
          errorCode = 'SERVER_ERROR'
          break
        case 502:
          errorMessage = '网关错误'
          errorCode = 'BAD_GATEWAY'
          break
        case 503:
          errorMessage = '服务不可用'
          errorCode = 'SERVICE_UNAVAILABLE'
          break
        default:
          errorMessage = data?.message || `请求失败 (${status})`
          errorCode = 'UNKNOWN_ERROR'
      }
    } else if (message.includes('timeout')) {
      // 超时错误
      errorMessage = '请求超时，请检查网络连接'
      errorCode = 'TIMEOUT'
    } else if (message.includes('Network Error')) {
      // 网络错误
      errorMessage = '网络连接失败，请检查网络设置'
      errorCode = 'NETWORK_ERROR'
    }

    // 打印错误信息
    console.error('❌ API错误:', {
      url: error.config?.url,
      method: error.config?.method,
      errorCode,
      errorMessage,
      originalError: error,
    })

    // 返回格式化的错误信息
    const formattedError = new Error(errorMessage)
    formattedError.code = errorCode
    formattedError.originalError = error
    
    return Promise.reject(formattedError)
  }
)

// 重试配置
const MAX_RETRY_COUNT = 3
const RETRY_DELAY = 1000

/**
 * 带重试机制的请求函数
 * @param {Object} config - Axios请求配置
 * @param {number} retryCount - 当前重试次数
 * @returns {Promise} 请求Promise
 */
const requestWithRetry = async (config, retryCount = 0) => {
  try {
    return await http(config)
  } catch (error) {
    // 只对网络错误和5xx错误进行重试
    const shouldRetry = 
      (error.code === 'NETWORK_ERROR' || 
       error.code === 'TIMEOUT' || 
       error.code === 'SERVER_ERROR' || 
       error.code === 'BAD_GATEWAY' || 
       error.code === 'SERVICE_UNAVAILABLE') &&
      retryCount < MAX_RETRY_COUNT

    if (shouldRetry) {
      console.log(`🔄 正在重试请求 (${retryCount + 1}/${MAX_RETRY_COUNT}):`, config.url)
      
      // 延迟后重试
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)))
      
      return requestWithRetry(config, retryCount + 1)
    }

    throw error
  }
}

// 导出HTTP客户端和重试请求函数
export { http as default, requestWithRetry }
