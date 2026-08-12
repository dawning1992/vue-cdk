/**
 * 单轴排序策略，移植自 Angular CDK drag-drop（MIT License）。
 * 原版权：Copyright Google LLC All Rights Reserved。
 *
 * 仅支持单轴排序；通过 CSS transform 平移条目实现可动画的重排。
 */

import type {Direction} from '../../scrolling/directionality';
import {moveItemInArray} from '../drag-utils';
import {dragDropRegistry, type DragDropRegistry} from '../drag-drop-registry';
import {adjustDomRect, getMutableClientRect, isInsideClientRect} from '../dom/dom-rect';
import {combineTransforms} from '../dom/styling';
import type {DragRef} from '../drag-ref';
import {type DropListSortStrategy, type SortPredicate} from './drop-list-sort-strategy';

/** 条目位置缓存项。 */
interface CachedItemPosition<T> {
  drag: T;
  clientRect: DOMRect;
  offset: number;
  initialTransform: string;
}

/**
 * 单轴排序策略：条目沿主轴（纵向 top / 横向 left）排列，
 * 拖动时按指针位置计算目标索引，用 transform 平移其余条目。
 */
export class SingleAxisSortStrategy implements DropListSortStrategy {
  /** 列表元素容器。 */
  private _element!: HTMLElement;

  /** 排序判定函数。 */
  private _sortPredicate!: SortPredicate<DragRef>;

  /** 条目位置缓存（按主轴坐标排序）。 */
  private _itemPositions: CachedItemPosition<DragRef>[] = [];

  /** 当前活动条目（含拖入未放下的条目）。 */
  private _activeDraggables!: DragRef[];

  /** 列表朝向。 */
  orientation: 'vertical' | 'horizontal' = 'vertical';

  /** 布局方向。 */
  direction: Direction = 'ltr';

  /** 上次交换记录，用于抑制指针未离开条目时的重复交换。 */
  private _previousSwap = {
    drag: null as DragRef | null,
    delta: 0,
    overlaps: false,
  };

  constructor(private _dragDropRegistry: DragDropRegistry = dragDropRegistry) {}

  /** 拖拽序列开始时同步条目。 */
  start(items: readonly DragRef[]) {
    this.withItems(items);
  }

  /** 按指针位置排序条目。 */
  sort(item: DragRef, pointerX: number, pointerY: number, pointerDelta: {x: number; y: number}) {
    const siblings = this._itemPositions;
    const newIndex = this._getItemIndexFromPointerPosition(item, pointerX, pointerY, pointerDelta);

    if (newIndex === -1 && siblings.length > 0) {
      return null;
    }

    const isHorizontal = this.orientation === 'horizontal';
    const currentIndex = siblings.findIndex(currentItem => currentItem.drag === item);
    const siblingAtNewPosition = siblings[newIndex];
    const currentPosition = siblings[currentIndex].clientRect;
    const newPosition = siblingAtNewPosition.clientRect;
    const delta = currentIndex > newIndex ? 1 : -1;

    const itemOffset = this._getItemOffsetPx(currentPosition, newPosition, delta);
    const siblingOffset = this._getSiblingOffsetPx(currentIndex, siblings, delta);

    const oldOrder = siblings.slice();
    moveItemInArray(siblings, currentIndex, newIndex);

    siblings.forEach((sibling, index) => {
      if (oldOrder[index] === sibling) {
        return;
      }

      const isDraggedItem = sibling.drag === item;
      const offset = isDraggedItem ? itemOffset : siblingOffset;
      const elementToOffset = isDraggedItem
        ? item.getPlaceholderElement()
        : sibling.drag.getRootElement();

      sibling.offset += offset;
      const transformAmount = Math.round(sibling.offset * (1 / sibling.drag.scale));

      if (isHorizontal) {
        elementToOffset.style.transform = combineTransforms(
          `translate3d(${transformAmount}px, 0, 0)`,
          sibling.initialTransform,
        );
        adjustDomRect(sibling.clientRect, 0, offset);
      } else {
        elementToOffset.style.transform = combineTransforms(
          `translate3d(0, ${transformAmount}px, 0)`,
          sibling.initialTransform,
        );
        adjustDomRect(sibling.clientRect, offset, 0);
      }
    });

    this._previousSwap.overlaps = isInsideClientRect(newPosition, pointerX, pointerY);
    this._previousSwap.drag = siblingAtNewPosition.drag;
    this._previousSwap.delta = isHorizontal ? pointerDelta.x : pointerDelta.y;

    return {previousIndex: currentIndex, currentIndex: newIndex};
  }

