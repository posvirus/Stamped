<script setup>

</script>

<template>
  <div id="app">
    <!-- Vue Router 页面容器 -->
    <router-view />
    

  </div>
</template>

<style>
#app {
  /* 移动端适配 */
  width: 100%;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: var(--bg-color);
  color: var(--text-primary);
}

/* 确保移动端触摸优化 */
* {
  -webkit-tap-highlight-color: transparent;
}
</style>
