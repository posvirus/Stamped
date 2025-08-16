import { createRouter, createWebHashHistory } from 'vue-router'
import { useAppStore } from '@/stores'

const router = createRouter({
  // 使用hash模式，适配移动端部署
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      // 路由懒加载优化性能
      component: () => import('../views/HomePage.vue'),
      meta: {
        title: '自律工具 - 任务总览'
      }
    },

    {
      path: '/confirm-agreement',
      name: 'confirmAgreement',
      component: () => import('../views/ConfirmAgreementPage.vue'),
      meta: {
        title: '自律工具 - 协议确认'
      }
    },
    {
      path: '/task-detail/:id',
      name: 'taskDetail',
      component: () => import('../views/TaskDetailPage.vue'),
      meta: {
        title: '自律工具 - 任务详情'
      },
      // 支持传递任务ID参数
      props: true
    },
    {
      path: '/task-verify/:id',
      name: 'taskVerify',
      component: () => import('../views/TaskVerifyPage.vue'),
      meta: {
        title: '自律工具 - 任务验证'
      },
      // 支持传递任务ID参数
      props: true
    },
    // 开发环境测试页面
    ...(import.meta.env.DEV ? [
      {
        path: '/api-test',
        name: 'api-test',
        component: () => import('../views/ApiTest.vue'),
        meta: {
          title: '自律工具 - API测试'
        }
      },
      {
        path: '/component-test',
        name: 'component-test',
        component: () => import('../views/ComponentTestPage.vue'),
        meta: {
          title: '自律工具 - 组件测试'
        }
      }
    ] : [])
  ]
})

// 全局路由守卫 - 设置页面标题和状态管理
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title
  }
  
  // 验证需要任务ID的路由
  if ((to.name === 'taskDetail' || to.name === 'taskVerify') && !to.params.id) {
    console.warn('缺少任务ID参数，重定向到首页')
    next('/')
    return
  }
  
  // 验证协议确认页面的必要参数
  if (to.name === 'confirmAgreement') {
    // 创建模式：允许没有goal和agreement参数
    if (to.query.mode === 'create') {
      // 创建模式无需验证参数
    } else {
      // 修改模式：需要goal和agreement参数
      if (!to.query.goal || !to.query.agreement) {
        console.warn('协议确认页面缺少必要参数，重定向到首页')
        next('/')
        return
      }
    }
  }
  
  next()
})

// 全局后置守卫 - 更新应用状态
router.afterEach((to, from) => {
  // 在 Pinia store 初始化后更新状态
  if (typeof window !== 'undefined') {
    const appStore = useAppStore()
    
    // 设置当前页面
    switch (to.name) {
      case 'home':
        appStore.setCurrentPage('home')
        break
      case 'createGoal':
        appStore.setCurrentPage('createGoal')
        break
      case 'confirmAgreement':
        appStore.setCurrentPage('confirmAgreement')
        break
      case 'taskDetail':
        appStore.setCurrentPage('taskDetail')
        break
      case 'taskVerify':
        appStore.setCurrentPage('taskVerify')
        break
      default:
        appStore.setCurrentPage('other')
    }
    
    // 设置页面标题到应用状态
    if (to.meta.title) {
      appStore.setPageTitle(to.meta.title)
    }
  }
})

export default router
