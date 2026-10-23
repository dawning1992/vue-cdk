<script setup lang="ts">
import type {ListKeyManager} from 'vue-cdk/a11y';

interface MenuItem {label: string; getLabel(): string; action(): void}
const props = defineProps<{items: MenuItem[]; manager: ListKeyManager<MenuItem>; onChoose: (item: MenuItem) => void}>();
</script>

<template>
  <div class="doc-ctx-menu">
    <div
      v-for="(item, index) in props.items"
      :key="item.label"
      class="doc-ctx-item"
      :class="{active: index === props.manager.activeItemIndex}"
      @mouseenter="props.manager.setActiveItem(index)"
      @click="props.onChoose(item)"
    >
      {{ item.label }}
    </div>
  </div>
</template>

<style>
.doc-ctx-menu { min-width: 140px; padding: 6px; background: #fff; border: 1px solid var(--doc-border); border-radius: 8px; box-shadow: var(--doc-shadow); user-select: none; }
.doc-ctx-item { padding: 7px 14px; border-radius: 6px; font-size: 13px; color: var(--doc-text); cursor: pointer; }
.doc-ctx-item:hover, .doc-ctx-item.active { background: var(--doc-primary-soft); color: var(--doc-primary); }
</style>
