/**
 * AI相关API接口
 * 基于豆包API实现协议生成和任务验证功能
 */

import axios from 'axios'
import { requestWithRetry } from './http.js'

// AI API配置
const AI_API_CONFIG = {
  baseURL: import.meta.env.VITE_AI_API_URL || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
  apiKey: import.meta.env.VITE_AI_API_KEY,
  model: 'doubao-seed-1-6-250615',
  visionModel: 'doubao-seed-1-6-250615',
}

/**
 * 创建AI HTTP客户端
 * 注意：这个客户端实例暂时未使用，保留用于未来的直接API调用
 */
// const aiHttp = axios.create({
//   baseURL: AI_API_CONFIG.baseURL,
//   timeout: 60000, // AI接口响应较慢，设置1分钟超时
//   headers: {
//     'Content-Type': 'application/json',
//     'Authorization': `Bearer ${AI_API_CONFIG.apiKey}`,
//   },
// })

/**
 * 生成任务协议接口
 * 根据用户目标描述生成或修改自律协议，支持基于现有协议的修改
 * 入参: {goalDescription: string, modificationDescription?: string, originalAgreement?: string}
 * 返回参数: {Promise<string>} 生成的协议文本
 * url地址: /api/v3/chat/completions (豆包AI接口)
 * 请求方式: POST
 */
