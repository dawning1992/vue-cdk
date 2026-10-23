<script setup lang="ts">
import DemoCard from '../components/DemoCard.vue';
import ModulePage from '../components/ModulePage.vue';
import {apiGroups} from '../apis/portal';
import ComponentPortalDemo from '../demos/portal/ComponentPortalDemo.vue';
import ComponentPortalDemoSource from '../demos/portal/ComponentPortalDemo.vue?raw';
import ReactivePropsDemo from '../demos/portal/ReactivePropsDemo.vue';
import ReactivePropsDemoSource from '../demos/portal/ReactivePropsDemo.vue?raw';
import UserCardSource from '../demos/portal/UserCard.vue?raw';
import DeclarativeTemplateDemo from '../demos/portal/DeclarativeTemplateDemo.vue';
import DeclarativeTemplateDemoSource from '../demos/portal/DeclarativeTemplateDemo.vue?raw';
import TemplateRefDemo from '../demos/portal/TemplateRefDemo.vue';
import TemplateRefDemoSource from '../demos/portal/TemplateRefDemo.vue?raw';
import ImperativeTemplateDemo from '../demos/portal/ImperativeTemplateDemo.vue';
import ImperativeTemplateDemoSource from '../demos/portal/ImperativeTemplateDemo.vue?raw';
import DomPortalDemo from '../demos/portal/DomPortalDemo.vue';
import DomPortalDemoSource from '../demos/portal/DomPortalDemo.vue?raw';
import OverlayPortalDemo from '../demos/portal/OverlayPortalDemo.vue';
import OverlayPortalDemoSource from '../demos/portal/OverlayPortalDemo.vue?raw';
</script>

<template>
  <ModulePage
    module-name="portal"
    zh-name="内容挂载"
    intro="可编程内容挂载系统：Portal 抽象类与组件 / 模板 / DOM 三种内容源，PortalOutlet 出口统一管理生命周期；VPortal / VPortalOutlet 提供声明式用法，overlay 与 dialog 已基于它构建。"
    intro-en="A programmable content attachment system with component, template, and DOM portals. PortalOutlet manages their lifecycle; VPortal and VPortalOutlet provide declarative usage, and overlay and dialog are built on this foundation."
    :api-groups="apiGroups"
  >
    <DemoCard
      title="组件 Portal（ComponentPortal + DomPortalOutlet）"
      title-en="Component portal (ComponentPortal + DomPortalOutlet)"
      description="命令式创建出口并挂载组件：挂载内容为独立 .vue 单文件组件，props 支持 reactive、ref/computed 和 getter，修改姓名或等级可更新已挂载内容；appContext 提供 provide/inject 通道；attach 返回组件公共实例。"
      description-en="Create an outlet imperatively and attach a standalone .vue component. Props support reactive, ref/computed, and getter inputs; edits update mounted content. appContext supplies provide/inject, and attach returns the component public instance."
      :source="ComponentPortalDemoSource"
      filename="ComponentPortalDemo.vue"
      :extra-sources="[{filename: 'UserCard.vue', code: UserCardSource}]"
    >
      <ComponentPortalDemo />
    </DemoCard>

    <DemoCard
      title="响应式 props（reactive / ref / computed / getter）"
      title-en="Reactive props (reactive / ref / computed / getter)"
      description="四种输入源直接传给 props：原地修改、整体替换、派生数据和组合输入均可更新已挂载组件。展开源码可查看完整用法与清理方式。"
      description-en="Pass all four input types directly as props: in-place edits, whole-object replacement, derived data, and combined inputs update the mounted component. Expand the source to see usage and cleanup."
      :source="ReactivePropsDemoSource"
      filename="ReactivePropsDemo.vue"
      :extra-sources="[{filename: 'UserCard.vue', code: UserCardSource}]"
    >
      <ReactivePropsDemo />
    </DemoCard>

    <DemoCard
      title="声明式模板（VPortal + VPortalOutlet）"
      title-en="Declarative template (VPortal + VPortalOutlet)"
      description="VPortal 捕获插槽为模板 Portal，VPortalOutlet 通过 portal prop 挂载；插槽 props 即上下文，父级响应式状态驱动已挂载内容更新。"
      description-en="VPortal captures its slot as a template portal, and VPortalOutlet attaches it through the portal prop. Slot props form the context, while reactive parent state updates mounted content."
      :source="DeclarativeTemplateDemoSource"
      filename="DeclarativeTemplateDemo.vue"
    >
      <DeclarativeTemplateDemo />
    </DemoCard>

    <DemoCard
      title="显式模板引用（TemplateRef）"
      title-en="Explicit template reference (TemplateRef)"
      description="TemplateRef 通过组件 ref 暴露 TemplateRefHandle，再交给 TemplatePortal 将作用域插槽挂载到 overlay。引用在 setup 阶段为空，应在挂载后检查就绪；父级响应式状态与事件闭包仍有效。来源卸载会自动卸载内容并使句柄失效；关闭后重开会重新创建内容。普通对象上下文的直接修改不会触发更新，需更新时使用 reactive。应用级 provide、全局组件和插件从来源继承，来源组件局部 provide 不保证继承。"
      description-en="TemplateRef exposes a TemplateRefHandle through a component ref; pass it to TemplatePortal to attach the scoped slot to an overlay. The ref is empty during setup, so check it after mount. Parent reactive state and event closures remain active. Unmounting the source detaches content and invalidates the handle; reopening creates fresh content. Mutating a plain-object context does not trigger updates; use reactive when needed. App-level provide, global components, and plugins are inherited from the source, while source-local provide is not guaranteed."
      :source="TemplateRefDemoSource"
      filename="TemplateRefDemo.vue"
    >
      <TemplateRefDemo />
    </DemoCard>

    <DemoCard
      title="命令式模板（TemplatePortal 上下文）"
      title-en="Imperative template (TemplatePortal context)"
      description="TemplateRef 捕获作用域插槽；attach(outlet, context) 传入的上下文优先于构造上下文，detach 后上下文被清空。"
      description-en="TemplateRef captures a scoped slot. Context passed to attach(outlet, context) takes precedence over the constructor context, and detach clears the context."
      :source="ImperativeTemplateDemoSource"
      filename="ImperativeTemplateDemo.vue"
    >
      <ImperativeTemplateDemo />
    </DemoCard>

    <DemoCard
      title="DOM Portal（元素移动与恢复）"
      title-en="DOM portal (move and restore an element)"
      description="DomPortal 把原生 DOM 节点从原位置移动到出口，detach 时经注释锚点恢复到原位置；元素上的事件与样式原样保留。"
      description-en="DomPortal moves a native DOM node from its original location to an outlet, then restores it using a comment anchor on detach. Its events and styles are preserved."
      :source="DomPortalDemoSource"
      filename="DomPortalDemo.vue"
    >
      <DomPortalDemo />
    </DemoCard>

    <DemoCard
      title="overlay 集成（分层价值验证）"
      title-en="Overlay integration (validating the layering)"
      description="overlay 已基于 portal 重构：overlayRef.attach(TemplatePortal) 直接挂载 portal 内容，TemplateRef 插槽中的响应式状态与事件在打开后仍继续工作，关闭后可再次打开。"
      description-en="Overlay is built on portal: overlayRef.attach(TemplatePortal) mounts portal content directly. Reactive state and events in the TemplateRef slot keep working while open, and the overlay can be reopened after closing."
      :source="OverlayPortalDemoSource"
      filename="OverlayPortalDemo.vue"
    >
      <OverlayPortalDemo />
    </DemoCard>
  </ModulePage>
</template>
