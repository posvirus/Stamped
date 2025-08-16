<!--
  API测试页面
  用于测试API功能的正确性
-->
<template>
  <div class="api-test">
    <h1>API功能测试</h1>
    
    <!-- Mock模式状态 -->
    <div class="mock-status" :class="{ active: isMockMode }">
      <span>{{ isMockMode ? '🎭 Mock模式已启用' : '🌐 真实API模式' }}</span>
    </div>

    <!-- 任务创建测试 -->
    <section class="test-section">
      <h2>1. 任务创建测试</h2>
      <div class="test-form">
        <textarea 
          v-model="testData.taskDescription" 
          placeholder="输入测试目标描述..."
          rows="3"
        ></textarea>
        <button @click="testCreateTask" :disabled="loading.createTask">
          {{ loading.createTask ? '创建中...' : '测试创建任务' }}
        </button>
      </div>
      <div v-if="results.createTask" class="test-result">
        <h4>创建结果：</h4>
        <pre>{{ JSON.stringify(results.createTask, null, 2) }}</pre>
      </div>
    </section>

    <!-- 任务列表获取测试 -->
    <section class="test-section">
      <h2>2. 任务列表获取测试</h2>
      <div class="test-form">
        <select v-model="testData.taskStatus">
          <option value="pending">未完成任务</option>
          <option value="completed">已完成任务</option>
        </select>
        <button @click="testGetTasks" :disabled="loading.getTasks">
          {{ loading.getTasks ? '获取中...' : '测试获取任务列表' }}
        </button>
      </div>
      <div v-if="results.getTasks" class="test-result">
        <h4>获取结果：</h4>
        <pre>{{ JSON.stringify(results.getTasks, null, 2) }}</pre>
      </div>
    </section>

    <!-- AI协议生成测试 -->
    <section class="test-section">
      <h2>3. AI协议生成测试</h2>
      <div class="test-form">
        <textarea 
          v-model="testData.aiGoal" 
          placeholder="输入目标描述..."
          rows="2"
        ></textarea>
        <button @click="testGenerateAgreement" :disabled="loading.generateAgreement">
          {{ loading.generateAgreement ? 'AI生成中...' : '测试AI协议生成' }}
        </button>
      </div>
      <div v-if="results.generateAgreement" class="test-result">
        <h4>生成结果：</h4>
        <pre>{{ JSON.stringify(results.generateAgreement, null, 2) }}</pre>
      </div>
    </section>



    <!-- 任务验证测试 -->
    <section class="test-section">
      <h2>4. 任务验证测试</h2>
      <div class="test-form">
        <input v-model="testData.taskId" placeholder="任务ID" />
        <textarea 
          v-model="testData.verificationDescription" 
          placeholder="验证描述..."
          rows="2"
        ></textarea>
        <button @click="testVerifyTask" :disabled="loading.verifyTask">
          {{ loading.verifyTask ? 'AI验证中...' : '测试任务验证' }}
        </button>
      </div>
      <div v-if="results.verifyTask" class="test-result">
        <h4>验证结果：</h4>
        <pre>{{ JSON.stringify(results.verifyTask, null, 2) }}</pre>
      </div>
    </section>

    <!-- Loading状态测试 -->
    <section class="test-section">
      <h2>6. Loading状态测试</h2>
      <div class="test-form">
        <button @click="testLoadingStates">测试Loading状态管理</button>
      </div>
      <div class="loading-status">
        <p>全局Loading状态: {{ isGlobalLoading ? '激活' : '未激活' }}</p>
        <p>当前Loading消息: {{ currentLoadingMessage }}</p>
        <div v-if="allLoadingStates.length > 0">
          <h4>所有活跃的Loading状态：</h4>
          <ul>
            <li v-for="state in allLoadingStates" :key="state.key">
              {{ state.key }}: {{ state.message }}
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- 错误处理测试 -->
    <section class="test-section">
      <h2>7. 错误处理测试</h2>
      <div class="test-form">
        <button @click="testErrorHandling">测试错误处理</button>
      </div>
      <div v-if="results.errorTest" class="test-result error">
        <h4>错误处理结果：</h4>
        <pre>{{ JSON.stringify(results.errorTest, null, 2) }}</pre>
      </div>
    </section>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { 
  createTask, 
  getTasks, 
  verifyTask,
  generateAgreement,
  isGlobalLoading,
  currentLoadingMessage,
  allLoadingStates,
  addLoading,
  removeLoading,
  LOADING_KEYS
} from '@/api'

