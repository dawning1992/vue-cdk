import {
  computed,
  inject,
  onBeforeUnmount,
  provide,
  ref,
  toValue,
  watch,
  type ComputedRef,
  type MaybeRefOrGetter,
  type Ref,
} from 'vue';
import {CDK_ACCORDION} from './accordion';

let nextAccordionItemId = 0;

/** useAccordionItem 在状态变化时调用的事件适配器。 */
export interface AccordionItemEmitters {
  expandedChange?(expanded: boolean): void;
  opened?(): void;
  closed?(): void;
  destroyed?(): void;
}

/** useAccordionItem 的创建参数。 */
export interface UseAccordionItemOptions {
  /** 外部展开状态；传入 Ref 时会被双向更新，缺省为内部状态 false。 */
  expanded?: Ref<boolean>;
  /** 是否禁用命令式及父级批量操作；直接修改 expanded Ref 仍会同步状态。 */
  disabled?: MaybeRefOrGetter<boolean>;
  /** 自定义唯一标识；缺省时生成 `cdk-accordion-child-N`。 */
  id?: string;
  /** 状态与生命周期事件回调。 */
  emit?: AccordionItemEmitters;
}

/** AccordionItem 的公共实例 API。 */
export interface CdkAccordionItemPublicApi {
  /** 子项唯一标识。 */
  readonly id: string;
  /** 当前展开状态。 */
  readonly expanded: Ref<boolean>;
  /** 当前禁用状态。 */
  readonly disabled: ComputedRef<boolean>;
  /** 直接设置展开状态；与修改 Angular expanded 输入属性语义一致。 */
  setExpanded(expanded: boolean): void;
  /** 在未禁用时切换展开状态。 */
  toggle(): void;
  /** 在未禁用时展开。 */
  open(): void;
  /** 在未禁用时收起。 */
  close(): void;
}

/**
 * 创建 AccordionItem 状态并注册到最近的 Accordion。
 *
 * 必须在组件 setup 阶段调用。函数会安装卸载清理，并提供空 Accordion 注入边界，
 * 因此调用它的组件内部若直接嵌套另一个 item，内层不会越级加入同一选择组。
 */
export function useAccordionItem(options: UseAccordionItemOptions = {}): CdkAccordionItemPublicApi {
  const accordion = inject(CDK_ACCORDION, null);
  provide(CDK_ACCORDION, null);

  const id = options.id || `cdk-accordion-child-${nextAccordionItemId++}`;
  const expanded = options.expanded ?? ref(false);
  const disabled = computed(() => Boolean(toValue(options.disabled ?? false)));
  let destroyed = false;

  function setExpanded(value: boolean): void {
    if (expanded.value === value) return;
    expanded.value = value;
  }

  const unregister = accordion?.register({
    id,
    get disabled() {
      return disabled.value;
    },
    get expanded() {
      return expanded.value;
    },
    setExpanded,
  });

  // 同步监听确保打开新项时，单选组内其他项在本次调用返回前已关闭；
  // 同时支持调用方直接修改传入的 expanded Ref，而不绕过组协调与事件。
  watch(
    expanded,
    value => {
      options.emit?.expandedChange?.(value);
      if (value) {
        options.emit?.opened?.();
        accordion?.notifyOpen(id);
      } else {
        options.emit?.closed?.();
      }
    },
    {flush: 'sync'},
  );

  if (expanded.value) accordion?.notifyOpen(id);

  function toggle(): void {
    if (!disabled.value) setExpanded(!expanded.value);
  }

  function open(): void {
    if (!disabled.value) setExpanded(true);
  }

  function close(): void {
    if (!disabled.value) setExpanded(false);
  }

  onBeforeUnmount(() => {
    if (destroyed) return;
    destroyed = true;
    unregister?.();
    options.emit?.destroyed?.();
  });

  return {id, expanded, disabled, setExpanded, toggle, open, close};
}
