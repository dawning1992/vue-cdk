import {isRef, toValue, type Directive, type MaybeRefOrGetter} from 'vue';
import {TextareaAutosize} from './autosize';

/** v-textarea-autosize 的对象绑定参数。 */
export interface TextareaAutosizeDirectiveOptions {
  enabled?: MaybeRefOrGetter<boolean>;
  minRows?: MaybeRefOrGetter<number | undefined>;
  maxRows?: MaybeRefOrGetter<number | undefined>;
  placeholder?: MaybeRefOrGetter<string | undefined>;
  /** 控制器创建后调用一次；用于命令式 resizeToFitContent/reset。 */
  onReady?: (controller: TextareaAutosize) => void;
}

/** 指令绑定值：布尔值控制启停；对象形式可配置行数、placeholder 与控制器回调。 */
export type TextareaAutosizeDirectiveValue = boolean | TextareaAutosizeDirectiveOptions | undefined;

const STATE = Symbol('vcdk-textarea-autosize');
type AutosizeElement = HTMLTextAreaElement & {[STATE]?: TextareaAutosize};

function applyOptions(controller: TextareaAutosize, value: TextareaAutosizeDirectiveValue): void {
  if (typeof value === 'boolean') {
    controller.enabled = value;
    return;
  }
  controller.minRows = toValue(value?.minRows);
  controller.maxRows = toValue(value?.maxRows);
  if (value?.placeholder !== undefined) controller.setPlaceholder(toValue(value.placeholder));
  controller.enabled = Boolean(toValue(value?.enabled ?? true));
  controller.resizeToFitContent();
}

/**
 * textarea 自动伸缩指令，对应 Angular cdkTextareaAutosize。
 *
 * 模板用法：`<textarea v-textarea-autosize="{minRows: 2, maxRows: 8}" />`。
 * 指令仅接受原生 textarea，错误宿主会在挂载阶段抛出 TypeError。
 */
export const vTextareaAutosize: Directive<
  HTMLTextAreaElement,
  TextareaAutosizeDirectiveValue
> = {
  mounted(el, binding) {
    const controller = new TextareaAutosize(el);
    (el as AutosizeElement)[STATE] = controller;
    applyOptions(controller, binding.value);
    if (typeof binding.value === 'object' && !isRef(binding.value)) {
      binding.value?.onReady?.(controller);
    }
  },
  updated(el, binding) {
    const controller = (el as AutosizeElement)[STATE];
    if (controller) applyOptions(controller, binding.value);
  },
  unmounted(el) {
    const element = el as AutosizeElement;
    element[STATE]?.destroy();
    delete element[STATE];
  },
};
