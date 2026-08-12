<script setup lang="ts">
import {computed, onBeforeUnmount, ref, watch} from 'vue';
import {ActiveDescendantKeyManager, type Highlightable} from 'vue-cdk/a11y';
import {VConnectedOverlay, VOverlayOrigin} from 'vue-cdk/overlay';

/** 自动补全选项：id 供 aria-activedescendant 引用，active 由管理器样式回调维护。 */
interface CityOption extends Highlightable {
  id: string;
  label: string;
  active: boolean;
  getLabel(): string;
}

/** 构造城市选项；高亮通过 setActiveStyles / setInactiveStyles 切换。 */
function makeCity(id: string, label: string): CityOption {
  return {
    id,
    label,
    active: false,
    getLabel: () => label,
    setActiveStyles() {
      this.active = true;
    },
    setInactiveStyles() {
      this.active = false;
    },
  };
}

const open = ref(false);
const query = ref('');

const cities = ref<CityOption[]>([
  makeCity('beijing', '北京'),
  makeCity('shanghai', '上海'),
  makeCity('guangzhou', '广州'),
  makeCity('shenzhen', '深圳'),
  makeCity('hangzhou', '杭州'),
  makeCity('nanjing', '南京'),
  makeCity('chengdu', '成都'),
  makeCity('wuhan', '武汉'),
  makeCity('xian', '西安'),
  makeCity('suzhou', '苏州'),
]);

const listboxId = 'doc-autocomplete-listbox';

/** 过滤结果即键盘管理器的条目源：列表变化时管理器自动同步活动项。 */
const filtered = computed(() =>
  cities.value.filter(city => city.label.includes(query.value || '')),
);

const manager = new ActiveDescendantKeyManager(filtered).withWrap().withHomeAndEnd();

/** 当前活动项对应的 option id，供 combobox 的 aria-activedescendant 指向。 */
const activeOptionId = computed(() =>
  manager.activeItemIndex >= 0 ? `doc-autocomplete-option-${manager.activeItemIndex}` : undefined,
);

function choose(city: CityOption) {
  query.value = city.label;
  open.value = false;
}

/**
 * 输入框键盘处理。
 *
 * 只在输入框上监听：若同时绑定 @overlay-keydown，同一事件会被输入框处理器与
 * overlay 键盘分发器各处理一次，导致活动项一次跳两位。
 * - 关闭时 ArrowDown/ArrowUp 打开并激活首/末项；
 * - 打开时方向键/Home/End 交给 manager，Enter 选中活动项；
 * - ESC 不在此拦截，交由 VConnectedOverlay 内置逻辑关闭。
 */
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown' && !open.value) {
    event.preventDefault();
    open.value = true;
    manager.setFirstItemActive();
    return;
  }
  if (event.key === 'ArrowUp' && !open.value) {
    event.preventDefault();
    open.value = true;
    manager.setLastItemActive();
    return;
  }
  if (event.key === 'Enter') {
    const item = manager.activeItem;
    if (open.value && item) {
      event.preventDefault();
      choose(item);
    }
    return;
  }
  manager.onKeydown(event);
}

// 查询变化后活动项可能已被过滤掉，统一复位，避免索引越界。
watch(query, () => manager.setActiveItem(-1));

// 关闭（ESC/外部点击/选中）后复位高亮，下次打开重新开始。
watch(open, value => {
  if (!value) {
    manager.setActiveItem(-1);
  }
});

onBeforeUnmount(() => manager.destroy());
</script>

<template>
  <div class="wrap">
    <p class="hint">
      输入关键字过滤城市列表；<code>match-width</code> 让面板宽度与输入框一致，
      <code>ActiveDescendantKeyManager</code> 驱动 <code>aria-activedescendant</code>，
      支持 ↑/↓/Home/End 选择、Enter 确认、ESC 关闭。
    </p>
    <VOverlayOrigin>
      <input
        v-model="query"
        class="doc-input"
        placeholder="输入城市名，如「京」"
        role="combobox"
        aria-autocomplete="list"
        :aria-expanded="open"
        :aria-controls="listboxId"
        :aria-activedescendant="activeOptionId"
        @focus="open = true"
        @keydown="onKeydown"
      />
      <VConnectedOverlay
        :open="open && filtered.length > 0"
        match-width
        :positions="[{originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top'}]"
        @overlay-outside-click="open = false"
        @update:open="open = $event"
      >
        <ul :id="listboxId" class="listbox" role="listbox">
          <li
            v-for="(city, index) in filtered"
            :key="city.id"
            :id="`doc-autocomplete-option-${index}`"
            role="option"
            :aria-selected="city.active"
            :class="{active: city.active}"
            @mousedown.prevent="choose(city)"
          >
            {{ city.label }}
          </li>
          <li v-if="filtered.length === 0" class="empty">无匹配结果</li>
        </ul>
      </VConnectedOverlay>
    </VOverlayOrigin>
  </div>
</template>

<style scoped>
.wrap {
  width: 100%;
}

.hint {
  margin: 0 0 12px;
  color: var(--doc-muted);
  font-size: 13px;
}

.listbox {
  list-style: none;
  margin: 0;
  padding: 6px;
  min-width: 100%;
  max-height: 240px;
  overflow: auto;
  background: #fff;
  border: 1px solid var(--doc-border);
  border-radius: 8px;
  box-shadow: var(--doc-shadow);
}

.listbox li {
  padding: 7px 12px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--doc-text);
  cursor: pointer;
}

.listbox li.active {
  background: var(--doc-primary-soft);
  color: var(--doc-primary);
}

.listbox .empty {
  color: var(--doc-muted);
  cursor: default;
}
</style>
