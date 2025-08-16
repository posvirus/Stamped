# API接口对接指南

## 概述

本项目已完成与后端API的完整对接，基础URL为：`https://hadeiqoanbmd.sealoshzh.site`

## 可用接口

### 1. 系统接口

#### 健康检查
```javascript
import { healthCheck } from '@/api'

const result = await healthCheck()
// 返回: { success: boolean, message: string, timestamp: string }
```

#### 获取API信息
```javascript
import { getApiInfo } from '@/api'

const result = await getApiInfo()
// 返回: { success: boolean, message: string, endpoints: object }
```

### 2. 任务管理接口

#### 保存任务
```javascript
import { saveConfirmedTask } from '@/api'

const result = await saveConfirmedTask(description, agreement)
// 参数:
// - description: string (必填，最大1000字符) - 任务目标描述
// - agreement: string (必填，最大2000字符) - 协议内容
// 返回: { success: boolean, data: object, message: string }
```

#### 获取任务列表
```javascript
import { getTasks } from '@/api'

const result = await getTasks('pending') // 或 'completed'
// 参数:
// - status: string (可选，默认'pending') - 任务状态筛选
// 返回: { success: boolean, data: array, total: number, message: string }
```

#### 获取任务详情
```javascript
import { getTaskById } from '@/api'

const result = await getTaskById(taskId)
// 参数:
// - taskId: string (必填) - 24位十六进制MongoDB ObjectId
// 返回: { success: boolean, data: object, message: string }
```

#### 更新任务状态
```javascript
import { updateTaskStatus } from '@/api'

const result = await updateTaskStatus(taskId, 'completed')
// 参数:
// - taskId: string (必填) - 任务ID
// - status: string (必填) - 新状态 'pending' 或 'completed'
// 返回: { success: boolean, data: object, message: string }
```

#### 删除任务
```javascript
import { deleteTask } from '@/api'

const result = await deleteTask(taskId)
// 参数:
// - taskId: string (必填) - 任务ID
// 返回: { success: boolean, data: object, message: string }
```

## 错误处理

所有API接口都包含统一的错误处理：

```javascript
try {
  const result = await saveConfirmedTask(description, agreement)
  console.log('成功:', result)
} catch (error) {
  console.error('错误:', error.message)
  // error.code 包含错误代码
  // error.originalError 包含原始错误信息
}
```

### 常见错误码

- `BAD_REQUEST` (400): 请求参数错误
- `NOT_FOUND` (404): 资源不存在
- `SERVER_ERROR` (500): 服务器内部错误
- `NETWORK_ERROR`: 网络连接失败
- `TIMEOUT`: 请求超时

## 测试工具

项目提供了完整的API测试工具：

```javascript
import { runFullApiTest, exposeApiTestToWindow } from '@/utils/apiTest'

// 开发环境中暴露测试方法到浏览器控制台
exposeApiTestToWindow()

// 在控制台中运行完整测试
window.apiTest.runFullTest()

// 或者在代码中直接运行
const testResults = await runFullApiTest()
```

## 配置说明

### HTTP客户端配置

- 基础URL: `https://hadeiqoanbmd.sealoshzh.site`
- 超时时间: 10秒
- 自动重试: 网络错误和5xx错误最多重试3次
- 请求头: `Content-Type: application/json`

### 开发环境

在开发环境中，你可以通过环境变量覆盖默认配置：

```bash
# .env.development
VITE_API_BASE_URL=https://your-custom-api-url.com
```

## 注意事项

1. 所有时间字段均为ISO 8601格式
2. 任务ID必须是有效的MongoDB ObjectId格式(24位十六进制字符串)
3. 字符串参数会自动去除首尾空格
4. 任务状态只能是 `pending` 或 `completed`
5. 系统支持CORS跨域请求

## 已弃用的接口

以下接口不在后端API文档中，建议谨慎使用：

- `createTask` - 建议使用 `saveConfirmedTask`
- `verifyTask` - 可能用于AI验证功能，请根据实际需求确定是否保留
