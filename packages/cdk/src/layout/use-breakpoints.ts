import {onScopeDispose, readonly, ref, shallowRef, type DeepReadonly, type Ref} from 'vue';
import {breakpointObserver, type BreakpointObserver, type BreakpointState} from './breakpoint-observer';

/** `useBreakpoints` 返回的响应式状态与显式停止句柄。 */
export interface UseBreakpointsReturn {
  readonly matches: Readonly<Ref<boolean>>;
  readonly breakpoints: DeepReadonly<Ref<Record<string, boolean>>>;
  readonly state: DeepReadonly<Ref<BreakpointState>>;
  stop(): void;
}

/**
 * 将 BreakpointObserver 事件流桥接为 Vue refs。
 * 在组件 setup 或 effectScope 中调用会随作用域自动退订；作用域外调用时必须执行 `stop()`。
 */
export function useBreakpoints(
  value: string | readonly string[],
  observer: BreakpointObserver = breakpointObserver,
): UseBreakpointsReturn {
  const state = shallowRef<BreakpointState>({matches: false, breakpoints: {}});
  const matches = ref(false);
  const breakpoints = shallowRef<Record<string, boolean>>({});
  const subscription = observer.observe(value).subscribe(next => {
    state.value = next;
    matches.value = next.matches;
    breakpoints.value = next.breakpoints;
  });
  const stop = () => subscription.unsubscribe();
  onScopeDispose(stop, true);
  return {
    matches: readonly(matches),
    breakpoints: readonly(breakpoints),
    state: readonly(state),
    stop,
  };
}

