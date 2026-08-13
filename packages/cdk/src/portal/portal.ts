import type {AppContext, Component, ComponentPublicInstance, VNode} from 'vue';
import {
  throwNoPortalAttachedError,
  throwNullPortalError,
  throwNullPortalOutletError,
  throwPortalAlreadyAttachedError,
  throwPortalOutletAlreadyDisposedError,
  throwUnknownPortalTypeError,
} from './portal-errors';

/** 模板渲染函数：接收上下文并返回 VNode（可多根或为空）。 */
export type TemplateRenderFn<C = unknown> = (context: C) => VNode | VNode[] | null;

/** ComponentPortal 构造选项（Vue 特有：props 与应用上下文）。 */
export interface ComponentPortalOptions {
  /** 传给挂载组件的 props。 */
  props?: Record<string, unknown> | null;
  /**
   * 渲染组件时使用的应用上下文（提供 provide/inject 能力）。
   * 缺省时回退到出口（PortalOutlet）自身的 appContext。
   */
  appContext?: AppContext | null;
}

/**
 * Portal：一段可被渲染到任意出口的 UI 内容。
 *
 * 抽象基类只管理「当前宿主」簿记：`attach` 把宿主写入自身并转发给出口，
 * `detach` 清除宿主并让出口卸载内容。子类决定内容的具体形态：
 * ComponentPortal（组件）、TemplatePortal（渲染函数/插槽）、DomPortal（原生 DOM 元素）。
 *
 * 生命周期约定：
 * - `attach` 前内容必须未挂载（同一 portal 同时只能挂到一个出口）；
 * - `detach` 要求已挂载，重复 detach 会抛错；
 * - 出口销毁（dispose）时会同步清空 portal 的宿主引用，此后 portal.isAttached 为 false。
 */
export abstract class Portal<T> {
  private _attachedHost: PortalOutlet | null = null;

  /** 把自身挂载到指定出口并返回出口返回的挂载引用。 */
  attach(host: PortalOutlet): T {
    if (host == null) {
      throwNullPortalOutletError();
    }
    if (host.hasAttached()) {
      throwPortalAlreadyAttachedError();
    }
    this._attachedHost = host;
    return host.attach(this) as T;
  }

  /** 从当前出口卸载自身；未挂载时抛错。 */
  detach(): void {
    const host = this._attachedHost;
    if (host != null) {
      this._attachedHost = null;
      host.detach();
    } else {
      throwNoPortalAttachedError();
    }
  }

  /** 当前是否已挂载到某个出口。 */
  get isAttached(): boolean {
    return this._attachedHost != null;
  }

  /**
   * 由出口在 attach/detach 时直接设置宿主引用，绕过 `attach()`/`detach()`。
   * 供 BasePortalOutlet 在走出口方法（如 attachComponentPortal）时同步状态。
   */
  setAttachedHost(host: PortalOutlet | null): void {
    this._attachedHost = host;
  }
}

/**
 * 组件 Portal：挂载时实例化一个 Vue 组件。
 *
 * Vue 与 Angular 的能力映射：
 * - Angular `component` → Vue 组件定义（SFC / defineComponent）；
 * - Angular `injector` → Vue `appContext`（provide/inject）；
 * - Angular `bindings/directives` → Vue `props`（Vue 用 props 表达输入，无需额外机制）；
 * - Angular `viewContainerRef` 不适用（Vue 用 render() 直接挂载到出口元素）。
 *
 * 挂载引用为组件公共实例（ComponentPublicInstance），可经 exposed 读取组件暴露的能力。
 */
export class ComponentPortal<T extends Component = Component> extends Portal<ComponentPublicInstance | null> {
  /** 待实例化的组件定义。 */
  readonly component: T;
  /** 传给组件的 props；null 表示不传。 */
  readonly props: Record<string, unknown> | null;
  /** 渲染时使用的应用上下文；null 表示回退到出口上下文。 */
  readonly appContext: AppContext | null;

  constructor(component: T, options: ComponentPortalOptions = {}) {
    super();
    this.component = component;
    this.props = options.props ?? null;
    this.appContext = options.appContext ?? null;
  }
}

/**
 * 模板 Portal：挂载时用上下文调用渲染函数生成内容。
 *
 * Vue 与 Angular 的能力映射：
 * - Angular `TemplateRef` → 渲染函数 `(context) => VNode | VNode[] | null`；
 *   声明式场景由 `VPortal` 组件把插槽捕获为渲染函数；
 * - Angular `context`/`$implicit` → 渲染函数参数 / 插槽 props；
 * - Angular `injector` → `appContext`。
 *
 * `attach(outlet, context?)` 传入的上下文优先于构造时的上下文；
 * `detach()` 会清空上下文，与 Angular 语义一致。
 */
export class TemplatePortal<C = unknown> extends Portal<VNode | null> {
  /** 生成内容的渲染函数。 */
  readonly render: TemplateRenderFn<C>;
  /** 当前上下文；attach 时可覆盖。 */
  context: C | undefined;
  /** 渲染时使用的应用上下文；null 表示回退到出口上下文。 */
  appContext: AppContext | null;

