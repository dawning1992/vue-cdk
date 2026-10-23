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
    <section class="template-guide">
      <h2>显式模板引用 TemplateRef</h2>
      <p>使用 TemplateRef 组件定义模板，通过 shallowRef&lt;TemplateRefHandle&lt;上下文类型&gt; | null&gt; 接收句柄。请在 onMounted 或用户事件中检查引用非空，再调用 new TemplatePortal(tpl.value, context)。Vue 裸 template ref 不产生模板句柄，无需编译器扩展。</p>
      <p>与 Angular TemplateRef 对应的是可复用模板来源；Vue 通过作用域插槽传入上下文。父级状态与事件保留，应用级 provide 和全局组件从来源继承，来源组件局部 provide 不保证继承。来源卸载会自动卸载内容，句柄永久失效。</p>
      <p>portal.attach(outlet, context) 覆盖上下文，portal.detach() 清空上下文；出口 detach 保留上下文。普通对象直接修改不触发更新，请使用 reactive。重新挂载会重新创建内容组件；调用方仍需 dispose 自己创建的出口或浮层。</p>
      <p>TemplateRef 适合显式构造 TemplatePortal；VPortal 直接提供 portal 与便捷挂载方法；独立 SFC 与 props 输入使用 ComponentPortal。旧渲染函数构造方式继续兼容，挂载返回 VNode。</p>
    </section>
    <DemoCard
      title="组件 Portal（ComponentPortal + DomPortalOutlet）"
      description="命令式创建出口并挂载组件：挂载内容为独立 .vue 单文件组件，props 支持 reactive、ref/computed 和 getter，修改姓名或等级可更新已挂载内容；appContext 提供 provide/inject 通道；attach 返回组件公共实例。"
      :source="ComponentPortalDemoSource"
      filename="ComponentPortalDemo.vue"
      :extra-sources="[{filename: 'UserCard.vue', code: UserCardSource}]"
    >
      <ComponentPortalDemo />
    </DemoCard>

    <DemoCard
      title="响应式 props（reactive / ref / computed / getter）"
      description="四种输入源直接传给 props：原地修改、整体替换、派生数据和组合输入均可更新已挂载组件。展开源码可查看完整用法与清理方式。"
      :source="ReactivePropsDemoSource"
      filename="ReactivePropsDemo.vue"
      :extra-sources="[{filename: 'UserCard.vue', code: UserCardSource}]"
    >
      <ReactivePropsDemo />
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
      description="TemplateRef 捕获作用域插槽；attach(outlet, context) 传入的上下文优先于构造上下文，detach 后上下文被清空。"
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
      description="overlay 已基于 portal 重构：overlayRef.attach(TemplatePortal) 直接挂载 portal 内容，TemplateRef 插槽中的响应式状态与事件在打开后仍继续工作，关闭后可再次打开。"
      :source="OverlayPortalDemoSource"
      filename="OverlayPortalDemo.vue"
    >
      <OverlayPortalDemo />
    </DemoCard>
  </ModulePage>
</template>
