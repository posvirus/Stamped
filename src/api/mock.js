/**
 * Mock API服务
 * 用于前端开发和测试，模拟后端API响应
 */

// 导入真实的AI验证API
import { verifyTaskCompletion } from './ai.js'

// Mock数据
const mockTasks = [
  {
    _id: '1',
    title: '每天跑步30分钟',
    description: '每天早晨6点到6点30分跑步30分钟，提高身体素质',
    agreement: '协议内容：\n1. 每天早晨6:00-6:30进行跑步锻炼\n2. 跑步距离不少于3公里\n3. 需要记录跑步轨迹和时间\n4. 连续完成30天\n5. 验证方式：提交跑步APP截图和自拍照',
    status: 'pending',
    createdAt: '2024-01-15T06:00:00.000Z',
  },
  {
    _id: '2', 
    title: '学习Vue 3新特性',
    description: '深入学习Vue 3的Composition API和新特性，提升前端开发技能',
    agreement: '协议内容：\n1. 每天学习Vue 3不少于2小时\n2. 完成官方文档阅读\n3. 实现至少3个练习项目\n4. 写学习笔记和总结\n5. 验证方式：提交项目代码和学习笔记',
    status: 'completed',
    createdAt: '2024-01-10T09:00:00.000Z',
    completedAt: '2024-01-20T18:30:00.000Z',
  }
]

// 模拟AI生成的协议模板
const agreementTemplates = [
  '协议内容：\n1. 明确具体的执行时间和频率\n2. 设定可量化的完成标准\n3. 建立有效的监督和验证机制\n4. 制定合理的奖惩措施\n5. 验证方式：提交相关证明材料（照片、截图、记录等）',
  '自律协议：\n1. 每日按时执行目标任务\n2. 保持持续性，不间断执行\n3. 记录执行过程和结果\n4. 定期进行自我评估\n5. 验证标准：通过文字描述和图片证明完成情况',
]

// 模拟AI验证结果
const mockVerificationResults = [
  { confidence: 85, reason: '根据提供的材料，任务完成情况良好，符合协议要求' },
  { confidence: 65, reason: '完成情况一般，部分要求未达到，建议继续努力' },
  { confidence: 45, reason: '完成情况不理想，与协议要求存在较大差距' },
  { confidence: 90, reason: '任务完成度很高，超出预期，表现优秀' },
]

/**
 * 模拟网络延迟
 */
const delay = (ms = 1000) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Mock API处理器
 */
