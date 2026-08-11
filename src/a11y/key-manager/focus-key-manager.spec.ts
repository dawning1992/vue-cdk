import {describe, expect, it, vi} from 'vitest';
import {createKeyboardEvent} from '../../../tests/helpers';
import {DOWN_ARROW} from '../keycodes';
import {FocusKeyManager, type FocusableOption} from './focus-key-manager';

interface TestItem extends FocusableOption {
  id: string;
  getLabel(): string;
}

function item(id: string): TestItem {
  return {
    id,
    getLabel: () => id,
    focus: vi.fn(),
  };
}

describe('FocusKeyManager', () => {
  it('setActiveItem 聚焦活动项，默认 origin 为 program', () => {
    const list = [item('a'), item('b')];
    const manager = new FocusKeyManager(list);

    manager.setActiveItem(1);
    expect(list[1].focus).toHaveBeenCalledWith('program');
    expect(list[0].focus).not.toHaveBeenCalled();
  });

  it('setFocusOrigin 影响后续 focus 调用', () => {
    const list = [item('a'), item('b')];
    const manager = new FocusKeyManager(list);
    manager.setFocusOrigin('keyboard');

    manager.setActiveItem(0);
    expect(list[0].focus).toHaveBeenCalledWith('keyboard');
  });

  it('方向键导航同样触发聚焦', () => {
    const list = [item('a'), item('b')];
    const manager = new FocusKeyManager(list);

    manager.onKeydown(createKeyboardEvent('keydown', DOWN_ARROW));
    expect(list[0].focus).toHaveBeenCalled();

    manager.onKeydown(createKeyboardEvent('keydown', DOWN_ARROW));
    expect(list[1].focus).toHaveBeenCalled();
  });

  it('无活动项时不会调用 focus', () => {
    const list = [item('a')];
    const manager = new FocusKeyManager(list);
    manager.setActiveItem(list[0]);
    expect(list[0].focus).toHaveBeenCalledTimes(1);
  });
});
