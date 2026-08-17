import type {Directive} from 'vue';
import {autofillMonitor, type AutofillEvent, type AutofillSubscription} from './autofill';

/** v-autofill 的事件回调；自动填充开始与结束时各调用一次。 */
export type AutofillDirectiveValue = ((event: AutofillEvent) => void) | undefined;

const STATE = Symbol('vcdk-autofill');
interface AutofillDirectiveState {
  callback: AutofillDirectiveValue;
  subscription: AutofillSubscription;
}
type AutofillElement = HTMLElement & {[STATE]?: AutofillDirectiveState};

/**
 * 自动填充监控指令，对应 Angular cdkAutofill。
 * 模板用法：`<input v-autofill="onAutofill" />`；卸载时自动停止监控。
 */
export const vAutofill: Directive<HTMLElement, AutofillDirectiveValue> = {
  mounted(el, binding) {
    const state: AutofillDirectiveState = {
      callback: binding.value,
      subscription: autofillMonitor.monitor(el).subscribe(event => state.callback?.(event)),
    };
    (el as AutofillElement)[STATE] = state;
  },
  updated(el, binding) {
    const state = (el as AutofillElement)[STATE];
    if (state) state.callback = binding.value;
  },
  unmounted(el) {
    const element = el as AutofillElement;
    element[STATE]?.subscription.unsubscribe();
    autofillMonitor.stopMonitoring(el);
    delete element[STATE];
  },
};
