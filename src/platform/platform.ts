/**
 * 平台能力检测与事件目标提取，供 SSR 环境下的安全判断使用。
 */

/** 是否运行在浏览器环境中。 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/** 是否支持原生 Popover API（`showPopover` 存在即可判定）。 */
export function supportsPopover(): boolean {
  return isBrowser() && typeof document.body?.showPopover === 'function';
}

/** 从事件中提取目标元素，兼容 `Event` 与合成事件对象。 */
export function getEventTarget(event: Event): HTMLElement | null {
  return event.target as HTMLElement | null;
}

/** 是否按下了 Ctrl、Alt、Shift 或 Meta 修饰键。 */
export function hasModifierKey(event: KeyboardEvent): boolean {
  return event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
}
