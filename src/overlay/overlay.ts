import {getCurrentInstance, type AppContext} from 'vue';
import {OverlayConfig} from './overlay-config';
import {OverlayRef, type OverlayRefDeps} from './overlay-ref';
import {OverlayContainer, overlayContainer} from './overlay-container';
import {overlayKeyboardDispatcher} from './dispatchers/overlay-keyboard-dispatcher';
import {overlayOutsideClickDispatcher} from './dispatchers/overlay-outside-click-dispatcher';
import {OverlayPositionBuilder, overlayPositionBuilder} from './position/overlay-position-builder';
import {scrollStrategies} from './scroll/scroll-strategy-options';
import {injectOverlayStyles} from './style-inject';
import {isBrowser, supportsPopover} from '../platform';

/** 创建 overlay 时的附加选项。 */
export interface CreateOverlayRefOptions {
  /** 渲染内容时使用的应用上下文（提供 provide/inject 支持）。 */
  appContext?: AppContext | null;
  /** 自定义容器；默认使用全局单例容器。 */
  container?: OverlayContainer;
}

/**
 * 创建 OverlayRef（对应 Angular 的 `overlay.create(config)`）。
 *
 * 步骤：
 * 1. 合并默认配置（方向、Popover 能力降级）；
 * 2. 创建 pane（面板）与 host（包装层）并插入容器或自定义插入点；
 * 3. 返回封装了全部生命周期的 OverlayRef。
 */
export function createOverlayRef(
  config?: OverlayConfig,
  options: CreateOverlayRefOptions = {},
): OverlayRef {
  // 与 Angular 一致：创建时确保结构样式可用，开箱即用。
  injectOverlayStyles();

  const container = options.container ?? overlayContainer;
  const documentRef = getDocumentFor(container);
  const overlayConfig = new OverlayConfig(config);

  if (!overlayConfig.direction) {
    overlayConfig.direction =
      isBrowser() && documentRef.documentElement.dir === 'rtl' ? 'rtl' : 'ltr';
  }
  overlayConfig.usePopover = supportsPopover() && (config?.usePopover ?? true);

  const pane = documentRef.createElement('div');
  const host = documentRef.createElement('div');
  pane.classList.add('vcdk-overlay-pane');
  host.appendChild(pane);

  if (overlayConfig.usePopover) {
    host.setAttribute('popover', 'manual');
    host.classList.add('vcdk-overlay-popover');
  }

  const customInsertionPoint = overlayConfig.usePopover
    ? overlayConfig.positionStrategy?.getPopoverInsertionPoint?.()
    : null;
  if (customInsertionPoint instanceof Element) {
    customInsertionPoint.after(host);
  } else if (customInsertionPoint?.type === 'parent') {
    customInsertionPoint.element.appendChild(host);
  } else {
    container.getContainerElement().appendChild(host);
  }

  const deps: OverlayRefDeps = {
    document: documentRef,
    keyboardDispatcher: overlayKeyboardDispatcher,
    outsideClickDispatcher: overlayOutsideClickDispatcher,
    container,
    animationsDisabled: config?.disableAnimations ?? false,
    appContext: options.appContext,
  };
  return new OverlayRef(host, pane, overlayConfig, deps);
}

/**
 * Vue 组合式 API 入口：对应 Angular 的 `Overlay` 服务。
 *
 * ```ts
 * const overlay = useOverlay();
 * const ref = overlay.create({
 *   positionStrategy: overlay.position().global().centerHorizontally().centerVertically(),
 *   hasBackdrop: true,
 * });
 * ref.attach(() => h(MyComponent));
 * ```
 *
 * 在组件 setup 中调用时会捕获当前应用上下文，使命令式渲染的内容
 * 也能访问 app 级别的 provide。
 */
export function useOverlay() {
  const appContext = getCurrentInstance()?.appContext ?? null;
  return {
    create: (config?: OverlayConfig) => createOverlayRef(config, {appContext}),
    position: (): OverlayPositionBuilder => overlayPositionBuilder,
    scrollStrategies,
  };
}

/** 获取容器绑定的 document（浏览器默认 window.document）。 */
function getDocumentFor(container: OverlayContainer): Document {
  const doc = container.document;
  if (doc) {
    return doc;
  }
  if (isBrowser()) {
    return window.document;
  }
  throw new Error('Overlay: 当前环境没有可用的 document（SSR 环境不应创建 overlay）。');
}
