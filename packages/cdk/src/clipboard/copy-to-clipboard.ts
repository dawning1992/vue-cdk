import {
  isRef,
  provide,
  unref,
  type ComponentPublicInstance,
  type Directive,
  type InjectionKey,
  type Ref,
} from 'vue';
import {clipboard} from './clipboard';
import type {PendingCopy} from './pending-copy';

/** 复制指令的全局默认配置，对应 Angular 的 CdkCopyToClipboardConfig。 */
export interface CdkCopyToClipboardConfig {
  /** 默认复制重试次数；未在绑定中显式指定时生效，上限 50。 */
  attempts?: number;
}

/**
 * 复制指令默认配置注入键，对应 Angular 的 CDK_COPY_TO_CLIPBOARD_CONFIG。
 * App 级：`app.provide(CDK_COPY_TO_CLIPBOARD_CONFIG, {attempts: 3})`；
 * 组件级：setup 中调用 provideCopyToClipboardConfig。
 */
export const CDK_COPY_TO_CLIPBOARD_CONFIG: InjectionKey<CdkCopyToClipboardConfig> = Symbol(
  'vcdk-copy-to-clipboard-config',
);

/**
 * 在组件 setup 中提供复制指令的默认配置（provide 通道）。
 * 仅可在 setup 阶段调用；App 级默认值请用 app.provide 注入同一键。
 */
export function provideCopyToClipboardConfig(config: CdkCopyToClipboardConfig): void {
  provide(CDK_COPY_TO_CLIPBOARD_CONFIG, config);
}

/** 复制指令的绑定参数（对象写法）。 */
export interface CopyToClipboardOptions {
  /** 要复制的文本；支持 Ref，点击时解包最新值。 */
  text: string | Ref<string>;
  /** 复制重试次数，默认 1，上限 50；长文本可加大以等待 textarea 重排完成。 */
  attempts?: number;
  /** 复制结束（成功或最终失败）后的回调，参数表示是否复制成功。 */
  onCopied?: (successful: boolean) => void;
}

/** 复制指令绑定值：字符串简写、Ref 或完整参数对象。 */
export type CopyToClipboardValue = string | Ref<string> | CopyToClipboardOptions;

const COPY_TO_CLIPBOARD_STATE = Symbol('vcdk-copy-to-clipboard');

interface CopyToClipboardState {
  /** 最新绑定值；点击时读取，保证响应式更新后复制新内容。 */
  value: CopyToClipboardValue | undefined;
  /** 从 provides 链解析出的默认重试次数（无配置时为 undefined）。 */
  defaultAttempts: number | undefined;
  /** 正在重试的 PendingCopy 集合，卸载时统一销毁。 */
  pending: Set<PendingCopy>;
  /** 当前重试定时器；卸载时清除，防止卸载后继续尝试。 */
  timeout: ReturnType<typeof setTimeout> | null;
  /** 指令是否已销毁；销毁后不再发起或继续重试。 */
  destroyed: boolean;
}

type CopyToClipboardElement = HTMLElement & {[COPY_TO_CLIPBOARD_STATE]?: CopyToClipboardState};

/**
 * 内部组件实例上 provides 链的形状（Vue 公共类型未暴露该字段）。
 * provides 以 Object.create 原型链向上连接父级，最终指向 appContext.provides。
 */
interface InternalInstanceWithProvides {
  parent: InternalInstanceWithProvides | null;
  appContext: {provides: Record<string | symbol, unknown>};
  provides: Record<string | symbol, unknown>;
}

/** 解析绑定值为待复制的文本；对象形式下 text 同样支持 Ref。 */
function resolveText(value: CopyToClipboardValue | undefined): string {
  if (typeof value === 'string' || isRef(value)) {
    return unref(value);
  }
  return unref(value?.text ?? '');
}

/** 解析本次复制的重试次数：显式 attempts 优先，其次 provides 默认值，最后 1。 */
function resolveAttempts(
  value: CopyToClipboardValue | undefined,
  defaultAttempts: number | undefined,
): number {
  const explicit = typeof value === 'string' || isRef(value) ? undefined : value?.attempts;
  return Math.min(explicit ?? defaultAttempts ?? 1, 50);
}

