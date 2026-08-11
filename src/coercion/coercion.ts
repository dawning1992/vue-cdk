/**
 * 通用类型强制转换工具，与 Angular CDK 的 coercion 工具保持相同语义。
 */

/** 将单个值或数组统一为数组；空值转换为空数组。 */
export function coerceArray<T>(value: T | T[] | null | undefined): T[] {
  if (value == null) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

/**
 * 将数字或字符串转换为合法的 CSS 像素值：数字追加 `px`，字符串原样返回，
 * 空值返回空串（用于清空内联样式）。
 */
export function coerceCssPixelValue(value: number | string | null | undefined): string {
  if (value == null || value === '') {
    return '';
  }
  return typeof value === 'string' ? value : `${value}px`;
}
