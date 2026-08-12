/**
 * 移植自 Angular CDK a11y（https://github.com/angular/components，v22.1.1，MIT License）。
 * 原版权：Copyright Google LLC All Rights Reserved.
 */

/**
 * 可配置焦点陷阱的管理器，对应 Angular CDK 的 FocusTrapManager。
 *
 * 维护一个"后进先出"的陷阱栈：只有栈顶陷阱处于激活状态，
 * 注册新陷阱会先停用旧的栈顶陷阱。这样页面中嵌套的模态框
 * 同时只有一个能拦截焦点。
 */

/** 由 FocusTrapManager 管理的陷阱接口（由 ConfigurableFocusTrap 实现，避免循环依赖）。 */
export interface ManagedFocusTrap {
  _enable(): void;
  _disable(): void;
  focusInitialElementWhenReady(): Promise<boolean>;
}

export class FocusTrapManager {
  private _focusTrapStack: ManagedFocusTrap[] = [];

  /** 注册陷阱并使其成为栈顶（停用上一个栈顶陷阱）。 */
  register(focusTrap: ManagedFocusTrap): void {
    // 同一陷阱重复注册时先去重，避免栈内出现重复条目。
    this._focusTrapStack = this._focusTrapStack.filter(ft => ft !== focusTrap);

    const stack = this._focusTrapStack;

    if (stack.length) {
      stack[stack.length - 1]._disable();
    }

    stack.push(focusTrap);
    focusTrap._enable();
  }

  /** 注销陷阱，并重新激活新的栈顶陷阱（若存在）。 */
  deregister(focusTrap: ManagedFocusTrap): void {
    focusTrap._disable();

    const stack = this._focusTrapStack;
    const index = stack.indexOf(focusTrap);

    if (index !== -1) {
      stack.splice(index, 1);
      if (stack.length) {
        stack[stack.length - 1]._enable();
      }
    }
  }
}

/** 全局单例管理器。 */
export const focusTrapManager = new FocusTrapManager();