/** 解析复制结束回调；字符串/Ref 简写形式没有回调。 */
function resolveOnCopied(
  value: CopyToClipboardValue | undefined,
): ((successful: boolean) => void) | undefined {
  return typeof value === 'string' || isRef(value) ? undefined : value?.onCopied;
}

/**
 * 从指令所属组件实例解析全局默认配置。
 *
 * 复刻 Vue inject 的查找规则：从父实例 provides 开始沿原型链向上，
 * 可命中组件级 provide 与 App 级 app.provide（根组件 provides 即
 * appContext.provides，二者共享同一原型链）。
 */
function readDefaultAttempts(
  instance: ComponentPublicInstance | Record<string, any> | null,
): number | undefined {
  // 非组件场景（Record 形状）没有实例句柄，直接视为无默认配置。
  const internal = (instance as ComponentPublicInstance | null)?.$ as
    | InternalInstanceWithProvides
    | undefined;
  if (!internal) {
    return undefined;
  }

  const provides = internal.parent ? internal.parent.provides : internal.appContext.provides;
  const config =
    provides && CDK_COPY_TO_CLIPBOARD_CONFIG in provides
      ? (provides[CDK_COPY_TO_CLIPBOARD_CONFIG] as CdkCopyToClipboardConfig | undefined)
      : undefined;

  return config?.attempts;
}

/**
 * 点击复制：attempts 大于 1 时先 beginCopy 预加载 textarea，再以 1ms 间隔
 * 重试直到成功或次数耗尽，与 Angular CdkCopyToClipboard 行为一致。
 */
function onClick(this: HTMLElement): void {
  const element = this as CopyToClipboardElement;
  const state = element[COPY_TO_CLIPBOARD_STATE];
  if (!state || state.destroyed) {
    return;
  }

  const attempts = resolveAttempts(state.value, state.defaultAttempts);
  const onCopied = resolveOnCopied(state.value);

  if (attempts > 1) {
    let remainingAttempts = attempts;
    const pending = clipboard.beginCopy(resolveText(state.value));
    state.pending.add(pending);

    const attempt = (): void => {
      const successful = pending.copy();
      if (!successful && --remainingAttempts && !state.destroyed) {
        // 1ms 间隔与 Angular 一致，便于测试稳定推进重试。
        state.timeout = setTimeout(attempt, 1);
      } else {
        state.timeout = null;
        state.pending.delete(pending);
        pending.destroy();
        onCopied?.(successful);
      }
    };
    attempt();
  } else {
    // 先复制再回调：可选调用 `onCopied?.(...)` 会短路参数求值，
    // 字符串简写（无回调）时必须显式先执行复制。
    const successful = clipboard.copy(resolveText(state.value));
    onCopied?.(successful);
  }
}

/**
 * 复制指令，对应 Angular 的 cdkCopyToClipboard。
 *
 * 用法：
 * ```vue
 * <button v-copy-to-clipboard="text">复制</button>
 * <button v-copy-to-clipboard="{text, attempts: 3, onCopied}">复制</button>
 * ```
 * 需自行注册：`app.directive('copy-to-clipboard', vCopyToClipboard)`。
 * 长文本建议加大 attempts，浏览器需要时间填充中间 textarea 再执行复制。
 */
export const vCopyToClipboard: Directive<HTMLElement, CopyToClipboardValue | undefined> = {
  mounted(el, binding) {
    const element = el as CopyToClipboardElement;
    element[COPY_TO_CLIPBOARD_STATE] = {
      value: binding.value,
      defaultAttempts: readDefaultAttempts(binding.instance),
      pending: new Set(),
      timeout: null,
      destroyed: false,
    };
    element.addEventListener('click', onClick);
  },
  updated(el, binding) {
    const element = el as CopyToClipboardElement;
    const state = element[COPY_TO_CLIPBOARD_STATE];
    if (state) {
      state.value = binding.value;
      state.defaultAttempts = readDefaultAttempts(binding.instance);
    }
  },
  unmounted(el) {
    const element = el as CopyToClipboardElement;
    const state = element[COPY_TO_CLIPBOARD_STATE];
    if (!state) {
      return;
    }

    element.removeEventListener('click', onClick);
    state.destroyed = true;
    if (state.timeout) {
      clearTimeout(state.timeout);
      state.timeout = null;
    }
    state.pending.forEach(pending => pending.destroy());
    state.pending.clear();
    delete element[COPY_TO_CLIPBOARD_STATE];
  },
};
