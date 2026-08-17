/**
 * 移植自 Angular CDK bidi（https://github.com/angular/components，MIT License）。
 * 原版权：Copyright Google LLC All Rights Reserved.
 * Vue 版本使用 Ref 与 Emitter 替代 Angular Signal 与 EventEmitter。
 */
import {
  getCurrentInstance,
  inject,
  onScopeDispose,
  provide,
  readonly,
  ref,
  toValue,
  watch,
  type InjectionKey,
  type MaybeRefOrGetter,
  type Ref,
} from 'vue';
import {Emitter} from '../emitter/emitter';

/** 页面布局方向。 */
export type Direction = 'ltr' | 'rtl';

/** 可由调用方输入的方向；auto 按浏览器语言解析。 */
export type DirectionInput = Direction | 'auto';

/** 匹配使用 RTL 书写系统的 locale，规则与 Angular CDK bidi 保持一致。 */
const RTL_LOCALE_PATTERN =
  /^(ar|ckb|dv|he|iw|fa|nqo|ps|sd|ug|ur|yi|.*[-_](Adlm|Arab|Hebr|Nkoo|Rohg|Thaa))(?!.*[-_](Latn|Cyrl)($|-|_))($|-|_)/i;

/**
 * 将外部方向值归一化为 ltr 或 rtl。
 *
 * auto 仅根据浏览器语言判断，不扫描元素文本；缺少 navigator、空值和非法值均返回 ltr。
 */
export function resolveDirectionality(
  rawValue: string | null | undefined,
  navigatorLanguage?: string | null,
): Direction {
  const value = rawValue?.toLowerCase() ?? '';
  const language =
    navigatorLanguage === undefined
      ? typeof navigator === 'undefined'
        ? null
        : navigator.language
      : navigatorLanguage;

  if (value === 'auto' && language) {
    return RTL_LOCALE_PATTERN.test(language) ? 'rtl' : 'ltr';
  }
  return value === 'rtl' ? 'rtl' : 'ltr';
}

/** 用于覆盖 Directionality 所读取 document 的 Vue 注入键，SSR 可提供 null。 */
export const DIR_DOCUMENT: InjectionKey<Document | null> = Symbol('vcdk-dir-document');

/** 最近方向上下文的 Vue 注入键。 */
export const CDK_DIRECTIONALITY: InjectionKey<Directionality> = Symbol('vcdk-directionality');

/**
 * LTR/RTL 方向上下文，对应 Angular CDK Directionality。
 *
 * valueSignal 是只读 Ref；方向真实变化时 change 同步发射。destroy() 完成事件流，
 * 销毁后不再接受更新。类本身不监听 document 属性变化，动态方向应由 VDir 或
 * provideDirectionality 提供响应式输入。
 */
export class Directionality {
  private readonly _value = ref<Direction>('ltr');
  private _destroyed = false;

  /** 当前归一化方向。 */
  get value(): Direction {
    return this._value.value;
  }

  /** 当前归一化方向的只读响应式引用。 */
  readonly valueSignal: Readonly<Ref<Direction>> = readonly(this._value);

  /** 方向真实变化时同步发射的事件流。 */
  readonly change = new Emitter<Direction>();

  /**
   * 创建方向上下文。
   * @param documentRef 用于读取初始方向的 document；未传时安全读取全局 document。
   * @param initialValue 显式初始值；提供后不再读取 document。
   */
  constructor(
    documentRef: Document | null = typeof document === 'undefined' ? null : document,
    initialValue?: string | null,
  ) {
    const rawValue =
      initialValue ?? (documentRef?.body?.dir || documentRef?.documentElement?.dir || 'ltr');
    this._value.value = resolveDirectionality(rawValue);
  }

  /** 更新方向；归一化结果未变化或实例已销毁时不发射事件。 */
  setDirection(value: string | null | undefined): void {
    if (this._destroyed) return;
    const next = resolveDirectionality(value);
    if (next === this._value.value) return;
    this._value.value = next;
    this.change.next(next);
  }

  /** 完成变更流并禁止后续更新；可重复调用。 */
  destroy(): void {
    if (this._destroyed) return;
    this._destroyed = true;
    this.change.complete();
  }
}

/**
 * 在当前 setup 作用域提供响应式方向上下文。
 * 输入可为普通值、Ref、computed 或 getter；组件/EffectScope 销毁时自动清理。
 */
export function provideDirectionality(
  direction: MaybeRefOrGetter<string | null | undefined>,
): Directionality {
  const context = new Directionality(null, toValue(direction));
  provide(CDK_DIRECTIONALITY, context);
  const stop = watch(
    () => toValue(direction),
    value => context.setDirection(value),
    {flush: 'sync'},
  );
  onScopeDispose(() => {
    stop();
    context.destroy();
  });
  return context;
}

/**
 * 注入最近方向上下文；没有局部提供者时根据注入的 document 创建当前组件级回退上下文。
 * 必须在 Vue setup 或可注入的组合式作用域中调用。
 */
export function useDirectionality(): Directionality {
  if (!getCurrentInstance()) {
    throw new Error('useDirectionality() 必须在 Vue 组件 setup() 中调用。');
  }
  const provided = inject(CDK_DIRECTIONALITY, null);
  if (provided) return provided;

  const documentRef = inject(
    DIR_DOCUMENT,
    typeof document === 'undefined' ? null : document,
  );
  const context = new Directionality(documentRef);
  onScopeDispose(() => context.destroy());
  return context;
}

/**
 * 解析元素当前所处方向，供需要在 DOM 事件或测量时取得即时方向的 CDK 模块使用。
 * 优先读取最近祖先 dir，再读取 body、html；支持大小写和 auto，SSR 回退 ltr。
 */
export function getDirection(element?: HTMLElement | null): Direction {
  const ownerDocument = element?.ownerDocument ?? (typeof document === 'undefined' ? null : document);
  const localDir = element?.closest?.('[dir]')?.getAttribute('dir');
  const rawValue = localDir || ownerDocument?.body?.dir || ownerDocument?.documentElement?.dir || 'ltr';
  return resolveDirectionality(rawValue);
}
