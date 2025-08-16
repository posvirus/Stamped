# API功能测试指南

本文档介绍如何测试已实现的API服务层功能的正确性。

## 🎯 测试目标

验证以下API功能：
- ✅ HTTP客户端配置和拦截器
- ✅ 任务CRUD操作（创建、获取、验证）
- ✅ AI接口集成（协议生成、任务验证）
- ✅ 文件上传和验证
- ✅ Loading状态管理
- ✅ 错误处理和重试机制

## 📋 测试方案

### 1. Mock API测试（推荐优先）

我们已经配置了Mock API服务，可以在没有后端的情况下测试前端功能。

#### 启用Mock模式
```bash
# 在 .env.development 中设置
VITE_MOCK_API=true
```

#### 运行测试
```bash
# 启动开发服务器
npm run dev

# 访问API测试页面
http://localhost:5173/api-test
```

### 2. 浏览器控制台测试

在开发环境中打开浏览器控制台，直接调用API函数：

```javascript
// 导入API函数（在浏览器中已全局可用）
import { createTask, getTasks, generateAgreement } from '@/api'

// 测试任务创建
createTask('每天跑步30分钟').then(console.log).catch(console.error)

// 测试获取任务列表
getTasks('pending').then(console.log).catch(console.error)

// 测试AI协议生成
generateAgreement('学习Vue 3新特性').then(console.log).catch(console.error)
```

### 3. 测试页面使用说明

访问 `/api-test` 页面进行可视化测试：

#### 3.1 任务创建测试
1. 在文本框中输入目标描述
2. 点击"测试创建任务"
3. 观察Mock API响应和控制台日志

#### 3.2 任务列表测试
1. 选择任务状态（pending/completed）
2. 点击"测试获取任务列表"
3. 查看返回的Mock数据

#### 3.3 AI协议生成测试
1. 输入目标描述
2. 点击"测试AI协议生成"
3. 观察模拟的AI协议生成过程

#### 3.4 文件上传测试
1. 选择图片文件（支持多选）
2. 点击"测试文件上传"
3. 观察文件验证和上传模拟

#### 3.5 Loading状态测试
1. 点击"测试Loading状态管理"
2. 观察全局Loading状态变化
3. 查看Loading消息和状态列表

### 4. 真实后端联调测试

当后端API准备就绪时：

#### 4.1 配置真实API
```bash
# 在 .env 中设置
VITE_MOCK_API=false
VITE_API_BASE_URL=http://localhost:3000
VITE_AI_API_KEY=your_real_api_key
```

#### 4.2 测试步骤
1. 确保后端服务运行在端口3000
2. 在测试页面进行相同的测试操作
3. 观察真实API的响应和错误处理

## 🧪 自动化测试

### 命令行测试脚本
```bash
# 运行Node.js测试脚本
node test-api.js
```

此脚本会自动测试：
- 参数验证
- 文件验证
- Mock API响应
- 错误处理

## 📊 测试检查清单

### HTTP客户端测试
- [ ] 请求拦截器工作正常
- [ ] 响应拦截器工作正常
- [ ] Mock模式切换正常
- [ ] 错误处理和重试机制
- [ ] 请求超时处理

### 任务API测试
- [ ] 创建任务功能
- [ ] 获取任务列表功能
- [ ] 获取任务详情功能
- [ ] 验证任务功能
- [ ] 参数验证正确

### AI API测试
- [ ] 协议生成功能
- [ ] 任务验证功能
- [ ] API密钥验证
- [ ] 错误处理

### 文件上传测试
- [ ] 文件类型验证
- [ ] 文件大小验证
- [ ] 图片压缩功能
- [ ] 上传进度显示
- [ ] 多文件上传

### Loading状态测试
- [ ] 全局Loading状态
- [ ] 个别Loading状态
- [ ] Loading消息显示
- [ ] 状态清理

## 🔍 调试技巧

### 1. 开发者工具
- 网络面板：查看HTTP请求和响应
- 控制台：查看API调用日志
- Vue Devtools：检查组件状态

### 2. 日志输出
API服务已配置详细的日志输出：
- 🚀 表示API请求
- ✅ 表示成功响应
- 🎭 表示Mock响应
- ❌ 表示错误

### 3. 错误排查
常见问题和解决方案：

#### Mock模式未启用
```bash
# 检查环境变量
echo $VITE_MOCK_API
# 或在浏览器控制台
console.log(import.meta.env.VITE_MOCK_API)
```

#### API密钥配置错误
```bash
# 检查环境变量
echo $VITE_AI_API_KEY
```

#### 网络请求失败
1. 检查后端服务是否运行
2. 确认API Base URL配置
3. 查看浏览器网络面板

## 📈 性能测试

### 1. 响应时间测试
在浏览器控制台运行：
```javascript
const startTime = Date.now()
createTask('测试任务').then(() => {
  console.log(`响应时间: ${Date.now() - startTime}ms`)
})
```

### 2. 并发测试
```javascript
const promises = Array(10).fill().map(() => createTask('并发测试'))
Promise.all(promises).then(results => {
  console.log('并发测试完成:', results.length)
})
```

## 🚀 下一步

1. 完成Mock API测试
2. 等待后端完成时进行真实API联调
3. 编写单元测试（可选）
4. 集成到CI/CD流程（可选）

---

## 📝 测试报告模板

测试完成后，可以按以下格式记录结果：

```
API功能测试报告
==================

测试时间: 2024-XX-XX
测试环境: Mock API / 真实API
测试人员: [姓名]

功能测试结果:
- 任务创建: ✅ 通过 / ❌ 失败
- 任务列表: ✅ 通过 / ❌ 失败
- AI协议生成: ✅ 通过 / ❌ 失败
- 文件上传: ✅ 通过 / ❌ 失败
- Loading状态: ✅ 通过 / ❌ 失败

问题记录:
1. [问题描述]
2. [解决方案]

总体评价:
[功能正常/存在问题/需要优化]
```
