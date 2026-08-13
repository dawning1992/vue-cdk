/**
 * 树形键盘导航管理器，移植自 Angular CDK a11y 的 TreeKeyManager
 * （https://github.com/angular/components，MIT License）。
 * 原版权：Copyright Google LLC All Rights Reserved.
 *
 * 本地适配（均为 Vue 等价物）：
 * - 条目源接受数组或 `Ref<T[]>`，通过 `watch` 同步列表变化（对应 QueryList.changes / Observable）；
 * - `change` 事件流使用仓库自研 Emitter 替代 RxJS Subject；
 * - 子节点流为 Emitter 时仅取首帧后退订（对应 RxJS take(1)）。
 *
 * 行为与 Angular 保持一致：方向键导航、左右键展开/收起或聚焦子/父节点、
 * Home/End、Enter/Space 激活、`*` 展开同级、typeahead、禁用项跳过、RTL 交换左右键。
 */

import {isRef, watch, type Ref} from 'vue';
import {Emitter} from '../../emitter';
import {Typeahead} from './typeahead';

/** 可作为 TreeKeyManager 条目的契约（对应 Angular TreeKeyManagerItem）。 */
export interface TreeKeyManagerItem {
  /** 是否禁用；禁用项不会被初始聚焦，但默认仍可被方向键导航到（ARIA 焦点规则）。 */
  isDisabled?: (() => boolean) | boolean;

  /** 获取无障碍标签；typeahead 模式下必须实现。 */
  getLabel?(): string;

  /** 执行条目的主动作（如激活）。 */
  activate(): void;

  /** 返回父条目；根节点返回 null。 */
  getParent(): TreeKeyManagerItem | null;

  /** 返回子条目列表。 */
  getChildren(): TreeKeyManagerItem[] | Emitter<TreeKeyManagerItem[]>;

  /** 判断条目当前是否展开；可为布尔值或返回布尔值的函数。 */
  isExpanded: (() => boolean) | boolean;

  /** 收起条目。 */
  collapse(): void;

  /** 展开条目。 */
  expand(): void;

  /** 聚焦条目。 */
  focus(): void;

  /** 取消聚焦状态。 */
  unfocus(): void;

  /** 使条目可聚焦但不抢占焦点（roving tabindex 的初始项）。 */
  makeFocusable?(): void;
}

/** TreeKeyManager 配置项（对应 Angular TreeKeyManagerOptions）。 */
export interface TreeKeyManagerOptions<T extends TreeKeyManagerItem> {
  /** 为 true 时，条目聚焦的同时执行 activate。 */
  shouldActivationFollowFocus?: boolean;

  /** 树的水平布局方向；RTL 时左右键语义互换。 */
  horizontalOrientation?: 'rtl' | 'ltr';

  /** 导航时跳过命中谓词的条目（与禁用项不同：禁用项默认仍可导航）。 */
  skipPredicate?: (item: T) => boolean;

  /** 判断两个条目是否等价；默认按引用比较。 */
  trackBy?: (treeItem: T) => unknown;

  /** 开启 typeahead；传入数字时作为防抖间隔（毫秒），true 使用默认 200ms。 */
  typeAheadDebounceInterval?: true | number;
}

/** TreeKeyManager 对外策略接口（对应 Angular TreeKeyManagerStrategy）。 */
export interface TreeKeyManagerStrategy<T extends TreeKeyManagerItem> {
  /** 聚焦项变化时发射，载荷为新聚焦项（可为 null）。 */
  readonly change: Emitter<T | null>;

  /** 释放订阅并结束事件流。 */
  destroy(): void;

  /** 处理树上的键盘事件。 */
  onKeydown(event: KeyboardEvent): void;

  /** 当前聚焦项索引；未聚焦时为 null。 */
  getActiveItemIndex(): number | null;

  /** 当前聚焦项；未聚焦时为 null。 */
  getActiveItem(): T | null;

  /** 按索引聚焦条目。 */
  focusItem(index: number, options?: {emitChangeEvent?: boolean}): void;

  /** 按条目聚焦。 */
  focusItem(item: T, options?: {emitChangeEvent?: boolean}): void;
}

