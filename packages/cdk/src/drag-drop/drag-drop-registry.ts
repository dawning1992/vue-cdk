/**
 * 拖拽全局注册表，移植自 Angular CDK drag-drop（https://github.com/angular/components，MIT License）。
 * 原版权：Copyright Google LLC All Rights Reserved。
 *
 * 职责：
 * - 维护全局的拖拽条目 / 拖放容器集合；
 * - 拖拽序列开始时在 document 绑定全局监听（pointer move/up、scroll、selectstart），
 *   全部拖拽结束后统一移除；
 * - 提供 DOM 节点到 VDrag 组件的映射，供 vDragHandle 等子指令查找所属拖拽项。
 *
 * 与 Angular 的差异：事件流使用仓库自研 Emitter；无 zone 概念，监听直接绑定。
 */

import type {DragRef} from './drag-ref';
import {Emitter} from '../emitter';
import {addListener} from '../scrolling/listen';

/** 捕获阶段监听选项。 */
const capturingEventOptions: AddEventListenerOptions = {capture: true};

/** 主动（非 passive）捕获阶段监听选项。 */
const activeCapturingEventOptions: AddEventListenerOptions = {capture: true, passive: false};

/** 可订阅事件流的统一形状，退订时执行资源清理。 */
export interface DragDropEventStream<T> {
  subscribe(listener: (value: T) => void): () => void;
}

/**
 * 拖拽全局注册表（模块级单例 `dragDropRegistry`）。
 * 组件与 ref 通过它共享全局监听器，避免同一页面多实例重复绑定 document 事件。
 */
export class DragDropRegistry {
  private _document: Document = document;

  /** 已注册的拖放容器。 */
  private _dropInstances = new Set<unknown>();

  /** 已注册的拖拽条目。 */
  private _dragInstances = new Set<DragRef>();

  /** 当前正在拖拽的条目（决定是否维持全局监听）。 */
  private _activeDragInstances: DragRef[] = [];

  /** document 全局监听器的移除函数。 */
  private _globalListeners: (() => void)[] | undefined;

  /** 持久 touchmove 监听器的移除函数（WebKit 需提前绑定才能 preventDefault）。 */
  private _cleanupDocumentTouchmove: (() => void) | undefined;

  /** 全局滚动事件流。 */
  private _scroll = new Emitter<Event>();

  /** 拖拽过程中的 pointermove 事件流。 */
  readonly pointerMove = new Emitter<MouseEvent | TouchEvent>();

  /** 拖拽结束（mouseup / touchend / touchcancel）事件流。 */
  readonly pointerUp = new Emitter<MouseEvent | TouchEvent>();

  /** DOM 节点到拖拽组件实例的映射。 */
  private _domNodesToDirectives: WeakMap<Node, unknown> | null = null;

  /** 拖拽判定谓词（高频调用，提取为属性避免重复创建函数）。 */
  private _draggingPredicate = (item: DragRef) => item.isDragging();

  /** 注册拖放容器。 */
  registerDropContainer(drop: unknown) {
    this._dropInstances.add(drop);
  }

  /** 注册拖拽条目；首个条目注册时绑定持久 touchmove 监听。 */
  registerDragItem(drag: DragRef) {
    this._dragInstances.add(drag);

    if (this._dragInstances.size === 1) {
      this._cleanupDocumentTouchmove?.();
      this._cleanupDocumentTouchmove = addListener(
        this._document,
        'touchmove',
        (event: Event) => this._persistentTouchmoveListener(event as TouchEvent),
        activeCapturingEventOptions,
      );
    }
  }

  /** 注销拖放容器。 */
  removeDropContainer(drop: unknown) {
    this._dropInstances.delete(drop);
  }

  /** 注销拖拽条目；全部条目注销后移除持久 touchmove 监听。 */
  removeDragItem(drag: DragRef) {
    this._dragInstances.delete(drag);
    this.stopDragging(drag);

    if (this._dragInstances.size === 0) {
      this._cleanupDocumentTouchmove?.();
      this._cleanupDocumentTouchmove = undefined;
    }
  }

