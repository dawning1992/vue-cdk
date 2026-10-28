import {useDialog} from 'vue-cdk/dialog';
import {createOriginAnimation} from './createOriginAnimation';
import type {DialogApi, DialogConfig, DialogContent, DialogRef} from 'vue-cdk/dialog';

/** 视口坐标，单位为 CSS 像素。 */
export interface DialogOrigin {
  x: number;
  y: number;
}

const APP_DIALOG_DEFAULTS = {
  panelClass: 'app-dialog-panel',
  width: 'min(420px, calc(100vw - 32px))',
  maxWidth: 'calc(100vw - 32px)',
} satisfies DialogConfig;

/** 把鼠标事件转换为视口坐标，显式坐标按原值使用。 */
function resolveOrigin(origin: MouseEvent | DialogOrigin): DialogOrigin {
  if ('clientX' in origin) {
    return {x: origin.clientX, y: origin.clientY};
  }
  return origin;
}

/**
 * 获取项目统一的弹窗入口，并按调用方提供的鼠标事件或视口坐标播放展开动画。
 * 动画通过 DialogConfig.animation 接入原生生命周期；closePredicate、关闭结果、
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

  /** 合并项目默认值与单次配置；调用方显式 animation 配置优先于坐标动画。 */
  function open<R = unknown, D = unknown, C = unknown>(
    content: DialogContent,
    options: DialogConfig<D, DialogRef<R, C>> = {},
    originInput?: MouseEvent | DialogOrigin,
  ): DialogRef<R, C> {
    const origin = originInput
      ? resolveOrigin(originInput)
      : {x: window.innerWidth / 2, y: window.innerHeight / 2};
    return dialog.open<R, D, C>(content, {
      ...APP_DIALOG_DEFAULTS,
      animation: createOriginAnimation(origin.x, origin.y),
      ...options,
    });
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
