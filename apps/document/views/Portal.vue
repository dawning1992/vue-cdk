<script setup lang="ts">
import DemoCard from '../components/DemoCard.vue';
import ModulePage from '../components/ModulePage.vue';
import {apiGroups} from '../apis/portal';
import ComponentPortalDemo from '../demos/portal/ComponentPortalDemo.vue';
import ComponentPortalDemoSource from '../demos/portal/ComponentPortalDemo.vue?raw';
import UserCardSource from '../demos/portal/UserCard.vue?raw';
import DeclarativeTemplateDemo from '../demos/portal/DeclarativeTemplateDemo.vue';
import DeclarativeTemplateDemoSource from '../demos/portal/DeclarativeTemplateDemo.vue?raw';
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
    :api-groups="apiGroups"
  >
    <DemoCard
      title="组件 Portal（ComponentPortal + DomPortalOutlet）"
      description="命令式创建出口并挂载组件：挂载内容为独立 .vue 单文件组件，props 传入数据，appContext 提供 provide/inject 通道；attach 返回组件公共实例。"
      :source="ComponentPortalDemoSource"
      filename="ComponentPortalDemo.vue"
      :extra-sources="[{filename: 'UserCard.vue', code: UserCardSource}]"
    >
      <ComponentPortalDemo />
    </DemoCard>

    <DemoCard
      title="声明式模板（VPortal + VPortalOutlet）"
      description="VPortal 捕获插槽为模板 Portal，VPortalOutlet 通过 portal prop 挂载；插槽 props 即上下文，父级响应式状态驱动已挂载内容更新。"
      :source="DeclarativeTemplateDemoSource"
      filename="DeclarativeTemplateDemo.vue"
    >
      <DeclarativeTemplateDemo />
    </DemoCard>

    <DemoCard
      title="命令式模板（TemplatePortal 上下文）"
      description="渲染函数接收上下文；attach(outlet, context) 传入的上下文优先于构造上下文，detach 后上下文被清空。"
      :source="ImperativeTemplateDemoSource"
      filename="ImperativeTemplateDemo.vue"
    >
      <ImperativeTemplateDemo />
    </DemoCard>

    <DemoCard
      title="DOM Portal（元素移动与恢复）"
      description="DomPortal 把原生 DOM 节点从原位置移动到出口，detach 时经注释锚点恢复到原位置；元素上的事件与样式原样保留。"
      :source="DomPortalDemoSource"
      filename="DomPortalDemo.vue"
    >
      <DomPortalDemo />
    </DemoCard>

    <DemoCard
      title="overlay 集成（分层价值验证）"
      description="overlay 已基于 portal 重构：overlayRef.attach(TemplatePortal) 直接挂载 portal 内容，渲染函数内的响应式状态在打开后仍持续更新。"
      :source="OverlayPortalDemoSource"
      filename="OverlayPortalDemo.vue"
    >
      <OverlayPortalDemo />
    </DemoCard>
  </ModulePage>
</template>
