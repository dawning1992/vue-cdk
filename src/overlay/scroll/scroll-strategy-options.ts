import {createBlockScrollStrategy} from './block-scroll-strategy';
import {
  createCloseScrollStrategy,
  type CloseScrollStrategyConfig,
} from './close-scroll-strategy';
import {createNoopScrollStrategy} from './noop-scroll-strategy';
import {
  createRepositionScrollStrategy,
  type RepositionScrollStrategyConfig,
} from './reposition-scroll-strategy';

/**
 * 滚动策略工厂集合，对应 Angular 的 ScrollStrategyOptions：
 * `useOverlay().scrollStrategies.close()/block()/reposition()/noop()`。
 */
export const scrollStrategies = {
  /** 滚动时不采取任何动作。 */
  noop: () => createNoopScrollStrategy(),
  /** 用户滚动即关闭（可配置阈值）。 */
  close: (config?: CloseScrollStrategyConfig) => createCloseScrollStrategy(config),
  /** 阻止页面滚动。 */
  block: () => createBlockScrollStrategy(),
  /** 滚动时重新定位（可配置节流与自动关闭）。 */
  reposition: (config?: RepositionScrollStrategyConfig) =>
    createRepositionScrollStrategy(config),
};
