import {describe, expect, it} from 'vitest';
import {coerceArray, coerceCssPixelValue} from './coercion';

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
