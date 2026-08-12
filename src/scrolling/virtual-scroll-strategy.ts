/**
 * 虚拟滚动策略接口，对应 Angular CDK 的 VirtualScrollStrategy。
 *
 * 策略决定「渲染哪些项」与「总内容尺寸」，视口负责把结果应用到 DOM。
 * 事件流使用自研 Emitter；自定义策略可注入 VIRTUAL_SCROLL_STRATEGY 接入。
 */

import type {InjectionKey} from 'vue';
import type {Emitter} from '../emitter';
import type {ListRange} from '../collections';

/** 视口暴露给策略的适配器接口（隐藏组件实现细节）。 */
export interface VirtualScrollViewportAdapter {
  /** 数据总条数。 */
  getDataLength(): number;

  /** 视口可见尺寸（像素，按当前方向）。 */
  getViewportSize(): number;

  /** 当前渲染区间。 */
  getRenderedRange(): ListRange;

  /** 从视口起点测量的滚动偏移（像素）。 */
  measureScrollOffset(from?: 'top' | 'left' | 'right' | 'bottom' | 'start' | 'end'): number;

  /** 设置全部内容的总尺寸（像素），用于撑出滚动条。 */
  setTotalContentSize(size: number): void;

  /** 设置当前渲染区间并触发重渲染。 */
  setRenderedRange(range: ListRange): void;

  /** 设置渲染内容相对视口起点的偏移（像素）。 */
  setRenderedContentOffset(offset: number, to?: 'to-start' | 'to-end'): void;

  /** 滚动到视口起点偏移（像素）。 */
  scrollToOffset(offset: number, behavior?: ScrollBehavior): void;
}

/**
 * 虚拟滚动策略接口。
 * 实现方通过构造时传入的 Emitter 对外暴露 scrolledIndexChange。
 */
export interface VirtualScrollStrategy {
  /** 首个可见项索引变化事件流（去重后派发）。 */
  scrolledIndexChange: Emitter<number>;

  /** 挂载到视口：初始化总尺寸与渲染区间。 */
  attach(viewport: VirtualScrollViewportAdapter): void;

  /** 从视口卸载并释放资源。 */
  detach(): void;

  /** 视口滚动时调用（按帧合并）。 */
  onContentScrolled(): void;

  /** 数据长度变化时调用。 */
  onDataLengthChanged(): void;

  /** 渲染区间实际写入 DOM 后调用。 */
  onContentRendered(): void;

  /** 渲染内容偏移变化后调用。 */
  onRenderedOffsetChanged(): void;

  /** 滚动到指定索引。 */
  scrollToIndex(index: number, behavior: ScrollBehavior): void;
}

/** 注入键：向 VVirtualScrollViewport 提供自定义虚拟滚动策略。 */
export const VIRTUAL_SCROLL_STRATEGY: InjectionKey<VirtualScrollStrategy> = Symbol(
  'vcdk-virtual-scroll-strategy',
);
