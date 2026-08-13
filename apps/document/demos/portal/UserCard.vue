<script setup lang="ts">
import {inject} from 'vue';

/**
 * 被 Portal 挂载的组件内容（.vue 单文件组件）。
 *
 * 与 ComponentPortalDemo 中内联 defineComponent 等价：经 ComponentPortal
 * 挂载后，props 正常传入，inject 仍能读取 app 级 provide，scoped 样式
 * 由构建工具按组件作用域生效。
 */
withDefaults(
  defineProps<{
    /** 用户名。 */
    name: string;
    /** 用户等级，默认 1。 */
    level?: number;
  }>(),
  {level: 1},
);

const appName = inject<string>('vue-cdk-doc-app', '未知应用');
</script>

<template>
  <div class="portal-card">
    <p class="card-title">你好，{{ name }}</p>
    <p class="card-meta">Lv.{{ level }} · 应用级 provide：{{ appName }}</p>
  </div>
</template>

<style scoped>
.portal-card {
  padding: 10px 14px;
  background: #fff;
  border: 1px solid #e3e6ee;
  border-radius: 8px;
}

.card-title {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
}

.card-meta {
  margin: 0;
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
