# API 接口文档

这是一个基于Node.js的后端项目，数据库使用MongoDB实现，数据库连接方式是：mongodb://root:4k2wprhj@stamped-data-mongodb.ns-828djh78.svc:27017

## 任务管理相关接口

### 1. 保存用户确认后的任务

- **接口名称**: saveConfirmedTask
- **功能描述**: 保存用户确认后的任务，将任务正式写入系统
- **入参**:
  - description: string - 目标描述，不能为空
  - agreement: string - 协议内容，不能为空
- **返回参数**: 
  - success: boolean - 操作是否成功
  - data: object - 保存的任务数据对象
    - _id: string - 任务ID
    - title: string - 任务标题
    - description: string - 目标描述
    - agreement: string - 协议内容
    - status: string - 任务状态
    - createdAt: string - 创建时间
  - message: string - 响应消息
- **url地址**: /api/task/save
- **请求方式**: POST

### 2. 获取任务列表

- **接口名称**: getTasks
- **功能描述**: 根据状态获取任务列表，支持分页和筛选
- **入参**:
  - status: string - 任务状态，可选值为 'pending' 或 'completed'，默认为 'pending'
- **返回参数**: 
  - success: boolean - 操作是否成功
  - data: array - 任务列表数组
    - _id: string - 任务ID
    - title: string - 任务标题
    - description: string - 目标描述
    - agreement: string - 协议内容
    - status: string - 任务状态
    - createdAt: string - 创建时间
    - completedAt: string - 完成时间（仅completed状态）
  - total: number - 总数量
  - message: string - 响应消息
- **url地址**: /api/tasks
- **请求方式**: GET

### 3. 获取单个任务详情

- **接口名称**: getTaskById
- **功能描述**: 根据任务ID获取指定任务的详细信息
- **入参**:
  - taskId: string - 任务ID，不能为空
- **返回参数**: 
  - success: boolean - 操作是否成功
  - data: object - 任务详情对象
    - _id: string - 任务ID
    - title: string - 任务标题
    - description: string - 目标描述
    - agreement: string - 协议内容
    - status: string - 任务状态
    - createdAt: string - 创建时间
    - completedAt: string - 完成时间（如果已完成）
  - message: string - 响应消息
- **url地址**: /api/task/{taskId}
- **请求方式**: GET

### 4. 删除任务

- **接口名称**: deleteTask
- **功能描述**: 根据任务ID删除指定的任务
- **入参**:
  - taskId: string - 任务ID，不能为空
- **返回参数**: 
  - success: boolean - 操作是否成功
  - data: object - 删除结果对象
    - deletedTask: object - 被删除的任务对象
  - message: string - 响应消息
- **url地址**: /api/task/{taskId}
- **请求方式**: DELETE

### 5. 更新任务状态

- **接口名称**: updateTaskStatus
- **功能描述**: 更新指定任务的状态
- **入参**:
  - taskId: string - 任务ID，不能为空
  - status: string - 新状态，可选值为 'pending' 或 'completed'
- **返回参数**: 
  - success: boolean - 操作是否成功
  - data: object - 更新结果对象
  - message: string - 响应消息
- **url地址**: /api/task/{taskId}
- **请求方式**: PATCH

### 错误处理

所有接口都遵循统一的错误响应格式：
- 4xx错误：客户端请求错误
- 5xx错误：服务器内部错误
- 错误响应包含错误码和详细错误信息

### 请求头

- Content-Type: application/json（普通请求）
- Content-Type: multipart/form-data（文件上传）

### 重试机制

- 网络错误和服务器错误会自动重试
- 最大重试次数：3次
- 重试延迟：1秒、2秒、3秒递增
