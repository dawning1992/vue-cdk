/**
 * portal 模块：可编程的 UI 内容挂载系统（移植自 Angular CDK portal）。
 *
 * 内容源（Portal）有三种形态：组件（ComponentPortal）、模板/渲染函数
 * （TemplatePortal）与原生 DOM（DomPortal）；出口（PortalOutlet）统一承载
 * 并管理内容生命周期。overlay/dialog 等上层能力可基于它构建。
 */
export {
  Portal,
  ComponentPortal,
  TemplatePortal,
  DomPortal,
  BasePortalOutlet,
  type TemplateRenderFn,
  type ComponentPortalOptions,
  type PortalOutlet,
} from './portal';
export {
  DomPortalOutlet,
  type DomPortalOutletOptions,
} from './dom-portal-outlet';
export {VPortal, VPortalOutlet} from './v-portal';
