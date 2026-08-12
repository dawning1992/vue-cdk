<script setup lang="ts">
import DemoCard from '../components/DemoCard.vue';
import ModulePage from '../components/ModulePage.vue';
import {apiGroups} from '../apis/overlay';
import DeclarativeOverlay from '../demos/overlay/DeclarativeOverlay.vue';
import DeclarativeOverlaySource from '../demos/overlay/DeclarativeOverlay.vue?raw';
import ImperativeOverlay from '../demos/overlay/ImperativeOverlay.vue';
import ImperativeOverlaySource from '../demos/overlay/ImperativeOverlay.vue?raw';
import OverlayContainerOverlay from '../demos/overlay/OverlayContainerOverlay.vue';
import OverlayContainerOverlaySource from '../demos/overlay/OverlayContainerOverlay.vue?raw';
import ConnectedTooltipOverlay from '../demos/overlay/ConnectedTooltipOverlay.vue';
import ConnectedTooltipOverlaySource from '../demos/overlay/ConnectedTooltipOverlay.vue?raw';
import ScrollStrategyOverlay from '../demos/overlay/ScrollStrategyOverlay.vue';
import ScrollStrategyOverlaySource from '../demos/overlay/ScrollStrategyOverlay.vue?raw';
import BackdropEventsOverlay from '../demos/overlay/BackdropEventsOverlay.vue';
import BackdropEventsOverlaySource from '../demos/overlay/BackdropEventsOverlay.vue?raw';
import DeclarativeAdvancedOverlay from '../demos/overlay/DeclarativeAdvancedOverlay.vue';
import DeclarativeAdvancedOverlaySource from '../demos/overlay/DeclarativeAdvancedOverlay.vue?raw';
import ContextMenuOverlay from '../demos/overlay/ContextMenuOverlay.vue';
import ContextMenuOverlaySource from '../demos/overlay/ContextMenuOverlay.vue?raw';
import StackingOverlay from '../demos/overlay/StackingOverlay.vue';
import StackingOverlaySource from '../demos/overlay/StackingOverlay.vue?raw';
import RtlOverlay from '../demos/overlay/RtlOverlay.vue';
import RtlOverlaySource from '../demos/overlay/RtlOverlay.vue?raw';
import PopoverPositionsOverlay from '../demos/overlay/PopoverPositionsOverlay.vue';
import PopoverPositionsOverlaySource from '../demos/overlay/PopoverPositionsOverlay.vue?raw';
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
      title="自定义 OverlayContainer"
      description="在模板中放置自定义 div 作为容器，通过 createOverlayRef 的 container 选项（OverlayContainer 实例或 HTMLElement）挂载浮层；面板被限制在区域内渲染，dispose 不会移除调用方元素。"
      :source="OverlayContainerOverlaySource"
      filename="OverlayContainerOverlay.vue"
    >
      <OverlayContainerOverlay />
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

    <DemoCard
      title="右键菜单（命令式 + 坐标原点）"
      description="以鼠标坐标（Point）为 origin 的上下文菜单：右键任意位置打开，贴近视口边缘时自动 push 回屏；打开后 ↑/↓/Home/End 导航、Enter 激活，ESC / 外部点击 / 再次右键关闭。"
      :source="ContextMenuOverlaySource"
      filename="ContextMenuOverlay.vue"
    >
      <ContextMenuOverlay />
    </DemoCard>

    <DemoCard
      title="多层堆叠"
      description="两个触发按钮共享同一 origin：先开第一层再开第二层不会误关第一层；键盘事件只命中栈顶 overlay，点击外部时两层同时收到 outsideClick。"
      :source="StackingOverlaySource"
      filename="StackingOverlay.vue"
    >
      <StackingOverlay />
    </DemoCard>

    <DemoCard
      title="RTL 方向镜像"
      description="切换文本方向：RTL 下 start 对齐右边缘，下拉菜单的连接点与 transform-origin 全部镜像；方向键导航行为保持不变。"
      :source="RtlOverlaySource"
      filename="RtlOverlay.vue"
    >
      <RtlOverlay />
    </DemoCard>

    <DemoCard
      title="Popover 插入位置"
      description="use-popover 支持 global（容器）、inline（紧随触发元素）、parent（自定义父元素）三种 DOM 插入位置；浏览器不支持 Popover API 时自动降级为容器渲染。"
      :source="PopoverPositionsOverlaySource"
      filename="PopoverPositionsOverlay.vue"
    >
      <PopoverPositionsOverlay />
    </DemoCard>
  </ModulePage>
</template>
