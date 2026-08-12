/**
 * 事件监听工具：注册监听并返回幂等的移除函数。
 * 供 scrolling 模块内部统一使用，避免各处重复实现。
 */

/**
 * 在目标上注册事件监听，返回移除函数。
 * @param captureOrOptions 布尔值表示 capture；也可传 AddEventListenerOptions
 * （例如 drag-drop 需要 {passive: false, capture: true} 的主动 touchmove 监听）。
 */
export function addListener(
  target: EventTarget,
  type: string,
  handler: (event: Event) => void,
  captureOrOptions: boolean | AddEventListenerOptions = false,
): () => void {
  target.addEventListener(type, handler, captureOrOptions);
  return () => target.removeEventListener(type, handler, captureOrOptions);
}