/** 条目源：数组或响应式数组引用。 */
export type TreeKeyManagerItems<T> = T[] | readonly T[] | Ref<T[]> | Ref<readonly T[]>;

/**
 * 管理树形结构的键盘事件：传入条目列表后，
 * 方向键导航、展开/收起、激活与 typeahead 均按 ARIA treeview 规范处理。
 */
export class TreeKeyManager<T extends TreeKeyManagerItem>
  implements TreeKeyManagerStrategy<T>
{
  /** 当前聚焦条目索引。 */
  private _activeItemIndex = -1;

  /** 当前聚焦条目。 */
  private _activeItem: T | null = null;

  /** 聚焦时是否同时激活。 */
  private _shouldActivationFollowFocus = false;

  /** 水平布局方向；RTL 时左右键交换。 */
  private _horizontalOrientation: 'ltr' | 'rtl' = 'ltr';

  /** 导航跳过谓词；默认不跳过任何条目。 */
  private _skipPredicateFn: (item: T) => boolean = () => false;

  /** 条目等价判定；默认按引用。 */
  private _trackByFn: (item: T) => unknown = item => item;

  /** 条目列表的同步缓存。 */
  private _items: T[] = [];

  private _typeahead?: Typeahead<T>;
  private _typeaheadUnsubscribe?: () => void;
  private _itemChangesUnsubscribe?: () => void;
  private _hasInitialFocused = false;

  /** 聚焦项变化时发射。 */
  readonly change = new Emitter<T | null>();

  /**
   * @param items 条目源；传入 Ref 时随列表变化自动同步。
   * @param config 导航配置（方向、跳过谓词、trackBy、typeahead 等）。
   */
  constructor(items: TreeKeyManagerItems<T>, config: TreeKeyManagerOptions<T>) {
    this._items = isRef(items) ? [...items.value] : [...items];

    if (typeof config.shouldActivationFollowFocus === 'boolean') {
      this._shouldActivationFollowFocus = config.shouldActivationFollowFocus;
    }
    if (config.horizontalOrientation) {
      this._horizontalOrientation = config.horizontalOrientation;
    }
    if (config.skipPredicate) {
      this._skipPredicateFn = config.skipPredicate;
    }
    if (config.trackBy) {
      this._trackByFn = config.trackBy;
    }
    if (typeof config.typeAheadDebounceInterval !== 'undefined') {
      this._setTypeAhead(config.typeAheadDebounceInterval);
    }

    if (isRef(items)) {
      this._itemChangesUnsubscribe = watch(
        items,
        newItems => this._itemsChanged([...newItems]),
        // 同步刷新：条目在同一渲染周期内变化时，聚焦状态不会滞后到下一帧。
        {flush: 'sync'},
      );
    }

    this._initializeFocus();
  }

  /** 释放订阅并结束事件流。 */
  destroy(): void {
    this._typeaheadUnsubscribe?.();
    this._itemChangesUnsubscribe?.();
    this._typeahead?.destroy();
    this.change.complete();
  }

  /**
   * 处理树上的键盘事件。
   * 导航类按键会阻止默认行为并清空 typeahead 缓冲区；Tab 直接放行。
   */
  onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Tab':
        // 允许 Tab 正常移出树。
        return;

      case 'ArrowDown':
        this._focusNextItem();
        break;

      case 'ArrowUp':
        this._focusPreviousItem();
        break;

      case 'ArrowRight':
        this._horizontalOrientation === 'rtl'
          ? this._collapseCurrentItem()
          : this._expandCurrentItem();
        break;

      case 'ArrowLeft':
        this._horizontalOrientation === 'rtl'
          ? this._expandCurrentItem()
          : this._collapseCurrentItem();
        break;

      case 'Home':
        this._focusFirstItem();
        break;

      case 'End':
        this._focusLastItem();
        break;

      case 'Enter':
      case ' ':
        this._activateCurrentItem();
        break;

      default:
        if (event.key === '*') {
          this._expandAllItemsAtCurrentItemLevel();
          break;
        }
        this._typeahead?.handleKey(event);
        // 非导航键不阻止默认行为，也不清空 typeahead 缓冲区。
        return;
    }

    this._typeahead?.reset();
    event.preventDefault();
  }

  /** 当前聚焦条目索引；未聚焦时为 null。 */
  getActiveItemIndex(): number | null {
    return this._activeItemIndex;
  }

  /** 当前聚焦条目；未聚焦时为 null。 */
  getActiveItem(): T | null {
    return this._activeItem;
  }

  /** 聚焦指定条目；等价条目（trackBy 相同）重复聚焦时不重复处理。 */
  focusItem(itemOrIndex: number | T, options: {emitChangeEvent?: boolean} = {}): void {
    options.emitChangeEvent ??= true;

    const index =
      typeof itemOrIndex === 'number'
        ? itemOrIndex
        : this._items.findIndex(item => this._trackByFn(item) === this._trackByFn(itemOrIndex));
    if (index < 0 || index >= this._items.length) {
      return;
    }
    const activeItem = this._items[index];

    if (
      this._activeItem !== null &&
      this._trackByFn(activeItem) === this._trackByFn(this._activeItem)
    ) {
      return;
    }

    const previousActiveItem = this._activeItem;
    this._activeItem = activeItem ?? null;
    this._activeItemIndex = index;
    this._typeahead?.setCurrentSelectedItemIndex(index);

    this._activeItem?.focus();
    previousActiveItem?.unfocus();

    if (options.emitChangeEvent) {
      this.change.next(this._activeItem);
    }

    if (this._shouldActivationFollowFocus) {
      this._activateCurrentItem();
    }
  }

  /** 设置水平布局方向；RTL 时左右键语义互换。 */
  withHorizontalOrientation(direction: 'rtl' | 'ltr'): this {
    this._horizontalOrientation = direction;
    return this;
  }

  /** 聚焦第一个可用条目。 */
  private _focusFirstItem(): void {
    this.focusItem(this._findNextAvailableItemIndex(-1));
  }

  /** 聚焦最后一个可用条目。 */
  private _focusLastItem(): void {
    this.focusItem(this._findPreviousAvailableItemIndex(this._items.length));
  }

  /** 聚焦下一个可用条目。 */
  private _focusNextItem(): void {
    this.focusItem(this._findNextAvailableItemIndex(this._activeItemIndex));
  }

  /** 聚焦上一个可用条目。 */
  private _focusPreviousItem(): void {
    this.focusItem(this._findPreviousAvailableItemIndex(this._activeItemIndex));
  }

  /**
   * 处理左箭头（RTL 时为右箭头）：已展开则收起，否则聚焦父节点。
   */
  private _collapseCurrentItem(): void {
    if (!this._activeItem) {
      return;
    }

    if (this._isCurrentItemExpanded()) {
      this._activeItem.collapse();
    } else {
      const parent = this._activeItem.getParent();
      if (!parent || this._skipPredicateFn(parent as T)) {
        return;
      }
      this.focusItem(parent as T);
    }
  }

  /**
   * 处理右箭头（RTL 时为左箭头）：已收起则展开，否则聚焦第一个子节点。
   */
  private _expandCurrentItem(): void {
    if (!this._activeItem) {
      return;
    }

    if (!this._isCurrentItemExpanded()) {
      this._activeItem.expand();
      return;
    }

    const children = this._activeItem.getChildren();
    if (Array.isArray(children)) {
      const firstChild = children.find(child => !this._skipPredicateFn(child as T));
      if (firstChild) {
        this.focusItem(firstChild as T);
      }
      return;
    }

    // Emitter 子节点流：取首帧后退订（对应 RxJS take(1)）。
    let unsub: () => void = () => undefined;
    unsub = children.subscribe(childItems => {
      unsub();
      const firstChild = childItems.find(child => !this._skipPredicateFn(child as T));
      if (firstChild) {
        this.focusItem(firstChild as T);
      }
    });
  }

  /** 当前条目是否展开。 */
  private _isCurrentItemExpanded(): boolean {
    if (!this._activeItem) {
      return false;
    }
    return typeof this._activeItem.isExpanded === 'boolean'
      ? this._activeItem.isExpanded
      : this._activeItem.isExpanded();
  }

  /** 条目是否禁用。 */
  private _isItemDisabled(item: TreeKeyManagerItem): boolean {
    return typeof item.isDisabled === 'boolean' ? item.isDisabled : !!item.isDisabled?.();
  }

  /** 展开当前条目所在层级的所有同级条目（`*` 键）。 */
  private _expandAllItemsAtCurrentItemLevel(): void {
    if (!this._activeItem) {
      return;
    }

    const parent = this._activeItem.getParent();
    const expandItems = (items: TreeKeyManagerItem[]) => {
      for (const item of items) {
        item.expand();
      }
    };

    if (!parent) {
      expandItems(this._items.filter(item => item.getParent() === null));
      return;
    }

    const children = parent.getChildren();
    if (Array.isArray(children)) {
      expandItems(children);
      return;
    }

    let unsub: () => void = () => undefined;
    unsub = children.subscribe(childItems => {
      unsub();
      expandItems(childItems);
    });
  }

  /** 激活当前条目。 */
  private _activateCurrentItem(): void {
    this._activeItem?.activate();
  }

  /**
   * 初始聚焦：为第一个可用（非跳过、非禁用）条目设置 roving tabindex。
   * 支持 makeFocusable 时仅设置可聚焦状态而不抢占焦点。
   */
  private _initializeFocus(): void {
    if (this._hasInitialFocused || this._items.length === 0) {
      return;
    }

    let activeIndex = 0;
    for (let i = 0; i < this._items.length; i++) {
      if (!this._skipPredicateFn(this._items[i]) && !this._isItemDisabled(this._items[i])) {
        activeIndex = i;
        break;
      }
    }

    const activeItem = this._items[activeIndex];
    if (activeItem.makeFocusable) {
      this._activeItem?.unfocus();
      this._activeItemIndex = activeIndex;
      this._activeItem = activeItem;
      this._typeahead?.setCurrentSelectedItemIndex(activeIndex);
      activeItem.makeFocusable();
    } else {
      this.focusItem(activeIndex);
    }

    this._hasInitialFocused = true;
  }

  /** 条目列表变化时同步缓存与活动项，必要时重置初始聚焦。 */
  private _itemsChanged(newItems: T[]): void {
    if (this._hasInitialFocused && this._activeItem && !newItems.includes(this._activeItem)) {
      this._activeItem = null;
      this._hasInitialFocused = false;
    }

    this._items = newItems;
    this._typeahead?.setItems(this._items);
    this._updateActiveItemIndex(this._items);
    this._initializeFocus();
  }

  /** 条目列表变化后尽量保持活动条目身份。 */
  private _updateActiveItemIndex(newItems: T[]): void {
    const activeItem = this._activeItem;
    if (!activeItem) {
      return;
    }

    const newIndex = newItems.findIndex(
      item => this._trackByFn(item) === this._trackByFn(activeItem),
    );
    if (newIndex > -1 && newIndex !== this._activeItemIndex) {
      this._activeItemIndex = newIndex;
      this._typeahead?.setCurrentSelectedItemIndex(newIndex);
    }
  }

  /** 配置 typeahead 并订阅命中事件。 */
  private _setTypeAhead(debounceInterval: number | boolean): void {
    this._typeahead = new Typeahead<T>(this._items, {
      debounceInterval: typeof debounceInterval === 'number' ? debounceInterval : undefined,
      skipPredicate: item => this._skipPredicateFn(item),
    });

    this._typeaheadUnsubscribe = this._typeahead.selectedItem.subscribe(item => {
      this.focusItem(item);
    });
  }

  /** 从起始索引向后查找第一个未被跳过的条目。 */
  private _findNextAvailableItemIndex(startingIndex: number): number {
    for (let i = startingIndex + 1; i < this._items.length; i++) {
      if (!this._skipPredicateFn(this._items[i])) {
        return i;
      }
    }
    return startingIndex;
  }

  /** 从起始索引向前查找第一个未被跳过的条目。 */
  private _findPreviousAvailableItemIndex(startingIndex: number): number {
    for (let i = startingIndex - 1; i >= 0; i--) {
      if (!this._skipPredicateFn(this._items[i])) {
        return i;
      }
    }
    return startingIndex;
  }
}
