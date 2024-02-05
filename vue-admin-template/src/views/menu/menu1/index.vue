<template>
  <router-view />
</template>
<style>
iframe {
  width: 100vw; /* 视口宽度的100%，平时的100%其实是父元素的100%不如直接用窗口稳定*/
  height: 100vh; /* 视口高度的100%，平时的100%其实是父元素的100%不如直接用窗口稳定*/
  border: none;
}
</style>
