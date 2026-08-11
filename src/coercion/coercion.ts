import {unref, type Ref} from 'vue';

/**
 * 通用类型强制转换工具，与 Angular CDK 的 coercion 工具保持相同语义。
 */

/** 元素或其响应式引用，用于将命令式与声明式调用归一。 */
export type ElementOrRef<T extends HTMLElement = HTMLElement> = T | Ref<T | null | undefined>;

/** 将单个值或数组统一为数组；空值转换为空数组。 */
export function coerceArray<T>(value: T | T[] | null | undefined): T[] {
  if (value == null) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

/**
 * 将元素或元素 ref 归一为元素。
 * ref 当前为空（null/undefined）时抛出异常，避免后续逻辑在无效元素上静默失败。
 */
export function coerceElement<T extends HTMLElement>(value: T | Ref<T | null | undefined>): T {
  const element = unref(value);
  if (!element) {
    throw new Error('Expected an element or a ref to an element, but got null.');
  }
  return element;
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
