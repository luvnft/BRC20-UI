import { type RouteRecordRaw, createRouter, createWebHashHistory, createWebHistory } from "vue-router"

const Layout = () => import("@/layout/index.vue")

/** 常驻路由 */
export const constantRoutes: RouteRecordRaw[] = [
  {
    path: "/redirect",
    component: Layout,
    meta: {
      hidden: true
    },
    children: [
      {
        path: "/redirect/:path(.*)",
        component: () => import("@/views/redirect/index.vue")
      }
    ]
  },
  {
    path: "/403",
    component: () => import("@/views/error-page/403.vue"),
    meta: {
      hidden: true
    }
  },
  {
    path: "/404",
    component: () => import("@/views/error-page/404.vue"),
    meta: {
      hidden: true
    },
    alias: "/:pathMatch(.*)*"
  },
  {
    // 登录页放到后面，避免影响用户使用
    path: "/login",
    component: () => import("@/views/login/index.vue"),
    meta: {
      hidden: true
    }
  },
  {
    path: "/Dashboard",
    component: Layout,
    children: [
      {
        path: "dashboard",
        component: () => import("@/views/dashboard/index.vue"),
        name: "Dashboard",
        meta: {
          title: "免责声明",
          svgIcon: "dashboard",
          affix: true
        }
      }
    ]
  },
  {
    path: "/",
    component: Layout,
    children: [
      {
        path: "",
        component: () => import("@/views/menu/menu99/index.vue"),
        name: "Mene99",
        meta: {
          title: "计算器",
          svgIcon: "dashboard"
        }
      }
    ]
  },
  {
    path: "/",
    component: Layout,
    name: "Menu",
    meta: {
      title: "AI工具",
      svgIcon: "menu"
    },
    children: [
      {
        path: "menu1",
        component: () => import("@/views/menu/menu1/index.vue"),
        redirect: "/menu/menu1/menu1-1",
        name: "Menu1",
        meta: {
          title: "AI问答"
        },
        children: [
          {
            path: "menu1-1",
            component: () => import("@/views/menu/menu1/menu1-1/index.vue"),
            name: "Menu1-1",
            meta: {
              title: "GPT"
            }
          },
          {
            path: "menu1-2",
            component: () => import("@/views/menu/menu1/menu1-2/index.vue"),
            name: "Menu1-2",
            meta: {
              title: "备用GPT"
            }
          }
        ]
      },
      {
        path: "menu2",
        component: () => import("@/views/menu/menu2/index.vue"),
        redirect: "/menu/menu2/menu2-1",
        name: "Menu2",
        meta: {
          title: "AI图片"
        },
        children: [
          {
            path: "menu2-1",
            component: () => import("@/views/menu/menu2/menu2-1/index.vue"),
            name: "Menu2-1",
            meta: {
              title: "备用AI图片"
            }
          },
          {
            path: "menu2-2",
            component: () => import("@/views/menu/menu2/menu2-2/index.vue"),
            name: "Menu2-2",
            meta: {
              title: "备用AI图片"
            }
          }
        ]
      },
      {
        path: "menu3",
        component: () => import("@/views/menu/menu3/index.vue"),
        name: "Menu3",
        meta: {
          title: "AI头像"
        }
      }
    ]
  }
]

/**
 * 动态路由
 * 用来放置有权限 (Roles 属性) 的路由
 * 必须带有 Name 属性
 */
export const asyncRoutes: RouteRecordRaw[] = [
  {
    path: "/:pathMatch(.*)*", // Must put the 'ErrorPage' route at the end, 必须将 'ErrorPage' 路由放在最后
    redirect: "/404",
    name: "ErrorPage",
    meta: {
      hidden: true
    }
  }
]

const router = createRouter({
  history:
    import.meta.env.VITE_ROUTER_HISTORY === "hash"
      ? createWebHashHistory(import.meta.env.VITE_PUBLIC_PATH)
      : createWebHistory(import.meta.env.VITE_PUBLIC_PATH),
  routes: constantRoutes
})

/** 重置路由 */
export function resetRouter() {
  // 注意：所有动态路由路由必须带有 Name 属性，否则可能会不能完全重置干净
  try {
    router.getRoutes().forEach((route) => {
      const { name, meta } = route
      if (name && meta.roles?.length) {
        router.hasRoute(name) && router.removeRoute(name)
      }
    })
  } catch {
    // 强制刷新浏览器也行，只是交互体验不是很好
    window.location.reload()
  }
}

export default router
