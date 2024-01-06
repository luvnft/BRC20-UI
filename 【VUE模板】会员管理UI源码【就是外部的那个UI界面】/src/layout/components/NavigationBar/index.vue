<script lang="ts" setup>
import { computed } from "vue"
import { useAppStore } from "@/store/modules/app"
import { useUserStore } from "@/store/modules/user"
import { UserFilled } from "@element-plus/icons-vue"
import Breadcrumb from "../Breadcrumb/index.vue"
import Hamburger from "../Hamburger/index.vue"

const appStore = useAppStore()
const userStore = useUserStore()

const sidebar = computed(() => {
  return appStore.sidebar
})

const toggleSidebar = () => {
  appStore.toggleSidebar(false)
}
</script>

<template>
  <div class="navigation-bar">
    <Hamburger :is-active="sidebar.opened" class="hamburger" @toggle-click="toggleSidebar" />
    <Breadcrumb class="breadcrumb" />
    <div class="right-menu">
      <el-dropdown class="right-menu-item">
        <div class="right-menu-avatar">
          <el-avatar :icon="UserFilled" :size="30" />
          <span>{{ userStore.username }}</span>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <a target="_blank" href="https://twitter.com/BithomeSwap">
              <el-dropdown-item>联系我们</el-dropdown-item>
            </a>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.navigation-bar {
  height: var(--v3-navigationbar-height);
  overflow: hidden;
  background: #fff;
  .hamburger {
    display: flex;
    align-items: center;
    height: 100%;
    float: left;
    padding: 0 15px;
    cursor: pointer;
  }
  .breadcrumb {
    float: left;
    // 参考 Bootstrap 的响应式设计 WIDTH = 576
    @media screen and (max-width: 576px) {
      display: none;
    }
  }
  .right-menu {
    float: right;
    margin-right: 10px;
    height: 100%;
    display: flex;
    align-items: center;
    color: #606266;
    .right-menu-item {
      padding: 0 10px;
      cursor: pointer;
      .right-menu-avatar {
        display: flex;
        align-items: center;
        .el-avatar {
          margin-right: 10px;
        }
        span {
          font-size: 16px;
        }
      }
    }
  }
}
</style>
