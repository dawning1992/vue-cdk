import type {PositionStrategy} from './position/position-strategy';
import type {Direction} from './position/connected-position';
import type {ScrollStrategy} from './scroll/scroll-strategy';
import {NoopScrollStrategy} from './scroll/noop-scroll-strategy';

/**
 * Overlay 创建配置，字段与默认值对齐 Angular CDK 的 OverlayConfig。
 */
export class OverlayConfig {
  /** 定位策略；不提供时 overlay 不主动定位，由使用方自行设置样式。 */
  positionStrategy?: PositionStrategy;

  /** 滚动策略，默认 noop。 */
  scrollStrategy?: ScrollStrategy = new NoopScrollStrategy();

  /** 面板自定义类（字符串或数组）。 */
  panelClass?: string | string[] = '';

  /** 是否启用遮罩。 */
  hasBackdrop?: boolean = false;

  /** 遮罩自定义类，默认深色遮罩。 */
  backdropClass?: string | string[] = 'vcdk-overlay-dark-backdrop';

  /** 是否禁用内置动画（遮罩淡入淡出）。 */
  disableAnimations?: boolean;

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

  /** 文本方向；不设置时回退到 html 根元素的 dir。 */
  direction?: Direction;

  /** 路由导航（popstate/hashchange）时自动销毁 overlay。 */
  disposeOnNavigation?: boolean = false;

  /**
   * 是否以原生 Popover 元素渲染（浏览器不支持时自动降级为容器渲染）。
   * 默认开启，与 Angular 最新行为一致。
   */
  usePopover?: boolean = true;

  /** 事件谓词：决定 overlay 是否接收分发器派发的特定事件。 */
  eventPredicate?: (event: Event) => boolean;

  constructor(config?: OverlayConfig) {
    if (config) {
      const keys = Object.keys(config) as (keyof OverlayConfig)[];
      for (const key of keys) {
        if (config[key] !== undefined) {
          (this as Record<keyof OverlayConfig, unknown>)[key] = config[key];
        }
      }
    }
  }
}