export const mockApiHandlers = {
  // 创建任务
  async createTask(description) {
    await delay(2000) // 模拟AI生成协议的时间
    
    const agreement = agreementTemplates[Math.floor(Math.random() * agreementTemplates.length)]
      .replace('目标任务', description)
    
    const newTask = {
      _id: Date.now().toString(),
      title: description.substring(0, 20) + (description.length > 20 ? '...' : ''),
      description,
      agreement,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
    
    mockTasks.unshift(newTask)
    
    return {
      success: true,
      data: newTask,
      message: '任务创建成功'
    }
  },

  // 保存用户确认后的任务
  async saveConfirmedTask(description, agreement) {
    await delay(1000) // 模拟保存任务的时间
    
    const newTask = {
      _id: Date.now().toString(),
      title: description.substring(0, 20) + (description.length > 20 ? '...' : ''),
      description,
      agreement,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
    
    mockTasks.unshift(newTask)
    
    return {
      success: true,
      data: newTask,
      message: '任务保存成功'
    }
  },

  // 获取任务列表
  async getTasks(status = 'pending') {
    await delay(500)
    
    const filteredTasks = mockTasks.filter(task => task.status === status)
    
    return {
      success: true,
      data: filteredTasks,
      total: filteredTasks.length,
      message: '获取任务列表成功'
    }
  },

  // 获取任务详情
  async getTaskById(taskId) {
    await delay(300)
    
    const task = mockTasks.find(t => t._id === taskId)
    
    if (!task) {
      throw new Error('任务不存在')
    }
    
    return {
      success: true,
      data: task,
      message: '获取任务详情成功'
    }
  },

  // 验证任务
  async verifyTask(taskId, verificationData) {
    const task = mockTasks.find(t => t._id === taskId)
    if (!task) {
      throw new Error('任务不存在')
    }
    
    try {
      // 在Mock模式下也使用真实的AI验证API
      const aiResult = await verifyTaskCompletion({
        goal: task.description,
        agreement: task.agreement,
        description: verificationData.description,
        imageUrls: verificationData.imageUrls
      })
      
      const success = aiResult.success
      
      // 直接返回AI验证结果，不在这里更新任务状态
      // 任务状态将由调用方通过 updateTaskStatus 来更新
      return {
        success: true,
        data: {
          taskId,
          verified: success,
          confidence: aiResult.confidence,
          reason: aiResult.reason,
          task: success ? task : undefined,
        },
        message: success ? '任务验证成功！' : '任务验证未通过'
      }
    } catch (error) {
      console.error('AI验证失败，使用备用模拟结果:', error)
      
      // 如果AI验证失败，回退到模拟结果
      const result = mockVerificationResults[Math.floor(Math.random() * mockVerificationResults.length)]
      const success = result.confidence >= 80
      
      // 同样不在这里更新任务状态，由调用方处理
      return {
        success: true,
        data: {
          taskId,
          verified: success,
          confidence: result.confidence,
          reason: `备用验证结果: ${result.reason}`,
          task: success ? task : undefined,
        },
        message: success ? '任务验证成功（备用模式）！' : '任务验证未通过（备用模式）'
      }
    }
  },

  // 生成协议
  async generateAgreement(description) {
    await delay(2000)
    
    const agreement = agreementTemplates[Math.floor(Math.random() * agreementTemplates.length)]
      .replace('目标任务', description)
    
    return {
      success: true,
      data: {
        agreement,
        goal: description,
      },
      message: '协议生成成功'
    }
  },

  // 删除任务
  async deleteTask(taskId) {
    await delay(500)
    
    const taskIndex = mockTasks.findIndex(t => t._id === taskId)
    
    if (taskIndex === -1) {
      throw new Error('任务不存在')
    }
    
    const deletedTask = mockTasks.splice(taskIndex, 1)[0]
    
    return {
      success: true,
      data: {
        deletedTask,
      },
      message: '任务删除成功'
    }
  },

  // 更新任务状态
  async updateTaskStatus(taskId, status) {
    await delay(300)
    
    const task = mockTasks.find(t => t._id === taskId)
    
    if (!task) {
      throw new Error('任务不存在')
    }
    
    const validStatuses = ['pending', 'completed']
    if (!validStatuses.includes(status)) {
      throw new Error(`无效的状态: ${status}`)
    }
    
    // 更新任务状态
    task.status = status
    if (status === 'completed') {
      task.completedAt = new Date().toISOString()
    } else if (status === 'pending') {
      // 如果从完成状态改回待处理，移除完成时间
      delete task.completedAt
    }
    
    return {
      success: true,
      data: task,
      message: `任务状态已更新为: ${status === 'completed' ? '已完成' : '待处理'}`
    }
  },


}

/**
 * 启用Mock模式
 */
export const enableMockMode = () => {
  // 检查是否启用了Mock模式
  const mockEnabled = import.meta.env.VITE_MOCK_API === 'true'
  
  if (mockEnabled) {
    console.log('🎭 Mock API模式已启用')
    return true
  } else {
    console.log('🌐 真实API模式已启用，连接到:', import.meta.env.VITE_API_BASE_URL || 'https://hadeiqoanbmd.sealoshzh.site')
    return false
  }
}

/**
 * Mock拦截器
 */
export const mockInterceptor = (config) => {
  if (!enableMockMode()) {
    return config
  }

  const { method, url, data } = config
  
  // 根据URL和方法确定Mock处理器
  if (url.includes('/api/task/save') && method === 'post') {
    return mockApiHandlers.saveConfirmedTask(data.description, data.agreement)
  }
  
  if (url.includes('/api/task') && method === 'post' && !url.includes('verify') && !url.includes('save')) {
    return mockApiHandlers.createTask(data.description)
  }
  
  if (url.includes('/api/tasks') && method === 'get') {
    const status = config.params?.status || 'pending'
    return mockApiHandlers.getTasks(status)
  }
  
  if (url.includes('/api/task/') && url.includes('/verify') && method === 'post') {
    const taskId = url.split('/api/task/')[1].split('/verify')[0]
    return mockApiHandlers.verifyTask(taskId, data)
  }
  
  if (url.includes('/api/task/') && method === 'get') {
    const taskId = url.split('/api/task/')[1]
    return mockApiHandlers.getTaskById(taskId)
  }
  
  if (url.includes('/api/task/') && method === 'delete') {
    const taskId = url.split('/api/task/')[1]
    return mockApiHandlers.deleteTask(taskId)
  }
  
  if (url.includes('/api/task/') && method === 'patch') {
    const taskId = url.split('/api/task/')[1]
    return mockApiHandlers.updateTaskStatus(taskId, data.status)
  }

  
  // 如果没有匹配的Mock处理器，返回原始配置
  return config
}
