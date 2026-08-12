<script setup lang="ts">
import DemoCard from '../components/DemoCard.vue';
import ModulePage from '../components/ModulePage.vue';
import {apiGroups} from '../apis/overlay';
import DeclarativeOverlay from '../demos/overlay/DeclarativeOverlay.vue';
import DeclarativeOverlaySource from '../demos/overlay/DeclarativeOverlay.vue?raw';
import ImperativeOverlay from '../demos/overlay/ImperativeOverlay.vue';
import ImperativeOverlaySource from '../demos/overlay/ImperativeOverlay.vue?raw';
</script>

<template>
  <ModulePage
    module-name="overlay"
    zh-name="浮层"
    intro="浮层面板体系：命令式 useOverlay() 与声明式 VConnectedOverlay / VOverlayOrigin 两种用法；连接定位自动选优（翻转、flexible、push、锁定）、四种滚动策略、backdrop、键盘与外部点击分发器，结构样式自动注入。"
    :api-groups="apiGroups"
  >
    <DemoCard
      title="声明式浮层（VConnectedOverlay）"
      description="通过 VOverlayOrigin 声明锚点，VConnectedOverlay 使用标准下拉位置常量打开菜单；点击外部区域自动关闭。"
      :source="DeclarativeOverlaySource"
      filename="DeclarativeOverlay.vue"
    >
      <DeclarativeOverlay />
    </DemoCard>

    <DemoCard
      title="命令式浮层（useOverlay）"
      description="在 setup 中调用 useOverlay()，通过 GlobalPositionStrategy 全局居中创建浮层；渲染函数内容可访问调用方应用上下文。"
      :source="ImperativeOverlaySource"
      filename="ImperativeOverlay.vue"
    >
      <ImperativeOverlay />
    </DemoCard>
  </ModulePage>
</template>
