/**
 * 方向（LTR/RTL）解析工具，对应 Angular CDK bidi 模块的轻量替代。
 *
 * 与 Angular Directionality 服务的差异：不提供运行时方向变更通知，
 * 每次测量/滚动时就近读取 `dir` 属性，结果始终反映当前 DOM 状态。
 */

/** 布局方向。 */
export type Direction = 'ltr' | 'rtl';

/**
 * 解析元素所处布局方向。
 *
 * 优先读取元素自身或最近祖先的 `dir` 属性，其次读取 `<html>` 的 `dir`，
 * 均未设置时按 HTML 规范默认 `ltr`。
 */
export function getDirection(element?: HTMLElement | null): Direction {
  const localDir = element?.closest?.('[dir]')?.getAttribute('dir');
  if (localDir === 'rtl' || localDir === 'ltr') {
    return localDir;
  }

  const rootDir = document.documentElement?.getAttribute('dir');
  return rootDir === 'rtl' ? 'rtl' : 'ltr';
}
