import type {ApiGroup} from '../api';

/** portal 模块 API 分组：内容源、出口、声明式组件与 Angular 映射。 */
export const apiGroups: readonly ApiGroup[] = [
  {
    title: '内容源（Portal）',
    titleEn: 'Content sources (Portal)',
    rows: [
      {name: 'TemplateRef / TemplateRefHandle<C>', signature: 'Component / template handle interface', description: 'TemplateRef 通过组件 ref 暴露句柄，挂载后可 new TemplatePortal(tpl.value)。自身不渲染默认插槽；支持作用域上下文、父级响应式状态与事件。来源卸载自动卸载出口，句柄永久失效；只保证应用级上下文。', descriptionEn: 'TemplateRef exposes a handle through a component ref; after mount, pass tpl.value to new TemplatePortal(). It does not render its default slot itself and supports scoped context, parent reactive state, and events. Unmounting the source detaches the outlet and permanently invalidates the handle. Only app-level context is guaranteed.'},
      {
        name: 'Portal<T>',
        signature: 'abstract class Portal<T>',
        description:
          '内容抽象基类：attach(outlet) 挂载到出口、detach() 卸载、isAttached 查询状态、setAttachedHost() 供出口同步宿主引用。同一 portal 同一时刻只能挂载到一个出口。',
        descriptionEn: 'Abstract content base class: attach(outlet) mounts to an outlet, detach() unmounts, isAttached reports state, and setAttachedHost() lets the outlet synchronize its host reference. A portal can be attached to only one outlet at a time.',
      },
      {
        name: 'ComponentPortal',
        signature: 'class ComponentPortal<T extends Component> extends Portal<ComponentPublicInstance | null>',
        description:
          '组件内容源：new ComponentPortal(component, {props?, appContext?})。挂载时实例化组件，挂载引用为组件公共实例（可读 exposed 能力）。',
        descriptionEn: 'Component content source, created with new ComponentPortal(component, {props?, appContext?}). Attaching instantiates the component and returns its public instance, including exposed capabilities.',
      },
      {
        name: 'TemplatePortal',
        signature: 'class TemplatePortal<C = unknown> extends Portal<VNode | null>',
        description:
          '模板内容源：new TemplatePortal(render 或 TemplateRefHandle, context?, appContext?)。render 接收上下文返回 VNode（可多根）；attach(outlet, context?) 传入的上下文优先于构造上下文，detach() 清空上下文。',
        descriptionEn: 'Template content source, created with a render function or TemplateRefHandle plus optional context and appContext. The render function receives context and returns one or more VNodes. Context passed to attach(outlet, context?) takes precedence over constructor context; detach() clears it.',
      },
      {
        name: 'DomPortal',
        signature: 'class DomPortal<T extends Element = HTMLElement> extends Portal<T>',
        description:
          '原生 DOM 内容源：挂载时把元素从原位置移动到出口，detach 时经注释锚点恢复到原位置。元素若含 Vue 响应式绑定，移动后将不再更新。',
        descriptionEn: 'Native DOM content source. Attaching moves an element from its original location into the outlet; detach restores it using a comment anchor. Vue reactive bindings on the element stop updating after it is moved.',
      },
      {
        name: 'TemplateRenderFn',
        signature: 'type TemplateRenderFn<C> = (context: C) => VNode | VNode[] | null',
        description: '模板 Portal 的渲染函数签名：接收上下文并返回单根、多根或空内容。',
        descriptionEn: 'Template portal render-function signature: accepts a context and returns a single root, multiple roots, or no content.',
      },
      {
        name: 'ComponentPortalOptions',
        signature: 'interface ComponentPortalOptions { props?: MaybeRefOrGetter<Record<string, unknown> | null | undefined>; appContext?: AppContext | null }',
        description: '组件 Portal 构造选项：props 支持普通对象、reactive、ref/computed 和 getter；响应式更新在 nextTick 后可读，属性删除会恢复组件默认值。普通对象直接修改不触发更新，对象内 ref 不逐项解包，getter 应无副作用。detach/dispose 停止追踪，重新挂载读取最新值；appContext 提供 provide/inject 通道，缺省回退到出口上下文。',
        descriptionEn: 'Component portal options. props accepts a plain object, reactive, ref/computed, or getter. Reactive updates are visible after nextTick; deleting a prop restores the component default. Mutating a plain object does not trigger updates, nested refs are not individually unwrapped, and getters should be side-effect free. detach/dispose stops tracking; remounting reads current values. appContext supplies provide/inject and defaults to the outlet context.',
      },
    ],
  },
  {
    title: '出口（PortalOutlet）',
    titleEn: 'Outlets (PortalOutlet)',
    rows: [
      {
        name: 'PortalOutlet',
        signature: 'interface PortalOutlet',
        description:
          '出口契约：attach(portal) 挂载并返回挂载引用、detach() 卸载、dispose() 永久销毁、hasAttached() 状态查询。',
        descriptionEn: 'Outlet contract: attach(portal) mounts and returns the attached reference; detach() unmounts; dispose() permanently destroys the outlet; hasAttached() checks its state.',
      },
      {
        name: 'BasePortalOutlet',
        signature: 'abstract class BasePortalOutlet implements PortalOutlet',
        description:
          '出口部分实现：按 instanceof 分发三类 portal，管理已挂载内容、一次性清理函数与已销毁状态；子类实现 attachComponentPortal / attachTemplatePortal / attachDomPortal。',
        descriptionEn: 'Partial outlet implementation that dispatches the three portal types with instanceof and manages attached content, one-time cleanup callbacks, and disposed state. Subclasses implement attachComponentPortal, attachTemplatePortal, and attachDomPortal.',
      },
      {
        name: 'DomPortalOutlet',
        signature: 'class DomPortalOutlet(outletElement: Element, options?: DomPortalOutletOptions)',
        description:
          '把内容挂载到任意原生 DOM 元素的出口：组件经 render() 挂载、模板经内部包装组件渲染、DOM 元素移动并恢复；dispose() 额外移除出口元素。',
        descriptionEn: 'Outlet that mounts content into any native DOM element: components mount through render(), templates render through an internal wrapper component, and DOM elements are moved and restored. dispose() also removes the outlet element.',
      },
      {
        name: 'DomPortalOutletOptions',
        signature: 'interface DomPortalOutletOptions { appContext?: AppContext | null }',
        description: '出口构造选项：appContext 作为内容渲染的 provide/inject 上下文，portal 自带上下文时优先。',
        descriptionEn: 'Outlet construction options. appContext provides the provide/inject context for rendered content; a context supplied by the portal takes precedence.',
      },
    ],
  },
  {
    title: '声明式组件',
    titleEn: 'Declarative components',
    rows: [
      {
        name: 'VPortal',
        signature: 'component VPortal',
        description:
          '无渲染模板源（对应 Angular CdkPortal 指令）：捕获默认插槽为 TemplatePortal，经模板 ref 读取 exposed 的 portal / attach(outlet) / detach()。插槽 props 即模板上下文。',
        descriptionEn: 'Non-rendering template source (corresponding to Angular CdkPortal): captures the default slot as a TemplatePortal. A template ref exposes portal, attach(outlet), and detach(). Slot props are the template context.',
      },
      {
        name: 'VPortalOutlet',
        signature: 'component VPortalOutlet',
        description:
          '声明式出口（对应 Angular CdkPortalOutlet 指令）：props 为 portal（内容源）与 tag（宿主标签，默认 div）；emits attached（载荷为挂载引用）；exposed 提供 attachedRef / portal / hasAttached() / attach() / detach() / dispose() / attachComponentPortal / attachTemplatePortal / attachDomPortal。',
        descriptionEn: 'Declarative outlet (corresponding to Angular CdkPortalOutlet): props are portal (content source) and tag (host tag, default div); emits attached with the attached reference. Exposes attachedRef, portal, hasAttached(), attach(), detach(), dispose(), attachComponentPortal, attachTemplatePortal, and attachDomPortal.',
      },
    ],
  },
  {
    title: 'Angular ↔ Vue 映射',
    titleEn: 'Angular ↔ Vue mapping',
    rows: [
      {
        name: 'Portal<T>',
        signature: 'Angular Portal<T> → Vue Portal<T>',
        description: 'attach / detach / isAttached / setAttachedHost 语义一致。',
        descriptionEn: 'attach, detach, isAttached, and setAttachedHost have matching semantics.',
      },
      {
        name: 'ComponentPortal',
        signature: 'component + Injector + bindings → component + appContext + props',
        description: 'Vue 无 Angular DI 注入器：provide/inject 经 appContext 提供，输入经 props 表达。',
        descriptionEn: 'Vue has no Angular DI injector: provide/inject is supplied through appContext, and inputs are expressed as props.',
      },
      {
        name: 'TemplatePortal',
        signature: 'TemplateRef + ViewContainerRef + $implicit → render function + slot props',
        description: '声明式场景由 VPortal 捕获插槽；上下文即渲染函数参数 / 插槽 props。',
        descriptionEn: 'In declarative usage, VPortal captures the slot; context maps to render-function arguments or slot props.',
      },
      {
        name: 'DomPortal',
        signature: 'Move a native DOM element',
        description: '注释锚点 + insertBefore/appendChild，detach 恢复原位置，行为与 Angular 一致。',
        descriptionEn: 'A comment anchor with insertBefore/appendChild restores the original location on detach, matching Angular behavior.',
      },
      {
        name: 'CdkPortal / CdkPortalOutlet',
        signature: 'Directive → VPortal / VPortalOutlet components',
        description: 'Vue 的 <template> 无法承载自定义指令，出口改为渲染宿主元素（tag 可配置）。',
        descriptionEn: 'Vue <template> cannot host custom directives, so the outlet renders a host element whose tag is configurable.',
      },
      {
        name: 'DomPortalOutlet',
        signature: 'ApplicationRef + Injector → appContext',
        description: 'Vue 侧无需手动管理应用视图：内容卸载由 render(null) 完成。',
        descriptionEn: 'Vue does not require manual application-view management; content is unmounted with render(null).',
      },
    ],
  },
];
