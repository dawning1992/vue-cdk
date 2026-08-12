<script setup lang="ts">
import {onBeforeUnmount, ref, watch} from 'vue';
import {ListKeyManager, type ListKeyManagerOption} from 'vue-cdk/a11y';
import {STANDARD_DROPDOWN_BELOW_POSITIONS, VConnectedOverlay, VOverlayOrigin} from 'vue-cdk/overlay';

/** 菜单条目：getLabel 供 ListKeyManager 的 typeahead 能力使用。 */
interface MenuItem extends ListKeyManagerOption {
  label: string;
}

const rtl = ref(false);
const open = ref(false);
const selected = ref('首项（start 侧）');

const items = ref<MenuItem[]>([
  {label: '首项（start 侧）', getLabel: () => '首项（start 侧）'},
  {label: '中间项', getLabel: () => '中间项'},
  {label: '末项（end 侧）', getLabel: () => '末项（end 侧）'},
]);

/** RTL 仅镜像连接点与 transform-origin，竖向菜单的方向键行为不变。 */
const manager = new ListKeyManager(items).withWrap().withHomeAndEnd();
manager.tabOut.subscribe(() => (open.value = false));

function choose(item: MenuItem) {
  selected.value = item.label;
  open.value = false;
}

/** 触发器键盘：关闭时打开菜单（ArrowDown 同时激活首项），打开时拦截按钮二次切换。 */
function onTriggerKeydown(event: KeyboardEvent) {
  if (!open.value) {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      open.value = true;
      if (event.key === 'ArrowDown') {
        manager.setActiveItem(0);
      }
    }
    return;
  }

  if (
    event.key === 'ArrowDown' ||
    event.key === 'ArrowUp' ||
    event.key === 'Enter' ||
    event.key === ' ' ||
    event.key === 'Home' ||
    event.key === 'End'
  ) {
    event.preventDefault();
  }
}

/** 面板键盘：方向键/Home/End 走 manager，Enter 选中，ESC 由 overlay 关闭。 */
function onMenuKeydown(event: KeyboardEvent) {
  manager.onKeydown(event);

  if (event.key === 'Enter') {
    const item = manager.activeItem;
    if (item) {
      event.preventDefault();
      choose(item);
    }
  }
}

// 关闭后复位高亮，下次打开重新从首项开始。
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
      切换文本方向：RTL 下 <code>start</code> 对齐右边缘，下拉菜单的连接点与
      transform-origin 全部镜像；打开后 ↑/↓/Home/End 导航、Enter 选中。
    </p>
    <div class="row">
      <button type="button" class="doc-btn" @click="rtl = !rtl">
        切换到 {{ rtl ? 'LTR' : 'RTL' }}
      </button>
      <VOverlayOrigin>
        <button type="button" class="doc-btn primary" @click="open = !open" @keydown="onTriggerKeydown">
          RTL 下拉菜单：{{ selected }} ▾
        </button>
        <VConnectedOverlay
          :open="open"
          :direction="rtl ? 'rtl' : 'ltr'"
          :positions="STANDARD_DROPDOWN_BELOW_POSITIONS"
          @overlay-keydown="onMenuKeydown"
          @overlay-outside-click="open = false"
          @update:open="open = $event"
        >
          <div class="panel" :style="{direction: rtl ? 'rtl' : 'ltr'}">
            <div
              v-for="(item, index) in items"
              :key="item.label"
              class="menu-item"
              :class="{active: index === manager.activeItemIndex}"
              @mouseenter="manager.setActiveItem(index)"
              @click="choose(item)"
            >
              {{ item.label }}
            </div>
          </div>
        </VConnectedOverlay>
      </VOverlayOrigin>
    </div>
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

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.panel {
  min-width: 180px;
  padding: 6px;
  background: #fff;
  border: 1px solid var(--doc-border);
  border-radius: 8px;
  box-shadow: var(--doc-shadow);
}

.menu-item {
  padding: 7px 12px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--doc-text);
  cursor: pointer;
}

.menu-item:hover,
.menu-item.active {
  background: var(--doc-primary-soft);
  color: var(--doc-primary);
}
</style>
