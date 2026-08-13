import {h, render, type AppContext, type Component, type ComponentPublicInstance, type VNode} from 'vue';
import {
  BasePortalOutlet,
  ComponentPortal,
  DomPortal,
  TemplatePortal,
  type TemplateRenderFn,
} from './portal';
import {PortalTemplate} from './portal-template';

/** DomPortalOutlet 构造选项。 */
export interface DomPortalOutletOptions {
  /**
   * 渲染内容时使用的应用上下文（提供 provide/inject 能力）。
   * portal 自带 appContext 时优先使用 portal 的。
   */
  appContext?: AppContext | null;
}

/**
 * 把 portal 挂载到任意原生 DOM 元素的出口（对应 Angular `DomPortalOutlet`）。
 *
 * 与 Angular 的区别：Angular 构造时需要 ApplicationRef + Injector，Vue 侧统一
 * 收敛为可选的 `appContext`；内容卸载通过 `render(null)` 完成，无需手动销毁实例。
 *
 * `dispose()` 会额外把出口元素移出 DOM（Angular 语义一致）。
 */
export class DomPortalOutlet extends BasePortalOutlet {
  /** 内容投影到的目标元素。 */
  readonly outletElement: Element;
  private _appContext: AppContext | null;

  constructor(outletElement: Element, options: DomPortalOutletOptions = {}) {
    super();
    this.outletElement = outletElement;
    this._appContext = options.appContext ?? null;
  }

  /**
   * 挂载组件 Portal：以 `h(component, props)` 渲染到出口元素，
   * 返回组件公共实例（经 vnode.component.proxy 获取，可读 exposed 能力）。
   */
  attachComponentPortal<T extends Component>(portal: ComponentPortal<T>): ComponentPublicInstance | null {
    const vnode = h(portal.component, portal.props ?? undefined);
    this._applyAppContext(vnode, portal.appContext);
    render(vnode, this.outletElement);
    const instance = vnode.component?.proxy ?? null;
    portal.setAttachedHost(this);
    this._attachedPortal = portal;
    this.setDisposeFn(() => render(null, this.outletElement));
    return instance;
  }

  /** 挂载模板 Portal：经 PortalTemplate 包装后渲染，保证父级响应式状态可驱动更新。 */
  attachTemplatePortal<C>(portal: TemplatePortal<C>): VNode {
    const vnode = h(PortalTemplate, {
      render: portal.render as TemplateRenderFn,
      context: portal.context,
    });
    this._applyAppContext(vnode, portal.appContext);
    render(vnode, this.outletElement);
    portal.setAttachedHost(this);
    this._attachedPortal = portal;
    this.setDisposeFn(() => render(null, this.outletElement));
    return vnode;
  }

  /**
   * 挂载 DOM Portal：在元素原位置插入注释锚点并移动到出口；
   * detach 时元素回到锚点处。
   */
  attachDomPortal(portal: DomPortal): Element {
    const element = portal.element;
    if (!element.parentNode) {
      throw Error('DOM portal 内容必须挂载在父节点上。');
    }
    const anchorNode = this.outletElement.ownerDocument.createComment('dom-portal');
    element.parentNode.insertBefore(anchorNode, element);
    this.outletElement.appendChild(element);
    portal.setAttachedHost(this);
    this._attachedPortal = portal;
    this.setDisposeFn(() => {
      // 出口元素可能已被外部清空/移除，锚点仍在原父节点时才恢复，避免抛错。
      if (anchorNode.parentNode) {
        anchorNode.parentNode.replaceChild(element, anchorNode);
      }
    });
    return element;
  }

  /** 永久销毁出口：先卸载内容，再把出口元素移出 DOM（幂等）。 */
  override dispose(): void {
    super.dispose();
    this.outletElement.remove();
  }

  /**
   * 把应用上下文挂到 VNode 上，供内容组件 provide/inject 使用。
   * portal 自带上下文优先，缺省回退到出口上下文。
   */
  private _applyAppContext(vnode: VNode, portalAppContext: AppContext | null): void {
    const appContext = portalAppContext ?? this._appContext;
    if (appContext) {
      vnode.appContext = appContext;
    }
  }
}
