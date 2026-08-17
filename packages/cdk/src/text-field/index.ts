/**
 * text-field 模块：textarea 自动伸缩与浏览器自动填充状态监控。
 * 同时提供 Angular 风格服务/控制器、Vue Composition API 和模板指令入口。
 */
export {
  TextareaAutosize,
  useTextareaAutosize,
  type TextareaAutosizeOptions,
  type UseTextareaAutosizeReturn,
} from './autosize';
export {
  vTextareaAutosize,
  type TextareaAutosizeDirectiveOptions,
  type TextareaAutosizeDirectiveValue,
} from './v-textarea-autosize';
export {
  AutofillMonitor,
  autofillMonitor,
  CDK_AUTOFILL_MONITOR,
  provideAutofillMonitor,
  useAutofillMonitor,
  useAutofill,
  type AutofillEvent,
  type AutofillObserver,
  type AutofillStream,
  type AutofillSubscription,
  type UseAutofillOptions,
  type UseAutofillReturn,
} from './autofill';
export {vAutofill, type AutofillDirectiveValue} from './v-autofill';
export {
  injectTextFieldStyles,
  removeInjectedTextFieldStyles,
  vcdkTextFieldStyles,
} from './style-inject';
