<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App',
  mounted() {
    this.$notify({
      title: "记住地址不迷路：https://bithome.top",
      message: this.$createElement(
        "a",
        {
          style: "color: teal",
          attrs: { target: "_blank", href: "https://t.zsxq.com/0fj2rWnlJ" },
        },
        "兄台我观您骨骼清奇，欢迎加入知识星球，获取实盘源码，练就绝世武功。"
      ),
      duration: 0,
      position: "bottom-right",
    });
  },
}
</script>