  /** 条目进入容器：插入活动列表与 DOM。 */
  enter(item: DragRef, pointerX: number, pointerY: number, index?: number): void {
    const activeDraggables = this._activeDraggables;
    const currentIndex = activeDraggables.indexOf(item);
    const placeholder = item.getPlaceholderElement();

    if (currentIndex > -1) {
      activeDraggables.splice(currentIndex, 1);
    }

    const newIndex =
      index == null || index < 0
        ? this._getItemIndexFromPointerPosition(item, pointerX, pointerY)
        : index;

    let newPositionReference: DragRef | undefined = activeDraggables[newIndex];

    if (newPositionReference === item) {
      newPositionReference = activeDraggables[newIndex + 1];
    }

    if (
      !newPositionReference &&
      (newIndex == null || newIndex === -1 || newIndex < activeDraggables.length - 1) &&
      this._shouldEnterAsFirstChild(pointerX, pointerY)
    ) {
      newPositionReference = activeDraggables[0];
    }

    if (newPositionReference && !this._dragDropRegistry.isDragging(newPositionReference)) {
      const element = newPositionReference.getRootElement();
      element.parentElement!.insertBefore(placeholder, element);
      activeDraggables.splice(newIndex, 0, item);
    } else {
      this._element.appendChild(placeholder);
      activeDraggables.push(item);
    }

    placeholder.style.transform = '';
    this._cacheItemPositions();
  }

  /** 同步条目集合并刷新位置缓存。 */
  withItems(items: readonly DragRef[]): void {
    this._activeDraggables = items.slice();
    this._cacheItemPositions();
  }

  /** 设置排序判定函数。 */
  withSortPredicate(predicate: SortPredicate<DragRef>): void {
    this._sortPredicate = predicate;
  }

  /** 重置到拖拽前状态并清除 transform。 */
  reset() {
    this._activeDraggables?.forEach(item => {
      const rootElement = item.getRootElement();

      if (rootElement) {
        const initialTransform = this._itemPositions.find(p => p.drag === item)?.initialTransform;
        rootElement.style.transform = initialTransform || '';
      }
    });

    this._itemPositions = [];
    this._activeDraggables = [];
    this._previousSwap.drag = null;
    this._previousSwap.delta = 0;
    this._previousSwap.overlaps = false;
  }

  /** 当前活动条目快照。 */
  getActiveItemsSnapshot(): readonly DragRef[] {
    return this._activeDraggables;
  }

  /** 条目索引（RTL 横向按视觉序反转）。 */
  getItemIndex(item: DragRef): number {
    return this._getVisualItemPositions().findIndex(currentItem => currentItem.drag === item);
  }

  /** 指定索引的条目。 */
  getItemAtIndex(index: number): DragRef | null {
    return this._getVisualItemPositions()[index]?.drag || null;
  }

  /** 滚动发生时平移缓存矩形并重排拖拽中的条目。 */
  updateOnScroll(topDifference: number, leftDifference: number) {
    this._itemPositions.forEach(({clientRect}) => {
      adjustDomRect(clientRect, topDifference, leftDifference);
    });

    this._itemPositions.forEach(({drag}) => {
      if (this._dragDropRegistry.isDragging(drag)) {
        drag._sortFromLastPointerPosition();
      }
    });
  }

  /** 设置列表元素容器。 */
  withElementContainer(container: HTMLElement): void {
    this._element = container;
  }

