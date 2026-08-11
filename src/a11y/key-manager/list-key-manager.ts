/**
 * 移植自 Angular CDK a11y（https://github.com/angular/components，v22.1.1，MIT License）。
 * 原版权：Copyright Google LLC All Rights Reserved.
 * 本地适配：QueryList/Signal 条目源 → 数组或 Ref；RxJS Subject → Emitter；
 * 内部状态信号 → Vue shallowRef。
 */

/**
 * 可选中列表的键盘管理，对应 Angular CDK 的 ListKeyManager。
 *
 * 与 Angular 版的差异（均为 Vue 等价物）：
 * - 条目源接受数组或 `Ref<T[]>`，通过 `watch` 同步列表变化（相当于 QueryList.changes / Signal effect）；
 * - `change` / `tabOut` 事件流使用仓库自研 Emitter 替代 RxJS Subject；
 * - 内部活动状态用 Vue `shallowRef` 存储，getter 读取解包值，可在组合式函数中直接参与响应式计算。
 *
 * 其余行为（方向键导航、换行、修饰键白名单、Home/End、PageUp/Down、
 * typeahead、skipPredicate、disabled 跳过等）与 Angular 保持一致。
 */

import {isRef, shallowRef, watch, type Ref} from 'vue';
import {Emitter} from '../../emitter';
import {hasModifierKey} from '../../platform';
import {DOWN_ARROW, END, HOME, LEFT_ARROW, PAGE_DOWN, PAGE_UP, RIGHT_ARROW, TAB, UP_ARROW} from '../keycodes';
import {Typeahead} from './typeahead';

/** 可作为 ListKeyManager 条目的接口。 */
export interface ListKeyManagerOption {
  /** 条目是否禁用（默认的跳过条件）。 */
  disabled?: boolean;

  /** 获取条目标签，typeahead 模式下必须实现。 */
  getLabel?(): string;
}

/** ListKeyManager 处理的修饰键名称。 */
export type ListKeyManagerModifierKey = 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey';

/** 条目源：数组或响应式数组引用。 */
export type ListKeyManagerItems<T> = T[] | readonly T[] | Ref<T[]> | Ref<readonly T[]>;

/**
 * 管理可选中列表的键盘事件：传入条目列表后，
 * 方向键等导航事件会正确移动活动项。
 */
export class ListKeyManager<T extends ListKeyManagerOption> {
  private _activeItemIndex = shallowRef(-1);
  private _activeItem = shallowRef<T | null>(null);
  private _wrap = false;
  private _vertical = true;
  private _horizontal: 'ltr' | 'rtl' | null = null;
  private _allowedModifierKeys: ListKeyManagerModifierKey[] = [];
  private _homeAndEnd = false;
  private _pageUpAndDown = {enabled: false, delta: 10};
  private _typeahead?: Typeahead<T>;
  private _typeaheadUnsubscribe?: () => void;
  private _itemChangesUnsubscribe?: () => void;

  /**
   * 判断条目是否应被跳过的谓词，默认跳过 disabled 的条目。
   */
  private _skipPredicateFn = (item: T) => item.disabled;

  constructor(private _items: ListKeyManagerItems<T>) {
    if (isRef(_items)) {
      this._itemChangesUnsubscribe = watch(
        _items,
        newItems => this._itemsChanged(newItems),
        // 同步刷新：列表在同一渲染周期内变化时，活动索引不会滞后到下一帧。
        {flush: 'sync'},
      );
    }
  }

  /** 按 Tab 键时发射，供组件感知焦点离开列表。 */
  readonly tabOut = new Emitter<void>();

  /** 活动项变化时发射，载荷为新的活动项索引。 */
  readonly change = new Emitter<number>();

  /** 设置跳过谓词，决定哪些条目不参与导航。 */
  skipPredicate(predicate: (item: T) => boolean): this {
    this._skipPredicateFn = predicate;
    return this;
  }

  /** 配置换行模式：到达列表两端时是否回到另一端。 */
  withWrap(shouldWrap = true): this {
    this._wrap = shouldWrap;
    return this;
  }

  /** 配置是否支持垂直方向移动。 */
  withVerticalOrientation(enabled = true): this {
    this._vertical = enabled;
    return this;
  }

  /** 配置水平方向移动；传入 null 关闭。 */
  withHorizontalOrientation(direction: 'ltr' | 'rtl' | null): this {
    this._horizontal = direction;
    return this;
  }

