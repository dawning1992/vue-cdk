import {getCurrentInstance, inject, type AppContext} from 'vue';
import {createOverlayRef} from '../overlay/overlay';
import {ComponentPortal} from '../portal';
import {OverlayConfig} from '../overlay/overlay-config';
import type {OverlayRef} from '../overlay/overlay-ref';
import {overlayPositionBuilder} from '../overlay/position/overlay-position-builder';
import {scrollStrategies} from '../overlay/scroll/scroll-strategy-options';
import {Emitter} from '../emitter';
import {DialogConfig, type DialogContainerInstance, type DialogContent} from './dialog-config';
import {DialogRef} from './dialog-ref';
import {VDialogContainer} from './dialog-container';
import {DEFAULT_DIALOG_CONFIG} from './dialog-injectors';
import {injectDialogStyles} from './style-inject';
import {injectFocusTrapStyles} from '../a11y/focus-trap/style-inject';

let dialogIdCounter = 0;

/** 生成与 Angular 前缀一致的唯一对话框 id。 */
function nextDialogId(): string {
  return `cdk-dialog-${++dialogIdCounter}`;
}

/** open() 的 Vue 特有附加选项。 */
export interface DialogOpenOptions {
  /** 渲染对话框内容时使用的应用上下文（保留调用方 app.provide 的能力）。 */
  appContext?: AppContext | null;
  /** 优先级高于内置默认值的默认配置（通常来自 DEFAULT_DIALOG_CONFIG 注入）。 */
  defaults?: DialogConfig | null;
}

/** Dialog 对外能力接口，useDialog() 与 dialogService 共用。 */
export interface DialogApi {
  /** 打开对话框；支持组件、渲染函数或 VNode 内容。 */
  open<R = unknown, D = unknown, C = unknown>(
    content: DialogContent,
    config?: DialogConfig<D, DialogRef<R, C>>,
  ): DialogRef<R, C>;
  /** 按后进先出顺序关闭所有已打开的对话框。 */
  closeAll(): void;
  /** 按 id 查找已打开的对话框。 */
  getDialogById<R = unknown, C = unknown>(id: string): DialogRef<R, C> | undefined;
  /** 当前已打开的对话框列表（后打开的排末尾）。 */
  readonly openDialogs: readonly DialogRef[];
  /** 对话框打开事件流。 */
  readonly afterOpened: Emitter<DialogRef>;
  /** 所有对话框关闭完成事件流；订阅时无打开对话框会立即触发一次。 */
  readonly afterAllClosed: Emitter<void>;
}

/** 订阅时无打开对话框立即触发一次，随后进入常规订阅（对齐 Angular 的 defer + startWith）。 */
class AfterAllClosedEmitter extends Emitter<void> {
  constructor(private readonly _hasOpenDialogs: () => boolean) {
    super();
  }

  override subscribe(listener: (value: void) => void): () => void {
    if (!this._hasOpenDialogs()) {
      listener(undefined);
    }
    return super.subscribe(listener);
  }
}

/**
 * 对话框服务，对应 Angular CDK 的 Dialog。
 *
 * 职责：
 * - 打开 / 关闭 / 查询对话框，维护打开栈与 afterOpened / afterAllClosed 事件；
 * - 将 DialogConfig 转换为 OverlayConfig 并基于 overlay 渲染对话框容器；
 * - 首个对话框打开时隐藏非 overlay 内容（aria-hidden），全部关闭后恢复。
 *
 * 模块导出单例 `dialogService` 供命令式使用；组件内建议使用 `useDialog()`
 * 以捕获当前应用上下文，保证内容可访问 app 级 provide。
 */
export class Dialog implements DialogApi {
  private readonly _openDialogsAtThisLevel: DialogRef<any, any>[] = [];
  private readonly _afterAllClosed: AfterAllClosedEmitter;
  private readonly _afterOpened = new Emitter<DialogRef<any, any>>();
  /** 被首开对话框隐藏的背景元素及其原 aria-hidden 值，最后关闭时恢复。 */
  private readonly _ariaHiddenElements = new Map<Element, string | null>();

  constructor() {
    this._afterAllClosed = new AfterAllClosedEmitter(() => this.openDialogs.length > 0);
  }

