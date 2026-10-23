import {nextTick} from 'vue';
import {useDialog} from 'vue-cdk/dialog';
import type {DialogApi, DialogCloseOptions, DialogConfig, DialogContent, DialogRef} from 'vue-cdk/dialog';

/** 视口坐标，单位为 CSS 像素。 */
export interface DialogOrigin {
  x: number;
  y: number;
}

const APP_DIALOG_DEFAULTS: DialogConfig = {
  panelClass: 'app-dialog-panel',
  width: 'min(420px, calc(100vw - 32px))',
  maxWidth: 'calc(100vw - 32px)',
};

const DURATION = 280;
const EASING = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

function resolveOrigin(origin: MouseEvent | DialogOrigin): DialogOrigin {
  if ('clientX' in origin) {
    return {x: origin.clientX, y: origin.clientY};
  }
  return origin;
}

function animationFrames(element: HTMLElement, origin: DialogOrigin): Keyframe[] {
  const rect = element.getBoundingClientRect();
  const dx = origin.x - (rect.left + rect.width / 2);
  const dy = origin.y - (rect.top + rect.height / 2);
  return [
    {opacity: 0, transform: `translate(${dx}px, ${dy}px) scale(0.08)`},
    {opacity: 1, transform: 'translate(0, 0) scale(1)'},
  ];
}

/**
 * 获取项目统一的弹窗入口，并按调用方提供的鼠标事件或视口坐标播放展开动画。
 * 关闭时会先播放反向动画，再执行 DialogRef 原有关闭流程；closePredicate、关闭结果、
 * 焦点恢复及 closeAll 的行为保持有效。动画使用 Web Animations API，系统减少动态效果
 * 设置开启时跳过动画；需要在浏览器组件 setup 中调用。
 */
export function useAnimatedAppDialog(): DialogApi & {
  open<R = unknown, D = unknown, C = unknown>(
    content: DialogContent,
    options?: DialogConfig<D, DialogRef<R, C>>,
    origin?: MouseEvent | DialogOrigin,
  ): DialogRef<R, C>;
} {
  const dialog = useDialog();

  function open<R = unknown, D = unknown, C = unknown>(
    content: DialogContent,
    options: DialogConfig<D, DialogRef<R, C>> = {},
    originInput?: MouseEvent | DialogOrigin,
  ): DialogRef<R, C> {
    const origin = originInput
      ? resolveOrigin(originInput)
      : {x: window.innerWidth / 2, y: window.innerHeight / 2};
    const config = {...APP_DIALOG_DEFAULTS, ...options} as DialogConfig<D, DialogRef<R, C>>;
    const dialogRef = dialog.open<R, D, C>(content, config);
    const closeImmediately = dialogRef.close.bind(dialogRef);
    let closing = false;
    let openingAnimation: Animation | undefined;
    let frames: Keyframe[] | undefined;

    dialogRef.close = (result?: R, closeOptions?: DialogCloseOptions): void => {
      if (closing || !dialogRef.containerInstance) return;

      const predicate = config.closePredicate;
      if (predicate && !predicate.call(config, result, config, dialogRef.componentInstance)) return;

      // containerInstance.element 仅是面板内部的内容容器；动画必须作用于 overlay pane，
      // 才能连同 panelClass 的背景、边框和阴影一起从坐标起点移动。
      const element = dialogRef.overlayRef.overlayElement;
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!element || reducedMotion || typeof element.animate !== 'function') {
        if (predicate) config.closePredicate = undefined;
        closeImmediately(result, closeOptions);
        if (predicate) config.closePredicate = predicate;
        return;
      }

      closing = true;
      openingAnimation?.cancel();
      const originFrames = frames ?? animationFrames(element, origin);
      const animation = element.animate([...originFrames].reverse(), {
        duration: DURATION,
        easing: EASING,
        fill: 'both',
      });
      void animation.finished
        .catch(() => undefined)
        .then(() => {
          if (predicate) config.closePredicate = undefined;
          closeImmediately(result, closeOptions);
          if (predicate) config.closePredicate = predicate;
        });
    };

    void nextTick(() => {
      const element = dialogRef.overlayRef.overlayElement;
      if (!element || !element.isConnected || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (typeof element.animate === 'function') {
        frames = animationFrames(element, origin);
        openingAnimation = element.animate(frames, {
          duration: DURATION,
          easing: EASING,
          fill: 'both',
        });
      }
    });

    return dialogRef;
  }

  return {
    open,
    closeAll: () => dialog.closeAll(),
    getDialogById: id => dialog.getDialogById(id),
    get openDialogs() { return dialog.openDialogs; },
    get afterOpened() { return dialog.afterOpened; },
    get afterAllClosed() { return dialog.afterAllClosed; },
  };
}
