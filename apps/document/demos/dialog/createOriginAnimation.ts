import type {DialogCustomAnimation} from 'vue-cdk/dialog';

/**
 * 创建从指定视口坐标展开、关闭时返回该坐标的动画配置。
 * @param x 起点横坐标，单位为 CSS 像素；调用方须传入有限数值。
 * @param y 起点纵坐标，单位为 CSS 像素；调用方须传入有限数值。
 * @returns 可直接赋给 DialogConfig.animation 的独立配置，不依赖 Vue setup 或注入上下文。
 * 创建配置不访问 DOM；钩子执行时才测量面板并播放动画。不支持 WAAPI 时同步完成。
 * 返回的 Animation 由 Dialog 等待 finished 并负责取消；禁用动画与减少动态效果由 Dialog 处理。
 * 每次调用固定一组起点坐标，各窗口在钩子执行时独立测量，互不共享播放状态。
 */
export function createOriginAnimation(x: number, y: number): DialogCustomAnimation {
  /** 按当前面板中心计算位移；退场反转关键帧以返回同一视口坐标。 */
  function play(element: HTMLElement, leaving: boolean): Animation | void {
    if (typeof element.animate !== 'function') return;

    const rect = element.getBoundingClientRect();
    const dx = x - (rect.left + rect.width / 2);
    const dy = y - (rect.top + rect.height / 2);
    const frames: Keyframe[] = [
      {opacity: 0, transform: `translate(${dx}px, ${dy}px) scale(0.08)`},
      {opacity: 1, transform: 'translate(0, 0) scale(1)'},
    ];

    return element.animate(leaving ? frames.reverse() : frames, {
      duration: 280,
      easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      fill: 'both',
    });
  }

  return {
    enter: ({element}) => play(element, false),
    leave: ({element}) => play(element, true),
  };
}
