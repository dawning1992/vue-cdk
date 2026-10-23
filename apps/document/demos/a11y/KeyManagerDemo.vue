<script setup lang="ts">
import {onBeforeUnmount, ref, shallowRef, watch} from 'vue';
import {ListKeyManager, type ListKeyManagerOption} from 'vue-cdk/a11y';
import {useLocale} from '../../composables/useLocale';

const {locale} = useLocale();

interface Item extends ListKeyManagerOption {
  id: string;
  label: string;
  labelZh: string;
  labelEn: string;
}

function makeItem(id: string, labelZh: string, labelEn: string, disabled = false): Item {
  const item: Item = {id, label: locale.value === 'en-US' ? labelEn : labelZh, labelZh, labelEn, disabled, getLabel: () => item.label};
  return item;
}

const items = ref<Item[]>([
  makeItem('1', '首页', 'Home'),
  makeItem('2', '文档', 'Docs'),
  makeItem('3', '示例', 'Demos', true),
  makeItem('4', '下载', 'Downloads'),
  makeItem('5', '关于', 'About'),
  makeItem('6', '设置', 'Settings'),
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

watch(locale, value => {
  items.value.forEach(item => {
    item.label = value === 'en-US' ? item.labelEn : item.labelZh;
  });
});

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
        {{ locale === 'en-US' ? 'withWrap (loop)' : 'withWrap（循环）' }}
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
        {{ locale === 'en-US' ? 'withTypeAhead (typeahead)' : 'withTypeAhead（字母定位）' }}
      </label>
      <label class="check">
        <input v-model="vertical" type="checkbox" @change="rebuild" />
        {{ locale === 'en-US' ? 'Vertical arrow keys' : '垂直方向键' }}
      </label>
      <label class="field">
        {{ locale === 'en-US' ? 'Horizontal arrow keys' : '水平方向键' }}
        <select v-model="horizontal" class="doc-input" @change="rebuild">
          <option value="off">{{ locale === 'en-US' ? 'Off' : '关闭' }}</option>
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
        {{ manager.activeItem ? (locale === 'en-US' ? `Active item: ${manager.activeItem.label}` : `活动项：${manager.activeItem.label}`) : (locale === 'en-US' ? 'No active item' : '尚未激活') }}
      </div>
    </div>
    <p class="hint">
      {{ locale === 'en-US' ? 'Focus the list and navigate with arrow keys. Home/End, PageUp/PageDown, and typeahead follow the toggles; disabled items are skipped.' : '点击列表后使用方向键导航；Home/End、PageUp/PageDown 与字母快速定位按开关生效，禁用项自动跳过。' }}
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
