<script setup lang="ts">
defineProps<{label: string}>();
</script>

<template>
  <div class="strategy-panel">
    <strong>当前策略：{{ label }}</strong>
    <p>现在滚动列表内容（锚点行）或页面观察行为变化。</p>
  </div>
</template>

<style scoped>
.strategy-panel { min-width: 200px; padding: 14px 16px; background: #fff; border: 1px solid #e3e6ee; border-radius: 10px; box-shadow: 0 6px 20px rgba(31, 36, 48, 0.12); }
.strategy-panel strong { display: block; margin-bottom: 4px; font-size: 13px; }
.strategy-panel p { margin: 0; color: #6b7280; font-size: 12px; }
</style>
