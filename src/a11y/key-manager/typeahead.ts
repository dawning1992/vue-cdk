/**
 * 移植自 Angular CDK a11y（https://github.com/angular/components，v22.1.1，MIT License）。
 * 原版权：Copyright Google LLC All Rights Reserved.
 * 本地适配：RxJS debounceTime → setTimeout 防抖；DOM 类名/标记使用 vcdk-* 前缀。
 */

/**
 * 基于键盘输入选择条目的 typeahead 实现，对应 Angular CDK 的 Typeahead。
 *
 * 行为要点：
 * - 字母按键会累积到缓冲区，防抖间隔内无新按键才触发匹配；
 * - 从当前选中项的下一个条目开始循环搜索（跳过 skipPredicate 命中的条目）；
 * - 匹配规则为"标签以已输入字符串开头"，比较前统一大写并去除首尾空白。
 *
 * Angular 版本基于 RxJS debounceTime 实现，这里用 setTimeout 等价替代，
 * 对外语义（缓冲区、防抖、循环搜索、重置）保持一致。
 */

import {Emitter} from '../../emitter';
import {A, NINE, Z, ZERO} from '../keycodes';

const DEFAULT_TYPEAHEAD_DEBOUNCE_INTERVAL_MS = 200;

interface TypeaheadItem {
  getLabel?(): string;
}

/** Typeahead 配置项。 */
export interface TypeaheadConfig<T> {
  /** 防抖间隔（毫秒），默认 200。 */
  debounceInterval?: number;
  /** 判断条目是否应被跳过，用于支持禁用项。 */
  skipPredicate?: (item: T) => boolean | undefined;
}

/**
 * 选择基于键盘输入的条目，实现 `role="listbox"`、`role="tree"` 等
 * ARIA 角色的 typeahead 功能。
 */
export class Typeahead<T extends TypeaheadItem> {
  private _items: readonly T[] = [];
  private _selectedItemIndex = -1;

  /** 用户已按下的字母缓冲区。 */
  private _pressedLetters: string[] = [];

  private _skipPredicateFn?: (item: T) => boolean | undefined;
  private readonly _debounceInterval: number;
  private _debounceTimer: ReturnType<typeof setTimeout> | undefined;
  private _destroyed = false;

  /** 匹配到条目时同步发射该条目。 */
  readonly selectedItem = new Emitter<T>();

  constructor(initialItems: readonly T[], config?: TypeaheadConfig<T>) {
    this._debounceInterval =
      typeof config?.debounceInterval === 'number'
        ? config.debounceInterval
        : DEFAULT_TYPEAHEAD_DEBOUNCE_INTERVAL_MS;

    if (config?.skipPredicate) {
      this._skipPredicateFn = config.skipPredicate;
    }

    if (
      import.meta.env.DEV &&
      initialItems.length &&
      initialItems.some(item => typeof item.getLabel !== 'function')
    ) {
      throw new Error('KeyManager items in typeahead mode must implement the `getLabel` method.');
    }

    this.setItems(initialItems);
  }

  /** 释放定时器并结束事件流。 */
  destroy(): void {
    this._destroyed = true;
    clearTimeout(this._debounceTimer);
    this._pressedLetters = [];
    this.selectedItem.complete();
  }

  /** 记录当前选中项索引，作为下次循环搜索的起点。 */
  setCurrentSelectedItemIndex(index: number): void {
    this._selectedItemIndex = index;
  }

  /** 更新条目列表（列表变化时由 ListKeyManager 调用）。 */
  setItems(items: readonly T[]): void {
    this._items = items;
  }

  /** 处理键盘事件，只接收字母与数字按键。 */
  handleKey(event: KeyboardEvent): void {
    const keyCode = event.keyCode;

    // 优先使用 event.key（会自动映射用户键盘语言），否则回退到 keyCode。
    if (event.key && event.key.length === 1) {
      this._pushLetter(event.key.toLocaleUpperCase());
    } else if ((keyCode >= A && keyCode <= Z) || (keyCode >= ZERO && keyCode <= NINE)) {
      this._pushLetter(String.fromCharCode(keyCode));
    }
  }

  /** 用户是否仍在输入（缓冲区非空）。 */
  isTyping(): boolean {
    return this._pressedLetters.length > 0;
  }

  /** 清空已输入的字母序列。 */
  reset(): void {
    this._pressedLetters = [];
  }

  /** 记录字母并重置防抖计时。 */
  private _pushLetter(letter: string): void {
    this._pressedLetters.push(letter);
    clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(() => this._selectFromBuffer(), this._debounceInterval);
  }

  /** 防抖到期后，用缓冲区内容在条目中循环搜索并发射命中项。 */
  private _selectFromBuffer(): void {
    if (this._destroyed || this._pressedLetters.length === 0) {
      return;
    }

    const inputString = this._pressedLetters.join('').toLocaleUpperCase();

    // 从当前选中项的下一个条目开始，避免直接命中当前项。
    for (let i = 1; i < this._items.length + 1; i++) {
      const index = (this._selectedItemIndex + i) % this._items.length;
      const item = this._items[index];

      if (
        !this._skipPredicateFn?.(item) &&
        item.getLabel?.().toLocaleUpperCase().trim().indexOf(inputString) === 0
      ) {
        this.selectedItem.next(item);
        break;
      }
    }

    this._pressedLetters = [];
  }
}