  /** 当前已打开的对话框列表。 */
  get openDialogs(): readonly DialogRef[] {
    return this._openDialogsAtThisLevel;
  }

  /** 对话框打开事件流。 */
  get afterOpened(): Emitter<DialogRef> {
    return this._afterOpened;
  }

  /** 所有对话框关闭完成事件流。 */
  get afterAllClosed(): Emitter<void> {
    return this._afterAllClosed;
  }

  /**
   * 打开一个对话框。
   * @param content 内容：组件 / 渲染函数 / VNode。
   * @param config 打开配置。
   * @param options Vue 特有附加选项（应用上下文与默认配置）。
   * @returns 对话框引用。
   * @throws 当 id 与已打开对话框重复时抛出错误。
   */
  open<R = unknown, D = unknown, C = unknown>(
    content: DialogContent,
    config?: DialogConfig<D, DialogRef<R, C>>,
    options: DialogOpenOptions = {},
  ): DialogRef<R, C> {
    // 结构样式与焦点陷阱样式随打开自动注入，开箱即用。
    injectDialogStyles();
    injectFocusTrapStyles();

    // 合并顺序：类内置默认值 → DEFAULT_DIALOG_CONFIG → 单次打开配置。
    const merged = {
      ...new DialogConfig(),
      ...(options.defaults ?? null),
      ...(config ?? null),
    } as DialogConfig<D, DialogRef<R, C>>;
    const id = merged.id || nextDialogId();
    merged.id = id;

    if (this.getDialogById(id)) {
      throw new Error(`Dialog with id "${id}" exists already. The dialog id must be unique.`);
    }

    const overlayConfig = this._getOverlayConfig(merged);
    const overlayRef = createOverlayRef(overlayConfig, {appContext: options.appContext ?? null});
    const dialogRef = new DialogRef(overlayRef, merged);
    try {
      dialogRef.containerInstance = this._attachContainer(overlayRef, dialogRef, merged, content);
    } catch (error) {
      // 容器挂载失败时回收 overlay，避免残留已 attach 的浮层污染分发器与 DOM。
      overlayRef.dispose();
      throw error;
    }
    dialogRef.componentInstance = (dialogRef.containerInstance.contentComponentInstance ??
      null) as C | null;

    // 首个对话框打开时隐藏非 overlay 内容，避免读屏器访问背景。
    if (!this.openDialogs.length) {
      this._hideNonDialogContentFromAssistiveTechnology(overlayRef);
    }

    (this.openDialogs as DialogRef<R, C>[]).push(dialogRef);
    dialogRef.closed.subscribe(() => this._removeOpenDialog(dialogRef, true));
    this._afterOpened.next(dialogRef);

    return dialogRef;
  }

  /** 按后进先出顺序关闭所有已打开的对话框。 */
  closeAll(): void {
    reverseForEach(this.openDialogs, dialog => dialog.close());
  }

  /** 按 id 查找已打开的对话框。 */
  getDialogById<R = unknown, C = unknown>(id: string): DialogRef<R, C> | undefined {
    return this.openDialogs.find(dialog => dialog.id === id) as DialogRef<R, C> | undefined;
  }

  /** 从 DialogConfig 构造 OverlayConfig：默认全局居中 + block 滚动策略。 */
  private _getOverlayConfig<D, R>(config: DialogConfig<D, R>): OverlayConfig {
    return new OverlayConfig({
      positionStrategy:
        config.positionStrategy ||
        overlayPositionBuilder.global().centerHorizontally().centerVertically(),
      scrollStrategy: config.scrollStrategy || scrollStrategies.block(),
      panelClass: config.panelClass,
      hasBackdrop: config.hasBackdrop,
      // 空字符串时不覆盖 overlay 默认深色遮罩类（与 Angular 行为一致）。
      backdropClass: config.backdropClass || undefined,
      direction: config.direction,
      minWidth: config.minWidth,
      minHeight: config.minHeight,
      maxWidth: config.maxWidth,
      maxHeight: config.maxHeight,
      width: config.width,
      height: config.height,
      disposeOnNavigation: config.closeOnNavigation,
      disableAnimations: config.disableAnimations,
    });
  }