  /** 刷新条目位置缓存（按主轴坐标排序）。 */
  private _cacheItemPositions() {
    const isHorizontal = this.orientation === 'horizontal';

    this._itemPositions = this._activeDraggables
      .map(drag => {
        const elementToMeasure = drag.getVisibleElement();
        return {
          drag,
          offset: 0,
          initialTransform: elementToMeasure.style.transform || '',
          clientRect: getMutableClientRect(elementToMeasure),
        };
      })
      .sort((a, b) => {
        return isHorizontal
          ? a.clientRect.left - b.clientRect.left
          : a.clientRect.top - b.clientRect.top;
      });
  }

  /** 视觉序条目位置（RTL 横向反转）。 */
  private _getVisualItemPositions() {
    return this.orientation === 'horizontal' && this.direction === 'rtl'
      ? this._itemPositions.slice().reverse()
      : this._itemPositions;
  }

  /** 计算被拖拽条目的位移。 */
  private _getItemOffsetPx(currentPosition: DOMRect, newPosition: DOMRect, delta: 1 | -1) {
    const isHorizontal = this.orientation === 'horizontal';
    let itemOffset = isHorizontal
      ? newPosition.left - currentPosition.left
      : newPosition.top - currentPosition.top;

    if (delta === -1) {
      itemOffset += isHorizontal
        ? newPosition.width - currentPosition.width
        : newPosition.height - currentPosition.height;
    }

    return itemOffset;
  }

  /** 计算其余条目的位移（含兄弟间距）。 */
  private _getSiblingOffsetPx(
    currentIndex: number,
    siblings: CachedItemPosition<DragRef>[],
    delta: 1 | -1,
  ) {
    const isHorizontal = this.orientation === 'horizontal';
    const currentPosition = siblings[currentIndex].clientRect;
    const immediateSibling = siblings[currentIndex + delta * -1];
    let siblingOffset = currentPosition[isHorizontal ? 'width' : 'height'] * delta;

    if (immediateSibling) {
      const start = isHorizontal ? 'left' : 'top';
      const end = isHorizontal ? 'right' : 'bottom';

      if (delta === -1) {
        siblingOffset -= immediateSibling.clientRect[start] - currentPosition[end];
      } else {
        siblingOffset += currentPosition[start] - immediateSibling.clientRect[end];
      }
    }

    return siblingOffset;
  }

  /** 指针是否位于容器首个条目之前（用于插入到首位）。 */
  private _shouldEnterAsFirstChild(pointerX: number, pointerY: number) {
    if (!this._activeDraggables.length) {
      return false;
    }

    const itemPositions = this._itemPositions;
    const isHorizontal = this.orientation === 'horizontal';

    const reversed = itemPositions[0].drag !== this._activeDraggables[0];
    if (reversed) {
      const lastItemRect = itemPositions[itemPositions.length - 1].clientRect;
      return isHorizontal ? pointerX >= lastItemRect.right : pointerY >= lastItemRect.bottom;
    } else {
      const firstItemRect = itemPositions[0].clientRect;
      return isHorizontal ? pointerX <= firstItemRect.left : pointerY <= firstItemRect.top;
    }
  }

  /** 按指针位置计算目标索引（sortPredicate 拒绝时返回 -1）。 */
  private _getItemIndexFromPointerPosition(
    item: DragRef,
    pointerX: number,
    pointerY: number,
    delta?: {x: number; y: number},
  ): number {
    const isHorizontal = this.orientation === 'horizontal';
    const index = this._itemPositions.findIndex(({drag, clientRect}) => {
      if (drag === item) {
        return false;
      }

      if (delta) {
        const direction = isHorizontal ? delta.x : delta.y;

        if (
          drag === this._previousSwap.drag &&
          this._previousSwap.overlaps &&
          direction === this._previousSwap.delta
        ) {
          return false;
        }
      }

      return isHorizontal
        ? pointerX >= Math.floor(clientRect.left) && pointerX < Math.floor(clientRect.right)
        : pointerY >= Math.floor(clientRect.top) && pointerY < Math.floor(clientRect.bottom);
    });

    return index === -1 || !this._sortPredicate(index, item) ? -1 : index;
  }
}
