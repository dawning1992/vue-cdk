<script setup lang="ts">
import {onBeforeUnmount, ref} from 'vue';
import {ActiveDescendantKeyManager, type Highlightable} from 'vue-cdk/a11y';

interface Option extends Highlightable {
  id: string;
  label: string;
}

/** 活动项 id 用于同步 aria-activedescendant 与高亮样式。 */
const activeId = ref('');

function makeOption(id: string, label: string): Option {
  return {
    id,
    label,
    getLabel: () => label,
    setActiveStyles: () => {
      activeId.value = id;
    },
    setInactiveStyles: () => {
      if (activeId.value === id) {
        activeId.value = '';
      }
    },
  };
}

const options = ref<Option[]>([
  makeOption('apple', '苹果'),
  makeOption('banana', '香蕉'),
  makeOption('cherry', '樱桃'),
  makeOption('durian', '榴莲'),
]);

const manager = new ActiveDescendantKeyManager(options).withWrap().withTypeAhead();
const open = ref(false);

function onFocus(): void {
  open.value = true;
  manager.setActiveItem(0);
}

function onBlur(): void {
  open.value = false;
}

function onKeydown(event: KeyboardEvent): void {
  manager.onKeydown(event);
}

onBeforeUnmount(() => manager.destroy());
</script>

<template>
  <div class="wrap">
    <div class="combobox">
      <input
        class="doc-input"
        role="combobox"
        :aria-expanded="open"
        :aria-activedescendant="activeId ? `ad-${activeId}` : undefined"
        aria-controls="ad-listbox"
        placeholder="聚焦后使用 ↑ ↓ 选择（可输入字母）"
        @focus="onFocus"
        @blur="onBlur"
        @keydown="onKeydown"
      />
      <ul v-if="open" id="ad-listbox" class="listbox" role="listbox">
        <li
          v-for="option in options"
          :id="`ad-${option.id}`"
          :key="option.id"
          role="option"
          :aria-selected="activeId === option.id"
          :class="{active: activeId === option.id}"
        >
          {{ option.label }}
        </li>
      </ul>
    </div>
    <p class="hint">
      aria-activedescendant = {{ activeId ? `ad-${activeId}` : '（无）' }}；activeId 由条目自身的 setActiveStyles / setInactiveStyles 维护。
    </p>
  </div>
</template>

<style scoped>
.wrap {
  width: 100%;
}

.combobox {
  position: relative;
  width: 240px;
}

.combobox .doc-input {
  width: 100%;
}

.listbox {
  list-style: none;
  margin: 4px 0 0;
  padding: 4px;
  background: #fff;
  border: 1px solid var(--doc-border);
  border-radius: 8px;
  box-shadow: var(--doc-shadow);
}

.listbox li {
  padding: 7px 12px;
  border-radius: 6px;
  font-size: 14px;
}

.listbox li.active {
  background: var(--doc-primary);
  color: #fff;
}

.hint {
  margin: 10px 0 0;
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
