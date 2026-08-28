import {coerceArray} from '../coercion';
import type {DialogRef} from './dialog-ref';

/** 共享遮罩基础类，与 overlay 模块样式保持一致。 */
const BACKDROP_CLASS = 'vcdk-overlay-backdrop';
/** 遮罩完全显示类，由淡入动画驱动。 */
const BACKDROP_SHOWING_CLASS = 'vcdk-overlay-backdrop-showing';
/** 禁用遮罩动画类。 */
const BACKDROP_NOOP_CLASS = 'vcdk-overlay-backdrop-noop-animation';
/** 未配置 backdropClass 时使用的默认深色遮罩类。 */
const DEFAULT_BACKDROP_CLASS = 'vcdk-overlay-dark-backdrop';
/** 容器 CSS 变量 --vcdk-overlay-container-z-index 解析失败时的兜底值。 */
const DEFAULT_CONTAINER_Z_INDEX = 1000;

/**
 * 对话框共享遮罩管理器：同一 Dialog 服务打开的多个对话框共用唯一遮罩元素，
 * 并统一维护对话框 host 的 z-index 栈。
 *
 * 层级模型（rank 为对话框在打开栈中的位置，从 1 起）：
 * - 每个对话框 host 的 z-index = base + 2 × rank，保证栈序与视觉序一致；
 * - 共享遮罩的 z-index = base + 2 × (topRank − 1) + 1，即始终位于当前
 *   顶层参与对话框之下、其余对话框之上；关闭顶层后 z-index 回落，
 *   把下一层窗口放出来。
 * - popover 渲染模式下 host 位于浏览器 top-layer，z-index 不参与层叠，
 *   遮罩改为迁入顶层参与对话框的 host 内部（pane 之前），
 *   由 top-layer 顺序实现等效层级。
 *
 * 遮罩点击只派发给当前顶层参与对话框，下层对话框不会收到；
 * backdropClass 跟随顶层参与对话框，动画禁用规则为“任一参与者禁用即 noop”。
 *
 * 生命周期约定：sync() 在 open/close 后调用；首个参与对话框打开时
 * 淡入遮罩，最后一个关闭时立即移除（与 overlay dispose 行为一致）。
 */
export class DialogBackdropManager {
  private _element: HTMLElement | null = null;
  /** 当前顶层参与对话框；关闭全部对话框后置空。 */
  private _topParticipant: DialogRef | null = null;
  /** 上一次应用到共享遮罩上的 backdropClass，切换顶层时据此清理。 */
  private _appliedBackdropClasses: string[] = [];

  /**
   * 按当前打开栈重排所有对话框的 z-index，并同步共享遮罩的位置、层级与类。
   * @param dialogs 当前已打开的对话框列表（后打开的排末尾）。
   */
  sync(dialogs: readonly DialogRef[]): void {
    const containerElement = dialogs[0]?.overlayRef.hostElement.parentElement ?? null;
    const base = this._resolveBaseZIndex(containerElement);

    // 所有对话框按打开顺序获得递增 z-index：关闭中间层后栈会塌缩重排，
    // 保证剩余对话框仍与视觉顺序一致。
    dialogs.forEach((dialog, index) => {
      if (dialog.overlayRef.hasAttached()) {
        dialog.overlayRef.hostElement.style.zIndex = String(base + 2 * (index + 1));
      }
    });

    const participants = dialogs.filter(dialog => dialog.config.hasBackdrop !== false);
    const topParticipant = participants[participants.length - 1] ?? null;
    this._topParticipant = topParticipant;

    if (!topParticipant) {
      this._removeElement();
      return;
    }

    const host = topParticipant.overlayRef.hostElement;
    const created = !this._element;
    const element = this._ensureElement(host.ownerDocument);
    const isPopover = topParticipant.overlayRef.getConfig().usePopover === true;

    if (isPopover) {
      // top-layer 顺序层叠：清除内联 z-index，把遮罩放到 pane 之前。
      element.style.zIndex = '';
      host.prepend(element);
    } else {
      // 容器渲染：遮罩作为容器子元素，z-index 插在顶层窗口之下。
      const topRank = dialogs.indexOf(topParticipant) + 1;
      element.style.zIndex = String(base + 2 * (topRank - 1) + 1);
      if (containerElement && element.parentElement !== containerElement) {
        containerElement.appendChild(element);
      }
    }

    this._applyBackdropClass(element, topParticipant.config.backdropClass);
    this._syncAnimationMode(element, participants);
    if (created) {
      // 首个参与对话框打开时淡入；禁用动画或无 rAF 环境时立即显示。
      const noAnimation = participants.some(dialog => dialog.config.disableAnimations === true);
      if (noAnimation || typeof requestAnimationFrame === 'undefined') {
        element.classList.add(BACKDROP_SHOWING_CLASS);
      } else {
        requestAnimationFrame(() => {
          element.classList.add(BACKDROP_SHOWING_CLASS);
        });
      }
    }
  }

  /**
   * 读取容器 z-index 基数：优先使用 CSS 变量 --vcdk-overlay-container-z-index，
   * 未解析成功（如 jsdom 环境）时回退默认值。
   */
  private _resolveBaseZIndex(containerElement: HTMLElement | null): number {
    if (!containerElement || typeof getComputedStyle === 'undefined') {
      return DEFAULT_CONTAINER_Z_INDEX;
    }
    const raw = getComputedStyle(containerElement).getPropertyValue(
      '--vcdk-overlay-container-z-index',
    );
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : DEFAULT_CONTAINER_Z_INDEX;
  }

  /** 懒创建共享遮罩元素（基础类与点击监听），淡入由 sync 在创建当次处理。 */
  private _ensureElement(documentRef: Document): HTMLElement {
    if (this._element) {
      return this._element;
    }
    const element = documentRef.createElement('div');
    element.classList.add(BACKDROP_CLASS);
    element.addEventListener('click', this._onBackdropClick);
    this._element = element;
    return element;
  }

  /** 遮罩点击只派发给当前顶层参与对话框，避免下层对话框被误关。 */
  private _onBackdropClick = (event: MouseEvent): void => {
    const topParticipant = this._topParticipant;
    if (topParticipant?.overlayRef.hasAttached()) {
      topParticipant.overlayRef.backdropClick().next(event);
    }
  };

  /** 应用顶层参与对话框的 backdropClass；未配置时回退默认深色遮罩类。 */
  private _applyBackdropClass(
    element: HTMLElement,
    backdropClass: string | string[] | undefined,
  ): void {
    for (const className of this._appliedBackdropClasses) {
      element.classList.remove(className);
    }
    const customClasses = coerceArray(backdropClass).filter(className => !!className);
    const effectiveClasses = customClasses.length ? customClasses : [DEFAULT_BACKDROP_CLASS];
    element.classList.add(...effectiveClasses);
    this._appliedBackdropClasses = effectiveClasses;
  }

  /** 任一参与对话框禁用动画时，共享遮罩全程使用 noop 模式。 */
  private _syncAnimationMode(element: HTMLElement, participants: readonly DialogRef[]): void {
    const noAnimation = participants.some(dialog => dialog.config.disableAnimations === true);
    element.classList.toggle(BACKDROP_NOOP_CLASS, noAnimation);
  }

  /** 无参与对话框时移除共享遮罩并清空状态，下次打开重新淡入。 */
  private _removeElement(): void {
    if (!this._element) {
      return;
    }
    this._element.remove();
    this._element = null;
    this._topParticipant = null;
    this._appliedBackdropClasses = [];
  }
}