  /**
   * 开始一次拖拽序列：把条目加入活动集合，并在首个条目开始时绑定全局监听。
   * @param drag 正在拖拽的条目。
   * @param event 触发拖拽的原始事件（用于区分触摸/鼠标序列）。
   */
  startDragging(drag: DragRef, event: TouchEvent | MouseEvent) {
    if (this._activeDragInstances.indexOf(drag) > -1) {
      return;
    }

    this._activeDragInstances.push(drag);

    if (this._activeDragInstances.length === 1) {
      const isTouchEvent = event.type.startsWith('touch');
      const endEventHandler = (e: Event) => this.pointerUp.next(e as TouchEvent | MouseEvent);
      const toBind: [string, (event: Event) => void, AddEventListenerOptions][] = [
        ['scroll', (e: Event) => this._scroll.next(e), capturingEventOptions],
        ['selectstart', this._preventDefaultWhileDragging, activeCapturingEventOptions],
      ];

      if (isTouchEvent) {
        toBind.push(
          ['touchend', endEventHandler, capturingEventOptions],
          ['touchcancel', endEventHandler, capturingEventOptions],
        );
      } else {
        toBind.push(['mouseup', endEventHandler, capturingEventOptions]);
        toBind.push(['mousemove', (e: Event) => this.pointerMove.next(e as MouseEvent), activeCapturingEventOptions]);
      }

      this._globalListeners = toBind.map(([name, handler, options]) =>
        addListener(this._document, name, handler, options),
      );
    }
  }

  /** 结束条目拖拽；活动集合为空时移除全局监听。 */
  stopDragging(drag: DragRef) {
    const index = this._activeDragInstances.indexOf(drag);
    if (index > -1) {
      this._activeDragInstances.splice(index, 1);
    }

    if (this._activeDragInstances.length === 0) {
      this._clearGlobalListeners();
    }
  }

  /** 条目是否正在拖拽。 */
  isDragging(drag: DragRef) {
    return this._activeDragInstances.indexOf(drag) > -1;
  }

  /**
   * 获取页面任意元素滚动时的事件流（仅拖拽期间派发）。
   * 传入 shadow root 时额外监听其滚动，弥补顶层监听不穿透 Shadow DOM 的限制。
   */
  scrolled(shadowRoot?: DocumentOrShadowRoot | null): DragDropEventStream<Event> {
    const output = new Emitter<Event>();
    const cleanups: (() => void)[] = [this._scroll.subscribe(event => output.next(event))];

    if (shadowRoot && shadowRoot !== this._document) {
      cleanups.push(
        addListener(
          shadowRoot as ShadowRoot,
          'scroll',
          (event: Event) => {
            if (this._activeDragInstances.length) {
              output.next(event);
            }
          },
          capturingEventOptions,
        ),
      );
    }

    const originalSubscribe = output.subscribe.bind(output);
    output.subscribe = listener => {
      const unsubscribe = originalSubscribe(listener);
      return () => {
        unsubscribe();
        cleanups.forEach(cleanup => cleanup());
      };
    };

    return output;
  }

  /** 记录 DOM 节点对应的拖拽组件实例。 */
  registerDirectiveNode(node: Node, dragRef: unknown): void {
    this._domNodesToDirectives ??= new WeakMap();
    this._domNodesToDirectives.set(node, dragRef);
  }

  /** 停止记录 DOM 节点对应的拖拽组件实例。 */
  removeDirectiveNode(node: Node): void {
    this._domNodesToDirectives?.delete(node);
  }

  /** 获取 DOM 节点对应的拖拽组件实例；未注册返回 null。 */
  getDragDirectiveForNode(node: Node): unknown {
    return this._domNodesToDirectives?.get(node) ?? null;
  }

  /** 释放所有注册项与全局监听。 */
  dispose() {
    this._dragInstances.forEach(instance => this.removeDragItem(instance));
    this._dropInstances.clear();
    this._domNodesToDirectives = null;
    this._clearGlobalListeners();
    this.pointerMove.complete();
    this.pointerUp.complete();
  }

  /** 拖拽期间阻止选择文本等默认行为。 */
  private _preventDefaultWhileDragging = (event: Event) => {
    if (this._activeDragInstances.length > 0) {
      event.preventDefault();
    }
  };

  /** 持久 touchmove 监听：拖拽期间派发 pointerMove 并在实际拖动后阻止滚动。 */
  private _persistentTouchmoveListener = (event: TouchEvent) => {
    if (this._activeDragInstances.length > 0) {
      if (this._activeDragInstances.some(this._draggingPredicate)) {
        event.preventDefault();
      }

      this.pointerMove.next(event);
    }
  };

  /** 移除 document 全局监听。 */
  private _clearGlobalListeners() {
    this._globalListeners?.forEach(cleanup => cleanup());
    this._globalListeners = undefined;
  }
}

/** 模块级单例，组件与 ref 默认共享。 */
export const dragDropRegistry = new DragDropRegistry();
