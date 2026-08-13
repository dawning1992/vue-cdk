<script setup lang="ts">
import DemoCard from '../components/DemoCard.vue';
import ModulePage from '../components/ModulePage.vue';
import {apiGroups} from '../apis/platform';
import PlatformDemo from '../demos/platform/PlatformDemo.vue';
import PlatformDemoSource from '../demos/platform/PlatformDemo.vue?raw';
import PlatformInfoDemo from '../demos/platform/PlatformInfoDemo.vue';
import PlatformInfoDemoSource from '../demos/platform/PlatformInfoDemo.vue?raw';
import ShadowDomPlatformDemo from '../demos/platform/ShadowDomPlatformDemo.vue';
import ShadowDomPlatformDemoSource from '../demos/platform/ShadowDomPlatformDemo.vue?raw';
import PassiveRtlPlatformDemo from '../demos/platform/PassiveRtlPlatformDemo.vue';
import PassiveRtlPlatformDemoSource from '../demos/platform/PassiveRtlPlatformDemo.vue?raw';
</script>

<template>
  <ModulePage
    module-name="platform"
    zh-name="平台"
    intro="平台能力检测与事件工具：Platform 服务（浏览器/引擎识别、usePlatform 注入）、支持的 input type、测试环境检测、Shadow DOM / Popover / scroll-behavior 检测，SSR 环境下可安全调用。"
    :api-groups="apiGroups"
  >
    <DemoCard
      title="Platform 服务：浏览器识别与输入类型"
      description="usePlatform() 读取当前平台标志；getSupportedInputTypes 列出支持的 input type；createPlatform 注入自定义 UA 验证检测结果。"
      :source="PlatformInfoDemoSource"
      filename="PlatformInfoDemo.vue"
    >
      <PlatformInfoDemo />
    </DemoCard>

    <DemoCard
      title="能力检测与修饰键演示"
      description="运行环境检测并输出各项能力；聚焦输入框后按键，验证 hasModifierKey 与 getEventTarget 的行为。"
      :source="PlatformDemoSource"
      filename="PlatformDemo.vue"
    >
      <PlatformDemo />
    </DemoCard>

    <DemoCard
      title="Shadow DOM 事件穿透"
      description="动态挂载 shadow root，演示 getEventTargetPierceShadowDom / getFocusedElementPierceShadowDom / getShadowRoot / supportsShadowDom 的穿透行为。"
      :source="ShadowDomPlatformDemoSource"
      filename="ShadowDomPlatformDemo.vue"
    >
      <ShadowDomPlatformDemo />
    </DemoCard>

    <DemoCard
      title="被动监听与 RTL 滚动轴"
      description="supportsPassiveEventListeners 与 normalizePassiveListenerOptions 实际用于 addEventListener；getRtlScrollAxisType 与 supportsScrollBehavior 输出检测结果。"
      :source="PassiveRtlPlatformDemoSource"
      filename="PassiveRtlPlatformDemo.vue"
    >
      <PassiveRtlPlatformDemo />
    </DemoCard>
  </ModulePage>
</template>