  /** 允许在导航时按下的修饰键；默认不允许任何修饰键。 */
  withAllowedModifierKeys(keys: ListKeyManagerModifierKey[]): this {
    this._allowedModifierKeys = keys;
    return this;
  }

  /** 开启 typeahead：输入字母时按标签匹配条目。 */
  withTypeAhead(debounceInterval = 200): this {
    const items = this._getItemsArray();

    if (import.meta.env.DEV && items.length > 0 && items.some(item => typeof item.getLabel !== 'function')) {
      throw new Error('ListKeyManager items in typeahead mode must implement the `getLabel` method.');
    }

    this._typeaheadUnsubscribe?.();
    this._typeahead = new Typeahead(items, {
      debounceInterval: typeof debounceInterval === 'number' ? debounceInterval : undefined,
      skipPredicate: item => this._skipPredicateFn(item),
    });
    this._typeaheadUnsubscribe = this._typeahead.selectedItem.subscribe(item => {
      this.setActiveItem(item);
    });

    return this;
  }

  /** 取消当前的 typeahead 输入序列。 */
  cancelTypeahead(): this {
    this._typeahead?.reset();
    return this;
  }

  /** 配置 Home / End 键分别激活首/末条目。 */
  withHomeAndEnd(enabled = true): this {
    this._homeAndEnd = enabled;
    return this;
  }

  /** 配置 PageUp / PageDown 键按指定步长（默认 10）前后移动。 */
  withPageUpDown(enabled = true, delta = 10): this {
    this._pageUpAndDown = {enabled, delta};
    return this;
  }

  /** 按索引设置活动项，并在活动项确实变化时发射 change。 */
  setActiveItem(index: number): void;

  /** 按条目设置活动项，并在活动项确实变化时发射 change。 */
  setActiveItem(item: T): void;

  setActiveItem(item: any): void {
    const previousActiveItem = this._activeItem.value;

    this.updateActiveItem(item);

    if (this._activeItem.value !== previousActiveItem) {
      this.change.next(this._activeItemIndex.value);
    }
  }

  /**
   * 根据键盘事件移动活动项。
   * 导航类按键处理后阻止默认行为；TAB 触发 tabOut；其余按键进入 typeahead。
   */
  onKeydown(event: KeyboardEvent): void {
    const keyCode = event.keyCode;
    const modifiers: ListKeyManagerModifierKey[] = ['altKey', 'ctrlKey', 'metaKey', 'shiftKey'];
    const isModifierAllowed = modifiers.every(
      modifier => !event[modifier] || this._allowedModifierKeys.indexOf(modifier) > -1,
    );

    switch (keyCode) {
      case TAB:
        this.tabOut.next();
        return;

      case DOWN_ARROW:
        if (this._vertical && isModifierAllowed) {
          this.setNextItemActive();
          break;
        }
        return;

      case UP_ARROW:
        if (this._vertical && isModifierAllowed) {
          this.setPreviousItemActive();
          break;
        }
        return;

      case RIGHT_ARROW:
        if (this._horizontal && isModifierAllowed) {
          this._horizontal === 'rtl' ? this.setPreviousItemActive() : this.setNextItemActive();
          break;
        }
        return;

      case LEFT_ARROW:
        if (this._horizontal && isModifierAllowed) {
          this._horizontal === 'rtl' ? this.setNextItemActive() : this.setPreviousItemActive();
          break;
        }
        return;

      case HOME:
        if (this._homeAndEnd && isModifierAllowed) {
          this.setFirstItemActive();
          break;
        }
        return;

      case END:
        if (this._homeAndEnd && isModifierAllowed) {
          this.setLastItemActive();
          break;
        }
        return;

      case PAGE_UP:
        if (this._pageUpAndDown.enabled && isModifierAllowed) {
          const upTargetIndex = this._activeItemIndex.value - this._pageUpAndDown.delta;
          this._setActiveItemByIndex(upTargetIndex > 0 ? upTargetIndex : 0, 1);
          break;
        }
        return;

      case PAGE_DOWN:
        if (this._pageUpAndDown.enabled && isModifierAllowed) {
          const itemsLength = this._getItemsArray().length;
          const downTargetIndex = this._activeItemIndex.value + this._pageUpAndDown.delta;
          this._setActiveItemByIndex(
            downTargetIndex < itemsLength ? downTargetIndex : itemsLength - 1,
            -1,
          );
          break;
        }
        return;

      default:
        if (isModifierAllowed || hasModifierKey(event, 'shiftKey')) {
          this._typeahead?.handleKey(event);
        }

        // 非导航键不阻止默认行为，直接返回。
        return;
    }

    this._typeahead?.reset();
    event.preventDefault();
  }

