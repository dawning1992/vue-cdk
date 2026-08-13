/**
 * 混合排序策略，移植自 Angular CDK drag-drop（MIT License）。
 * 原版权：Copyright Google LLC All Rights Reserved。
 *
 * 支持可能换行的列表（如 flex-wrap 网格）：通过移动 DOM 节点重排，
 * 移动后对被挤动条目施加 FLIP 反向位移并在下一帧清除，配合 CSS transition
 * 实现平滑让位动画；拖拽结束后按快照恢复容器内节点顺序。
 */

import {getShadowRoot} from '../../platform';
import {moveItemInArray} from '../drag-utils';
import {dragDropRegistry, type DragDropRegistry} from '../drag-drop-registry';
import {combineTransforms, getTransform} from '../dom/styling';
import type {DragRef} from '../drag-ref';
import {type DropListSortStrategy, type SortPredicate} from './drop-list-sort-strategy';

/** FLIP 动画待清除项：元素与其移动前的初始 transform。 */
interface FlipEntry {
  element: HTMLElement;
  initialTransform: string;
}

/**
 * 混合排序策略：排序通过 DOM 节点移动实现，适合 wrap 布局；
 * 同时记录节点与其 nextSibling 的关系，便于 reset 时恢复顺序。
 */
export class MixedSortStrategy implements DropListSortStrategy {
  private _element!: HTMLElement;
  private _sortPredicate!: SortPredicate<DragRef>;

  /** 懒解析的根节点（文档或 shadow root）。 */
  private _rootNode: DocumentOrShadowRoot | undefined;

  private _activeItems!: DragRef[];

  /** 上次交换记录，抑制指针未离开条目时的重复交换。 */
  private _previousSwap = {
    drag: null as DragRef | null,
    deltaX: 0,
    deltaY: 0,
    overlaps: false,
  };

  /** 拖拽开始时节点与其 nextSibling 的关系快照。 */
  private _relatedNodes: [node: Node, nextSibling: Node | null][] = [];

  /** 本轮拖拽中各条目可见元素的初始 transform（动画结束后需还原）。 */
  private _initialTransforms = new Map<HTMLElement, string>();

  /** 已被施加反向位移、等待下一帧清除的元素。 */
  private _flippedElements: FlipEntry[] = [];

  /** 待播放的清除帧 id，新一轮交换或 reset 时需取消。 */
  private _flipFrameId: number | null = null;

  constructor(
    private _document: Document,
    private _dragDropRegistry: DragDropRegistry = dragDropRegistry,
  ) {}

  /** 拖拽开始：记录容器节点关系并同步条目。 */
  start(items: readonly DragRef[]): void {
    const childNodes = this._element.childNodes;
    this._relatedNodes = [];

    for (let i = 0; i < childNodes.length; i++) {
      const node = childNodes[i];
      this._relatedNodes.push([node, node.nextSibling]);
    }

    this.withItems(items);

    // 记录初始 transform，动画结束后按原值还原，避免覆盖用户已有位移。
    this._initialTransforms = new Map(
      this._activeItems.map(item => {
        const element = item.getVisibleElement();
        return [element, element.style.transform || ''];
      }),
    );
  }

  /** 按指针命中元素排序：把占位符移动到目标条目前后。 */
  sort(
    item: DragRef,
    pointerX: number,
    pointerY: number,
    pointerDelta: {x: number; y: number},
  ): {previousIndex: number; currentIndex: number} | null {
    const newIndex = this._getItemIndexFromPointerPosition(item, pointerX, pointerY);
    const previousSwap = this._previousSwap;

    if (newIndex === -1 || this._activeItems[newIndex] === item) {
      return null;
    }

    const toSwapWith = this._activeItems[newIndex];

    if (
      previousSwap.drag === toSwapWith &&
      previousSwap.overlaps &&
      previousSwap.deltaX === pointerDelta.x &&
      previousSwap.deltaY === pointerDelta.y
    ) {
      return null;
    }

    const previousIndex = this.getItemIndex(item);
    const current = item.getPlaceholderElement();
    const overlapElement = toSwapWith.getRootElement();

    this._moveWithFlip(() => {
      if (newIndex > previousIndex) {
        overlapElement.after(current);
      } else {
        overlapElement.before(current);
      }
    }, current);

    moveItemInArray(this._activeItems, previousIndex, newIndex);

    const newOverlapElement = this._getRootNode().elementFromPoint(pointerX, pointerY);
    previousSwap.deltaX = pointerDelta.x;
    previousSwap.deltaY = pointerDelta.y;
    previousSwap.drag = toSwapWith;
    previousSwap.overlaps =
      overlapElement === newOverlapElement || overlapElement.contains(newOverlapElement);

    return {
      previousIndex,
      currentIndex: newIndex,
    };
  }

