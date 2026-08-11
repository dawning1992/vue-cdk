/**
 * 移植自 Angular CDK a11y（https://github.com/angular/components，v22.1.1，MIT License）。
 * 原版权：Copyright Google LLC All Rights Reserved.
 */

/**
 * ConfigurableFocusTrap 的创建配置。
 */
export interface ConfigurableFocusTrapConfig {
  /** 是否延迟锚点创建，由调用方稍后手动 attachAnchors。 */
  defer: boolean;
}
