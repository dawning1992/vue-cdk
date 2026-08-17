<script setup lang="ts">
import {onUnmounted, ref} from 'vue';
import {BreakpointObserver} from 'vue-cdk/layout';

const observer = new BreakpointObserver();
const state = ref('等待初始状态');
const subscription = observer.observe(['(orientation: portrait)', '(prefers-reduced-motion: reduce)'])
  .subscribe(value => {
    state.value = JSON.stringify(value, null, 2);
  });

onUnmounted(() => {
  subscription.unsubscribe();
  observer.destroy();
});
</script>

<template>
  <div>
    <p class="hint">命令式 API 适合组件外服务；它保留 observe(...).subscribe(...) 调用形态。</p>
    <pre class="doc-output">{{ state }}</pre>
  </div>
</template>

<style scoped>
.hint { margin-top: 0; color: var(--doc-muted); font-size: 13px; }
.doc-output { white-space: pre-wrap; }
</style>

