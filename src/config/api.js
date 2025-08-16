/**
 * API配置管理
 * 用于控制API模式和相关配置
 */

/**
 * API模式配置
 */
export const API_CONFIG = {
  // 真实API配置
  REAL_API: {
    baseURL: 'https://hadeiqoanbmd.sealoshzh.site',
    timeout: 10000,
    description: '连接到真实后端API服务器'
  },
  
  // Mock API配置  
  MOCK_API: {
    baseURL: 'mock://localhost',
    timeout: 5000,
    description: '使用Mock数据进行本地开发'
  }
}

/**
 * 获取当前API模式
 */
export const getCurrentApiMode = () => {
  const isMockEnabled = import.meta.env.VITE_MOCK_API === 'true'
  return isMockEnabled ? 'MOCK' : 'REAL'
}

/**
 * 获取当前API配置
 */
export const getCurrentApiConfig = () => {
  const mode = getCurrentApiMode()
  return mode === 'MOCK' ? API_CONFIG.MOCK_API : API_CONFIG.REAL_API
}

/**
 * 打印当前API配置信息
 */
export const printApiInfo = () => {
  const mode = getCurrentApiMode()
  const config = getCurrentApiConfig()
  
  console.log(`%c🔧 API配置信息`, 'color: #4F46E5; font-weight: bold; font-size: 14px;')
  console.log(`模式: ${mode === 'MOCK' ? '🎭 Mock模式' : '🌐 真实API模式'}`)
  console.log(`地址: ${config.baseURL}`)
  console.log(`描述: ${config.description}`)
  
  if (mode === 'MOCK') {
    console.log(`%c💡 要切换到真实API，请重启应用`, 'color: #059669; font-weight: bold;')
  } else {
    console.log(`%c💡 要切换到Mock模式，请设置 VITE_MOCK_API=true 并重启应用`, 'color: #059669; font-weight: bold;')
  }
}
