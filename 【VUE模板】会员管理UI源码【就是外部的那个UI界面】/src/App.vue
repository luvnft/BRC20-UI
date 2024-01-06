<script lang="ts" setup>
import { useTheme } from "@/hooks/useTheme"
const { initTheme } = useTheme()
/** 初始化主题 */
initTheme()
import { ElNotification } from "element-plus"
import { h } from "vue"
ElNotification({
  title: "记住地址不迷路：https://bithome.top",
  message: h(
    "a",
    { style: "color: teal", target: "_blank", href: "https://t.zsxq.com/0fj2rWnlJ" },
    "小哥哥，小姐姐，加入我的知识星球吧，你的赞赏是我最大的动力"
  ),
  duration: 0,
  position: "bottom-right"
})
</script>

<template>
  <ElConfigProvider>
    <router-view />
  </ElConfigProvider>
</template>
