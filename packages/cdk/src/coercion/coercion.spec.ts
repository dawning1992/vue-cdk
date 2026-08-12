import {describe, expect, it} from 'vitest';
import {ref} from 'vue';
import {coerceArray, coerceCssPixelValue, coerceElement} from './coercion';

describe('coerceArray', () => {
  it('将单个值包装为数组', () => {
    expect(coerceArray('a')).toEqual(['a']);
    expect(coerceArray(['a', 'b'])).toEqual(['a', 'b']);
  });

  it('空值转换为空数组', () => {
    expect(coerceArray(null)).toEqual([]);
    expect(coerceArray(undefined)).toEqual([]);
  });
});

describe('coerceCssPixelValue', () => {
  it('数字追加 px，字符串原样保留', () => {
    expect(coerceCssPixelValue(100)).toBe('100px');
    expect(coerceCssPixelValue('50%')).toBe('50%');
  });

  it('空值返回空串', () => {
    expect(coerceCssPixelValue(null)).toBe('');
    expect(coerceCssPixelValue(undefined)).toBe('');
  });
});

describe('coerceElement', () => {
  it('元素直接原样返回', () => {
    const element = document.createElement('input');
    expect(coerceElement(element)).toBe(element);
  });

  it('ref 解包后返回元素', () => {
    const element = document.createElement('input');
    const elementRef = ref<HTMLElement | null>(element);
    expect(coerceElement(elementRef)).toBe(element);
  });

  it('ref 为空时抛出异常，避免在无效元素上静默失败', () => {
    expect(() => coerceElement(ref<HTMLElement | null>(null))).toThrowError(/Expected an element/);
  });
});
