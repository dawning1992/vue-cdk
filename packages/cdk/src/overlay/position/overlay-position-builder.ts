import {
  FlexibleConnectedPositionStrategy,
  type FlexibleConnectedPositionStrategyOrigin,
} from './flexible-connected-position-strategy';
import {GlobalPositionStrategy} from './global-position-strategy';

/**
 * 定位策略构建器：对应 Angular 的 OverlayPositionBuilder，
 * 通过 `useOverlay().position()` 获取。
 */
export class OverlayPositionBuilder {
  /** 创建全局定位策略（相对视口定位）。 */
  global(): GlobalPositionStrategy {
    return new GlobalPositionStrategy();
  }

  /** 创建连接定位策略（相对触发元素或坐标点定位）。 */
  flexibleConnectedTo(
    origin: FlexibleConnectedPositionStrategyOrigin,
  ): FlexibleConnectedPositionStrategy {
    return new FlexibleConnectedPositionStrategy(origin);
  }
}

/** 默认定位构建器单例。 */
export const overlayPositionBuilder = new OverlayPositionBuilder();
