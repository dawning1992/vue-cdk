import {describe, expect, it} from 'vitest';
import {hasModifierKey} from '../platform';
import {
  A,
  ALT,
  CONTROL,
  DOWN_ARROW,
  END,
  HOME,
  LEFT_ARROW,
  MAC_META,
  META,
  NINE,
  PAGE_DOWN,
  PAGE_UP,
  RIGHT_ARROW,
  SHIFT,
  TAB,
  UP_ARROW,
  Z,
  ZERO,
} from './keycodes';

describe('a11y 内部 keycodes', () => {
  it('常用按键码与 Angular CDK 取值一致', () => {
    expect(TAB).toBe(9);
    expect(SHIFT).toBe(16);
    expect(CONTROL).toBe(17);
    expect(ALT).toBe(18);
    expect(PAGE_UP).toBe(33);
    expect(PAGE_DOWN).toBe(34);
    expect(END).toBe(35);
    expect(HOME).toBe(36);
    expect(LEFT_ARROW).toBe(37);
    expect(UP_ARROW).toBe(38);
    expect(RIGHT_ARROW).toBe(39);
    expect(DOWN_ARROW).toBe(40);
    expect(ZERO).toBe(48);
    expect(NINE).toBe(57);
    expect(A).toBe(65);
    expect(Z).toBe(90);
    expect(META).toBe(91);
    expect(MAC_META).toBe(224);
  });

  it('hasModifierKey 支持指定修饰键名称（供 ListKeyManager 默认分支使用）', () => {
    const event = new KeyboardEvent('keydown', {shiftKey: true});
    expect(hasModifierKey(event, 'shiftKey')).toBe(true);
    expect(hasModifierKey(event, 'ctrlKey')).toBe(false);
  });
});
