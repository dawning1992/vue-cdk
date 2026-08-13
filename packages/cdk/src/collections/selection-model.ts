/**
 * 选择模型，移植自 Angular CDK collections 的 SelectionModel
 * （https://github.com/angular/components，MIT License）。
 * 原版权：Copyright Google LLC All Rights Reserved.
 *
 * 本地适配：事件流使用仓库自研 Emitter 替代 RxJS Subject；
 * 选中集合存放在 `shallowRef<Set<T>>` 中，读取 `selected` / `isSelected`
 * 均可被 Vue 响应式追踪，方便在 watchEffect/computed 中驱动渲染。
 */

import {shallowRef} from 'vue';
import {Emitter} from '../emitter';

/** 选择变化事件载荷，与 Angular CDK 的 SelectionChange 字段一致。 */
export interface SelectionChange<T> {
  /** 派发本次变化的模型实例。 */
  source: SelectionModel<T>;
  /** 本次新增选中的值。 */
  added: T[];
  /** 本次取消选中的值。 */
  removed: T[];
}

/** 单值模式下传入多个值时抛出的错误。 */
export function getMultipleValuesInSingleSelectionError(): Error {
  return Error('Cannot pass multiple values into SelectionModel with single-value mode.');
}

/**
 * 选择模型：支持单选/多选、自定义相等比较与变化事件。
 *
 * 与 Angular 版的差异仅为 Vue 等价物：内部状态用 `shallowRef<Set<T>>` 存储，
 * 每次批量变更后整体替换 Set 以触发响应式更新；`changed` 使用 Emitter。
 */
export class SelectionModel<T> {
  /** 当前选中集合；整体替换以触发响应式。 */
  private _selection = shallowRef<Set<T>>(new Set<T>());

  /** 待派发的取消选中值（与下一次事件一起发出）。 */
  private _deselectedToEmit: T[] = [];

  /** 待派发的新增选中值（与下一次事件一起发出）。 */
  private _selectedToEmit: T[] = [];

  /** 选择变化事件流。 */
  readonly changed = new Emitter<SelectionChange<T>>();

  /**
   * 面向大批量集合的批量操作入口，避免大数组展开触发调用栈限制。
   * 语义与 Angular 一致：方法返回是否发生了选择变化。
   */
  readonly bulk: Readonly<{
    select: (values: T[]) => boolean;
    deselect: (values: T[]) => boolean;
    setSelection: (values: T[]) => boolean;
  }> = {
    select: values => this._select(values),
    deselect: values => this._deselect(values),
    setSelection: values => this._setSelection(values),
  };

  /**
   * @param multiple 是否允许多选，默认单选。
   * @param initiallySelectedValues 初始选中值；多选时取全部，单选时取第一个。
   * @param emitChanges 是否派发变化事件，默认派发。
   * @param compareWith 自定义相等比较函数；提供时用「等价代表值」存储。
   */
  constructor(
    private _multiple = false,
    initiallySelectedValues?: readonly T[],
    private _emitChanges = true,
    public compareWith?: (o1: T, o2: T) => boolean,
  ) {
    if (initiallySelectedValues && initiallySelectedValues.length) {
      if (_multiple) {
        initiallySelectedValues.forEach(value => this._markSelected(value));
      } else {
        this._markSelected(initiallySelectedValues[0]);
      }
      // 预选值不产生变化事件。
      this._selectedToEmit.length = 0;
      this._syncSelected();
    }
  }

  /** 当前选中的值（按选中顺序），读取该属性可被响应式追踪。 */
  get selected(): readonly T[] {
    return Array.from(this._selection.value);
  }

  /** 选中一个或多个值。 */
  select(...values: T[]): boolean {
    return this._select(values);
  }

  /** 取消选中一个或多个值。 */
  deselect(...values: T[]): boolean {
    return this._deselect(values);
  }

  /** 用给定值整体替换当前选择。 */
  setSelection(...values: T[]): boolean {
    return this._setSelection(values);
  }

  /** 在选中与未选中之间切换单个值。 */
  toggle(value: T): boolean {
    return this.isSelected(value) ? this.deselect(value) : this.select(value);
  }

  /**
   * 清空全部选中值。
   * @param flushEvent 是否立即派发事件；为 false 时与下一次事件一起派发。
   */
  clear(flushEvent = true): boolean {
    this._unmarkAll();
    const changed = this._hasQueuedChanges();
    if (flushEvent) {
      this._emitChangeEvent();
    } else {
      this._syncSelected();
    }
    return changed;
  }

