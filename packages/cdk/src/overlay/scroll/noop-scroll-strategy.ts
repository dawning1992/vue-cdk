import type {ScrollStrategy} from './scroll-strategy';

/** 不做任何处理的滚动策略（默认值）。 */
export class NoopScrollStrategy implements ScrollStrategy {
  enable(): void {}
  disable(): void {}
  attach(): void {}
}

/** 创建 noop 滚动策略。 */
export function createNoopScrollStrategy(): NoopScrollStrategy {
  return new NoopScrollStrategy();
}