  /** 条目进入容器：按索引或最近元素插入。 */
  enter(item: DragRef, pointerX: number, pointerY: number, index?: number): void {
    const currentIndex = this._activeItems.indexOf(item);

    if (currentIndex > -1) {
      this._activeItems.splice(currentIndex, 1);
    }

    let enterIndex =
      index == null || index < 0
        ? this._getItemIndexFromPointerPosition(item, pointerX, pointerY)
        : index;

    if (enterIndex === -1) {
      enterIndex = this._getClosestItemIndexToPointer(item, pointerX, pointerY);
    }

    const targetItem = this._activeItems[enterIndex] as DragRef | undefined;

    if (targetItem && !this._dragDropRegistry.isDragging(targetItem)) {
      this._activeItems.splice(enterIndex, 0, item);
      this._moveWithFlip(
        () => targetItem.getRootElement().before(item.getPlaceholderElement()),
        item.getPlaceholderElement(),
      );
    } else {
      this._activeItems.push(item);
      this._moveWithFlip(
        () => this._element.appendChild(item.getPlaceholderElement()),
        item.getPlaceholderElement(),
      );
    }
  }

  /** 同步条目集合。 */
  withItems(items: readonly DragRef[]): void {
    this._activeItems = items.slice();
  }

  /** 设置排序判定函数。 */
  withSortPredicate(predicate: SortPredicate<DragRef>): void {
    this._sortPredicate = predicate;
  }

  /** 恢复容器节点原始顺序并清空状态。 */
  reset(): void {
    // 先无过渡清除待播放的反向位移，避免放下后被拖回的条目闪跳。
    this._clearFlipTransforms(false);

    const root = this._element;
    const previousSwap = this._previousSwap;

    for (let i = this._relatedNodes.length - 1; i > -1; i--) {
      const [node, nextSibling] = this._relatedNodes[i];
      if (node.parentNode === root && node.nextSibling !== nextSibling) {
        if (nextSibling === null) {
          root.appendChild(node);
        } else if (nextSibling.parentNode === root) {
          root.insertBefore(node, nextSibling);
        }
      }
    }

    this._relatedNodes = [];
    this._activeItems = [];
    this._initialTransforms.clear();
    previousSwap.drag = null;
    previousSwap.deltaX = previousSwap.deltaY = 0;
    previousSwap.overlaps = false;
  }

  /** 当前活动条目快照。 */
  getActiveItemsSnapshot(): readonly DragRef[] {
    return this._activeItems;
  }

  /** 条目索引。 */
  getItemIndex(item: DragRef): number {
    return this._activeItems.indexOf(item);
  }

  /** 指定索引的条目。 */
  getItemAtIndex(index: number): DragRef | null {
    return this._activeItems[index] || null;
  }

  /** 滚动时让拖拽中的条目按最近指针位置重排。 */
  updateOnScroll(): void {
    this._activeItems.forEach(item => {
      if (this._dragDropRegistry.isDragging(item)) {
        item._sortFromLastPointerPosition();
      }
    });
  }

  /** 设置列表元素容器并失效根节点缓存。 */
  withElementContainer(container: HTMLElement): void {
    if (container !== this._element) {
      this._element = container;
      this._rootNode = undefined;
    }
  }

  /** 按指针命中的元素计算目标索引。 */
  private _getItemIndexFromPointerPosition(
    item: DragRef,
    pointerX: number,
    pointerY: number,
  ): number {
    const elementAtPoint = this._getRootNode().elementFromPoint(
      Math.floor(pointerX),
      Math.floor(pointerY),
    );
    const index = elementAtPoint
      ? this._activeItems.findIndex(item => {
          const root = item.getRootElement();
          return elementAtPoint === root || root.contains(elementAtPoint);
        })
      : -1;
    return index === -1 || !this._sortPredicate(index, item) ? -1 : index;
  }

