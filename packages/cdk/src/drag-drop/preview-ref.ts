/**
 * 拖拽预览元素管理器，移植自 Angular CDK drag-drop（https://github.com/angular/components，MIT License）。
 * 原版权：Copyright Google LLC All Rights Reserved。
 *
 * 与 Angular 的差异：自定义预览模板由框架层提供 `render`/`destroy` 函数
 * （Vue 插槽经渲染函数实现），替代 TemplateRef/EmbeddedViewRef 机制。
 */

import type {Direction} from '../scrolling/directionality';
import type {DragPreviewTemplate} from './drag-ref';
import {deepCloneNode} from './dom/clone-node';
import {
  extendStyles,
  getTransform,
  matchElementSize,
  toggleNativeDragInteractions,
} from './dom/styling';
import {getTransformTransitionDurationInMs} from './dom/transition-duration';

/** 需要以 !important 写入的内联样式。 */
const importantProperties = new Set([
  // mat-table 等场景会设置 position: sticky !important，需强制覆盖。
  'position',
]);

/** 预览元素类名。 */
export const DRAG_PREVIEW_CLASS = 'vcdk-drag-preview';

/**
 * 拖拽预览：跟随指针的根元素克隆或自定义模板渲染结果。
 * 负责定位、尺寸匹配、样式注入与销毁。
 */
export class PreviewRef {
  /** 预览根元素。 */
  private _preview!: HTMLElement;

  /** 预览根元素。 */
  get element(): HTMLElement {
    return this._preview;
  }

  constructor(
    _document: Document,
    private _rootElement: HTMLElement,
    private _direction: Direction,
    private _initialDomRect: DOMRect,
    private _previewTemplate: DragPreviewTemplate | null,
    private _previewClass: string | string[] | null,
    private _pickupPositionOnPage: {x: number; y: number},
    private _initialTransform: string | null,
    private _zIndex: number,
  ) {}

  /** 创建预览并插入目标父节点；支持原生 Popover 时以 popover 方式展示。 */
  attach(parent: HTMLElement): void {
    this._preview = this._createPreview();
    parent.appendChild(this._preview);

    if (supportsPopover(this._preview)) {
      this._preview.showPopover();
    }
  }

  /** 移除预览元素并释放自定义模板资源。 */
  destroy(): void {
    this._preview?.remove();
    this._previewTemplate?.destroy();
    this._previewTemplate = null;
    (this._preview as HTMLElement | null) = null;
  }

  /** 更新预览位移。 */
  setTransform(value: string): void {
    this._preview.style.transform = value;
  }

  /** 预览元素包围盒。 */
  getBoundingClientRect(): DOMRect {
    return this._preview.getBoundingClientRect();
  }

  /** 追加类名（用于拖回动画等状态）。 */
  addClass(className: string): void {
    this._preview.classList.add(className);
  }

  /** 解析预览 transform 过渡时长，用于判断是否需要等待 transitionend。 */
  getTransitionDuration(): number {
    return getTransformTransitionDurationInMs(this._preview);
  }

  /** 在预览元素上注册监听，返回移除函数。 */
  addEventListener(name: string, handler: (event: any) => void): () => void {
    this._preview.addEventListener(name, handler);
    return () => this._preview.removeEventListener(name, handler);
  }

  /** 创建预览元素：自定义模板或根元素克隆，随后注入定位样式。 */
  private _createPreview(): HTMLElement {
    const previewConfig = this._previewTemplate;
    const previewClass = this._previewClass;
    let preview: HTMLElement;

    if (previewConfig) {
      const rootRect = previewConfig.matchSize ? this._initialDomRect : null;
      preview = previewConfig.render();
      if (previewConfig.matchSize) {
        matchElementSize(preview, rootRect!);
      } else {
        preview.style.transform = getTransform(
          this._pickupPositionOnPage.x,
          this._pickupPositionOnPage.y,
        );
      }
    } else {
      preview = deepCloneNode(this._rootElement);
      matchElementSize(preview, this._initialDomRect);

      if (this._initialTransform) {
        preview.style.transform = this._initialTransform;
      }
    }

    extendStyles(
      preview.style,
      {
        // 预览必须忽略指针事件，否则会干扰 document.elementFromPoint 判定。
        'pointer-events': 'none',
        // 清除外边距，避免影响定位；popover 模式在 RTL 下需要 auto 补偿。
        'margin': supportsPopover(preview) ? '0 auto 0 0' : '0',
        'position': 'fixed',
        'top': '0',
        'left': '0',
        'z-index': this._zIndex + '',
      },
      importantProperties,
    );

    toggleNativeDragInteractions(preview, false);
    preview.classList.add(DRAG_PREVIEW_CLASS);
    preview.setAttribute('popover', 'manual');
    preview.setAttribute('dir', this._direction);

    if (previewClass) {
      if (Array.isArray(previewClass)) {
        previewClass.forEach(className => preview.classList.add(className));
      } else {
        preview.classList.add(previewClass);
      }
    }

    return preview;
  }
}

/** 元素是否支持原生 Popover API。 */
function supportsPopover(element: HTMLElement): boolean {
  return 'showPopover' in element;
}
