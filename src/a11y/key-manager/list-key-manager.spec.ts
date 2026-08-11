import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {ref} from 'vue';
import {createKeyboardEvent} from '../../../tests/helpers';
import {
  DOWN_ARROW,
  END,
  HOME,
  LEFT_ARROW,
  PAGE_DOWN,
  PAGE_UP,
  RIGHT_ARROW,
  TAB,
  UP_ARROW,
} from '../keycodes';
import {ListKeyManager, type ListKeyManagerOption} from './list-key-manager';

interface TestItem extends ListKeyManagerOption {
  id: string;
  getLabel(): string;
}

function item(id: string, disabled = false): TestItem {
  return {id, disabled, getLabel: () => id};
}

function createManager(items: TestItem[], config?: (m: ListKeyManager<TestItem>) => void) {
  const manager = new ListKeyManager(items);
  config?.(manager);
  return manager;
}

describe('ListKeyManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('初始状态：无活动项、索引为 -1', () => {
    const manager = createManager([item('a'), item('b')]);
    expect(manager.activeItemIndex).toBe(-1);
    expect(manager.activeItem).toBeNull();
  });

  it('方向键导航并发射 change（载荷为索引）', () => {
    const manager = createManager([item('a'), item('b'), item('c')]);
    const onChange = vi.fn();
    manager.change.subscribe(onChange);

    manager.onKeydown(createKeyboardEvent('keydown', DOWN_ARROW));
    expect(manager.activeItemIndex).toBe(0);
    expect(onChange).toHaveBeenCalledWith(0);

    manager.onKeydown(createKeyboardEvent('keydown', DOWN_ARROW));
    expect(manager.activeItemIndex).toBe(1);
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('默认模式到达边界后不再移动', () => {
    const manager = createManager([item('a'), item('b')]);
    manager.onKeydown(createKeyboardEvent('keydown', UP_ARROW));
    expect(manager.activeItemIndex).toBe(-1);

    manager.setFirstItemActive();
    manager.onKeydown(createKeyboardEvent('keydown', UP_ARROW));
    expect(manager.activeItemIndex).toBe(0);

    manager.setLastItemActive();
    manager.onKeydown(createKeyboardEvent('keydown', DOWN_ARROW));
    expect(manager.activeItemIndex).toBe(1);
  });

  it('withWrap 开启后在两端循环', () => {
    const manager = createManager([item('a'), item('b'), item('c')], m => m.withWrap());

    manager.setLastItemActive();
    manager.onKeydown(createKeyboardEvent('keydown', DOWN_ARROW));
    expect(manager.activeItemIndex).toBe(0);

    manager.onKeydown(createKeyboardEvent('keydown', UP_ARROW));
    expect(manager.activeItemIndex).toBe(2);
  });

  it('未激活时向上导航在 wrap 模式下回到最后一项', () => {
    const manager = createManager([item('a'), item('b')], m => m.withWrap());
    manager.onKeydown(createKeyboardEvent('keydown', UP_ARROW));
    expect(manager.activeItemIndex).toBe(1);
  });

  it('禁用项默认被跳过', () => {
    const manager = createManager([item('a'), item('b', true), item('c')]);
    manager.onKeydown(createKeyboardEvent('keydown', DOWN_ARROW));
    expect(manager.activeItemIndex).toBe(0);

    manager.onKeydown(createKeyboardEvent('keydown', DOWN_ARROW));
    expect(manager.activeItemIndex).toBe(2);
  });

  it('skipPredicate 支持自定义跳过规则', () => {
    const manager = createManager([item('a'), item('b'), item('c')], m =>
      m.skipPredicate(i => i.id === 'b'),
    );
    manager.setFirstItemActive();
    manager.onKeydown(createKeyboardEvent('keydown', DOWN_ARROW));
    expect(manager.activeItemIndex).toBe(2);
  });

  it('withVerticalOrientation(false) 时方向键不导航', () => {
    const manager = createManager([item('a'), item('b')], m => m.withVerticalOrientation(false));
    const onChange = vi.fn();
    manager.change.subscribe(onChange);

    manager.onKeydown(createKeyboardEvent('keydown', DOWN_ARROW));
    expect(manager.activeItemIndex).toBe(-1);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('水平方向：ltr 下右进左退，rtl 下相反', () => {
    const ltr = createManager([item('a'), item('b'), item('c')], m =>
      m.withHorizontalOrientation('ltr'),
    );
    ltr.onKeydown(createKeyboardEvent('keydown', RIGHT_ARROW));
    expect(ltr.activeItemIndex).toBe(0);
    ltr.onKeydown(createKeyboardEvent('keydown', RIGHT_ARROW));
    expect(ltr.activeItemIndex).toBe(1);
    ltr.onKeydown(createKeyboardEvent('keydown', LEFT_ARROW));
    expect(ltr.activeItemIndex).toBe(0);

    const rtl = createManager([item('a'), item('b'), item('c')], m =>
      m.withHorizontalOrientation('rtl'),
    );
    rtl.onKeydown(createKeyboardEvent('keydown', RIGHT_ARROW));
    expect(rtl.activeItemIndex).toBe(-1);
    rtl.onKeydown(createKeyboardEvent('keydown', LEFT_ARROW));
    expect(rtl.activeItemIndex).toBe(0);
  });

  it('withHomeAndEnd 支持 Home/End 跳转首尾', () => {
    const manager = createManager([item('a'), item('b'), item('c')], m => m.withHomeAndEnd());
    manager.setActiveItem(1);

    manager.onKeydown(createKeyboardEvent('keydown', HOME));
    expect(manager.activeItemIndex).toBe(0);
    manager.onKeydown(createKeyboardEvent('keydown', END));
    expect(manager.activeItemIndex).toBe(2);
  });

  it('未开启 withHomeAndEnd 时 Home/End 不生效', () => {
    const manager = createManager([item('a'), item('b')]);
    manager.onKeydown(createKeyboardEvent('keydown', HOME));
    expect(manager.activeItemIndex).toBe(-1);
  });

  it('withPageUpDown 支持按步长跳转并夹取边界', () => {
    const manager = createManager(
      Array.from({length: 6}, (_, i) => item(`item-${i}`)),
      m => m.withPageUpDown(true, 2),
    );
    manager.setActiveItem(1);

    manager.onKeydown(createKeyboardEvent('keydown', PAGE_DOWN));
    expect(manager.activeItemIndex).toBe(3);
    manager.onKeydown(createKeyboardEvent('keydown', PAGE_UP));
    expect(manager.activeItemIndex).toBe(1);

    manager.onKeydown(createKeyboardEvent('keydown', PAGE_UP));
    expect(manager.activeItemIndex).toBe(0);

    manager.setActiveItem(4);
    manager.onKeydown(createKeyboardEvent('keydown', PAGE_DOWN));
    expect(manager.activeItemIndex).toBe(5);
  });

  it('未开启 withPageUpDown 时 PageUp/PageDown 不生效', () => {
    const manager = createManager([item('a'), item('b'), item('c')]);
    manager.onKeydown(createKeyboardEvent('keydown', PAGE_DOWN));
    expect(manager.activeItemIndex).toBe(-1);
  });

  it('导航按键阻止默认行为，TAB 只发射 tabOut 不阻止', () => {
    const manager = createManager([item('a'), item('b')]);
    const onTabOut = vi.fn();
    manager.tabOut.subscribe(onTabOut);

    const down = createKeyboardEvent('keydown', DOWN_ARROW);
    manager.onKeydown(down);
    expect(down.defaultPrevented).toBe(true);

    const tab = createKeyboardEvent('keydown', TAB);
    manager.onKeydown(tab);
    expect(onTabOut).toHaveBeenCalled();
    expect(tab.defaultPrevented).toBe(false);
  });

  it('默认不允许修饰键组合，withAllowedModifierKeys 允许指定修饰键', () => {
    const manager = createManager([item('a'), item('b')]);
    manager.onKeydown(createKeyboardEvent('keydown', DOWN_ARROW, {ctrlKey: true}));
    expect(manager.activeItemIndex).toBe(-1);

    manager.withAllowedModifierKeys(['ctrlKey']);
    manager.onKeydown(createKeyboardEvent('keydown', DOWN_ARROW, {ctrlKey: true}));
    expect(manager.activeItemIndex).toBe(0);
  });

  it('setActiveItem 支持按索引与按条目，且活动项未变化时不发射 change', () => {
    const list = [item('a'), item('b')];
    const manager = createManager(list);
    const onChange = vi.fn();
    manager.change.subscribe(onChange);

    manager.setActiveItem(1);
    expect(manager.activeItem).toBe(list[1]);
    expect(onChange).toHaveBeenCalledTimes(1);

    manager.setActiveItem(1);
    expect(onChange).toHaveBeenCalledTimes(1);

    manager.setActiveItem(list[0]);
    expect(manager.activeItemIndex).toBe(0);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('updateActiveItem 只更新状态不发射 change', () => {
    const list = [item('a'), item('b')];
    const manager = createManager(list);
    const onChange = vi.fn();
    manager.change.subscribe(onChange);

    manager.updateActiveItem(1);
    expect(manager.activeItemIndex).toBe(1);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('setFirst/setLast/setNext/setPrevious 直接可用', () => {
    const manager = createManager([item('a'), item('b'), item('c')]);
    manager.setNextItemActive();
    expect(manager.activeItemIndex).toBe(0);
    manager.setLastItemActive();
    expect(manager.activeItemIndex).toBe(2);
    manager.setPreviousItemActive();
    expect(manager.activeItemIndex).toBe(1);
    manager.setFirstItemActive();
    expect(manager.activeItemIndex).toBe(0);
  });

  it('条目 ref 变化时保持活动条目身份并同步索引', () => {
    const b = item('b');
    const listRef = ref<TestItem[]>([item('a'), b, item('c')]);
    const manager = new ListKeyManager(listRef);
    manager.setActiveItem(1);

    // 重排：同一 b 对象移到首位，索引应跟随更新。
    listRef.value = [b, item('a'), item('c')];
    expect(manager.activeItemIndex).toBe(0);
    expect(manager.activeItem?.id).toBe('b');
  });

  it('withTypeAhead 通过字母输入激活条目', () => {
    const list = [item('apple'), item('banana'), item('cherry')];
    const manager = createManager(list, m => m.withTypeAhead());

    manager.onKeydown(createKeyboardEvent('keydown', 65, {key: 'a'}));
    vi.advanceTimersByTime(200);
    expect(manager.activeItem).toBe(list[0]);
  });

  it('withTypeAhead 要求条目实现 getLabel（开发模式抛错）', () => {
    const noLabel = [{id: 'x'} as unknown as TestItem];
    expect(() => new ListKeyManager(noLabel).withTypeAhead()).toThrowError(/getLabel/);
  });

  it('cancelTypeahead 清空输入状态', () => {
    const manager = createManager([item('apple')], m => m.withTypeAhead());
    manager.onKeydown(createKeyboardEvent('keydown', 65, {key: 'a'}));
    expect(manager.isTyping()).toBe(true);

    manager.cancelTypeahead();
    expect(manager.isTyping()).toBe(false);
  });

  it('destroy 后结束事件流且不再导航', () => {
    const manager = createManager([item('a'), item('b')]);
    manager.destroy();

    expect(manager.change.hasListeners).toBe(false);
    expect(manager.tabOut.hasListeners).toBe(false);
    // destroy 只清理订阅与事件流，不改变活动状态（与 Angular 一致）。
    manager.onKeydown(createKeyboardEvent('keydown', DOWN_ARROW));
    expect(manager.activeItemIndex).toBe(0);
  });
});
