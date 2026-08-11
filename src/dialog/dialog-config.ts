import type {Component, VNode} from 'vue';
import type {FocusOrigin} from '../a11y/focus-monitor/focus-monitor';
import type {PositionStrategy} from '../overlay/position/position-strategy';
import type {Direction} from '../overlay/position/connected-position';
import type {ScrollStrategy} from '../overlay/scroll/scroll-strategy';

/** 对话框根元素的合法 ARIA role。 */
export type DialogRole = 'dialog' | 'alertdialog';

/** 打开对话框时的自动聚焦目标。 */
export type AutoFocusTarget = 'dialog' | 'first-tabbable' | 'first-heading';

/**
 * 关闭对话框后的焦点恢复配置，对应 Angular CDK 的 RestoreFocusValue：
 * - `boolean`：true 时恢复为打开前的聚焦元素，false 表示不恢复；
 * - `string`：恢复为第一个匹配该 CSS 选择器的元素；
 * - `HTMLElement`：恢复为指定元素。
 */
export type RestoreFocusValue = boolean | string | HTMLElement;

/**
 * 可放入对话框的内容（对应 Angular 的 ComponentType / TemplateRef 二选一）。
 *
 * - 组件：SFC 或 `defineComponent` 结果，通过 `contentProps` 与 provide/inject 双通道接收数据；
 * - 渲染函数：等价 Angular 的 TemplateRef，调用参数为上下文对象
 *   （含 `$implicit`（data）与 `dialogRef`，并合并 `templateContext`）；
 * - VNode：直接渲染的虚拟节点。
 */
export type DialogContent =
  | Component
  | ((context: Record<string, unknown>) => VNode | VNode[] | null)
  | VNode;

/**
 * 对话框容器暴露给 DialogRef 的实例契约（对应 Angular 的 CdkDialogContainer 实例）。
 * 自定义容器应通过 `useDialogContainerCore` 复用默认行为，并在 setup 中把实例
 * 经 `onContainerReady` 回调交给 Dialog 服务。
 */
export interface DialogContainerInstance {
  /** 导致对话框关闭的交互来源，焦点恢复时据此应用对应焦点样式。 */
  _closeInteractionType: FocusOrigin | null;
  /** 焦点不在对话框内时重新捕获（多用于遮罩点击被阻止关闭的场景）。 */
  _recaptureFocus?: () => void;
  /** 对话框根元素。 */
  element?: HTMLElement | null;
  /** 内容组件实例（渲染函数 / VNode 内容时为 null）。 */
  contentComponentInstance?: unknown | null;
}

/**
 * 打开对话框的配置，字段与默认值对齐 Angular CDK 的 DialogConfig。
 *
 * Vue 适配说明：
 * - Angular 的 `injector` / `viewContainerRef` / `providers` / `bindings`
 *   属依赖注入概念，不移植；由 `provide/inject` 通道（DIALOG_DATA / DIALOG_REF）
 *   与 `contentProps`（Vue 特有 props 通道）替代；
 * - 内容类型统一为 `DialogContent`（组件 / 渲染函数 / VNode）。
 */
export class DialogConfig<D = unknown, R = unknown> {
  /** 对话框 id；省略时由服务自动生成唯一 id。 */
  id?: string;

  /** 对话框根元素的 ARIA role。 */
  role?: DialogRole = 'dialog';

  /** 应用到 overlay 面板的 CSS 类（字符串或数组）。 */
  panelClass?: string | string[] = '';

  /** 是否显示遮罩。 */
  hasBackdrop?: boolean = true;

  /** 遮罩 CSS 类（字符串或数组）。 */
  backdropClass?: string | string[] = '';

  /** 是否禁止 ESC 与遮罩点击关闭。 */
  disableClose?: boolean = false;

  /**
   * 关闭谓词：返回 false 时阻止关闭，对 `close()` / `closeAll()` / ESC / 遮罩点击均生效。
   * 参数依次为关闭结果、配置与内容组件实例；阻止遮罩关闭时会重捕获焦点到对话框内。
   */
  closePredicate?: <Result, ComponentInstance, Config extends DialogConfig>(
    result: Result | undefined,
    config: Config,
    componentInstance: ComponentInstance | null,
  ) => boolean;

