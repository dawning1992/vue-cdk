<script setup lang="ts">
import DemoCard from '../components/DemoCard.vue';
import ModulePage from '../components/ModulePage.vue';
import {apiGroups} from '../apis/a11y';
import KeyManagerDemo from '../demos/a11y/KeyManagerDemo.vue';
import KeyManagerDemoSource from '../demos/a11y/KeyManagerDemo.vue?raw';
import FocusTrapDemo from '../demos/a11y/FocusTrapDemo.vue';
import FocusTrapDemoSource from '../demos/a11y/FocusTrapDemo.vue?raw';
import FocusMonitorDemo from '../demos/a11y/FocusMonitorDemo.vue';
import FocusMonitorDemoSource from '../demos/a11y/FocusMonitorDemo.vue?raw';
import FocusKeyManagerDemo from '../demos/a11y/FocusKeyManagerDemo.vue';
import FocusKeyManagerDemoSource from '../demos/a11y/FocusKeyManagerDemo.vue?raw';
import ActiveDescendantDemo from '../demos/a11y/ActiveDescendantDemo.vue';
import ActiveDescendantDemoSource from '../demos/a11y/ActiveDescendantDemo.vue?raw';
import ImperativeFocusTrapDemo from '../demos/a11y/ImperativeFocusTrapDemo.vue';
import ImperativeFocusTrapDemoSource from '../demos/a11y/ImperativeFocusTrapDemo.vue?raw';
import AutocompleteDemo from '../demos/a11y/AutocompleteDemo.vue';
import AutocompleteDemoSource from '../demos/a11y/AutocompleteDemo.vue?raw';
</script>

<template>
  <ModulePage
    module-name="a11y"
    zh-name="无障碍"
    intro="无障碍三件套：键盘导航（ListKeyManager 系列）、焦点陷阱（FocusTrap / vFocusTrap / useFocusTrap）、焦点来源监视（FocusMonitor / vFocusMonitor / useFocusMonitor），均提供类与 Vue 绑定两种形态。"
    :api-groups="apiGroups"
  >
    <DemoCard
      title="键盘导航（ListKeyManager）"
      description="方向键导航并自动跳过禁用项；循环、Home/End、PageUp/PageDown、typeahead 字母定位、方向与修饰键均为可配置选项。"
      :source="KeyManagerDemoSource"
      filename="KeyManagerDemo.vue"
    >
      <KeyManagerDemo />
    </DemoCard>

    <DemoCard
      title="焦点陷阱（v-focus-trap）"
      description="Tab 焦点被限制在区域内；.autoCapture 挂载时捕获、卸载时恢复，绑定值动态启停，卸载/重挂载演示焦点恢复。"
      :source="FocusTrapDemoSource"
      filename="FocusTrapDemo.vue"
    >
      <FocusTrapDemo />
    </DemoCard>

    <DemoCard
      title="焦点来源监视（v-focus-monitor）"
      description="聚焦元素时回调接收焦点来源；focusVia 编程聚焦、stopMonitoring 停止监视、InputModalityDetector 实时输入方式检测，.subtree 修饰符覆盖子元素。"
      :source="FocusMonitorDemoSource"
      filename="FocusMonitorDemo.vue"
    >
      <FocusMonitorDemo />
    </DemoCard>

    <DemoCard
      title="真实聚焦（FocusKeyManager）"
      description="活动项变化时自动调用条目的 focus() 移动真实焦点；change / tabOut 事件流与 setFocusOrigin 来源标记。"
      :source="FocusKeyManagerDemoSource"
      filename="FocusKeyManagerDemo.vue"
    >
      <FocusKeyManagerDemo />
    </DemoCard>

    <DemoCard
      title="组合框（ActiveDescendantKeyManager）"
      description="input + aria-activedescendant 组合框模式：条目实现 Highlightable 的 setActiveStyles / setInactiveStyles 同步高亮。"
      :source="ActiveDescendantDemoSource"
      filename="ActiveDescendantDemo.vue"
    >
      <ActiveDescendantDemo />
    </DemoCard>

    <DemoCard
      title="自动补全（组合示例）"
      description="ActiveDescendantKeyManager 与 VConnectedOverlay 组合成真实自动补全：match-width 对齐输入框，↑/↓/Home/End 选择、Enter 确认、ESC 关闭。"
      :source="AutocompleteDemoSource"
      filename="AutocompleteDemo.vue"
    >
      <AutocompleteDemo />
    </DemoCard>

    <DemoCard
      title="命令式焦点陷阱"
      description="focusTrapFactory.create() 在任意元素上命令式创建/启用/销毁陷阱；useFocusTrap 组合式提供双向 enabled 与 focusInitial / focusFirst / focusLast。"
      :source="ImperativeFocusTrapDemoSource"
      filename="ImperativeFocusTrapDemo.vue"
    >
      <ImperativeFocusTrapDemo />
    </DemoCard>
  </ModulePage>
</template>
