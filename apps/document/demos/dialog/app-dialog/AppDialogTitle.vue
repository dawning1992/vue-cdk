<script setup lang="ts">
defineProps<{
  /** 可选标题元素 id；传入时可用于 DialogConfig.ariaLabelledBy。 */
  id?: string;
}>();
</script>

<template>
  <h2 :id="id" class="app-dialog-title"><slot /></h2>
</template>

<style scoped>
.app-dialog-title {
  margin: 0;
  padding: 22px 24px 12px;
  color: var(--doc-text);
  font-size: 18px;
  line-height: 1.35;
}
</style>
