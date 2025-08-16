# 任务管理系统 API 接口文档

**基础URL**：https://hadeiqoanbmd.sealoshzh.site

## 1. 健康检查接口

- **接口名称**: 健康检查
- **功能描述**: 检查服务器运行状态，用于监控和负载均衡器检测服务是否正常运行
- **入参**: 无
- **返回参数**: 
  - success: boolean - 请求是否成功
  - message: string - 响应消息
  - timestamp: string - 服务器当前时间戳(ISO格式)
- **url地址**: /health
- **请求方式**: GET

---

## 2. API信息接口

- **接口名称**: 获取API信息
- **功能描述**: 获取任务管理系统API版本信息和所有可用端点列表，方便开发者了解系统概况
- **入参**: 无
- **返回参数**: 
  - success: boolean - 请求是否成功
  - message: string - API系统名称和版本
  - endpoints: object - 所有可用的API端点及其描述
- **url地址**: /
- **请求方式**: GET

---

## 3. 保存任务接口

- **接口名称**: 保存用户确认后的任务
- **功能描述**: 创建一个新的任务记录，用于保存用户确认的目标描述和协议内容，任务初始状态为pending
- **入参**: 
  - description: string(必填) - 任务目标描述，最大长度1000字符
  - agreement: string(必填) - 协议内容，最大长度2000字符
- **返回参数**: 
  - success: boolean - 请求是否成功
  - data: object - 任务数据对象
    - _id: string - 任务唯一标识符(MongoDB ObjectId)
    - title: string - 任务标题(自动从description前50字符生成)
    - description: string - 任务描述
    - agreement: string - 协议内容
    - status: string - 任务状态(pending/completed)
    - createdAt: string - 创建时间(ISO格式)
  - message: string - 操作结果消息
- **url地址**: /api/task/save
- **请求方式**: POST

---

## 4. 获取任务列表接口

- **接口名称**: 获取任务列表
- **功能描述**: 根据状态筛选获取任务列表，支持按创建时间倒序排列，用于展示和管理任务
- **入参**: 
  - status: string(可选) - 任务状态筛选，可选值: pending/completed，默认为pending
- **返回参数**: 
  - success: boolean - 请求是否成功
  - data: array - 任务列表数组
    - _id: string - 任务唯一标识符
    - title: string - 任务标题
    - description: string - 任务描述
    - agreement: string - 协议内容
    - status: string - 任务状态
    - createdAt: string - 创建时间
    - completedAt: string - 完成时间(仅completed状态有值)
  - total: number - 符合条件的任务总数
  - message: string - 操作结果消息
- **url地址**: /api/tasks
- **请求方式**: GET

---

## 5. 获取单个任务详情接口

- **接口名称**: 获取单个任务详情
- **功能描述**: 根据任务ID获取指定任务的完整详细信息，用于任务详情页面展示
- **入参**: 
  - taskId: string(路径参数) - 任务ID，必须为有效的MongoDB ObjectId格式(24位十六进制字符串)
- **返回参数**: 
  - success: boolean - 请求是否成功
  - data: object - 任务详情对象
    - _id: string - 任务唯一标识符
    - title: string - 任务标题
    - description: string - 任务描述
    - agreement: string - 协议内容
    - status: string - 任务状态
    - createdAt: string - 创建时间
    - completedAt: string - 完成时间(仅completed状态有值)
  - message: string - 操作结果消息
- **url地址**: /api/task/:taskId
- **请求方式**: GET

---

## 6. 删除任务接口

- **接口名称**: 删除任务
- **功能描述**: 根据任务ID永久删除指定的任务记录，删除后无法恢复，需谨慎操作
- **入参**: 
  - taskId: string(路径参数) - 任务ID，必须为有效的MongoDB ObjectId格式
- **返回参数**: 
  - success: boolean - 请求是否成功
  - data: object - 删除的任务信息
    - deletedTask: object - 被删除的任务对象
      - _id: string - 任务ID
      - title: string - 任务标题
      - description: string - 任务描述
      - status: string - 任务状态
  - message: string - 操作结果消息
- **url地址**: /api/task/:taskId
- **请求方式**: DELETE

---

## 7. 更新任务状态接口

- **接口名称**: 更新任务状态
- **功能描述**: 修改指定任务的状态，支持pending和completed两种状态切换，状态变为completed时会自动设置完成时间
- **入参**: 
  - taskId: string(路径参数) - 任务ID，必须为有效的MongoDB ObjectId格式
  - status: string(必填) - 新的任务状态，可选值: pending/completed
- **返回参数**: 
  - success: boolean - 请求是否成功
  - data: object - 更新后的任务信息
    - _id: string - 任务ID
    - title: string - 任务标题
    - description: string - 任务描述
    - agreement: string - 协议内容
    - status: string - 更新后的任务状态
    - createdAt: string - 创建时间
    - completedAt: string - 完成时间(状态为completed时自动设置)
  - message: string - 操作结果消息
- **url地址**: /api/task/:taskId
- **请求方式**: PATCH

---

## 错误响应格式

所有接口在发生错误时返回统一的错误响应格式：

```json
{
  "success": false,
  "message": "具体的错误信息描述"
}
```

### 常见错误状态码：
- **400**: 请求参数错误或格式不正确
- **404**: 请求的资源不存在
- **500**: 服务器内部错误

## 请求示例

### 1. 保存任务示例
```javascript
// POST /api/task/save
{
  "description": "完成项目文档编写",
  "agreement": "我同意在一周内完成此任务，并确保文档质量符合要求"
}
```

### 2. 获取任务列表示例
```javascript
// GET /api/tasks?status=pending
// 无需请求体
```

### 3. 更新任务状态示例
```javascript
// PATCH /api/task/66789abc123def456789abc0
{
  "status": "completed"
}
```

## 注意事项

1. 所有请求需要设置 `Content-Type: application/json`
2. 任务ID必须是有效的MongoDB ObjectId格式(24位十六进制字符串)
3. 字符串参数会自动去除首尾空格
4. 系统支持CORS跨域请求
5. 所有时间字段均为ISO 8601格式
6. 任务状态只能是 `pending` 或 `completed`
7. 任务标题会根据描述前50个字符自动生成
8. 任务完成时会自动设置completedAt时间戳
