import type {ApiGroup} from '../api';

/** portal 模块 API 分组：内容源、出口、声明式组件与 Angular 映射。 */
export const apiGroups: readonly ApiGroup[] = [
  {
    title: '内容源（Portal）',
    rows: [
      {
        name: 'Portal<T>',
        signature: 'abstract class Portal<T>',
        description:
          '内容抽象基类：attach(outlet) 挂载到出口、detach() 卸载、isAttached 查询状态、setAttachedHost() 供出口同步宿主引用。同一 portal 同一时刻只能挂载到一个出口。',
      },
      {
        name: 'ComponentPortal',
        signature: 'class ComponentPortal<T extends Component> extends Portal<ComponentPublicInstance | null>',
        description:
          '组件内容源：new ComponentPortal(component, {props?, appContext?})。挂载时实例化组件，挂载引用为组件公共实例（可读 exposed 能力）。',
      },
      {
        name: 'TemplatePortal',
        signature: 'class TemplatePortal<C = unknown> extends Portal<VNode | null>',
        description:
          '模板内容源：new TemplatePortal(render, context?, appContext?)。render 接收上下文返回 VNode（可多根）；attach(outlet, context?) 传入的上下文优先于构造上下文，detach() 清空上下文。',
      },
      {
        name: 'DomPortal',
        signature: 'class DomPortal<T extends Element = HTMLElement> extends Portal<T>',
        description:
          '原生 DOM 内容源：挂载时把元素从原位置移动到出口，detach 时经注释锚点恢复到原位置。元素若含 Vue 响应式绑定，移动后将不再更新。',
      },
      {
        name: 'TemplateRenderFn',
        signature: 'type TemplateRenderFn<C> = (context: C) => VNode | VNode[] | null',
        description: '模板 Portal 的渲染函数签名：接收上下文并返回单根、多根或空内容。',
      },
      {
        name: 'ComponentPortalOptions',
        signature: 'interface ComponentPortalOptions { props?: Record<string, unknown> | null; appContext?: AppContext | null }',
        description: '组件 Portal 构造选项：props 传给组件；appContext 提供 provide/inject 通道，缺省回退到出口上下文。',
      },
    ],
  },
  {
    title: '出口（PortalOutlet）',
    rows: [
      {
        name: 'PortalOutlet',
        signature: 'interface PortalOutlet',
        description:
          '出口契约：attach(portal) 挂载并返回挂载引用、detach() 卸载、dispose() 永久销毁、hasAttached() 状态查询。',
      },
      {
        name: 'BasePortalOutlet',
        signature: 'abstract class BasePortalOutlet implements PortalOutlet',
        description:
          '出口部分实现：按 instanceof 分发三类 portal，管理已挂载内容、一次性清理函数与已销毁状态；子类实现 attachComponentPortal / attachTemplatePortal / attachDomPortal。',
      },
      {
        name: 'DomPortalOutlet',
        signature: 'class DomPortalOutlet(outletElement: Element, options?: DomPortalOutletOptions)',
        description:
          '把内容挂载到任意原生 DOM 元素的出口：组件经 render() 挂载、模板经内部包装组件渲染、DOM 元素移动并恢复；dispose() 额外移除出口元素。',
      },
      {
        name: 'DomPortalOutletOptions',
        signature: 'interface DomPortalOutletOptions { appContext?: AppContext | null }',
        description: '出口构造选项：appContext 作为内容渲染的 provide/inject 上下文，portal 自带上下文时优先。',
      },
    ],
  },
  {
    title: '声明式组件',
    rows: [
      {
        name: 'VPortal',
        signature: 'component VPortal',
        description:
          '无渲染模板源（对应 Angular CdkPortal 指令）：捕获默认插槽为 TemplatePortal，经模板 ref 读取 exposed 的 portal / attach(outlet) / detach()。插槽 props 即模板上下文。',
      },
      {
        name: 'VPortalOutlet',
        signature: 'component VPortalOutlet',
        description:
          '声明式出口（对应 Angular CdkPortalOutlet 指令）：props 为 portal（内容源）与 tag（宿主标签，默认 div）；emits attached（载荷为挂载引用）；exposed 提供 attachedRef / portal / hasAttached() / attach() / detach() / dispose() / attachComponentPortal / attachTemplatePortal / attachDomPortal。',
      },
    ],
  },
  {
    title: 'Angular ↔ Vue 映射',
    rows: [
      {
        name: 'Portal<T>',
        signature: 'Angular Portal<T> → Vue Portal<T>',
        description: 'attach / detach / isAttached / setAttachedHost 语义一致。',
      },
      {
        name: 'ComponentPortal',
        signature: 'component + Injector + bindings → component + appContext + props',
        description: 'Vue 无 Angular DI 注入器：provide/inject 经 appContext 提供，输入经 props 表达。',
      },
      {
        name: 'TemplatePortal',
        signature: 'TemplateRef + ViewContainerRef + $implicit → render 函数 + 插槽 props',
        description: '声明式场景由 VPortal 捕获插槽；上下文即渲染函数参数 / 插槽 props。',
      },
      {
        name: 'DomPortal',
        signature: '原生 DOM 元素移动',
        description: '注释锚点 + insertBefore/appendChild，detach 恢复原位置，行为与 Angular 一致。',
      },
      {
        name: 'CdkPortal / CdkPortalOutlet',
        signature: '指令 → VPortal / VPortalOutlet 组件',
        description: 'Vue 的 <template> 无法承载自定义指令，出口改为渲染宿主元素（tag 可配置）。',
      },
      {
        name: 'DomPortalOutlet',
        signature: 'ApplicationRef + Injector → appContext',
        description: 'Vue 侧无需手动管理应用视图：内容卸载由 render(null) 完成。',
      },
    ],
  },
];