export const generateAgreement = async (goalDescription, modificationDescription = '', originalAgreement = '') => {
  if (!goalDescription || typeof goalDescription !== 'string') {
    throw new Error('目标描述不能为空')
  }

  if (!AI_API_CONFIG.apiKey || AI_API_CONFIG.apiKey === 'your_ark_api_key_here') {
    throw new Error('AI API密钥未配置，请在环境变量中设置VITE_AI_API_KEY')
  }

  let prompt

  // 如果有原始协议和修改要求，则进行协议修改
  if (originalAgreement && originalAgreement.trim() && modificationDescription && modificationDescription.trim()) {
    prompt = `你是一个专业的自律协议修改助手。用户已经有一个现有的协议，现在希望根据新的要求对协议进行修改。

用户目标：${goalDescription}

现有协议内容：
${originalAgreement}

用户的修改要求：${modificationDescription}

要求：
1. 根据用户目标和修改要求，在保持现有协议框架和风格的基础上进行调整。
2. 提供明确的完成标准，确保协议简洁具体，易于后续验证。
3. 验证方式需尽可能简单：可供你选择的证据类型有，图片（必须有，不超过3张）、文字（可选）
4. 协议内容应尽可能宽松，降低完成和验证的难度，同时确保其核心目标不偏离初衷。
5. 语气温暖，令人安心
6. 总字数控制在100字以内，并使用中文。

请根据修改要求对现有协议进行调整，生成修改后的协议，返回JSON格式的结果：
{
  "success": true/false,
  "title": 修改后的协议标题，
  "content": 修改后的协议内容,
  "reason": "详细的判断理由"
}
  
判断标准：
1. success为true代表成功生成协议，success为false代表用户给出的信息不足以修改协议
2. content为修改的协议内容
3. title为修改后的协议标题
4. success为false，则reason为"你提出的要求好像不可行呢，因为+具体原因,+鼓励的话"
5. success为true，则reason为"好呀，已按照你的要求修改任务卡片！+鼓励的话"`
  } else {
    // 如果没有原始协议，则生成新协议
    prompt = `你是一个专业的自律任务助手。用户会告诉你一个他想达成的目标，你的任务是辅助他生成包含检验方式的任务内容。

要求：
1. 判断用户是否已经提出了他所期待的检验方式
2. 如提出且可行（情形1），则按照他想要的方式来生成；如提出但偏离实际（情形2），则为用户生成并解释为什么做不到；如用户未提出（情形3）或提出不完整，则由模型补全缺失的部分，不要空着让用户补充
3. 提供明确的完成标准，确保检验简洁具体，易于后续验证。
3. 验证方式需尽可能简单，可供你选择的证据类型有，图片（必须有，不超过3张）、文字（可选）
4. 协议内容应尽可能宽松，降低完成和验证的难度，同时确保其核心目标不偏离初衷。
5. 语气温暖，令人安心
6. 总字数控制在100字以内，并使用中文。
7. 如果用户问到你的身份，请不要透露模型名字和开发者名字，请记住你是Stamp，用户的个人生活小管家

用户目标：${goalDescription}`

    // 如果有修改要求但没有原始协议，添加到提示中
    if (modificationDescription && modificationDescription.trim()) {
      prompt += `

用户对协议的修改要求：${modificationDescription}

请根据修改要求，重新生成或调整协议内容。`
    }

    prompt += `

请仔细分析并生成对应的自律协议，返回JSON格式的结果：
{
  "success": true/false,
  "title": 生成的协议标题,
  "content": 生成的协议内容,
  "reason": "详细的判断理由"
}
  
判断标准：
1. success为true代表成功生成协议，success为false代表用户给出的信息不足以生成协议
2. title为生成的协议标题
3. content为生成的协议内容
4. 如果用户给出的信息不足以生成协议，则reason为"你提出的目标好像不可行呢，因为+具体原因，+鼓励的话"
5. 如果用户给出的信息足以生成协议，则reason为"好呀，已按照你的要求创建任务卡片！+鼓励的话"`
  }

  try {
    const response = await requestWithRetry({
      method: 'POST',
      url: AI_API_CONFIG.baseURL,
      timeout: 60000, // AI接口设置1分钟超时
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_CONFIG.apiKey}`,
      },
      data: {
        model: AI_API_CONFIG.model,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的自律协议生成助手，擅长将用户的目标转化为具体可执行的协议。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
        thinking: {
          type: 'disabled'
        },
      },
    })

    if (!response?.choices?.[0]?.message?.content) {
      throw new Error('AI接口返回数据格式错误')
    }

    return response.choices[0].message.content.trim()
  } catch (error) {
    console.error('生成协议失败:', error)
    
    if (error.message.includes('API密钥')) {
      throw error
    }
    
    throw new Error('生成协议失败，请稍后重试')
  }
}

/**
 * 验证任务完成情况接口
 * 基于AI视觉和文本分析验证用户是否完成了自律任务，支持图片和文字描述的综合判断
 * 入参: {verificationData: {goal: string, agreement: string, description?: string, imageUrls?: Array<string>}}
 * 返回参数: {Promise<Object>} {success: boolean, confidence: number, reason: string}
 * url地址: /api/v3/chat/completions (豆包AI接口)
 * 请求方式: POST
 */
export const verifyTaskCompletion = async (verificationData) => {
  const { goal, agreement, description, imageUrls = [] } = verificationData

  if (!goal || !agreement) {
    throw new Error('验证数据不完整')
  }

  if (!AI_API_CONFIG.apiKey || AI_API_CONFIG.apiKey === 'your_ark_api_key_here') {
    throw new Error('AI API密钥未配置，请在环境变量中设置VITE_AI_API_KEY')
  }

  // 构建验证提示
  let prompt = `你是一个专业的任务完成情况验证助手。请根据以下信息判断用户是否完成了目标。

原始目标：${goal}

协议内容：${agreement}

无需严格遵守协议中的标准条目，只需判断核心目标是否完成即可。`

  // 只有当description不为空时才添加描述信息
  if (description && description.trim()) {
    prompt += `

用户描述的完成情况：${description}`
  } else {
    prompt += `

用户未提供文字描述，请主要根据提供的图片进行验证。`
  }

  // 构建消息内容
  const messageContent = []

  // 添加文本内容
  messageContent.push({
    type: 'text',
    text: prompt + `

请仔细分析并返回JSON格式的结果：
{
  "success": true/false,
  "confidence": 0-100的数字,
  "reason": "详细的判断理由"
}

判断标准：
1. confidence >= 50 表示任务完成
2. confidence < 50 表示任务未完成
3. reason 要具体说明判断依据`
  })

  // 添加图片（如果有）
  if (imageUrls.length > 0) {
    imageUrls.forEach(url => {
      messageContent.push({
        type: 'image_url',
        image_url: {
          url: url
        }
      })
    })
  }

  try {
    const model = imageUrls.length > 0 ? AI_API_CONFIG.visionModel : AI_API_CONFIG.model

    const response = await requestWithRetry({
      method: 'POST',
      url: AI_API_CONFIG.baseURL,
      timeout: 60000, // AI接口设置1分钟超时，图片处理需要更长时间
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_CONFIG.apiKey}`,
      },
      data: {
        model: model,
        messages: [
          {
            role: 'system',
            content: '你是一个专业的任务验证助手，能够客观公正地判断任务完成情况。'
          },
          {
            role: 'user',
            content: messageContent
          }
        ],
        temperature: 0.3,
        max_tokens: 300,
        thinking: {
          type: 'disabled'
        },
      },
    })

    if (!response?.choices?.[0]?.message?.content) {
      throw new Error('AI接口返回数据格式错误')
    }

    // 解析AI返回的JSON结果
    try {
      const aiResult = JSON.parse(response.choices[0].message.content.trim())
      
      return {
        success: aiResult.confidence >= 50,
        confidence: aiResult.confidence,
        reason: aiResult.reason,
      }
    } catch (parseError) {
      console.error('解析AI返回结果失败:', parseError)
      
      // 如果JSON解析失败，尝试从文本中提取关键信息
      const content = response.choices[0].message.content
      const success = content.includes('完成') && !content.includes('未完成')
      
      return {
        success: success,
        confidence: success ? 85 : 30,
        reason: content,
      }
    }
  } catch (error) {
    console.error('验证任务失败:', error)
    
    if (error.message.includes('API密钥')) {
      throw error
    }
    
    throw new Error('验证任务失败，请稍后重试')
  }
}
