/**
 * 可滚动祖先位置缓存，移植自 Angular CDK drag-drop（MIT License）。
 * 原版权：Copyright Google LLC All Rights Reserved。
 */

import {getEventTarget} from '../../platform';
import {adjustDomRect, getMutableClientRect} from './dom-rect';

/** 某节点的滚动位置。 */
interface ScrollPosition {
  top: number;
  left: number;
}

/**
 * 跟踪拖拽条目可滚动祖先的滚动位置与矩形。
 * 拖动期间发生滚动时，据此平移缓存的矩形并计算滚动差值。
 */
export class ParentPositionTracker {
  /** 已缓存的滚动位置与矩形，键为文档或元素。 */
  readonly positions = new Map<
    Document | HTMLElement,
    {
      scrollPosition: ScrollPosition;
      clientRect?: DOMRect;
    }
  >();

  constructor(private _document: Document) {}

  /** 清空缓存。 */
  clear() {
    this.positions.clear();
  }

  /** 缓存文档与元素的滚动位置和矩形，应在拖拽序列开始时调用。 */
  cache(elements: readonly HTMLElement[]) {
    this.clear();
    this.positions.set(this._document, {
      scrollPosition: this.getViewportScrollPosition(),
    });

    elements.forEach(element => {
      this.positions.set(element, {
        scrollPosition: {top: element.scrollTop, left: element.scrollLeft},
        clientRect: getMutableClientRect(element),
      });
    });
  }

  /**
   * 处理一次滚动事件：返回滚动差值，并平移受影响的缓存矩形。
   * 未缓存的目标返回 null。
   */
  handleScroll(event: Event): ScrollPosition | null {
    const target = getEventTarget(event) as HTMLElement | Document | null;
    const cachedPosition = target ? this.positions.get(target) : undefined;

    if (!target || !cachedPosition) {
      return null;
    }

    const scrollPosition = cachedPosition.scrollPosition;
    let newTop: number;
    let newLeft: number;

    if (target === this._document) {
      const viewportScrollPosition = this.getViewportScrollPosition();
      newTop = viewportScrollPosition.top;
      newLeft = viewportScrollPosition.left;
    } else {
      newTop = (target as HTMLElement).scrollTop;
      newLeft = (target as HTMLElement).scrollLeft;
    }

    const topDifference = scrollPosition.top - newTop;
    const leftDifference = scrollPosition.left - newLeft;

    this.positions.forEach((position, node) => {
      if (position.clientRect && target !== node && target.contains(node)) {
        adjustDomRect(position.clientRect, topDifference, leftDifference);
      }
    });

    scrollPosition.top = newTop;
    scrollPosition.left = newLeft;

    return {top: topDifference, left: leftDifference};
  }

  /**
   * 获取视口滚动位置。直接读取 scrollX/scrollY，
   * 避免 BlockScrollStrategy 等修改 documentElement 偏移时读数失真。
   */
  getViewportScrollPosition() {
    return {top: window.scrollY, left: window.scrollX};
  }
}
