import {describe, expect, it} from 'vitest';
import {
  ConnectionPositionPair,
  ConnectedOverlayPositionChange,
  ScrollingVisibility,
  validateHorizontalPosition,
  validateVerticalPosition,
} from './connected-position';

describe('ConnectionPositionPair', () => {
  it('保存连接点与偏移', () => {
    const pair = new ConnectionPositionPair(
      {originX: 'start', originY: 'bottom'},
      {overlayX: 'start', overlayY: 'top'},
      4,
      8,
      'menu',
    );
    expect(pair.originX).toBe('start');
    expect(pair.originY).toBe('bottom');
    expect(pair.overlayX).toBe('start');
    expect(pair.overlayY).toBe('top');
    expect(pair.offsetX).toBe(4);
    expect(pair.offsetY).toBe(8);
    expect(pair.panelClass).toBe('menu');
  });
});

describe('ScrollingVisibility', () => {
  it('默认四个字段均为 false', () => {
    const visibility = new ScrollingVisibility();
    expect(visibility.isOriginClipped).toBe(false);
    expect(visibility.isOriginOutsideView).toBe(false);
    expect(visibility.isOverlayClipped).toBe(false);
    expect(visibility.isOverlayOutsideView).toBe(false);
  });
});

describe('ConnectedOverlayPositionChange', () => {
  it('携带连接对与滚动可见性', () => {
    const pair = {originX: 'start' as const, originY: 'top' as const, overlayX: 'start' as const, overlayY: 'bottom' as const};
    const visibility = new ScrollingVisibility();
    const change = new ConnectedOverlayPositionChange(pair, visibility);
    expect(change.connectionPair).toBe(pair);
    expect(change.scrollableViewProperties).toBe(visibility);
  });
});

describe('位置校验', () => {
  it('合法值不抛错', () => {
    expect(() => validateHorizontalPosition('originX', 'start')).not.toThrow();
    expect(() => validateHorizontalPosition('originX', 'center')).not.toThrow();
    expect(() => validateHorizontalPosition('originX', 'end')).not.toThrow();
    expect(() => validateVerticalPosition('originY', 'top')).not.toThrow();
    expect(() => validateVerticalPosition('originY', 'center')).not.toThrow();
    expect(() => validateVerticalPosition('originY', 'bottom')).not.toThrow();
  });

  it('非法值抛出带属性名的错误', () => {
    expect(() => validateHorizontalPosition('originX', 'middle' as never)).toThrow(
      /originX/,
    );
    expect(() => validateVerticalPosition('overlayY', 'left' as never)).toThrow(
      /overlayY/,
    );
  });
});