  /** 懒解析列表根节点，确保元素已处于最终 DOM 位置。 */
  private _getRootNode(): DocumentOrShadowRoot {
    if (!this._rootNode) {
      this._rootNode = getShadowRoot(this._element) || this._document;
    }
    return this._rootNode;
  }

  /** 找出与指针欧氏距离最近的条目索引。 */
  private _getClosestItemIndexToPointer(item: DragRef, pointerX: number, pointerY: number): number {
    if (this._activeItems.length === 0) {
      return -1;
    }

    if (this._activeItems.length === 1) {
      return 0;
    }

    let minDistance = Infinity;
    let minIndex = -1;

    for (let i = 0; i < this._activeItems.length; i++) {
      const current = this._activeItems[i];
      if (current !== item) {
        const {x, y} = current.getRootElement().getBoundingClientRect();
        const distance = Math.hypot(pointerX - x, pointerY - y);

        if (distance < minDistance) {
          minDistance = distance;
          minIndex = i;
        }
      }
    }

    return minIndex;
  }

  /** 执行节点移动，并围绕移动对被挤动条目做 FLIP 动画。 */
  private _moveWithFlip(move: () => void, movedElement: HTMLElement): void {
    // 先无过渡清掉上一轮反向位移，确保测量到真实布局位置。
    this._clearFlipTransforms(false);
    const before = this._capturePositions();
    move();
    this._playFlip(before, movedElement);
  }

  /** 捕获当前各条目可见元素的布局矩形。 */
  private _capturePositions(): Map<HTMLElement, DOMRect> {
    const positions = new Map<HTMLElement, DOMRect>();
    this._activeItems.forEach(item => {
      const element = item.getVisibleElement();
      positions.set(element, element.getBoundingClientRect());
    });
    return positions;
  }

  /**
   * 对比移动前后的位置，对被挤动条目施加反向位移，再在下一帧清除，
   * 使 CSS transition 把它们从旧位置平滑滑到新位置。
   * 被移动的占位符本身不参与动画（跟随指针跳位，与单轴策略一致）。
   */
  private _playFlip(before: Map<HTMLElement, DOMRect>, movedElement: HTMLElement): void {
    const displaced: {element: HTMLElement; dx: number; dy: number}[] = [];

    before.forEach((oldRect, element) => {
      if (element === movedElement) {
        return;
      }

      const newRect = element.getBoundingClientRect();
      const dx = oldRect.left - newRect.left;
      const dy = oldRect.top - newRect.top;

      if (dx !== 0 || dy !== 0) {
        displaced.push({element, dx, dy});
      }
    });

    if (!displaced.length) {
      return;
    }

    for (const {element, dx, dy} of displaced) {
      const initialTransform = this._initialTransforms.get(element) || '';
      // 反位移阶段必须禁用过渡，否则浏览器会把“回到原位”本身也做成动画。
      element.style.transition = 'none';
      element.style.transform = combineTransforms(getTransform(dx, dy), initialTransform);
      this._flippedElements.push({element, initialTransform});
    }

    // 强制回流，让浏览器把反向位移记为下一帧 transition 的起点。
    this._element.getBoundingClientRect();

    if (typeof requestAnimationFrame === 'function') {
      this._flipFrameId = requestAnimationFrame(() => this._clearFlipTransforms(true));
    } else {
      this._clearFlipTransforms(false);
    }
  }

  /**
   * 清除待播放的反向位移。animate=true 时恢复过渡，让条目从旧位置滑回
   * 最终位置；否则无过渡直接还原（用于新一轮交换前测量或 reset）。
   */
  private _clearFlipTransforms(animate: boolean): void {
    if (this._flipFrameId !== null) {
      if (typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(this._flipFrameId);
      }
      this._flipFrameId = null;
    }

    const flipped = this._flippedElements;
    this._flippedElements = [];

    for (const {element, initialTransform} of flipped) {
      if (animate) {
        element.style.transition = '';
        element.style.transform = initialTransform;
      } else {
        element.style.transition = 'none';
        element.style.transform = initialTransform;
        // 还原后立刻移除内联 transition，避免影响该元素后续的 CSS 过渡。
        element.style.transition = '';
      }
    }
  }
}
