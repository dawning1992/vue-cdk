<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** tab 配置，默认示例 + API 文档。 */
    tabs?: readonly {key: string; label: string}[];
    /** 当前激活的 tab key。 */
    modelValue?: string;
  }>(),
  {
    tabs: () => [
      {key: 'demo', label: '示例'},
      {key: 'api', label: 'API 文档'},
    ],
    modelValue: 'demo',
  },
);

const emit = defineEmits<{(e: 'update:modelValue', value: string): void}>();
</script>

<template>
  <div class="doc-tabs" role="tablist">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      type="button"
      class="tab-btn"
      :class="{active: tab.key === props.modelValue}"
      role="tab"
      :aria-selected="tab.key === props.modelValue"
      @click="emit('update:modelValue', tab.key)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<style scoped>
.doc-tabs {
  display: flex;
  gap: 4px;
  margin: 20px 0 18px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--doc-border);
}

.tab-btn {
  appearance: none;
  border: none;
  background: transparent;
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  color: var(--doc-muted);
}

.tab-btn:hover {
  background: var(--doc-primary-soft);
  color: var(--doc-text);
}

.tab-btn.active {
  background: var(--doc-primary);
  color: #fff;
}
</style>
