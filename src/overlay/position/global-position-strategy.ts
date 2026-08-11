import type {OverlayRef} from '../overlay-ref';
import type {PositionStrategy} from './position-strategy';

/** 全局定位包装层的类名。 */
const wrapperClass = 'vue-global-overlay-wrapper';

/**
 * 全局定位策略：将 overlay 定位到视口的指定位置（顶部、居中、底部、左右等）。
 *
 * 与 Angular 一致，使用 flexbox 而非 transform 实现定位，
 * 避免子像素渲染导致的文字模糊；width/height 在 attach 时合并进 overlay 配置。
 */
export class GlobalPositionStrategy implements PositionStrategy {
  private _overlayRef: OverlayRef | null = null;
  private _cssPosition = 'static';
  private _topOffset = '';
  private _bottomOffset = '';
  private _alignItems = '';
  private _xPosition = '';
  private _xOffset = '';
  private _width = '';
  private _height = '';
  private _isDisposed = false;

  attach(overlayRef: OverlayRef): void {
    const config = overlayRef.getConfig();
    this._overlayRef = overlayRef;

    if (this._width && !config.width) {
      overlayRef.updateSize({width: this._width});
    }
    if (this._height && !config.height) {
      overlayRef.updateSize({height: this._height});
    }

    overlayRef.hostElement.classList.add(wrapperClass);
    this._isDisposed = false;
  }

  /** 定位到顶部；清除已设置的垂直位置。 */
  top(value = ''): this {
    this._bottomOffset = '';
    this._topOffset = value;
    this._alignItems = 'flex-start';
    return this;
  }

  /** 定位到左侧。 */
  left(value = ''): this {
    this._xOffset = value;
    this._xPosition = 'left';
    return this;
  }

  /** 定位到底部；清除已设置的垂直位置。 */
  bottom(value = ''): this {
    this._topOffset = '';
    this._bottomOffset = value;
    this._alignItems = 'flex-end';
    return this;
  }

  /** 定位到右侧。 */
  right(value = ''): this {
    this._xOffset = value;
    this._xPosition = 'right';
    return this;
  }

  /** 定位到行首（LTR 为左，RTL 为右）。 */
  start(value = ''): this {
    this._xOffset = value;
    this._xPosition = 'start';
    return this;
  }

  /** 定位到行尾（LTR 为右，RTL 为左）。 */
  end(value = ''): this {
    this._xOffset = value;
    this._xPosition = 'end';
    return this;
  }

  /** 设置 overlay 宽度（已挂载时直接更新 overlay 尺寸）。 */
  width(value = ''): this {
    if (this._overlayRef) {
      this._overlayRef.updateSize({width: value});
    } else {
      this._width = value;
    }
    return this;
  }

  /** 设置 overlay 高度（已挂载时直接更新 overlay 尺寸）。 */
  height(value = ''): this {
    if (this._overlayRef) {
      this._overlayRef.updateSize({height: value});
    } else {
      this._height = value;
    }
    return this;
  }

  /** 水平居中，可带偏移。 */
  centerHorizontally(offset = ''): this {
    this.left(offset);
    this._xPosition = 'center';
    return this;
  }

  /** 垂直居中，可带偏移。 */
  centerVertically(offset = ''): this {
    this.top(offset);
    this._alignItems = 'center';
    return this;
  }

  /** 将 flexbox 定位样式应用到 overlay 的 pane 与 host。 */
  apply(): void {
    if (!this._overlayRef || !this._overlayRef.hasAttached()) {
      return;
    }

    const styles = this._overlayRef.overlayElement.style;
    const parentStyles = this._overlayRef.hostElement.style;
    const config = this._overlayRef.getConfig();
    const {width, height, maxWidth, maxHeight} = config;
    const shouldBeFlushHorizontally =
      (width === '100%' || width === '100vw') &&
      (!maxWidth || maxWidth === '100%' || maxWidth === '100vw');
    const shouldBeFlushVertically =
      (height === '100%' || height === '100vh') &&
      (!maxHeight || maxHeight === '100%' || maxHeight === '100vh');
    const xPosition = this._xPosition;
    const xOffset = this._xOffset;
    const isRtl = this._overlayRef.getDirection() === 'rtl';
    let marginLeft = '';
    let marginRight = '';
    let justifyContent = '';

    if (shouldBeFlushHorizontally) {
      justifyContent = 'flex-start';
    } else if (xPosition === 'center') {
      justifyContent = 'center';
      if (isRtl) {
        marginRight = xOffset;
      } else {
        marginLeft = xOffset;
      }
    } else if (isRtl) {
      if (xPosition === 'left' || xPosition === 'end') {
        justifyContent = 'flex-end';
        marginLeft = xOffset;
      } else if (xPosition === 'right' || xPosition === 'start') {
        justifyContent = 'flex-start';
        marginRight = xOffset;
      }
    } else if (xPosition === 'left' || xPosition === 'start') {
      justifyContent = 'flex-start';
      marginLeft = xOffset;
    } else if (xPosition === 'right' || xPosition === 'end') {
      justifyContent = 'flex-end';
      marginRight = xOffset;
    }

    styles.position = this._cssPosition;
    styles.marginLeft = shouldBeFlushHorizontally ? '0' : marginLeft;
    styles.marginTop = shouldBeFlushVertically ? '0' : this._topOffset;
    styles.marginBottom = this._bottomOffset;
    styles.marginRight = shouldBeFlushHorizontally ? '0' : marginRight;
    parentStyles.justifyContent = justifyContent;
    parentStyles.alignItems = shouldBeFlushVertically ? 'flex-start' : this._alignItems;
  }

  /** 清理策略应用到 DOM 上的样式。 */
  dispose(): void {
    if (this._isDisposed || !this._overlayRef) {
      return;
    }

    const styles = this._overlayRef.overlayElement.style;
    const parent = this._overlayRef.hostElement;
    const parentStyles = parent.style;

    parent.classList.remove(wrapperClass);
    parentStyles.justifyContent = '';
    parentStyles.alignItems = '';
    styles.marginTop = '';
    styles.marginBottom = '';
    styles.marginLeft = '';
    styles.marginRight = '';
    styles.position = '';

    this._overlayRef = null;
    this._isDisposed = true;
  }
}

/** 创建全局定位策略。 */
export function createGlobalPositionStrategy(): GlobalPositionStrategy {
  return new GlobalPositionStrategy();
}
