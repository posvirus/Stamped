import js from '@eslint/js'
import vue from 'eslint-plugin-vue'

export default [
  js.configs.recommended,
  ...vue.configs['flat/essential'],
  {
    files: ['**/*.{js,vue}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // 基础全局变量
        console: 'readonly',
        process: 'readonly',
        
        // 浏览器环境
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        
        // 定时器
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        
        // 对话框
        alert: 'readonly',
        confirm: 'readonly',
        prompt: 'readonly',
        
        // Web APIs
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        FormData: 'readonly',
        FileReader: 'readonly',
        File: 'readonly',
        Blob: 'readonly',
        Image: 'readonly',
        
        // 性能和观察者API
        performance: 'readonly',
        PerformanceObserver: 'readonly',
        IntersectionObserver: 'readonly',
        ResizeObserver: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly'
      }
    },
    rules: {
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-unused-vars': 'warn',
      'vue/multi-word-component-names': 'off'
    }
  },
  {
    ignores: ['node_modules/**', 'dist/**', 'public/**']
  }
]
