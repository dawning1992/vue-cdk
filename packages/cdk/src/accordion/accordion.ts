import {
  computed,
  provide,
  toValue,
  type ComputedRef,
  type InjectionKey,
  type MaybeRefOrGetter,
} from 'vue';

let nextAccordionId = 0;

/** Accordion 子项向父级注册的最小控制契约。 */
export interface AccordionItemController {
  /** 子项唯一标识。 */
  readonly id: string;
  /** 子项当前是否禁用。 */
  readonly disabled: boolean;
  /** 子项当前是否展开。 */
  readonly expanded: boolean;
  /** 由父级批量操作或唯一选择协调更新展开状态。 */
  setExpanded(expanded: boolean): void;
}

/** Accordion 的公共实例 API，对应 Angular CdkAccordion 的公开能力。 */
export interface CdkAccordionPublicApi {
  /** 当前 accordion 的唯一标识，用于隔离不同选择组。 */
  readonly id: string;
  /** 是否允许多个子项同时展开。 */
  readonly multi: ComputedRef<boolean>;
  /** 多选模式下展开全部未禁用子项；单选模式下不执行任何操作。 */
  openAll(): void;
  /** 收起全部未禁用子项。 */
  closeAll(): void;
}

/** useAccordion 的创建参数。 */
export interface UseAccordionOptions {
  /** 是否允许多项展开；支持 Ref、computed 或 getter，默认 false。 */
  multi?: MaybeRefOrGetter<boolean>;
  /** 自定义唯一标识；缺省时生成 `cdk-accordion-N`。 */
  id?: string;
}

/** Accordion 内部上下文；注册方法仅供 CdkAccordionItem/useAccordionItem 使用。 */
export interface CdkAccordionContext extends CdkAccordionPublicApi {
  register(item: AccordionItemController): () => void;
  notifyOpen(itemId: string): void;
}

/**
 * 父级 Accordion 注入键。
 *
 * 值允许为 null，因为 AccordionItem 会提供空边界，防止其嵌套子项越级注册到外层组。
 */
export const CDK_ACCORDION: InjectionKey<CdkAccordionContext | null> = Symbol('CDK_ACCORDION');

/**
 * 创建并向当前组件后代提供 Accordion 协调上下文。
 *
 * 必须在组件 setup 阶段调用。返回值可用于自定义无包装组件，也可直接调用
 * openAll/closeAll。作用域销毁后，子项自身的卸载钩子会完成注销。
 */
export function useAccordion(options: UseAccordionOptions = {}): CdkAccordionContext {
  const id = options.id || `cdk-accordion-${nextAccordionId++}`;
  const multi = computed(() => Boolean(toValue(options.multi ?? false)));
  const items = new Map<string, AccordionItemController>();

  const context: CdkAccordionContext = {
    id,
    multi,
    register(item) {
      if (items.has(item.id)) {
        throw new Error(`CdkAccordion: 子项 id "${item.id}" 在同一 accordion 中重复。`);
      }
      items.set(item.id, item);
      return () => {
        if (items.get(item.id) === item) items.delete(item.id);
      };
    },
    notifyOpen(itemId) {
      if (multi.value) return;
      for (const item of items.values()) {
        if (item.id !== itemId) item.setExpanded(false);
      }
    },
    openAll() {
      if (!multi.value) return;
      for (const item of items.values()) {
        if (!item.disabled) item.setExpanded(true);
      }
    },
    closeAll() {
      for (const item of items.values()) {
        if (!item.disabled) item.setExpanded(false);
      }
    },
  };

  provide(CDK_ACCORDION, context);
  return context;
}

