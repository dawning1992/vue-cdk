import {inject, type InjectionKey} from 'vue';
import {DialogConfig} from './dialog-config';
import {DialogRef} from './dialog-ref';

/** 对话框数据的注入键，对应 Angular 的 `DIALOG_DATA`。 */
export const DIALOG_DATA: InjectionKey<unknown> = Symbol('vcdk-dialog-data');

/** 对话框引用的注入键，对应 Angular 中对 `DialogRef` 的注入。 */
export const DIALOG_REF: InjectionKey<DialogRef> = Symbol('vcdk-dialog-ref');

/** 全局默认对话框配置注入键，对应 Angular 的 `DEFAULT_DIALOG_CONFIG`。 */
export const DEFAULT_DIALOG_CONFIG: InjectionKey<DialogConfig> = Symbol(
  'vcdk-dialog-default-config',
);

/**
 * 在对话框内容组件中读取打开时传入的数据（inject 通道）。
 * 仅在对话框内容（或其子组件）内可调用。
 */
export function useDialogData<D = unknown>(): D {
  return inject(DIALOG_DATA, null) as D;
}

/**
 * 在对话框内容组件中读取当前 DialogRef，用于主动关闭对话框或监听事件。
 * 在对话框内容之外调用会抛出错误，便于尽早发现误用。
 */
export function useDialogRef<R = unknown, C = unknown>(): DialogRef<R, C> {
  const dialogRef = inject(DIALOG_REF, null);
  if (!dialogRef) {
    throw new Error(
      'useDialogRef() 只能在对话框内容组件中调用（缺少 DIALOG_REF 注入，请确认组件由 dialog.open() 打开）。',
    );
  }
  return dialogRef as DialogRef<R, C>;
}
