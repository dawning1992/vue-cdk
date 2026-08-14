/**
 * 虚拟滚动树键盘导航管理器（内部）。
 *
 * 与 tree 模块 TreeKeyManager 的区别：导航基于「扁平可见列表索引」而非已渲染节点实例，
 * 因此方向键/Home/End 跨越虚拟窗口时先 `scrollToIndex` 滚动到目标，再聚焦已渲染节点；
 * typeahead 受虚拟化限制仅覆盖当前渲染区间（文档中注明）。
 */

import {Typeahead} from '../a11y/key-manager/typeahead';
import type {ListRange} from '../collections';

/** 键盘管理器依赖的适配器，由 VVirtualScrollTree 注入真实实现（便于独立单测）。 */
export interface VirtualTreeKeyboardAdapter<T> {
  /** 当前扁平可见节点列表。 */
  getFlat(): readonly T[];
  /** 当前渲染区间；未就绪时返回 null。 */
  getRenderedRange(): ListRange | null;
  /** 滚动到指定扁平索引（行高固定，由视口换算偏移）。 */
  scrollToIndex(index: number): void;
  /** 聚焦已渲染节点；聚焦成功返回 true（未渲染时返回 false）。 */
  focusIndex(index: number): boolean;
  /** 节点是否禁用。 */
  isDisabled(node: T): boolean;
  /** 节点是否可展开。 */
  isExpandable(node: T): boolean;
  /** 节点是否展开。 */
  isExpanded(node: T): boolean;
  /** 返回节点的父节点扁平索引；根节点返回 null。 */
  getParentIndex(index: number): number | null;
  /** 返回节点的同级扁平索引（含自身）。 */
  getSiblingIndices(index: number): readonly number[];
  /** 展开节点（懒加载时触发子级加载）。 */
  expand(node: T): void;
  /** 收起节点。 */
  collapse(node: T): void;
  /** 派发节点激活事件。 */
  emitActivation(node: T): void;
  /** 获取节点 typeahead 标签。 */
  getLabel(node: T): string;
  /** 当前布局方向（RTL 时左右键语义互换）。 */
  getDirection(): 'ltr' | 'rtl';
}

/** typeahead 内部条目包装：向 a11y Typeahead 提供 getLabel。 */
interface TypeaheadEntry<T> {
  node: T;
  getLabel(): string;
}

/** 滚动入视后聚焦的重试次数上限（应对 rAF/渲染时序差异）。 */
const MAX_FOCUS_RETRIES = 3;

/**
 * 虚拟滚动树键盘管理器：维护扁平索引上的焦点，处理方向键/Home/End、
 * 左右键展开收起、Enter/Space 激活、`*` 展开同级与渲染项内的 typeahead。
 */
export class VirtualTreeKeyboard<T> {
  private _activeIndex = -1;
  private _destroyed = false;
  private readonly _typeahead: Typeahead<TypeaheadEntry<T>>;
  private readonly _typeaheadUnsubscribe: () => void;

  constructor(private readonly _adapter: VirtualTreeKeyboardAdapter<T>) {
    this._typeahead = new Typeahead<TypeaheadEntry<T>>([], {
      skipPredicate: entry => this._adapter.isDisabled(entry.node),
    });
    this._typeaheadUnsubscribe = this._typeahead.selectedItem.subscribe(entry => {
      const index = this._adapter.getFlat().indexOf(entry.node);
      if (index >= 0) {
        this._moveTo(index);
      }
    });
  }

  /** 当前聚焦的扁平索引；未聚焦时返回 null。 */
  getActiveIndex(): number | null {
    return this._activeIndex >= 0 ? this._activeIndex : null;
  }

  /** 记录当前聚焦索引（点击节点等外部入口），不重复聚焦。 */
  setActiveIndex(index: number): void {
    if (index >= 0 && index < this._adapter.getFlat().length) {
      this._activeIndex = index;
    }
    this._typeahead.setCurrentSelectedItemIndex(this._activeIndexInRendered());
  }

  /** 渲染区间变化时刷新 typeahead 条目（仅覆盖已渲染节点）。 */
  updateRendered(): void {
    this._typeahead.setItems(this._typeaheadEntries());
    this._typeahead.setCurrentSelectedItemIndex(this._activeIndexInRendered());
  }