  /** 面板宽度；数字按像素处理。 */
  width?: number | string;

  /** 面板高度；数字按像素处理。 */
  height?: number | string;

  /** 面板最小宽度。 */
  minWidth?: number | string;

  /** 面板最小高度。 */
  minHeight?: number | string;

  /** 面板最大宽度。 */
  maxWidth?: number | string;

  /** 面板最大高度。 */
  maxHeight?: number | string;

  /** 定位策略；默认全局水平垂直居中。 */
  positionStrategy?: PositionStrategy;

  /** 注入给对话框内容组件的数据。 */
  data?: D | null = null;

  /** 对话框内容布局方向（ltr/rtl）；缺省时回退到 html 根元素的 dir。 */
  direction?: Direction;

  /** 描述对话框内容的元素 id。 */
  ariaDescribedBy?: string | null = null;

  /** 标注对话框标题的元素 id；配置了 `ariaLabel` 时忽略。 */
  ariaLabelledBy?: string | null = null;

  /** 对话框的 aria-label 文本。 */
  ariaLabel?: string | null = null;

  /** 是否设置 aria-modal 属性。 */
  ariaModal?: boolean = false;

  /**
   * 打开时的自动聚焦目标：
   * - `first-tabbable`：第一个可 Tab 元素（默认），找不到时聚焦对话框根元素；
   * - `first-heading`：第一个标题元素（h1-h6 或 role="heading"）；
   * - `dialog`：对话框根元素；
   * - 其他字符串：作为 CSS 选择器匹配第一个元素；
   * - `true` 等价 first-tabbable；`false` 表示不主动聚焦内容（仍会保证焦点进入对话框）。
   */
  autoFocus?: AutoFocusTarget | string | boolean = 'first-tabbable';

  /** 关闭后的焦点恢复行为，见 RestoreFocusValue。 */
  restoreFocus?: RestoreFocusValue = true;

  /** 滚动策略；默认 block（打开期间禁止页面滚动）。 */
  scrollStrategy?: ScrollStrategy;

  /** 浏览器前进/后退导航（popstate/hashchange）时是否关闭对话框。 */
  closeOnNavigation?: boolean = true;

  /**
   * 服务销毁时是否关闭对话框。当前 Dialog 为模块级单例、与应用同生命周期，
   * 该字段暂保留以兼容 Angular API，无运行时销毁钩子。
   */
  closeOnDestroy?: boolean = true;

  /** overlay 被外部 detach 时是否关闭对话框。 */
  closeOnOverlayDetachments?: boolean = true;

  /** 是否禁用内置动画（遮罩淡入淡出）。 */
  disableAnimations?: boolean = false;

  /**
   * 渲染函数内容的额外上下文；函数形式在打开时惰性求值，
   * 与内置的 `$implicit`（data）和 `dialogRef` 合并后作为渲染函数参数。
   */
  templateContext?: Record<string, unknown> | (() => Record<string, unknown>);

  /**
   * 自定义容器组件；缺省使用内置 `VDialogContainer`。
   * 自定义容器需接收 `config` / `dialogRef` / `content` / `onContainerReady` 四个 props，
   * 建议复用 `useDialogContainerCore` 以获得焦点陷阱、ARIA 与数据注入行为。
   */
  container?: Component;

  /**
   * 传给内容组件的 props（Vue 特有通道，替代 Angular 的 bindings/providers）。
   * 与 provide/inject 通道并存，内容组件可任选一种方式获取数据。
   */
  contentProps?: Record<string, unknown>;

  constructor(config?: DialogConfig<D, R>) {
    if (config) {
      const keys = Object.keys(config) as (keyof DialogConfig<D, R>)[];
      for (const key of keys) {
        if (config[key] !== undefined) {
          (this as Record<keyof DialogConfig<D, R>, unknown>)[key] = config[key];
        }
      }
    }
  }
}
