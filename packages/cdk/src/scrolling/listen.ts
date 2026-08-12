/**
 * 事件监听工具：注册监听并返回幂等的移除函数。
 * 供 scrolling 模块内部统一使用，避免各处重复实现。
 */

/** 在目标上注册事件监听，返回移除函数。 */
export function addListener(
  target: EventTarget,
  type: string,
  handler: (event: Event) => void,
  capture = false,
): () => void {
  target.addEventListener(type, handler, capture);
  return () => target.removeEventListener(type, handler, capture);
}
