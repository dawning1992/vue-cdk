<script setup lang="ts">
import {onBeforeUnmount, ref} from 'vue';
import {
  ActiveDescendantKeyManager,
  FocusKeyManager,
  ListKeyManager,
  type FocusOrigin,
  type ListKeyManagerOption,
} from 'vue-cdk/a11y';

defineProps<{id?: string}>();

interface ListItem extends ListKeyManagerOption {
  id: string;
  label: string;
  disabled?: boolean;
  getLabel(): string;
}

/** 可高亮条目：ActiveDescendant 场景使用。 */
interface HighlightItem extends ListItem {
  active: boolean;
  setActiveStyles(): void;
  setInactiveStyles(): void;
}

/** 可聚焦条目：FocusKeyManager 场景使用。 */
interface FocusItem extends ListItem {
  focus(origin?: FocusOrigin): void;
}

function makeItem(id: string, label: string, disabled = false): ListItem {
  return {id, label, disabled, getLabel: () => label};
}

function makeHighlightable(id: string, label: string): HighlightItem {
  return {
    id,
    label,
    getLabel: () => label,
    active: false,
    setActiveStyles() {
      this.active = true;
    },
    setInactiveStyles() {
      this.active = false;
    },
  };
}

/**
 * 点击条目时激活该项，并把焦点交给所在列表容器。
 *
 * 条目上的 `mousedown.prevent` 会阻止 li 抢占焦点，但默认的焦点转移
 * （聚焦可聚焦祖先）同样被阻止，导致点击后焦点停留在 body，方向键事件
 * 派发不到容器的 keydown 监听器，表现为页面滚动而非列表导航。
 * 这里在阻止默认行为后显式 focus 容器，保证点击后即可用方向键导航。
 */
function selectItemWithFocus(
  manager: {setActiveItem(index: number): void},
  event: MouseEvent,
  index: number,
): void {
  manager.setActiveItem(index);
  (event.currentTarget as HTMLElement).closest('ul')?.focus();
}

// 场景一：垂直导航 + 换行 + 禁用项 + Home/End + PageUp/Down + typeahead。
const menuItems = ref<ListItem[]>([
  makeItem('apple', 'Apple'),
  makeItem('banana', 'Banana'),
  makeItem('cherry', 'Cherry', true),
  makeItem('date', 'Date'),
  makeItem('elderberry', 'Elderberry'),
  makeItem('fig', 'Fig'),
  makeItem('grape', 'Grape'),
  makeItem('honeydew', 'Honeydew'),
  makeItem('kiwi', 'Kiwi'),
  makeItem('lemon', 'Lemon'),
]);
const menuManager = new ListKeyManager(menuItems)
  .withWrap()
  .withHomeAndEnd()
  .withPageUpDown(true, 3)
  .withTypeAhead();
const lastMenuAction = ref('未操作');
menuManager.change.subscribe(index => {
  lastMenuAction.value = `change → ${menuItems.value[index]?.label ?? index}`;
});
menuManager.tabOut.subscribe(() => {
  lastMenuAction.value = 'tabOut（焦点离开列表）';
});

function onMenuKeydown(event: KeyboardEvent): void {
  menuManager.onKeydown(event);
}

// 场景二：水平方向 + RTL（方向键相反）。
const horizontalItems = ref<ListItem[]>([
  makeItem('h1', '一'),
  makeItem('h2', '二'),
  makeItem('h3', '三'),
  makeItem('h4', '四'),
]);
const horizontalManager = new ListKeyManager(horizontalItems)
  .withVerticalOrientation(false)
  .withHorizontalOrientation('rtl');

function onHorizontalKeydown(event: KeyboardEvent): void {
  horizontalManager.onKeydown(event);
}

// 场景三：ActiveDescendant（aria-activedescendant + 高亮样式切换）。
const listboxItems = ref<HighlightItem[]>([
  makeHighlightable('l1', '第一项'),
  makeHighlightable('l2', '第二项'),
  makeHighlightable('l3', '第三项'),
  makeHighlightable('l4', '第四项'),
]);
const listboxManager = new ActiveDescendantKeyManager(listboxItems)
  .withWrap()
  .withHomeAndEnd();

function onListboxKeydown(event: KeyboardEvent): void {
  listboxManager.onKeydown(event);
}

// 场景四：FocusKeyManager（焦点跟随活动项）。
const focusElements: HTMLElement[] = [];

