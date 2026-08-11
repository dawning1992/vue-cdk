/** platform 模块：平台能力检测与通用事件工具，供 SSR 环境下安全判断使用。 */
export {
  isBrowser,
  supportsPopover,
  getEventTarget,
  hasModifierKey,
} from './platform';