  constructor(render: TemplateRenderFn<C>, context?: C, appContext?: AppContext | null) {
    super();
    this.render = render;
    this.context = context;
    this.appContext = appContext ?? null;
  }

  /** 挂载；传入 context 时覆盖实例上的上下文并生效。 */
  override attach(outlet: PortalOutlet, context: C | undefined = this.context): VNode | null {
    this.context = context;
    return super.attach(outlet);
  }

  /** 卸载并清空上下文。 */
  override detach(): void {
    this.context = undefined;
    super.detach();
  }
}

/**
 * DOM Portal：把原生 DOM 元素从当前位置移动到出口。
 *
 * 挂载时在元素原位置插入注释锚点，detach 时元素回到锚点处；
 * 元素及其子树按原样移动，若元素由 Vue 渲染且包含响应式绑定，
 * 移动后绑定将不再更新（与 Angular 的 DomPortal 警告一致）。
 */
export class DomPortal<T extends Element = HTMLElement> extends Portal<T> {
  /** 被移动的原生 DOM 元素。 */
  readonly element: T;

  constructor(element: T) {
    super();
    this.element = element;
  }
}

/** 出口：可以容纳单个 Portal 的插槽。 */
export interface PortalOutlet {
  /** 挂载 portal 到本出口；返回挂载引用。 */
  attach(portal: Portal<any>): any;
  /** 卸载当前内容（可重复调用，幂等）。 */
  detach(): any;
  /** 永久销毁出口；销毁后不能再挂载。 */
  dispose(): void;
  /** 当前是否已有内容。 */
  hasAttached(): boolean;
}

/**
 * PortalOutlet 的部分实现：负责三类 portal 的按类型分发与生命周期管理。
 *
 * 职责：
 * - 记录 `_attachedPortal`、`_disposeFn` 与 `_isDisposed` 状态；
 * - `attach` 按 instanceof 分发到三个抽象挂载方法，并做 null/重复/已销毁校验；
 * - `detach` 清空 portal 宿主引用并执行 dispose 函数；
 * - `dispose` 幂等：先 detach 已挂载内容，再执行 dispose 函数并置为已销毁。
 */
export abstract class BasePortalOutlet implements PortalOutlet {
  /** 当前挂载的 portal；null 表示空闲。 */
  protected _attachedPortal: Portal<any> | null = null;
  /** 永久销毁时执行的一次性清理函数（如 render(null) 卸载内容）。 */
  private _disposeFn: (() => void) | null = null;
  /** 出口是否已永久销毁。 */
  private _isDisposed = false;

  /** 当前是否已有内容。 */
  hasAttached(): boolean {
    return !!this._attachedPortal;
  }

  /** 按类型分发挂载：ComponentPortal / TemplatePortal / DomPortal。 */
  attach<T>(portal: Portal<T>): any {
    if (!portal) {
      throwNullPortalError();
    }
    if (this.hasAttached()) {
      throwPortalAlreadyAttachedError();
    }
    if (this._isDisposed) {
      throwPortalOutletAlreadyDisposedError();
    }

    try {
      if (portal instanceof ComponentPortal) {
        this._attachedPortal = portal;
        return this.attachComponentPortal(portal);
      }
      if (portal instanceof TemplatePortal) {
        this._attachedPortal = portal;
        return this.attachTemplatePortal(portal);
      }
      if (portal instanceof DomPortal) {
        this._attachedPortal = portal;
        return this.attachDomPortal(portal);
      }
      throwUnknownPortalTypeError();
    } catch (error) {
      // 挂载失败时回滚簿记，避免出口与 portal 停留在不一致的“已挂载”状态。
      this._attachedPortal = null;
      portal.setAttachedHost(null);
      throw error;
    }
  }

  /** 挂载组件 Portal，返回组件公共实例。 */
  abstract attachComponentPortal<T extends Component>(portal: ComponentPortal<T>): any;
  /** 挂载模板 Portal，返回渲染结果 VNode。 */
  abstract attachTemplatePortal<C>(portal: TemplatePortal<C>): any;
  /** 挂载 DOM Portal，返回被移动的元素。 */
  abstract attachDomPortal(portal: DomPortal): any;

  /** 卸载当前内容（幂等）。 */
  detach(): void {
    if (this._attachedPortal) {
      this._attachedPortal.setAttachedHost(null);
      this._attachedPortal = null;
    }
    this._invokeDisposeFn();
  }

  /** 永久销毁出口；销毁后不可再挂载，内容会被卸载。 */
  dispose(): void {
    if (this.hasAttached()) {
      this.detach();
    }
    this._invokeDisposeFn();
    this._isDisposed = true;
  }

  /** 注册一次性清理函数，detach/dispose 时执行并置空。 */
  setDisposeFn(fn: (() => void) | null): void {
    this._disposeFn = fn;
  }

  private _invokeDisposeFn(): void {
    if (this._disposeFn) {
      this._disposeFn();
      this._disposeFn = null;
    }
  }
}
