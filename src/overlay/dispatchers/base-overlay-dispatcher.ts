import type {Emitter} from '../../emitter';
import type {OverlayRef} from '../overlay-ref';

/**
 * 全局事件分发器基类：维护按打开顺序排列的 overlay 栈，
 * 并在栈为空时自动卸载全局监听。
 */
export abstract class BaseOverlayDispatcher {
  /** 已注册的 overlay，按 attach 先后排序（尾部为最上层）。 */
  protected _attachedOverlays: OverlayRef[] = [];
  protected _isAttached = false;

  /** 注册 overlay；重复注册会先移除再追加，保证栈内唯一。 */
  add(overlayRef: OverlayRef): void {
    this.remove(overlayRef);
    this._attachedOverlays.push(overlayRef);
  }

  /** 移除 overlay；栈空时自动卸载全局监听。 */
  remove(overlayRef: OverlayRef): void {
    const index = this._attachedOverlays.indexOf(overlayRef);
    if (index > -1) {
      this._attachedOverlays.splice(index, 1);
    }
    if (this._attachedOverlays.length === 0) {
      this.detach();
    }
  }

  /** 判断 overlay 是否允许接收事件：存在订阅者且事件谓词放行。 */
  protected canReceiveEvent<T>(overlayRef: OverlayRef, event: Event, stream: Emitter<T>): boolean {
    if (!stream.hasListeners) {
      return false;
    }
    const predicate = overlayRef.eventPredicate;
    return predicate ? predicate(event) : true;
  }

  /** 卸载全局监听。 */
  protected abstract detach(): void;
}
