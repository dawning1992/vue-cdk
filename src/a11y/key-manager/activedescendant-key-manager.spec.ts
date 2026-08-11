import {describe, expect, it, vi} from 'vitest';
import {createKeyboardEvent} from '../../../tests/helpers';
import {DOWN_ARROW} from '../keycodes';
import {ActiveDescendantKeyManager, type Highlightable} from './activedescendant-key-manager';

interface TestItem extends Highlightable {
  id: string;
  getLabel(): string;
}

function item(id: string): TestItem {
  return {
    id,
    getLabel: () => id,
    setActiveStyles: vi.fn(),
    setInactiveStyles: vi.fn(),
  };
}

describe('ActiveDescendantKeyManager', () => {
  it('活动项切换时先取消旧项样式，再应用新项样式', () => {
    const list = [item('a'), item('b')];
    const manager = new ActiveDescendantKeyManager(list);

    manager.setActiveItem(0);
    expect(list[0].setActiveStyles).toHaveBeenCalledTimes(1);

    manager.setActiveItem(1);
    expect(list[0].setInactiveStyles).toHaveBeenCalledTimes(1);
    expect(list[1].setActiveStyles).toHaveBeenCalledTimes(1);
  });

  it('方向键导航同样切换高亮样式', () => {
    const list = [item('a'), item('b')];
    const manager = new ActiveDescendantKeyManager(list);

    manager.onKeydown(createKeyboardEvent('keydown', DOWN_ARROW));
    expect(list[0].setActiveStyles).toHaveBeenCalled();

    manager.onKeydown(createKeyboardEvent('keydown', DOWN_ARROW));
    expect(list[0].setInactiveStyles).toHaveBeenCalled();
    expect(list[1].setActiveStyles).toHaveBeenCalled();
  });
});
