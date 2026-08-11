import {Emitter} from '../emitter';
import {isBrowser} from '../platform';

/** 当前滚动位置。 */
export interface ViewportScrollPosition {
  top: number;
  left: number;
}

/**
 * 视口几何信息工具：滚动位置、视口尺寸与 resize 事件流。
 * 库内以模块级单例形式使用，测试中可替换为自定义实例。
 */
export class ViewportRuler {
  private _change = new Emitter<void>();
  private _listening = false;

  /** 返回当前窗口滚动位置（pageYOffset 优先，退化到 documentElement）。 */
  getViewportScrollPosition(): ViewportScrollPosition {
    if (!isBrowser()) {
      return {top: 0, left: 0};
    }
    return {
      top: window.pageYOffset ?? document.documentElement.scrollTop,
      left: window.pageXOffset ?? document.documentElement.scrollLeft,
    };
  }

  /** 返回视口尺寸（innerWidth/innerHeight）。 */
  getViewportSize(): {width: number; height: number} {
    if (!isBrowser()) {
      return {width: 0, height: 0};
    }
    return {width: window.innerWidth, height: window.innerHeight};
  }

  /** 订阅视口 resize 变化，返回退订函数。监听器懒挂载，首个订阅者触发。 */
  change(): Emitter<void> {
    if (!this._listening && isBrowser()) {
      window.addEventListener('resize', this._onResize);
      this._listening = true;
    }
    return this._change;
  }

  /** 销毁实例：移除全局监听并结束事件流。 */
  dispose(): void {
    if (this._listening) {
      window.removeEventListener('resize', this._onResize);
      this._listening = false;
    }
    this._change.complete();
  }

  private _onResize = (): void => {
    this._change.next();
  };
}

/** 默认视口工具实例。 */
export const viewportRuler = new ViewportRuler();