  /**
   * 把对话框容器渲染进 overlay 并等待实例就绪。
   * 自定义容器必须通过 onContainerReady 回调暴露容器实例，否则抛错。
   */
  private _attachContainer(
    overlay: OverlayRef,
    dialogRef: DialogRef<any, any>,
    config: DialogConfig,
    content: DialogContent,
  ): DialogContainerInstance {
    let containerInstance: DialogContainerInstance | null = null;
    const containerComponent = config.container ?? VDialogContainer;
    // 容器经 ComponentPortal 挂载：验证 portal 分层，同时保持 h() 传参语义
    // （config/dialogRef/content 走 props，onContainerReady 作为事件监听）。
    overlay.attach(
      new ComponentPortal(containerComponent, {
        props: {
        config,
        dialogRef,
        content,
        onContainerReady: (instance: DialogContainerInstance) => {
          containerInstance = instance;
        },
        },
      }),
    );
    if (!containerInstance) {
      throw new Error(
        'Dialog: 容器组件未通过 onContainerReady 回调暴露实例，请复用 useDialogContainerCore。',
      );
    }
    return containerInstance;
  }

  /** 隐藏 overlay 容器之外的页面内容，防止读屏器访问背景。 */
  private _hideNonDialogContentFromAssistiveTechnology(overlayRef: OverlayRef): void {
    const overlayContainerElement = overlayRef.hostElement.parentElement;
    if (!overlayContainerElement?.parentElement) {
      return;
    }
    const siblings = overlayContainerElement.parentElement.children;
    for (let i = siblings.length - 1; i > -1; i--) {
      const sibling = siblings[i];
      if (
        sibling !== overlayContainerElement &&
        sibling.nodeName !== 'SCRIPT' &&
        sibling.nodeName !== 'STYLE' &&
        !sibling.hasAttribute('aria-live') &&
        !sibling.hasAttribute('popover')
      ) {
        this._ariaHiddenElements.set(sibling, sibling.getAttribute('aria-hidden'));
        sibling.setAttribute('aria-hidden', 'true');
      }
    }
  }

  /**
   * 从打开栈移除对话框；最后一个关闭时恢复背景元素的 aria-hidden
   * 并触发 afterAllClosed。
   */
  private _removeOpenDialog(dialogRef: DialogRef<any, any>, emitEvent: boolean): void {
    const index = this.openDialogs.indexOf(dialogRef);
    if (index > -1) {
      (this.openDialogs as DialogRef<any, any>[]).splice(index, 1);
      if (!this.openDialogs.length) {
        this._ariaHiddenElements.forEach((previousValue, element) => {
          if (previousValue) {
            element.setAttribute('aria-hidden', previousValue);
          } else {
            element.removeAttribute('aria-hidden');
          }
        });
        this._ariaHiddenElements.clear();
        if (emitEvent) {
          this._afterAllClosed.next();
        }
      }
    }
  }
}

/** 模块级对话框服务单例，适合非组件上下文命令式调用。 */
export const dialogService = new Dialog();

/**
 * 组合式 API 入口：在组件 setup 中调用，捕获当前应用上下文与
 * DEFAULT_DIALOG_CONFIG 注入，使对话框内容可访问 app 级 provide。
 * 返回对象与 dialogService 共享打开栈与事件流。
 */
export function useDialog(): DialogApi {
  const appContext = getCurrentInstance()?.appContext ?? null;
  const defaults = getCurrentInstance() ? inject(DEFAULT_DIALOG_CONFIG, null) : null;
  return {
    open: (content, config) => dialogService.open(content, config, {appContext, defaults}),
    closeAll: () => dialogService.closeAll(),
    getDialogById: id => dialogService.getDialogById(id),
    get openDialogs() {
      return dialogService.openDialogs;
    },
    get afterOpened() {
      return dialogService.afterOpened;
    },
    get afterAllClosed() {
      return dialogService.afterAllClosed;
    },
  };
}

/** 逆序遍历并回调，兼容回调中修改数组（Angular 同款工具）。 */
function reverseForEach<T>(items: readonly T[], callback: (current: T) => void): void {
  let i = items.length;
  while (i--) {
    callback(items[i]);
  }
}
