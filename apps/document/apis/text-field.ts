import type {ApiGroup} from '../api';

/** text-field 模块公开 API：自动伸缩、自动填充监控、Vue 绑定与样式。 */
export const apiGroups: readonly ApiGroup[] = [
  {
    title: 'Textarea 自动伸缩',
    rows: [
      {name: 'TextareaAutosize', signature: 'class TextareaAutosize(textarea: HTMLTextAreaElement)', description: 'Angular CdkTextareaAutosize 对应控制器；安装 input/composition/focus/blur/resize 监听并写入测量样式。中文等输入法选词期间暂停测量，compositionend 后统一重算；不再使用时必须 destroy。'},
      {name: 'TextareaAutosize.enabled', signature: 'boolean', default: 'true', description: '启停自动伸缩；关闭时恢复控制器创建前的行内高度。'},
      {name: 'TextareaAutosize.minRows / maxRows', signature: 'number | undefined', description: '按克隆 textarea 测得的单行高度设置最小/最大高度；小于 1 或非有限数视为未设置。'},
      {name: 'TextareaAutosize.resizeToFitContent', signature: 'resizeToFitContent(force?: boolean): void', default: 'force = false', description: '按内容和 placeholder 的较大高度调整；force=true 忽略内容缓存。'},
      {name: 'TextareaAutosize.reset / destroy', signature: 'reset(): void; destroy(): void', description: 'reset 仅恢复初始高度；destroy 还会取消任务、移除监听器并恢复 rows/min/max 样式。'},
      {name: 'useTextareaAutosize', signature: 'useTextareaAutosize(target: Ref<HTMLTextAreaElement | null>, options?): UseTextareaAutosizeReturn', description: 'Composition API：响应 enabled/minRows/maxRows/placeholder，并随 effect scope 自动清理。'},
      {name: 'vTextareaAutosize', signature: 'Directive<HTMLTextAreaElement, boolean | TextareaAutosizeDirectiveOptions>', description: '模板指令 v-textarea-autosize；对象绑定支持 enabled、minRows、maxRows、placeholder、onReady。'},
    ],
  },
  {
    title: '自动填充监控',
    rows: [
      {name: 'AutofillEvent', signature: '{target: Element; isAutofilled: boolean}', description: '自动填充状态事件，与 Angular CDK 同名类型对齐。'},
      {name: 'AutofillMonitor', signature: 'class AutofillMonitor', description: '通过 :-webkit-autofill CSS animation 探针监控元素；同一实例内同一元素共享原生监听器。'},
      {name: 'AutofillMonitor.monitor', signature: 'monitor(element: Element): AutofillStream', description: '返回支持 subscribe(function | observer) 的轻量事件流；订阅者负责 unsubscribe，或调用 stopMonitoring 完成该元素全部流。'},
      {name: 'AutofillMonitor.stopMonitoring / destroy', signature: 'stopMonitoring(element): void; destroy(): void', description: '移除监听器与 cdk-text-field-autofill-* 状态类；destroy 清理实例内所有元素。'},
      {name: 'autofillMonitor', signature: 'const autofillMonitor: AutofillMonitor', description: '模块级默认单例。'},
      {name: 'useAutofill', signature: 'useAutofill(target: Ref<Element | null>, options?): UseAutofillReturn', description: '提供只读 isAutofilled/event refs 与 stop()；目标变化或作用域销毁时自动清理。'},
      {name: 'useAutofillMonitor / provideAutofillMonitor', signature: 'useAutofillMonitor(): AutofillMonitor; provideAutofillMonitor(instance?): AutofillMonitor', description: 'Vue inject/provide 入口；未提供实例时回退默认单例，内部创建的实例随作用域销毁。'},
      {name: 'CDK_AUTOFILL_MONITOR', signature: 'InjectionKey<AutofillMonitor>', description: '应用级替换自动填充服务的注入键。'},
      {name: 'vAutofill', signature: 'Directive<HTMLElement, (event: AutofillEvent) => void>', description: '模板指令 v-autofill；自动管理监控生命周期，并把状态事件传给最新绑定回调。'},
    ],
  },
  {
    title: '样式与兼容性',
    rows: [
      {name: 'injectTextFieldStyles', signature: 'injectTextFieldStyles(): void', description: '幂等注入测量结构样式与自动填充探针；所有控制器和监控服务会自动调用。SSR 下为空操作。'},
      {name: 'vcdkTextFieldStyles', signature: 'string', description: '结构样式源码，供 CSP nonce 或自定义注入流程使用。'},
      {name: 'vue-cdk/text-field/style.css', signature: 'CSS 子路径', description: '不使用运行时注入时可显式引入的预构建样式。'},
      {name: 'vue-cdk/text-field/index', signature: 'Sass @use 入口', description: '提供 text-field-autosize、text-field-autofill、text-field-autofill-color 与 text-field mixin。'},
    ],
  },
];
