<script setup lang="ts">
import DemoCard from '../components/DemoCard.vue';
import ModulePage from '../components/ModulePage.vue';
import {apiGroups} from '../apis/overlay';
import DeclarativeOverlay from '../demos/overlay/DeclarativeOverlay.vue';
import DeclarativeOverlaySource from '../demos/overlay/DeclarativeOverlay.vue?raw';
import ImperativeOverlay from '../demos/overlay/ImperativeOverlay.vue';
import ImperativeOverlaySource from '../demos/overlay/ImperativeOverlay.vue?raw';
import ConnectedTooltipOverlay from '../demos/overlay/ConnectedTooltipOverlay.vue';
import ConnectedTooltipOverlaySource from '../demos/overlay/ConnectedTooltipOverlay.vue?raw';
import ScrollStrategyOverlay from '../demos/overlay/ScrollStrategyOverlay.vue';
import ScrollStrategyOverlaySource from '../demos/overlay/ScrollStrategyOverlay.vue?raw';
import BackdropEventsOverlay from '../demos/overlay/BackdropEventsOverlay.vue';
import BackdropEventsOverlaySource from '../demos/overlay/BackdropEventsOverlay.vue?raw';
import DeclarativeAdvancedOverlay from '../demos/overlay/DeclarativeAdvancedOverlay.vue';
import DeclarativeAdvancedOverlaySource from '../demos/overlay/DeclarativeAdvancedOverlay.vue?raw';
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

    <DemoCard
      title="命令式连接定位"
      description="useOverlay().position().flexibleConnectedTo() 绑定锚点元素；候选位置自动选优，开关实时控制锁定、push、flexible 尺寸与偏移。"
      :source="ConnectedTooltipOverlaySource"
      filename="ConnectedTooltipOverlay.vue"
    >
      <ConnectedTooltipOverlay />
    </DemoCard>

    <DemoCard
      title="滚动策略对比"
      description="同一浮层切换 close / block / reposition / noop 四种滚动策略，面板以 inline popover 插入锚点行后（DOM 位于列表内）；滚动列表内容与页面观察不同行为，锚点行滚出列表可视区域时自动关闭面板。"
      :source="ScrollStrategyOverlaySource"
      filename="ScrollStrategyOverlay.vue"
    >
      <ScrollStrategyOverlay />
    </DemoCard>

    <DemoCard
      title="遮罩与事件流"
      description="hasBackdrop 遮罩配合 backdropClick / keydownEvents / outsidePointerEvents 事件流；演示 updateSize / updatePosition / addPanelClass / removePanelClass / dispose 动态控制。"
      :source="BackdropEventsOverlaySource"
      filename="BackdropEventsOverlay.vue"
    >
      <BackdropEventsOverlay />
    </DemoCard>

    <DemoCard
      title="声明式高级用法"
      description="origin 支持元素 ref 与坐标点；matchWidth、transformOriginSelector、usePopover 模式（global / inline / 禁用）与 positionChange / attach / detach 事件。"
      :source="DeclarativeAdvancedOverlaySource"
      filename="DeclarativeAdvancedOverlay.vue"
    >
      <DeclarativeAdvancedOverlay />
    </DemoCard>
  </ModulePage>
</template>