export default {
  name: 'ApiTest',
  setup() {
    // 响应式数据
    const results = ref({})
    const loading = ref({})
    const isMockMode = ref(false)
    
    const testData = ref({
      taskDescription: '每天阅读30分钟技术书籍',
      taskStatus: 'pending',
      aiGoal: '学习Vue 3新特性并完成项目',
      taskId: '1',
      verificationDescription: '已完成今天的阅读任务，阅读了Vue 3官方文档'
    })

    // 检查Mock模式
    onMounted(() => {
      isMockMode.value = import.meta.env.VITE_MOCK_API === 'true'
    })

    // 测试函数
    const testCreateTask = async () => {
      if (!testData.value.taskDescription.trim()) {
        alert('请输入任务描述')
        return
      }

      loading.value.createTask = true
      try {
        const result = await createTask(testData.value.taskDescription)
        results.value.createTask = result
        console.log('✅ 创建任务测试成功:', result)
      } catch (error) {
        results.value.createTask = { error: error.message }
        console.error('❌ 创建任务测试失败:', error)
      } finally {
        loading.value.createTask = false
      }
    }

    const testGetTasks = async () => {
      loading.value.getTasks = true
      try {
        const result = await getTasks(testData.value.taskStatus)
        results.value.getTasks = result
        console.log('✅ 获取任务列表测试成功:', result)
      } catch (error) {
        results.value.getTasks = { error: error.message }
        console.error('❌ 获取任务列表测试失败:', error)
      } finally {
        loading.value.getTasks = false
      }
    }

    const testGenerateAgreement = async () => {
      if (!testData.value.aiGoal.trim()) {
        alert('请输入目标描述')
        return
      }

      loading.value.generateAgreement = true
      try {
        const result = await generateAgreement(testData.value.aiGoal)
        results.value.generateAgreement = result
        console.log('✅ AI协议生成测试成功:', result)
      } catch (error) {
        results.value.generateAgreement = { error: error.message }
        console.error('❌ AI协议生成测试失败:', error)
      } finally {
        loading.value.generateAgreement = false
      }
    }



    const testVerifyTask = async () => {
      if (!testData.value.taskId || !testData.value.verificationDescription.trim()) {
        alert('请输入任务ID和验证描述')
        return
      }

      loading.value.verifyTask = true
      try {
        const result = await verifyTask(testData.value.taskId, {
          description: testData.value.verificationDescription
        })
        results.value.verifyTask = result
        console.log('✅ 任务验证测试成功:', result)
      } catch (error) {
        results.value.verifyTask = { error: error.message }
        console.error('❌ 任务验证测试失败:', error)
      } finally {
        loading.value.verifyTask = false
      }
    }

    const testLoadingStates = () => {
      // 模拟多个Loading状态
      addLoading(LOADING_KEYS.CREATE_TASK, '正在创建任务...')
      setTimeout(() => {
        addLoading(LOADING_KEYS.UPLOAD_FILE, '正在上传文件...')
      }, 1000)
      
      setTimeout(() => {
        removeLoading(LOADING_KEYS.CREATE_TASK)
      }, 2000)
      
      setTimeout(() => {
        removeLoading(LOADING_KEYS.UPLOAD_FILE)
      }, 3000)
    }

    const testErrorHandling = async () => {
      try {
        // 测试参数错误
        await createTask('')
      } catch (error) {
        results.value.errorTest = {
          type: '参数验证错误',
          message: error.message,
          timestamp: new Date().toISOString()
        }
        console.log('✅ 错误处理测试成功:', error.message)
      }
    }



    return {
      results,
      loading,
      testData,
      isMockMode,
      isGlobalLoading,
      currentLoadingMessage,
      allLoadingStates: computed(() => allLoadingStates.value),
      testCreateTask,
      testGetTasks,
      testGenerateAgreement,
      testVerifyTask,
      testLoadingStates,
      testErrorHandling
    }
  }
}
</script>

<style scoped>
.api-test {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

h1 {
  color: #1E88E5;
  text-align: center;
  margin-bottom: 30px;
}

.mock-status {
  padding: 10px;
  border-radius: 8px;
  text-align: center;
  margin-bottom: 30px;
  background-color: #f5f5f5;
  border: 2px solid #ddd;
}

.mock-status.active {
  background-color: #e3f2fd;
  border-color: #1E88E5;
  color: #1E88E5;
}

.test-section {
  margin-bottom: 40px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
}

.test-section h2 {
  color: #333;
  margin-top: 0;
  margin-bottom: 15px;
}

.test-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 15px;
}

.test-form input,
.test-form textarea,
.test-form select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.test-form button {
  padding: 10px 20px;
  background-color: #1E88E5;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.test-form button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.test-form button:hover:not(:disabled) {
  background-color: #1976D2;
}

.test-result {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 15px;
  margin-top: 10px;
}

.test-result.error {
  background-color: #fff5f5;
  border-color: #fed7d7;
}

.test-result h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #333;
}

.test-result pre {
  background-color: white;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.4;
}

.file-preview {
  margin-top: 10px;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.file-item {
  padding: 5px 10px;
  background-color: #f0f0f0;
  border-radius: 4px;
  font-size: 12px;
}

.loading-status {
  margin-top: 15px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.loading-status p {
  margin: 5px 0;
}

.loading-status ul {
  margin: 10px 0;
  padding-left: 20px;
}
</style>
