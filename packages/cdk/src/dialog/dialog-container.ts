import {
  Fragment,
  defineComponent,
  h,
  isVNode,
  nextTick,
  onBeforeUnmount,
  onMounted,
  provide,
  ref,
  type Ref,
  type VNode,
} from 'vue';
import {DialogConfig, type DialogContainerInstance, type DialogContent} from './dialog-config';
import {DIALOG_DATA, DIALOG_REF} from './dialog-injectors';
import {useFocusTrap} from '../a11y/focus-trap/use-focus-trap';
import {InteractivityChecker} from '../a11y/focus-trap/interactivity-checker';
import {focusMonitor} from '../a11y/focus-monitor/focus-monitor';
import {getFocusedElementPierceShadowDom} from '../platform';
import type {DialogRef} from './dialog-ref';

/** 容器组件接收的 props 契约（服务打开对话框时统一注入）。 */
export interface VDialogContainerProps {
  /** 打开对话框的配置。 */
  config: DialogConfig;
  /** 当前对话框引用。 */
  dialogRef: DialogRef;
  /** 对话框内容（组件 / 渲染函数 / VNode）。 */
  content: DialogContent;
  /** 容器实例就绪回调；服务据此绑定 DialogRef.containerInstance。 */
  onContainerReady?: (instance: DialogContainerInstance) => void;
}

/**
 * 把对话框内容归一化为单根 VNode。
 *
 * - 渲染函数：以上下文（`$implicit`=data、`dialogRef`，合并 `templateContext`）为参数调用；
 * - VNode：原样返回；
 * - 组件：通过 `contentProps` 透传 props，并捕获组件实例供 DialogRef.componentInstance 使用。
 *   注意：函数类型一律按渲染函数处理，因此函数式组件请改用 `defineComponent` 包装。
 */
export function normalizeDialogContent(
  content: DialogContent,
  config: DialogConfig,
  dialogRef: DialogRef,
  onComponentInstance?: (instance: unknown) => void,
): VNode {
  if (typeof content === 'function') {
    const renderFn = content as (
      context: Record<string, unknown>,
    ) => VNode | VNode[] | null;
    const context: Record<string, unknown> = {
      $implicit: config.data,
      dialogRef,
      ...(typeof config.templateContext === 'function'
        ? config.templateContext()
        : config.templateContext ?? {}),
    };
    const result = renderFn(context);
    return Array.isArray(result) ? h(Fragment, null, result) : result ?? h(Fragment);
  }
  if (isVNode(content)) {
    return content;
  }
  // ref 由 Vue 从 props 中提取为 vnode 属性，不会作为 prop 传给内容组件。
  return h(content, {...(config.contentProps ?? {}), ref: onComponentInstance});
}

/**
 * 对话框容器行为组合式函数：供默认容器与自定义容器复用。
 *
 * 负责的能力：
 * - 通过 provide 暴露 DIALOG_DATA / DIALOG_REF（内容组件的注入通道）；
 * - 创建焦点陷阱，并按 `autoFocus` 配置在内容挂载后移动焦点；
 * - 记录打开前的聚焦元素，按 `restoreFocus` 配置在卸载时恢复焦点；
 * - 构造容器实例（_closeInteractionType / _recaptureFocus / element /
 *   contentComponentInstance）并经 onContainerReady 交给服务。
 *
 * 约定：须在组件 setup 中调用；容器模板需把返回的 `containerEl` ref 绑定到
 * 根元素，并自行渲染 `props.content`（推荐使用 `normalizeDialogContent`）。
 */
