/**
 * 浏览器支持的 `<input>` type 检测，对齐 Angular CDK platform 的
 * `features/input-types.ts`。结果按模块缓存，避免重复探测。
 */

/** 当前浏览器支持的输入类型缓存；undefined 表示尚未探测。 */
let supportedInputTypes: Set<string> | undefined;

/**
 * 可能受支持的输入类型候选列表，与 Angular CDK 保持一致。
 *
 * `color` 必须排在最前：Chrome 56 起，若先改为其他类型再改为 color，
 * 会因空值不符合 "#rrggbb" 格式而输出告警。
 */
const candidateInputTypes = [
  'color',
  'button',
  'checkbox',
  'date',
  'datetime-local',
  'email',
  'file',
  'hidden',
  'image',
  'month',
  'number',
  'password',
  'radio',
  'range',
  'reset',
  'search',
  'submit',
  'tel',
  'text',
  'time',
  'url',
  'week',
] as const;

/**
 * 返回当前浏览器支持的输入类型集合。
 *
 * 探测方式：逐项对临时 input 设置 `type` 属性，仅保留赋值后
 * `input.type` 与目标值一致的候选类型。非浏览器环境无法探测，
 * 按 Angular 的约定返回完整候选集（宁可多报，避免误杀可用能力）。
 */
export function getSupportedInputTypes(): Set<string> {
  // 结果按模块缓存，重复调用直接返回同一 Set 实例。
  if (supportedInputTypes) {
    return supportedInputTypes;
  }

  if (typeof document !== 'object' || !document) {
    supportedInputTypes = new Set(candidateInputTypes);
    return supportedInputTypes;
  }

  const featureTestInput = document.createElement('input');
  supportedInputTypes = new Set(
    candidateInputTypes.filter(value => {
      featureTestInput.setAttribute('type', value);
      return featureTestInput.type === value;
    }),
  );

  return supportedInputTypes;
}
