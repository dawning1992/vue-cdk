<script setup lang="ts">
import {onBeforeUnmount, ref} from 'vue';
import {FocusKeyManager, type FocusableOption} from 'vue-cdk/a11y';

interface Item extends FocusableOption {
  id: string;
  label: string;
}

function makeItem(id: string, label: string, disabled = false): Item {
  return {
    id,
    label,
    disabled,
    getLabel: () => label,
    // 活动项变化时由 FocusKeyManager 调用，把真实焦点移到对应 DOM 元素。
    focus: () => document.getElementById(`fkm-${id}`)?.focus(),
  };
}

const items = ref<Item[]>([
  makeItem('home', '首页'),
  makeItem('docs', '文档'),
  makeItem('demo', '示例', true),
  makeItem('about', '关于'),
]);

const manager = new FocusKeyManager(items).withWrap().withHomeAndEnd();
const log = ref('准备就绪：点击列表后用方向键导航。');

manager.change.subscribe(index => {
  const item = index >= 0 ? items.value[index] : null;
  log.value = item ? `change：活动项切换为「${item.label}」（已调用 focus()）` : 'change：无活动项';
});
manager.tabOut.subscribe(() => {
  log.value = 'tabOut：按 Tab 焦点已移出列表';
});

function onKeydown(event: KeyboardEvent): void {
  // 键盘交互产生的活动项变化以 keyboard 作为聚焦来源。
  manager.setFocusOrigin('keyboard');
  manager.onKeydown(event);
}

onBeforeUnmount(() => manager.destroy());
</script>

<template>
  <div class="wrap">
    <ul class="list" tabindex="0" @keydown="onKeydown">
      <li
        v-for="(item, index) in items"
        :id="`fkm-${item.id}`"
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
    <div class="doc-output">{{ log }}</div>
    <p class="hint">
      与 ListKeyManager 的差别：活动项变化时自动调用条目的 focus()，真实移动焦点；Tab 触发 tabOut。
    </p>
  </div>
</template>

<style scoped>
.wrap {
  width: 100%;
}

.list {
  list-style: none;
  margin: 0 0 12px;
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
