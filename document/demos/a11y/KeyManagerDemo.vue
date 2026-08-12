<script setup lang="ts">
import {onBeforeUnmount, ref, shallowRef} from 'vue';
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
  makeItem('5', '关于'),
  makeItem('6', '设置'),
]);

const wrap = ref(true);
const homeEnd = ref(true);
const pageUpDown = ref(false);
const typeahead = ref(true);
const vertical = ref(true);
const horizontal = ref<'off' | 'ltr' | 'rtl'>('off');

/** 选项均为运行时可配置，变更后重建 manager 使全部配置生效。 */
function createManager(): ListKeyManager<Item> {
  const next = new ListKeyManager<Item>(items)
    .withWrap(wrap.value)
    .withHomeAndEnd(homeEnd.value)
    .withPageUpDown(pageUpDown.value)
    .withVerticalOrientation(vertical.value);
  if (horizontal.value !== 'off') {
    next.withHorizontalOrientation(horizontal.value);
  }
  if (typeahead.value) {
    next.withTypeAhead();
  }
  return next;
}

const manager = shallowRef(createManager());

function rebuild(): void {
  manager.value.destroy();
  manager.value = createManager();
}

function onKeydown(event: KeyboardEvent): void {
  manager.value.onKeydown(event);
}

onBeforeUnmount(() => manager.value.destroy());
</script>

<template>
  <div class="wrap">
    <div class="options">
      <label class="check">
        <input v-model="wrap" type="checkbox" @change="rebuild" />
        withWrap（循环）
      </label>
      <label class="check">
        <input v-model="homeEnd" type="checkbox" @change="rebuild" />
        withHomeAndEnd
      </label>
      <label class="check">
        <input v-model="pageUpDown" type="checkbox" @change="rebuild" />
        withPageUpDown
      </label>
      <label class="check">
        <input v-model="typeahead" type="checkbox" @change="rebuild" />
        withTypeAhead（字母定位）
      </label>
      <label class="check">
        <input v-model="vertical" type="checkbox" @change="rebuild" />
        垂直方向键
      </label>
      <label class="field">
        水平方向键
        <select v-model="horizontal" class="doc-input" @change="rebuild">
          <option value="off">关闭</option>
          <option value="ltr">LTR</option>
          <option value="rtl">RTL</option>
        </select>
      </label>
    </div>

    <div class="play">
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
      <div class="doc-output">
        {{ manager.activeItem ? `活动项：${manager.activeItem.label}` : '尚未激活' }}
      </div>
    </div>
    <p class="hint">
      点击列表后使用方向键导航；Home/End、PageUp/PageDown 与字母快速定位按开关生效，禁用项自动跳过。
    </p>
  </div>
</template>

<style scoped>
.wrap {
  width: 100%;
}

.options {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.check,
.field {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--doc-muted);
}

.play {
  display: flex;
  gap: 16px;
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
