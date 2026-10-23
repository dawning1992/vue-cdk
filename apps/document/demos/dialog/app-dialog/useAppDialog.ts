import {useDialog} from 'vue-cdk/dialog';
import type {DialogApi, DialogConfig, DialogContent, DialogRef} from 'vue-cdk/dialog';

/**
 * 项目级对话框默认配置。项目可在这里统一设置面板样式、尺寸和其他 DialogConfig。
 * 单次 open() 传入的配置优先级更高，可按具体场景覆盖。
 */
const APP_DIALOG_DEFAULTS: DialogConfig = {
  panelClass: 'app-dialog-panel',
  width: 'min(420px, calc(100vw - 32px))',
  maxWidth: 'calc(100vw - 32px)',
};

/**
 * 获取项目统一的对话框入口。
 * 在 Vue 组件 setup 中调用，以保留 useDialog() 捕获的应用上下文。
 * open() 的 options 与 DialogConfig 相同，且会覆盖项目默认配置。
 */
export function useAppDialog(): DialogApi {
  const dialog = useDialog();

  function open<R = unknown, D = unknown, C = unknown>(
    content: DialogContent,
    options?: DialogConfig<D, DialogRef<R, C>>,
  ): DialogRef<R, C> {
    const config = {...APP_DIALOG_DEFAULTS, ...options} as DialogConfig<D, DialogRef<R, C>>;
    return dialog.open<R, D, C>(content, config);
  }

  return {
    open,
    closeAll: () => dialog.closeAll(),
    getDialogById: id => dialog.getDialogById(id),
    get openDialogs() {
      return dialog.openDialogs;
    },
    get afterOpened() {
      return dialog.afterOpened;
    },
    get afterAllClosed() {
      return dialog.afterAllClosed;
    },
  };
}