  /** 处理树上的键盘事件；Tab 放行，其余导航键阻止默认行为。 */
  onKeydown(event: KeyboardEvent): void {
    if (this._destroyed) {
      return;
    }
    const isRtl = this._adapter.getDirection() === 'rtl';

    switch (event.key) {
      case 'Tab':
        return;
      case 'ArrowDown':
        event.preventDefault();
        this._moveTo(this._findNext(this._activeIndex, 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        this._moveTo(this._findNext(this._activeIndex, -1));
        break;
      case 'Home':
        event.preventDefault();
        this._moveTo(this._findBoundary(1));
        break;
      case 'End':
        event.preventDefault();
        this._moveTo(this._findBoundary(-1));
        break;
      case 'ArrowRight':
        event.preventDefault();
        isRtl ? this._handleArrowLeft() : this._handleArrowRight();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        isRtl ? this._handleArrowRight() : this._handleArrowLeft();
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this._activate();
        break;
      case '*':
        event.preventDefault();
        this._expandSiblings();
        break;
      default:
        // 字母/数字交给 typeahead（仅当前渲染区间内的节点参与匹配）。
        this._typeahead.setItems(this._typeaheadEntries());
        this._typeahead.setCurrentSelectedItemIndex(this._activeIndexInRendered());
        this._typeahead.handleKey(event);
    }
  }

  /** 释放订阅与定时器。 */
  destroy(): void {
    this._destroyed = true;
    this._typeaheadUnsubscribe();
    this._typeahead.destroy();
  }

  /** 移动到指定索引：越界时跨虚拟窗口先滚动，渲染后重试聚焦。 */
  private _moveTo(index: number): void {
    if (index < 0) {
      return;
    }
    const flat = this._adapter.getFlat();
    if (index >= flat.length) {
      return;
    }
    this._activeIndex = index;
    this._typeahead.setCurrentSelectedItemIndex(this._activeIndexInRendered());

    const range = this._adapter.getRenderedRange();
    if (range && (index < range.start || index >= range.end)) {
      this._adapter.scrollToIndex(index);
      this._focusWhenRendered(index);
    } else {
      this._adapter.focusIndex(index);
    }
  }

  /** 滚动后等待渲染再聚焦；渲染时机依赖 rAF/滚动事件，故带重试上限。 */
  private _focusWhenRendered(index: number, attempt = 0): void {
    if (this._destroyed) {
      return;
    }
    if (this._adapter.focusIndex(index)) {
      return;
    }
    if (attempt >= MAX_FOCUS_RETRIES) {
      return;
    }
    const retry = () => this._focusWhenRendered(index, attempt + 1);
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(retry);
    } else {
      setTimeout(retry, 16);
    }
  }

  /** 沿指定方向寻找下一个未禁用节点；无可用节点时返回 -1。 */
  private _findNext(from: number, step: 1 | -1): number {
    const flat = this._adapter.getFlat();
    if (!flat.length) {
      return -1;
    }
    let index = from;
    for (let i = 0; i < flat.length; i++) {
      index += step;
      if (index < 0 || index >= flat.length) {
        return -1;
      }
      if (!this._adapter.isDisabled(flat[index])) {
        return index;
      }
    }
    return -1;
  }

  /** 查找首（step=1）/末（step=-1）个未禁用节点。 */
  private _findBoundary(step: 1 | -1): number {
    const flat = this._adapter.getFlat();
    const start = step === 1 ? 0 : flat.length - 1;
    const end = step === 1 ? flat.length : -1;
    for (let i = start; i !== end; i += step) {
      if (!this._adapter.isDisabled(flat[i])) {
        return i;
      }
    }
    return -1;
  }

  /** 右键语义：未展开则可展开节点展开；已展开移动到第一个子节点。 */
  private _handleArrowRight(): void {
    const flat = this._adapter.getFlat();
    const node = flat[this._activeIndex];
    if (!node) {
      return;
    }
    if (this._adapter.isExpandable(node) && !this._adapter.isExpanded(node)) {
      this._adapter.expand(node);
      return;
    }
    const nextIndex = this._activeIndex + 1;
    if (
      nextIndex < flat.length &&
      this._adapter.getParentIndex(nextIndex) === this._activeIndex
    ) {
      this._moveTo(nextIndex);
    }
  }

  /** 左键语义：已展开则收起；否则移动到父节点。 */
  private _handleArrowLeft(): void {
    const flat = this._adapter.getFlat();
    const node = flat[this._activeIndex];
    if (!node) {
      return;
    }
    if (this._adapter.isExpanded(node)) {
      this._adapter.collapse(node);
      return;
    }
    const parentIndex = this._adapter.getParentIndex(this._activeIndex);
    if (parentIndex !== null) {
      this._moveTo(parentIndex);
    }
  }

  /** Enter/Space：激活当前节点（禁用节点忽略）。 */
  private _activate(): void {
    const node = this._adapter.getFlat()[this._activeIndex];
    if (node && !this._adapter.isDisabled(node)) {
      this._adapter.emitActivation(node);
    }
  }

  /** `*`：展开当前节点的全部同级（含自身）。 */
  private _expandSiblings(): void {
    const flat = this._adapter.getFlat();
    for (const index of this._adapter.getSiblingIndices(this._activeIndex)) {
      const node = flat[index];
      if (node && this._adapter.isExpandable(node) && !this._adapter.isExpanded(node)) {
        this._adapter.expand(node);
      }
    }
  }

  /** 当前渲染区间内的 typeahead 条目。 */
  private _typeaheadEntries(): TypeaheadEntry<T>[] {
    const flat = this._adapter.getFlat();
    const range = this._adapter.getRenderedRange();
    if (!range) {
      return [];
    }
    const entries: TypeaheadEntry<T>[] = [];
    const end = Math.min(range.end, flat.length);
    for (let i = range.start; i < end; i++) {
      const node = flat[i];
      entries.push({node, getLabel: () => this._adapter.getLabel(node)});
    }
    return entries;
  }

  /** 活动索引在渲染区间内的偏移（typeahead 搜索起点）。 */
  private _activeIndexInRendered(): number {
    const range = this._adapter.getRenderedRange();
    return range && this._activeIndex >= range.start ? this._activeIndex - range.start : -1;
  }
}
