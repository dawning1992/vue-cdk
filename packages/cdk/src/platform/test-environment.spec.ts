import {describe, expect, it, vi} from 'vitest';
import {isTestEnvironment} from './test-environment';

describe('isTestEnvironment', () => {
  it('Vitest 环境下默认返回 false', () => {
    expect(isTestEnvironment()).toBe(false);
  });

  it.each(['__karma__', 'jasmine', 'jest', 'Mocha'] as const)(
    '检测到 %s 全局标记时返回 true',
    name => {
      vi.stubGlobal(name, {});
      expect(isTestEnvironment()).toBe(true);
      vi.unstubAllGlobals();
    },
  );
});
