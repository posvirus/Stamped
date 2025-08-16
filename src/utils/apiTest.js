/**
 * API接口测试工具
 * 用于验证所有API接口的对接情况
 */

import { 
  healthCheck, 
  getApiInfo,
  saveConfirmedTask,
  getTasks,
  getTaskById,
  deleteTask,
  updateTaskStatus
} from '../api/index.js'

/**
 * 测试健康检查接口
 */
export const testHealthCheck = async () => {
  try {
    console.log('🩺 测试健康检查接口...')
    const result = await healthCheck()
    console.log('✅ 健康检查成功:', result)
    return { success: true, data: result }
  } catch (error) {
    console.error('❌ 健康检查失败:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * 测试获取API信息接口
 */
export const testGetApiInfo = async () => {
  try {
    console.log('📋 测试获取API信息接口...')
    const result = await getApiInfo()
    console.log('✅ 获取API信息成功:', result)
    return { success: true, data: result }
  } catch (error) {
    console.error('❌ 获取API信息失败:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * 测试保存任务接口
 */
export const testSaveTask = async () => {
  try {
    console.log('💾 测试保存任务接口...')
    const testTask = {
      description: '测试任务：完成API接口对接',
      agreement: '我同意完成此测试任务，确保所有API接口正常工作'
    }
    
    const result = await saveConfirmedTask(testTask.description, testTask.agreement)
    console.log('✅ 保存任务成功:', result)
    return { success: true, data: result }
  } catch (error) {
    console.error('❌ 保存任务失败:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * 测试获取任务列表接口
 */
export const testGetTasks = async () => {
  try {
    console.log('📄 测试获取任务列表接口...')
    
    // 测试获取pending状态任务
    const pendingTasks = await getTasks('pending')
    console.log('✅ 获取待完成任务成功:', pendingTasks)
    
    // 测试获取completed状态任务
    const completedTasks = await getTasks('completed')
    console.log('✅ 获取已完成任务成功:', completedTasks)
    
    return { 
      success: true, 
      data: { 
        pending: pendingTasks, 
        completed: completedTasks 
      } 
    }
  } catch (error) {
    console.error('❌ 获取任务列表失败:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * 测试获取任务详情接口
 */
export const testGetTaskById = async (taskId) => {
  try {
    console.log(`🔍 测试获取任务详情接口，任务ID: ${taskId}`)
    const result = await getTaskById(taskId)
    console.log('✅ 获取任务详情成功:', result)
    return { success: true, data: result }
  } catch (error) {
    console.error('❌ 获取任务详情失败:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * 测试更新任务状态接口
 */
export const testUpdateTaskStatus = async (taskId, status) => {
  try {
    console.log(`🔄 测试更新任务状态接口，任务ID: ${taskId}，新状态: ${status}`)
    const result = await updateTaskStatus(taskId, status)
    console.log('✅ 更新任务状态成功:', result)
    return { success: true, data: result }
  } catch (error) {
    console.error('❌ 更新任务状态失败:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * 测试删除任务接口
 */
export const testDeleteTask = async (taskId) => {
  try {
    console.log(`🗑️ 测试删除任务接口，任务ID: ${taskId}`)
    const result = await deleteTask(taskId)
    console.log('✅ 删除任务成功:', result)
    return { success: true, data: result }
  } catch (error) {
    console.error('❌ 删除任务失败:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * 完整的API测试流程
 */
export const runFullApiTest = async () => {
  console.log('🚀 开始完整的API接口测试...')
  
  const results = {
    healthCheck: await testHealthCheck(),
    apiInfo: await testGetApiInfo(),
    saveTask: await testSaveTask(),
    getTasks: await testGetTasks(),
  }
  
  // 如果保存任务成功，继续测试其他接口
  if (results.saveTask.success && results.saveTask.data?.data?._id) {
    const taskId = results.saveTask.data.data._id
    
    results.getTaskById = await testGetTaskById(taskId)
    results.updateTaskStatus = await testUpdateTaskStatus(taskId, 'completed')
    
    // 可选：取消删除测试以保留测试数据
    // results.deleteTask = await testDeleteTask(taskId)
  }
  
  console.log('📊 API测试结果汇总:')
  Object.entries(results).forEach(([testName, result]) => {
    const status = result.success ? '✅' : '❌'
    console.log(`${status} ${testName}: ${result.success ? '成功' : result.error}`)
  })
  
  return results
}

/**
 * 在浏览器控制台中使用的便捷方法
 */
export const exposeApiTestToWindow = () => {
  if (typeof window !== 'undefined') {
    window.apiTest = {
      healthCheck: testHealthCheck,
      getApiInfo: testGetApiInfo,
      saveTask: testSaveTask,
      getTasks: testGetTasks,
      getTaskById: testGetTaskById,
      updateTaskStatus: testUpdateTaskStatus,
      deleteTask: testDeleteTask,
      runFullTest: runFullApiTest,
    }
    
    console.log('🔧 API测试方法已添加到 window.apiTest')
    console.log('使用方法: window.apiTest.runFullTest() 进行完整测试')
  }
}
