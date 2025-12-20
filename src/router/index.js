import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/booking/passengers'
  },
  {
    path: '/test',
    name: 'Test',
    component: () => import('@/views/Test.vue'),
    meta: {
      title: '测试页面'
    }
  },
  {
    path: '/booking',
    redirect: '/booking/passengers'
  },
  {
    path: '/booking/passengers',
    name: 'PassengerList',
    component: () => import('@/views/booking/PassengerList.vue'),
    meta: {
      title: '乘客管理',
      requiresAuth: true
    }
  },
  {
    path: '/booking/create-order',
    name: 'CreateOrder',
    component: () => import('@/views/booking/CreateOrder.vue'),
    meta: {
      title: '创建订单',
      requiresAuth: true
    }
  },
  {
    path: '/booking/select-passengers',
    name: 'PassengerSelect',
    component: () => import('@/views/booking/PassengerSelect.vue'),
    meta: {
      title: '选择乘客',
      requiresAuth: true
    }
  },
  {
    path: '/booking/orders',
    name: 'OrderList',
    component: () => import('@/views/booking/OrderList.vue'),
    meta: {
      title: '订单管理',
      requiresAuth: true
    }
  },
  {
    path: '/booking/orders/:pnr',
    name: 'OrderDetail',
    component: () => import('@/views/booking/OrderDetail.vue'),
    meta: {
      title: '订单详情',
      requiresAuth: true
    }
  },
  // 处理从其他模块跳转过来的booking.html路径
  {
    path: '/booking.html',
    redirect: (to) => {
      // 将查询参数传递到创建订单页面
      return {
        name: 'CreateOrder',
        query: to.query
      }
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: {
      title: '页面未找到'
    }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 火车订票系统`
  }

  // 检查是否需要认证
  // 暂时注释掉认证检查，等登录页面实现后再启用
  // if (to.meta.requiresAuth) {
  //   const token = localStorage.getItem('token')
  //   if (!token) {
  //     next({ 
  //       name: 'Login', 
  //       query: { redirect: to.fullPath } 
  //     })
  //     return
  //   }
  // }

  next()
})

export default router

