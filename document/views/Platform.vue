<script setup lang="ts">
import DemoCard from '../components/DemoCard.vue';
import ModulePage from '../components/ModulePage.vue';
import {apiGroups} from '../apis/platform';
import PlatformDemo from '../demos/platform/PlatformDemo.vue';
import PlatformDemoSource from '../demos/platform/PlatformDemo.vue?raw';
</script>

<template>
  <ModulePage
    module-name="platform"
    zh-name="平台"
    intro="平台能力检测与事件工具：浏览器 / Shadow DOM / Popover / scroll-behavior 检测、事件目标穿透 Shadow DOM、修饰键判断，SSR 环境下可安全调用。"
    :api-groups="apiGroups"
  >
    <DemoCard
      title="能力检测与修饰键演示"
      description="运行环境检测并输出各项能力；聚焦输入框后按键，验证 hasModifierKey 与 getEventTarget 的行为。"
      :source="PlatformDemoSource"
      filename="PlatformDemo.vue"
    >
      <PlatformDemo />
    </DemoCard>
  </ModulePage>
</template>
