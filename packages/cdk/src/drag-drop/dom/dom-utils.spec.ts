import {afterEach, describe, expect, it, vi} from 'vitest';
import {deepCloneNode} from './clone-node';
import {
  adjustDomRect,
  getMutableClientRect,
  isInsideClientRect,
  isOverflowingParent,
  isPointerNearDomRect,
} from './dom-rect';
import {ParentPositionTracker} from './parent-position-tracker';
import {
  combineTransforms,
  extendStyles,
  getTransform,
  matchElementSize,
  toggleNativeDragInteractions,
  toggleVisibility,
} from './styling';
import {getTransformTransitionDurationInMs} from './transition-duration';

function rect(partial: Partial<DOMRect>): DOMRect {
  return {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
    ...partial,
  } as DOMRect;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getMutableClientRect', () => {
  it('返回可修改的矩形副本', () => {
    const element = document.createElement('div');
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(rect({top: 10, left: 20, width: 100, height: 50}));
    const output = getMutableClientRect(element);
    expect(output.top).toBe(10);
    expect(output.left).toBe(20);
    (output as unknown as {top: number}).top = 99;
    expect((output as unknown as {top: number}).top).toBe(99);
  });
});

describe('isInsideClientRect', () => {
  it('坐标在矩形内返回 true', () => {
    expect(isInsideClientRect(rect({top: 0, left: 0, right: 100, bottom: 100}), 50, 50)).toBe(true);
  });

  it('坐标在矩形外返回 false', () => {
    expect(isInsideClientRect(rect({top: 0, left: 0, right: 100, bottom: 100}), 150, 50)).toBe(false);
    expect(isInsideClientRect(rect({top: 0, left: 0, right: 100, bottom: 100}), 50, -1)).toBe(false);
  });
});

describe('isOverflowingParent', () => {
  const parent = rect({top: 0, left: 0, right: 100, bottom: 100, width: 100, height: 100});

  it('子元素超出边界时返回 true', () => {
    expect(isOverflowingParent(parent, rect({top: 0, left: 80, width: 50, height: 20}))).toBe(true);
  });

  it('子元素未超出边界时返回 false', () => {
    expect(isOverflowingParent(parent, rect({top: 10, left: 10, width: 50, height: 50}))).toBe(false);
  });
});

describe('adjustDomRect', () => {
  it('按差值调整 top/left 及派生 bottom/right', () => {
    const domRect = rect({top: 10, left: 20, bottom: 60, right: 120, width: 100, height: 50});
    adjustDomRect(domRect, 5, 3);
    expect(domRect.top).toBe(15);
    expect(domRect.left).toBe(23);
    expect(domRect.bottom).toBe(65);
    expect(domRect.right).toBe(123);
  });
});

describe('isPointerNearDomRect', () => {
  it('指针在阈值内返回 true', () => {
    const area = rect({top: 0, left: 0, right: 100, bottom: 100, width: 100, height: 100});
    expect(isPointerNearDomRect(area, 0.05, -4, 50)).toBe(true);
  });

  it('指针超出阈值返回 false', () => {
    const area = rect({top: 0, left: 0, right: 100, bottom: 100, width: 100, height: 100});
    expect(isPointerNearDomRect(area, 0.05, -10, 50)).toBe(false);
  });
});

describe('getTransform / combineTransforms / matchElementSize', () => {
  it('getTransform 生成四舍五入的 translate3d', () => {
    expect(getTransform(10.4, 20.6)).toBe('translate3d(10px, 21px, 0)');
  });

  it('combineTransforms 拼接已有 transform', () => {
    expect(combineTransforms('translate3d(1px, 0, 0)', 'rotate(90deg)')).toBe(
      'translate3d(1px, 0, 0) rotate(90deg)',
    );
    expect(combineTransforms('translate3d(1px, 0, 0)', 'none')).toBe('translate3d(1px, 0, 0)');
  });

  it('matchElementSize 按源矩形设置尺寸与位置', () => {
    const target = document.createElement('div');
    matchElementSize(target, rect({left: 5, top: 6, width: 100, height: 40}));
    expect(target.style.width).toBe('100px');
    expect(target.style.height).toBe('40px');
    expect(target.style.transform).toBe('translate3d(5px, 6px, 0)');
  });
});

