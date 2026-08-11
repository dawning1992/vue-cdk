<script setup lang="ts">
import {computed, ref, type Component} from 'vue';
import DropdownMenu from './sections/DropdownMenu.vue';
import Tooltip from './sections/Tooltip.vue';
import Dialog from './sections/Dialog.vue';
import ContextMenu from './sections/ContextMenu.vue';
import Autocomplete from './sections/Autocomplete.vue';
import ScrollStrategies from './sections/ScrollStrategies.vue';
import RtlDemo from './sections/RtlDemo.vue';
import Stacking from './sections/Stacking.vue';
import PopoverDemo from './sections/PopoverDemo.vue';
import KeyManagerDemo from './sections/KeyManagerDemo.vue';
import FocusTrapDemo from './sections/FocusTrapDemo.vue';
import FocusMonitorDemo from './sections/FocusMonitorDemo.vue';

/** 页签配置：每个页签对应一个独立功能演示组件。 */
interface TabItem {
  key: string;
  label: string;
  component: Component;
}

const tabs: TabItem[] = [
  {key: 'dropdown', label: '下拉菜单', component: DropdownMenu},
  {key: 'tooltip', label: 'Tooltip', component: Tooltip},
  {key: 'dialog', label: '模态对话框', component: Dialog},
  {key: 'context-menu', label: '右键菜单', component: ContextMenu},
  {key: 'autocomplete', label: '自动补全', component: Autocomplete},
  {key: 'scroll', label: '滚动策略', component: ScrollStrategies},
  {key: 'rtl', label: 'RTL 方向', component: RtlDemo},
  {key: 'stacking', label: '多层堆叠', component: Stacking},
  {key: 'popover', label: 'Popover 位置', component: PopoverDemo},
  {key: 'key-manager', label: '键盘导航', component: KeyManagerDemo},
  {key: 'focus-trap', label: '焦点陷阱', component: FocusTrapDemo},
  {key: 'focus-monitor', label: '焦点来源', component: FocusMonitorDemo},
];

const activeKey = ref(tabs[0].key);
const activeTab = computed(() => tabs.find(tab => tab.key === activeKey.value) ?? tabs[0]);
</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1>Vue CDK 演示</h1>
      <p>Vue 3 Composition API 组件开发工具包，设计移植自 Angular CDK（Overlay 与 a11y）</p>
    </header>

    <nav class="tabs" role="tablist" aria-label="功能演示">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-btn"
        :class="{active: tab.key === activeKey}"
        role="tab"
        :aria-selected="tab.key === activeKey"
        @click="activeKey = tab.key"
      >
        {{ tab.label }}
      </button>
    </nav>

    <!-- 只渲染当前页签；切换时卸载上一个功能，自动清理其打开的 overlay。 -->
    <component :is="activeTab.component" :key="activeTab.key" :id="activeTab.key" />
  </div>
</template>
