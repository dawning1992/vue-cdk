import {describe, expect, it} from 'vitest';
import {isElementClippedByScrolling, isElementScrolledOutsideView} from './scroll-clip';

const element = {top: 10, bottom: 110, left: 10, right: 110, width: 100, height: 100} as DOMRect;

describe('isElementScrolledOutsideView', () => {
  it('元素完全在容器内时返回 false', () => {
    const container = {top: 0, bottom: 200, left: 0, right: 200} as DOMRect;
    expect(isElementScrolledOutsideView(element, [container])).toBe(false);
  });

  it('元素完全移出容器时返回 true', () => {
    const container = {top: 200, bottom: 300, left: 0, right: 200} as DOMRect;
    expect(isElementScrolledOutsideView(element, [container])).toBe(true);
  });

  it('元素部分越界但仍有重叠时不视为完全移出', () => {
    const container = {top: 50, bottom: 300, left: 0, right: 200} as DOMRect;
    expect(isElementScrolledOutsideView(element, [container])).toBe(false);
  });
});

describe('isElementClippedByScrolling', () => {
  it('元素被容器裁剪时返回 true', () => {
    const container = {top: 50, bottom: 300, left: 0, right: 200} as DOMRect;
    expect(isElementClippedByScrolling(element, [container])).toBe(true);
  });

  it('元素完全在容器内时返回 false', () => {
    const container = {top: 0, bottom: 200, left: 0, right: 200} as DOMRect;
    expect(isElementClippedByScrolling(element, [container])).toBe(false);
  });
});
