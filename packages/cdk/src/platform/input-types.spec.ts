import {describe, expect, it, vi} from 'vitest';
import {getSupportedInputTypes} from './input-types';

describe('getSupportedInputTypes', () => {
  it('jsdom 下返回包含常见输入类型的 Set', () => {
    const types = getSupportedInputTypes();
    expect(types).toBeInstanceOf(Set);
    for (const type of ['text', 'number', 'date', 'email', 'checkbox', 'color', 'week']) {
      expect(types.has(type)).toBe(true);
    }
  });

  it('结果按模块缓存：重复调用返回同一 Set 实例', () => {
    expect(getSupportedInputTypes()).toBe(getSupportedInputTypes());
  });

  it('SSR 环境（无 document）返回完整候选集', async () => {
    vi.resetModules();
    vi.stubGlobal('window', undefined);
    vi.stubGlobal('document', undefined);
    try {
      const {getSupportedInputTypes: ssrGetSupportedInputTypes} = await import('./input-types');
      const types = ssrGetSupportedInputTypes();
      expect(types.size).toBe(22);
      expect(types.has('color')).toBe(true);
      expect(types.has('week')).toBe(true);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('仅保留 type 赋值成功的候选类型', async () => {
    vi.resetModules();
    // 模拟不支持 date 的环境：赋值后 input.type 不返回目标值。
    const fakeInput = {
      _type: '',
      setAttribute(_name: string, value: string) {
        this._type = value;
      },
      get type() {
        return this._type === 'date' ? '' : this._type;
      },
    };
    vi.spyOn(document, 'createElement').mockReturnValue(
      fakeInput as unknown as HTMLInputElement,
    );
    try {
      const {getSupportedInputTypes: freshGetSupportedInputTypes} = await import('./input-types');
      const types = freshGetSupportedInputTypes();
      expect(types.has('date')).toBe(false);
      expect(types.has('text')).toBe(true);
      expect(types.has('color')).toBe(true);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