  /** 当前活动项索引；未激活时为 -1。 */
  get activeItemIndex(): number {
    return this._activeItemIndex.value;
  }

  /** 当前活动条目；未激活时为 null。 */
  get activeItem(): T | null {
    return this._activeItem.value;
  }

  /** 用户是否正在 typeahead 输入中。 */
  isTyping(): boolean {
    return !!this._typeahead && this._typeahead.isTyping();
  }

  /** 激活列表中第一个可用条目。 */
  setFirstItemActive(): void {
    this._setActiveItemByIndex(0, 1);
  }

  /** 激活列表中最后一个可用条目。 */
  setLastItemActive(): void {
    this._setActiveItemByIndex(this._getItemsArray().length - 1, -1);
  }

  /** 激活下一个可用条目；未激活时从第一个开始。 */
  setNextItemActive(): void {
    this._activeItemIndex.value < 0 ? this.setFirstItemActive() : this._setActiveItemByDelta(1);
  }

  /** 激活上一个可用条目；未激活且开启换行时从最后一个开始。 */
  setPreviousItemActive(): void {
    this._activeItemIndex.value < 0 && this._wrap
      ? this.setLastItemActive()
      : this._setActiveItemByDelta(-1);
  }

  /** 仅更新活动状态（不发射 change），按索引。 */
  updateActiveItem(index: number): void;

  /** 仅更新活动状态（不发射 change），按条目。 */
  updateActiveItem(item: T): void;

  updateActiveItem(item: any): void {
    const itemArray = this._getItemsArray();
    const index = typeof item === 'number' ? item : itemArray.indexOf(item);
    const activeItem = itemArray[index];

    // 显式判断 null/undefined：其他 falsy 值是合法条目。
    this._activeItem.value = activeItem == null ? null : activeItem;
    this._activeItemIndex.value = index;
    this._typeahead?.setCurrentSelectedItemIndex(index);
  }

  /** 清理订阅并结束事件流。 */
  destroy(): void {
    this._typeaheadUnsubscribe?.();
    this._itemChangesUnsubscribe?.();
    this._typeahead?.destroy();
    this.tabOut.complete();
    this.change.complete();
  }

  /** 按 delta 移动活动项，换行与否走不同分支。 */
  private _setActiveItemByDelta(delta: -1 | 1): void {
    this._wrap ? this._setActiveInWrapMode(delta) : this._setActiveInDefaultMode(delta);
  }

  /** 换行模式：循环查找第一个未被跳过的条目。 */
  private _setActiveInWrapMode(delta: -1 | 1): void {
    const items = this._getItemsArray();

    for (let i = 1; i <= items.length; i++) {
      const index = (this._activeItemIndex.value + delta * i + items.length) % items.length;
      const item = items[index];

      if (!this._skipPredicateFn(item)) {
        this.setActiveItem(index);
        return;
      }
    }
  }

  /** 默认模式：沿 delta 方向移动，遇到列表边界即停止。 */
  private _setActiveInDefaultMode(delta: -1 | 1): void {
    this._setActiveItemByIndex(this._activeItemIndex.value + delta, delta);
  }

  /** 从指定索引开始，沿 fallbackDelta 方向跳过不可用条目后激活。 */
  private _setActiveItemByIndex(index: number, fallbackDelta: -1 | 1): void {
    const items = this._getItemsArray();

    if (!items[index]) {
      return;
    }

    while (this._skipPredicateFn(items[index])) {
      index += fallbackDelta;
      if (!items[index]) {
        return;
      }
    }

    this.setActiveItem(index);
  }

  /** 将条目源统一为数组。 */
  private _getItemsArray(): T[] | readonly T[] {
    return isRef(this._items) ? this._items.value : this._items;
  }

  /** 列表变化时同步 typeahead 数据，并尽量保持活动条目身份。 */
  private _itemsChanged(newItems: T[] | readonly T[]): void {
    this._typeahead?.setItems(newItems);
    const activeItem = this._activeItem.value;

    if (activeItem) {
      const newIndex = newItems.indexOf(activeItem);

      if (newIndex > -1 && newIndex !== this._activeItemIndex.value) {
        this._activeItemIndex.value = newIndex;
        this._typeahead?.setCurrentSelectedItemIndex(newIndex);
      }
    }
  }
}