function makeFocusItem(id: string, label: string): FocusItem {
  const item: FocusItem = {
    ...makeItem(id, label),
    focus: () => undefined,
  };
  item.focus = () => focusElements[focusButtons.value.indexOf(item)]?.focus();
  return item;
}

const focusButtons = ref<FocusItem[]>([
  makeFocusItem('f1', '按钮 A'),
  makeFocusItem('f2', '按钮 B'),
  makeFocusItem('f3', '按钮 C'),
]);
// 同时启用垂直与水平方向，使 ↑↓/←→ 均可导航，与下方提示文案保持一致。
const focusManager = new FocusKeyManager(focusButtons)
  .withWrap()
  .withHorizontalOrientation('ltr');

function onFocusKeydown(event: KeyboardEvent): void {
  focusManager.onKeydown(event);
}

onBeforeUnmount(() => {
  menuManager.destroy();
  horizontalManager.destroy();
  listboxManager.destroy();
  focusManager.destroy();
});
</script>

<template>
  <section :id="id" class="section">
    <h2>键盘导航<span class="badge">ListKeyManager 系列</span></h2>
    <p class="desc">
      基于 Angular CDK ListKeyManager / ActiveDescendantKeyManager / FocusKeyManager：
      点击列表后使用 ↑↓、←→、Home/End、PageUp/PageDown、Tab 与字母 typeahead 体验导航。
      Cherry 为禁用项（默认跳过）。
    </p>

    <div class="demo-grid">
      <div class="demo-card">
        <h3>垂直导航 + 换行 + typeahead</h3>
        <ul class="k-list" tabindex="0" role="listbox" @keydown="onMenuKeydown">
          <li
            v-for="(item, index) in menuItems"
            :key="item.id"
            role="option"
            :class="[
              'k-item',
              {active: index === menuManager.activeItemIndex, disabled: item.disabled},
            ]"
            @mousedown.prevent="selectItemWithFocus(menuManager, $event, index)"
          >
            {{ item.label }}<span v-if="item.disabled" class="tag">禁用</span>
          </li>
        </ul>
        <p class="hint">
          方向键/字母导航；Home/End 跳首尾；PageUp/Down 步进 3；输入首字母筛选；
          Tab 触发 tabOut。最近事件：{{ lastMenuAction }}
        </p>
      </div>

      <div class="demo-card">
        <h3>水平方向（RTL，方向键相反）</h3>
        <ul class="k-row" dir="rtl" tabindex="0" @keydown="onHorizontalKeydown">
          <li
            v-for="(item, index) in horizontalItems"
            :key="item.id"
            :class="['k-chip', {active: index === horizontalManager.activeItemIndex}]"
            @mousedown.prevent="selectItemWithFocus(horizontalManager, $event, index)"
          >
            {{ item.label }}
          </li>
        </ul>
        <p class="hint">RTL 下 ← 前进、→ 后退，验证 withHorizontalOrientation('rtl')。</p>
      </div>

      <div class="demo-card">
        <h3>ActiveDescendant 列表</h3>
        <ul
          class="k-list"
          tabindex="0"
          role="listbox"
          aria-activedescendant="listbox-active"
          @keydown="onListboxKeydown"
        >
          <li
            v-for="(item, index) in listboxItems"
            :key="item.id"
            :id="index === listboxManager.activeItemIndex ? 'listbox-active' : undefined"
            role="option"
            :class="['k-item', {active: item.active}]"
            @mousedown.prevent="selectItemWithFocus(listboxManager, $event, index)"
          >
            {{ item.label }}
          </li>
        </ul>
        <p class="hint">活动项通过 setActiveStyles / setInactiveStyles 切换高亮。</p>
      </div>

      <div class="demo-card">
        <h3>FocusKeyManager（焦点跟随）</h3>
        <div class="k-row" tabindex="0" @keydown="onFocusKeydown">
          <button
            v-for="(item, index) in focusButtons"
            :key="item.id"
            class="btn"
            :class="{active: index === focusManager.activeItemIndex}"
            :ref="el => el && focusElements.splice(index, 1, el as HTMLElement)"
            @click="focusManager.setActiveItem(index)"
          >
            {{ item.label }}
          </button>
        </div>
        <p class="hint">←→/↑↓ 移动时自动调用条目 focus()，焦点跟随活动项。</p>
      </div>
    </div>
  </section>
</template>