describe('extendStyles / toggleVisibility / toggleNativeDragInteractions', () => {
  it('extendStyles 支持 important 属性', () => {
    const element = document.createElement('div');
    extendStyles(element.style, {'position': 'fixed', 'top': '0'}, new Set(['position']));
    expect(element.style.getPropertyPriority('position')).toBe('important');
    expect(element.style.position).toBe('fixed');
  });

  it('toggleVisibility 隐藏时保留尺寸并设置定位', () => {
    const element = document.createElement('div');
    toggleVisibility(element, false);
    expect(element.style.position).toBe('fixed');
    expect(element.style.opacity).toBe('0');

    toggleVisibility(element, true);
    expect(element.style.opacity).toBe('');
    expect(element.style.position).toBe('');
  });

  it('toggleNativeDragInteractions 切换 user-select 与 touch-action', () => {
    const element = document.createElement('div');
    toggleNativeDragInteractions(element, false);
    expect(element.style.userSelect).toBe('none');
    expect(element.style.touchAction).toBe('none');

    toggleNativeDragInteractions(element, true);
    expect(element.style.userSelect).toBe('');
    expect(element.style.touchAction).toBe('');
  });
});

describe('deepCloneNode', () => {
  it('深克隆元素并移除重复 id', () => {
    const source = document.createElement('div');
    source.id = 'source-id';
    const child = document.createElement('span');
    child.id = 'child-id';
    source.appendChild(child);

    const clone = deepCloneNode(source);
    expect(clone).not.toBe(source);
    expect(clone.getAttribute('id')).toBeNull();
    expect(clone.querySelector('span')!.getAttribute('id')).toBeNull();
  });

  it('克隆 input 时保留 value', () => {
    const source = document.createElement('input');
    source.value = 'draft';
    const clone = deepCloneNode(source);
    expect((clone as HTMLInputElement).value).toBe('draft');
  });
});

describe('ParentPositionTracker', () => {
  it('缓存文档与元素滚动位置', () => {
    const tracker = new ParentPositionTracker(document);
    const element = document.createElement('div');
    element.scrollTop = 10;
    element.scrollLeft = 20;
    tracker.cache([element]);
    expect(tracker.positions.get(element)!.scrollPosition).toEqual({top: 10, left: 20});
    expect(tracker.positions.has(document)).toBe(true);
  });

  it('handleScroll 返回滚动差值并更新缓存', () => {
    const tracker = new ParentPositionTracker(document);
    const element = document.createElement('div');
    element.scrollTop = 0;
    element.scrollLeft = 0;
    tracker.cache([element]);

    element.scrollTop = 30;
    element.scrollLeft = 10;
    const scrollEvent = new Event('scroll');
    element.dispatchEvent(scrollEvent);
    const difference = tracker.handleScroll(scrollEvent);

    expect(difference).toEqual({top: -30, left: -10});
    expect(tracker.positions.get(element)!.scrollPosition).toEqual({top: 30, left: 10});
  });

  it('未缓存的滚动目标返回 null', () => {
    const tracker = new ParentPositionTracker(document);
    tracker.cache([]);
    expect(tracker.handleScroll(new Event('scroll'))).toBeNull();
  });
});

describe('getTransformTransitionDurationInMs', () => {
  it('transform 过渡时长解析为毫秒（含延迟）', () => {
    const element = document.createElement('div');
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      transitionProperty: 'transform, opacity',
      transitionDuration: '0.2s, 0.5s',
      transitionDelay: '0.1s, 0s',
      getPropertyValue: (name: string) => {
        if (name === 'transition-property') return 'transform, opacity';
        if (name === 'transition-duration') return '0.2s, 0.5s';
        if (name === 'transition-delay') return '0.1s, 0s';
        return '';
      },
    } as unknown as CSSStyleDeclaration);

    expect(getTransformTransitionDurationInMs(element)).toBe(300);
  });

  it('无 transform 过渡时返回 0', () => {
    const element = document.createElement('div');
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      transitionProperty: 'opacity',
      transitionDuration: '0.5s',
      transitionDelay: '0s',
      getPropertyValue: (name: string) => {
        if (name === 'transition-property') return 'opacity';
        if (name === 'transition-duration') return '0.5s';
        if (name === 'transition-delay') return '0s';
        return '';
      },
    } as unknown as CSSStyleDeclaration);

    expect(getTransformTransitionDurationInMs(element)).toBe(0);
  });
});
