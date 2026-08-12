import type {ApiGroup} from '../api';

/** coercion 模块 API 分组：工具函数与类型。 */
export const apiGroups: readonly ApiGroup[] = [
  {
    title: '转换函数',
    rows: [
      {
        name: 'coerceArray',
        signature: 'coerceArray<T>(value: T | T[] | null | undefined): T[]',
        description:
          '把单个值或数组统一为数组：数组原样返回，单个值包装为单元素数组，null/undefined 返回空数组。适用于把「单个或列表」输入归一为列表的场景。',
      },
      {
        name: 'coerceCssPixelValue',
        signature: 'coerceCssPixelValue(value: number | string | null | undefined): string',
        description:
          '把数字或字符串转换为合法 CSS 尺寸：数字追加 px 单位，字符串原样返回，空值返回空串（便于清空内联样式）。',
      },
      {
        name: 'coerceElement',
        signature: 'coerceElement<T extends HTMLElement>(value: T | Ref<T | null | undefined>): T',
        description:
          '把元素或其响应式引用（ref）归一为元素；ref 当前为空时抛出异常，避免后续逻辑在无效元素上静默失败。',
      },
    ],
  },
  {
    title: '类型',
    rows: [
      {
        name: 'ElementOrRef',
        signature: 'type ElementOrRef<T extends HTMLElement = HTMLElement> = T | Ref<T | null | undefined>',
        description: '元素或其 ref 的联合类型，用于把命令式与声明式调用归一为同一入参形态。',
      },
    ],
  },
];