  /** 判断值是否被选中（响应式可追踪）。 */
  isSelected(value: T): boolean {
    return this._selection.value.has(this._getConcreteValue(value, this._selection.value));
  }

  /** 是否没有任何选中值。 */
  isEmpty(): boolean {
    return this._selection.value.size === 0;
  }

  /** 是否至少有一个选中值。 */
  hasValue(): boolean {
    return !this.isEmpty();
  }

  /** 按谓词排序选中值；仅多选模式生效。 */
  sort(predicate?: (a: T, b: T) => number): void {
    if (this._multiple && !this.isEmpty()) {
      const sorted = Array.from(this._selection.value);
      sorted.sort(predicate);
      this._selection.value = new Set(sorted);
    }
  }

  /** 是否允许多选。 */
  isMultipleSelection(): boolean {
    return this._multiple;
  }

  /** 选中一批值并派发事件。 */
  private _select(values: T[]): boolean {
    this._verifyValueAssignment(values);
    values.forEach(value => this._markSelected(value));
    const changed = this._hasQueuedChanges();
    this._emitChangeEvent();
    return changed;
  }

  /** 取消选中一批值并派发事件。 */
  private _deselect(values: T[]): boolean {
    this._verifyValueAssignment(values);
    values.forEach(value => this._unmarkSelected(value));
    const changed = this._hasQueuedChanges();
    this._emitChangeEvent();
    return changed;
  }

  /** 用一批值整体替换选择并派发事件。 */
  private _setSelection(values: T[]): boolean {
    this._verifyValueAssignment(values);
    const oldValues = this.selected;
    const newSelectedSet = new Set(values.map(value => this._getConcreteValue(value)));
    values.forEach(value => this._markSelected(value));
    oldValues
      .filter(value => !newSelectedSet.has(this._getConcreteValue(value, newSelectedSet)))
      .forEach(value => this._unmarkSelected(value));
    const changed = this._hasQueuedChanges();
    this._emitChangeEvent();
    return changed;
  }

  /** 派发事件并刷新响应式快照。 */
  private _emitChangeEvent(): void {
    this._syncSelected();
    if (this._selectedToEmit.length || this._deselectedToEmit.length) {
      this.changed.next({
        source: this,
        added: this._selectedToEmit,
        removed: this._deselectedToEmit,
      });
      this._deselectedToEmit = [];
      this._selectedToEmit = [];
    }
  }

  /** 用当前 Set 的内容替换 shallowRef，触发响应式更新。 */
  private _syncSelected(): void {
    this._selection.value = new Set(this._selection.value);
  }

  /** 标记单个值为选中（不派发事件）。 */
  private _markSelected(value: T): void {
    value = this._getConcreteValue(value);
    if (!this.isSelected(value)) {
      if (!this._multiple) {
        this._unmarkAll();
      }
      if (!this.isSelected(value)) {
        this._selection.value.add(value);
      }
      if (this._emitChanges) {
        this._selectedToEmit.push(value);
      }
    }
  }

  /** 标记单个值为未选中（不派发事件）。 */
  private _unmarkSelected(value: T): void {
    value = this._getConcreteValue(value);
    if (this.isSelected(value)) {
      this._selection.value.delete(value);
      if (this._emitChanges) {
        this._deselectedToEmit.push(value);
      }
    }
  }

  /** 取消选中全部值（不派发事件）。 */
  private _unmarkAll(): void {
    if (!this.isEmpty()) {
      this._selection.value.forEach(value => this._unmarkSelected(value));
    }
  }

  /** 校验单值模式下不得传入多个值。 */
  private _verifyValueAssignment(values: T[]): void {
    if (values.length > 1 && !this._multiple) {
      throw getMultipleValuesInSingleSelectionError();
    }
  }

  /** 是否还有待派发的变化。 */
  private _hasQueuedChanges(): boolean {
    return !!(this._deselectedToEmit.length || this._selectedToEmit.length);
  }

  /** 应用 compareWith：返回集合中等价的代表值，无匹配时返回原值。 */
  private _getConcreteValue(inputValue: T, selection?: Set<T>): T {
    if (!this.compareWith) {
      return inputValue;
    }
    const target = selection ?? this._selection.value;
    for (const selectedValue of target) {
      if (this.compareWith(inputValue, selectedValue)) {
        return selectedValue;
      }
    }
    return inputValue;
  }
}
