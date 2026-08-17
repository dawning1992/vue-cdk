<script setup lang="ts">
import {computed} from 'vue';
import {Breakpoints, useBreakpoints} from 'vue-cdk/layout';

// effectScope 会在组件卸载时自动退订，无需手工移除 matchMedia 监听。
const {matches: isHandset, breakpoints} = useBreakpoints(Breakpoints.Handset);
const {matches: isWide} = useBreakpoints([Breakpoints.Large, Breakpoints.XLarge]);
const mode = computed(() => (isHandset.value ? '移动端' : isWide.value ? '宽屏桌面' : '常规屏幕'));
</script>

<template>
  <div class="layout-demo" :class="{compact: isHandset}">
    <aside>导航</aside>
    <main>
      <strong>当前模式：{{ mode }}</strong>
      <p>拖动浏览器宽度，布局和状态会随媒体查询实时更新。</p>
      <code>Handset = {{ isHandset }} · Large/XLarge = {{ isWide }}</code>
      <details>
        <summary>逐项状态</summary>
        <pre>{{ JSON.stringify(breakpoints, null, 2) }}</pre>
      </details>
    </main>
  </div>
</template>

<style scoped>
.layout-demo { display: grid; grid-template-columns: 140px 1fr; min-height: 170px; border: 1px solid var(--doc-border); border-radius: 10px; overflow: hidden; }
.layout-demo aside { padding: 18px; color: white; background: var(--doc-primary); }
.layout-demo main { padding: 18px; min-width: 0; }
.layout-demo p { color: var(--doc-muted); }
.layout-demo code { font-size: 12px; }
.layout-demo.compact { grid-template-columns: 1fr; }
.layout-demo.compact aside { padding: 10px 18px; }
details { margin-top: 16px; }
pre { overflow: auto; font-size: 11px; }
</style>

