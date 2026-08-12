<script setup lang="ts">
import {onBeforeUnmount, ref} from 'vue';
import {ListKeyManager, type ListKeyManagerOption} from 'vue-cdk/a11y';

interface Item extends ListKeyManagerOption {
  id: string;
  label: string;
}

function makeItem(id: string, label: string, disabled = false): Item {
  return {id, label, disabled, getLabel: () => label};
}

const items = ref<Item[]>([
  makeItem('1', '首页'),
  makeItem('2', '文档'),
  makeItem('3', '示例', true),
  makeItem('4', '下载'),
]);

/** 支持循环与拼音首字母快速定位。 */
const manager = new ListKeyManager(items).withWrap().withTypeAhead();

function onKeydown(event: KeyboardEvent): void {
  manager.onKeydown(event);
}

onBeforeUnmount(() => manager.destroy());
</script>

<template>
  <div class="wrap">
    <ul class="list" tabindex="0" @keydown="onKeydown">
      <li
        v-for="(item, index) in items"
        :key="item.id"
        :class="{
          active: index === manager.activeItemIndex,
          disabled: item.disabled,
        }"
        @click="manager.setActiveItem(index)"
      >
        {{ item.label }}
      </li>
    </ul>
    <p class="hint">点击列表后使用 ↑ ↓ 方向键导航（Home/End、字母快速定位均可用）。</p>
  </div>
</template>

<style scoped>
.wrap {
  width: 100%;
}

.list {
  list-style: none;
  margin: 0;
  padding: 4px;
  width: 180px;
  background: #fff;
  border: 1px solid var(--doc-border);
  border-radius: 8px;
  outline: none;
}

.list li {
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.list li.active {
  background: var(--doc-primary);
  color: #fff;
}

.list li.disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.hint {
  margin: 10px 0 0;
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
