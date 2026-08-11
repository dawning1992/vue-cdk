<script setup lang="ts">
import {onBeforeUnmount, ref, watch} from 'vue';
import {ListKeyManager, type ListKeyManagerOption} from 'vue-cdk/a11y';
import {STANDARD_DROPDOWN_BELOW_POSITIONS, VConnectedOverlay, VOverlayOrigin} from 'vue-cdk/overlay';

defineProps<{id?: string}>();

/** 菜单条目：getLabel 供 ListKeyManager 的 typeahead 能力使用。 */
interface MenuItem extends ListKeyManagerOption {
  label: string;
}

const open = ref(false);
const selected = ref('React');
const items = ref<MenuItem[]>([
  {label: 'Vue 3', getLabel: () => 'Vue 3'},
  {label: 'React', getLabel: () => 'React'},
  {label: 'Svelte', getLabel: () => 'Svelte'},
  {label: 'Solid', getLabel: () => 'Solid'},
]);

/**
 * 菜单键盘管理器：换行 + Home/End。焦点始终留在触发器按钮上，
 * 活动项仅通过高亮呈现（与“键盘导航”页签的场景一一致）。
 */
const menuManager = new ListKeyManager(items).withWrap().withHomeAndEnd();

// 焦点按 Tab 离开列表时关闭菜单，与真实下拉菜单行为一致。
menuManager.tabOut.subscribe(() => (open.value = false));

function choose(item: MenuItem) {
  selected.value = item.label;
  open.value = false;
}

/**
 * 触发器键盘处理：
 * - 菜单关闭时，ArrowDown/Enter/Space 打开菜单，ArrowDown 同时激活首项；
 * - 菜单打开时，preventDefault 拦截 Enter/Space 触发的按钮 click，避免菜单刚打开又被关闭。
 * 导航类按键不在此处理，统一由 overlay 键盘分发器派发到 @overlay-keydown。
 */
function onTriggerKeydown(event: KeyboardEvent) {
  if (!open.value) {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      open.value = true;
      if (event.key === 'ArrowDown') {
        menuManager.setActiveItem(0);
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

/**
 * 面板键盘处理：方向键/Home/End 交给 manager 移动活动项，
 * Enter 选中活动项并关闭菜单；ESC 由 VConnectedOverlay 内置逻辑关闭。
 */
function onMenuKeydown(event: KeyboardEvent) {
  menuManager.onKeydown(event);

  if (event.key === 'Enter') {
    const item = menuManager.activeItem;
    if (item) {
      event.preventDefault();
      choose(item);
    }
  }
}

// 无论通过哪种途径（ESC/外部点击/选中）关闭，都复位高亮，下次打开从首项开始。
watch(open, value => {
  if (!value) {
    menuManager.setActiveItem(-1);
  }
});

onBeforeUnmount(() => menuManager.destroy());
</script>

<template>
  <section :id="id" class="section">
    <h2>下拉菜单<span class="badge">声明式 · 位置自动翻转 · 键盘导航</span></h2>
    <p class="desc">
      使用 <code>VOverlayOrigin</code> + <code>VConnectedOverlay</code>，候选位置放不下时自动向上翻转；
      打开后 ↑/↓/Home/End 导航、Enter 选中、ESC/Tab 关闭，点击面板外部同样关闭。
    </p>
    <div class="stage">
      <VOverlayOrigin>
        <button class="btn primary" @click="open = !open" @keydown="onTriggerKeydown">
          选择框架：{{ selected }} ▾
        </button>
        <VConnectedOverlay
          :open="open"
          :positions="STANDARD_DROPDOWN_BELOW_POSITIONS"
          panel-class="menu-panel"
          @overlay-keydown="onMenuKeydown"
          @backdrop-click="open = false"
          @overlay-outside-click="open = false"
          @update:open="open = $event"
        >
          <div class="panel">
            <div
              v-for="(item, index) in items"
              :key="item.label"
              class="menu-item"
              :class="{active: index === menuManager.activeItemIndex}"
              @mouseenter="menuManager.setActiveItem(index)"
              @click="choose(item)"
            >
              {{ item.label }}
            </div>
          </div>
        </VConnectedOverlay>
      </VOverlayOrigin>
    </div>
  </section>
</template>

<style scoped>
.menu-panel {
  min-width: 180px;
}
</style>