export function useDialogContainerCore(props: VDialogContainerProps): {
  containerEl: Ref<HTMLElement | null>;
  instance: DialogContainerInstance;
  trapFocus(options?: FocusOptions): void;
  restoreFocus(): void;
  captureContentRef(instance: unknown): void;
} {
  const config = props.config;
  const containerEl = ref<HTMLElement | null>(null);
  const checker = new InteractivityChecker();
  let destroyed = false;
  let contentComponentInstance: unknown = null;

  // 打开前的聚焦元素，关闭时据此恢复焦点。
  const elementFocusedBeforeDialogWasOpened = getFocusedElementPierceShadowDom();

  // 注入通道：内容组件可通过 useDialogData / useDialogRef 读取数据与引用。
  provide(DIALOG_DATA, config.data);
  provide(DIALOG_REF, props.dialogRef);

  // autoCapture 关闭：焦点捕获与恢复由本组合式函数按 autoFocus / restoreFocus 定制。
  const {focusInitial} = useFocusTrap(containerEl, {});

  /** 焦点是否仍在对话框内。 */
  function containsFocus(): boolean {
    const element = containerEl.value;
    const activeElement = getFocusedElementPierceShadowDom();
    return !!element && (activeElement === element || element.contains(activeElement));
  }

  /**
   * 强制聚焦指定元素：不可聚焦时临时添加 tabindex=-1，
   * 焦点移出或用户点击后移除，避免改变后续 Tab 顺序。
   */
  function forceFocus(element: HTMLElement, options?: FocusOptions): void {
    if (!checker.isFocusable(element)) {
      element.tabIndex = -1;
      const cleanup = () => {
        element.removeEventListener('blur', cleanup);
        element.removeEventListener('mousedown', cleanup);
        element.removeAttribute('tabindex');
      };
      element.addEventListener('blur', cleanup);
      element.addEventListener('mousedown', cleanup);
    }
    element.focus(options);
  }

  /** 聚焦对话框内第一个匹配选择器的元素。 */
  function focusByCssSelector(selector: string, options?: FocusOptions): void {
    const element = containerEl.value?.querySelector(selector) as HTMLElement | null;
    if (element) {
      forceFocus(element, options);
    }
  }

  /** 按 autoFocus 配置移动焦点到对话框内（与 Angular CdkDialogContainer 语义一致）。 */
  function trapFocus(options?: FocusOptions): void {
    if (destroyed) {
      return;
    }
    const element = containerEl.value;
    if (!element) {
      return;
    }
    switch (config.autoFocus) {
      case false:
      case 'dialog':
        // 焦点不在对话框内时聚焦根元素；使用方可能已自行移动焦点，因此不强制。
        if (!containsFocus()) {
          element.focus(options);
        }
        break;
      case true:
      case 'first-tabbable': {
        const focusedSuccessfully = focusInitial(options);
        // 找不到可 Tab 元素时回退到对话框根元素。
        if (!focusedSuccessfully) {
          element.focus(options);
        }
        break;
      }
      case 'first-heading':
        focusByCssSelector('h1, h2, h3, h4, h5, h6, [role="heading"]', options);
        break;
      default:
        focusByCssSelector(config.autoFocus as string, options);
        break;
    }
  }

  /** 按 restoreFocus 配置恢复焦点到目标元素。 */
  function restoreFocus(): void {
    const focusConfig = config.restoreFocus;
    let focusTargetElement: HTMLElement | null = null;

    if (typeof focusConfig === 'string') {
      focusTargetElement = document.querySelector(focusConfig);
    } else if (typeof focusConfig === 'boolean') {
      focusTargetElement = focusConfig ? elementFocusedBeforeDialogWasOpened : null;
    } else if (focusConfig) {
      focusTargetElement = focusConfig;
    }

    if (focusConfig && focusTargetElement && typeof focusTargetElement.focus === 'function') {
      const activeElement = getFocusedElementPierceShadowDom();
      const element = containerEl.value;
      // 仅当焦点仍在对话框内（或已回到 body）时才恢复，避免覆盖使用方自行移动的焦点。
      if (
        !activeElement ||
        activeElement === document.body ||
        (element && (activeElement === element || element.contains(activeElement)))
      ) {
        focusMonitor.focusVia(focusTargetElement, instance._closeInteractionType);
        instance._closeInteractionType = null;
      }
    }
  }

  /** 容器实例：暴露给 DialogRef 的最小能力集。 */
  const instance: DialogContainerInstance = {
    _closeInteractionType: null,
    _recaptureFocus: () => {
      if (!containsFocus()) {
        trapFocus();
      }
    },
    get element() {
      return containerEl.value;
    },
    get contentComponentInstance() {
      return contentComponentInstance;
    },
  };

  // 同步回调，保证服务在 attach 返回后即可读取容器实例。
  props.onContainerReady?.(instance);

  // 内容渲染完成后（含子组件挂载）再执行自动聚焦。
  onMounted(() => {
    void nextTick(() => trapFocus());
  });

  onBeforeUnmount(() => {
    destroyed = true;
    restoreFocus();
  });

  return {
    containerEl,
    instance,
    trapFocus,
    restoreFocus,
    captureContentRef: (componentInstance: unknown) => {
      contentComponentInstance = componentInstance;
    },
  };
}

/**
 * 默认对话框容器：负责对话框根元素的 ARIA 属性、焦点陷阱与内容渲染。
 * 服务默认使用本容器；自定义容器可复用 `useDialogContainerCore` 获得相同行为。
 */
export const VDialogContainer = defineComponent({
  name: 'VDialogContainer',
  props: {
    config: {type: Object, required: true},
    dialogRef: {type: Object, required: true},
    content: {type: [Object, Function], required: true},
    onContainerReady: {type: Function},
  },
  setup(props) {
    const {containerEl, captureContentRef} = useDialogContainerCore(
      props as VDialogContainerProps,
    );

    return () => {
      const config = props.config as DialogConfig;
      // 配置了 ariaLabel 时不设置 aria-labelledby（两者互斥，与 Angular 一致）。
      const ariaLabelledBy = config.ariaLabel ? undefined : config.ariaLabelledBy || undefined;
      return h(
        'div',
        {
          ref: containerEl,
          class: 'vcdk-dialog-container',
          tabindex: -1,
          id: config.id || undefined,
          role: config.role,
          'aria-modal': config.ariaModal || undefined,
          'aria-label': config.ariaLabel || undefined,
          'aria-labelledby': ariaLabelledBy,
          'aria-describedby': config.ariaDescribedBy || undefined,
        },
        [
          normalizeDialogContent(
            props.content as DialogContent,
            config,
            props.dialogRef as DialogRef,
            captureContentRef,
          ),
        ],
      );
    };
  },
});
