import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

/* Layout */
import Layout from '@/layout'

export const constantRoutes = [
  {
    path: '/404',
    component: () => import('@/views/404'),
    hidden: true
  },

  {
    path: '/',
    component: Layout,
    name: 'login',
    redirect: '/login',
    children: [{
      path: 'login',
      name: '主页',
      component: () => import('@/views/menu/login'),
      meta: { title: '主页', icon: 'form' }
    }]
  },

  {
    path: '/dashboard',
    component: Layout,
    name: 'dashboard',
    redirect: '/dashboard',
    children: [{
      path: '',
      name: '计算器',
      component: () => import('@/views/menu/dashboard'),
      meta: { title: '计算器', icon: 'dashboard' }
    }]
  },

  {
    path: '/menu',
    component: Layout,
    name: 'menu',
    redirect: '/menu',
    meta: {
      title: '工具箱',
      icon: 'menu'
    },
    children: [
      {
        path: 'menu1',
        component: () => import('@/views/menu/menu1/index'),
        name: 'Menu1',
        meta: { title: '工具箱' },
        // Parent router-view
        children: [
          {
            path: 'menu1-1',
            component: () => import('@/views/menu/menu1/menu1-1'),
            name: 'GPT',
            meta: { title: 'GPT' }
          },
          {
            path: 'menu1-2',
            component: () => import('@/views/menu/menu1/menu1-2'),
            name: '书签',
            meta: { title: '书签' }
          }
        ]
      },
      {
        path: 'menu2',
        component: () => import('@/views/menu/menu2'),
        name: 'menu2',
        meta: { title: '付费专栏' }
      }
    ]
  },

  {
    path: 'external-link',
    component: Layout,
    children: [
      {
        path: 'https://www.zhihu.com/people/13-98-43-33',
        meta: { title: '知乎主页', icon: 'link' }
      }
    ]
  },
  { path: '*', redirect: '/404', hidden: true }
]

const createRouter = () => new Router({
  // mode: 'history', // require service support
  scrollBehavior: () => ({ y: 0 }),
  routes: constantRoutes
})

const router = createRouter()

// Detail see: https://github.com/vuejs/vue-router/issues/1234#issuecomment-357941465
export function resetRouter() {
  const newRouter = createRouter()
  router.matcher = newRouter.matcher // reset router
}

export default router
