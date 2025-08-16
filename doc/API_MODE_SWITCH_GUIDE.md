# 🔄 API模式切换指南

## 当前状态

✅ **已修复**: Mock模式不再在开发环境中自动启用
✅ **默认**: 现在默认使用真实API模式

## 🌐 使用真实API模式（当前模式）

### 方法1：直接启动（推荐）
```bash
npm run dev
```

现在应用将连接到真实的后端API：`https://hadeiqoanbmd.sealoshzh.site`

### 方法2：明确禁用Mock
```bash
# Windows (cmd)
set VITE_MOCK_API=false && npm run dev

# Windows (PowerShell) 
$env:VITE_MOCK_API="false"; npm run dev

# macOS/Linux
VITE_MOCK_API=false npm run dev
```

## 🎭 切换到Mock模式

如果您需要使用Mock数据进行开发：

```bash
# Windows (cmd)
set VITE_MOCK_API=true && npm run dev

# Windows (PowerShell)
$env:VITE_MOCK_API="true"; npm run dev

# macOS/Linux  
VITE_MOCK_API=true npm run dev
```

## 🔍 如何确认当前模式

### 方法1：查看浏览器控制台
启动应用后，在浏览器控制台中会看到：

**真实API模式：**
```
🌐 真实API模式已启用，连接到: https://hadeiqoanbmd.sealoshzh.site
```

**Mock模式：**
```
🎭 Mock API模式已启用
```

### 方法2：在代码中检查
```javascript
import { printApiInfo } from '@/config/api'

// 在控制台打印当前API配置
printApiInfo()
```

### 方法3：测试API调用
```javascript
import { healthCheck } from '@/api'

// 调用健康检查接口
healthCheck().then(result => {
  console.log('API响应:', result)
  // 真实API会返回服务器时间戳
  // Mock API会返回模拟数据
})
```

## 🧪 快速验证

运行以下命令来验证API连接：

```bash
# 启动应用
npm run dev

# 然后在浏览器控制台中运行：
window.apiTest?.healthCheck()
```

## 🔧 环境变量说明

| 变量名 | 值 | 效果 |
|--------|---|------|
| `VITE_MOCK_API` | `true` | 启用Mock模式 |
| `VITE_MOCK_API` | `false` 或未设置 | 使用真实API |
| `VITE_API_BASE_URL` | 自定义URL | 覆盖默认API地址 |

## ⚠️ 注意事项

1. **环境变量修改后需要重启应用** (`npm run dev`)
2. **真实API模式下**，所有请求将发送到后端服务器
3. **Mock模式下**，使用本地模拟数据，不会发送网络请求
4. **生产环境**默认使用真实API，无法启用Mock模式

## 🚀 推荐设置

对于日常开发，建议：

1. **后端服务可用时**：使用真实API模式（默认）
2. **后端服务不可用时**：临时切换到Mock模式
3. **UI开发阶段**：使用Mock模式快速迭代

现在您可以直接运行 `npm run dev` 来使用真实API！
