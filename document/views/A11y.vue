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
      description="方向键导航列表并自动跳过禁用项；支持循环与输入字母快速定位。"
      :source="KeyManagerDemoSource"
      filename="KeyManagerDemo.vue"
    >
      <KeyManagerDemo />
    </DemoCard>

    <DemoCard
      title="焦点陷阱（v-focus-trap）"
      description="Tab 焦点被限制在区域内；.autoCapture 在挂载时捕获焦点、卸载时恢复，绑定值可动态启停。"
      :source="FocusTrapDemoSource"
      filename="FocusTrapDemo.vue"
    >
      <FocusTrapDemo />
    </DemoCard>

    <DemoCard
      title="焦点来源监视（v-focus-monitor）"
      description="聚焦元素时回调接收焦点来源（mouse/keyboard/touch/program）；.subtree 修饰符下子元素聚焦也算父元素聚焦。"
      :source="FocusMonitorDemoSource"
      filename="FocusMonitorDemo.vue"
    >
      <FocusMonitorDemo />
    </DemoCard>
  </ModulePage>
</template>
