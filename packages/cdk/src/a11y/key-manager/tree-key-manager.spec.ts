import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {ref} from 'vue';
import {Emitter} from '../../emitter';
import {createKeyboardEvent} from '../../../tests/helpers';
import {
  TreeKeyManager,
  type TreeKeyManagerItem,
  type TreeKeyManagerItems,
  type TreeKeyManagerOptions,
} from './tree-key-manager';

interface TestItem extends TreeKeyManagerItem {
  id: string;
}

function item(
  id: string,
  config: {
    expanded?: boolean;
    disabled?: boolean;
    parent?: TestItem | null;
    children?: TestItem[];
  } = {},
): TestItem {
  return {
    id,
    isExpanded: config.expanded ?? false,
    isDisabled: config.disabled ?? false,
    getLabel: () => id,
    getParent: () => config.parent ?? null,
    getChildren: () => config.children ?? [],
    activate: vi.fn(),
    collapse: vi.fn(),
    expand: vi.fn(),
    focus: vi.fn(),
    unfocus: vi.fn(),
    makeFocusable: vi.fn(),
  };
}

function keydown(key: string): KeyboardEvent {
  return createKeyboardEvent('keydown', 0, {key});
}

function createManager(
  items: TreeKeyManagerItems<TestItem>,
  options: TreeKeyManagerOptions<TestItem> = {},
) {
  return new TreeKeyManager<TestItem>(items, options);
}

describe('TreeKeyManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('构造时初始聚焦第一个可用条目（makeFocusable，不抢占焦点）', () => {
    const list = [item('a'), item('b')];
    const manager = createManager(list);

    expect(manager.getActiveItemIndex()).toBe(0);
    expect(manager.getActiveItem()).toBe(list[0]);
    expect(list[0].makeFocusable).toHaveBeenCalledTimes(1);
    expect(list[1].makeFocusable).not.toHaveBeenCalled();
  });

  it('初始聚焦跳过禁用项', () => {
    const list = [item('a', {disabled: true}), item('b'), item('c')];
    const manager = createManager(list);

    expect(manager.getActiveItem()).toBe(list[1]);
  });

  it('ArrowDown / ArrowUp 依次聚焦且发射 change', () => {
    const list = [item('a'), item('b'), item('c')];
    const manager = createManager(list);
    const onChanged = vi.fn();
    manager.change.subscribe(onChanged);

    manager.onKeydown(keydown('ArrowDown'));
    expect(manager.getActiveItem()).toBe(list[1]);
    expect(list[1].focus).toHaveBeenCalledTimes(1);
    expect(list[0].unfocus).toHaveBeenCalledTimes(1);
    expect(onChanged).toHaveBeenLastCalledWith(list[1]);

    manager.onKeydown(keydown('ArrowUp'));
    expect(manager.getActiveItem()).toBe(list[0]);

    // 到达边界后不再移动。
    manager.onKeydown(keydown('ArrowUp'));
    expect(manager.getActiveItem()).toBe(list[0]);
  });

  it('Home / End 聚焦首/末条目', () => {
    const list = [item('a'), item('b'), item('c')];
    const manager = createManager(list);

    manager.onKeydown(keydown('End'));
    expect(manager.getActiveItem()).toBe(list[2]);
    manager.onKeydown(keydown('Home'));
    expect(manager.getActiveItem()).toBe(list[0]);
  });

  it('Enter / Space 激活当前条目并阻止默认行为', () => {
    const list = [item('a')];
    const manager = createManager(list);
    const event = keydown('Enter');
    const preventDefault = vi.spyOn(event, 'preventDefault');

    manager.onKeydown(event);
    expect(list[0].activate).toHaveBeenCalledTimes(1);
    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  it('ArrowRight：收起态展开，展开态聚焦第一个子节点', () => {
    const child = item('child');
    const parent = item('parent', {expanded: true, children: [child]});
    const manager = createManager([parent, child]);

    // 展开态：聚焦第一个子节点。
    manager.onKeydown(keydown('ArrowRight'));
    expect(manager.getActiveItem()).toBe(child);

    // 回到父节点后收起它。
    manager.focusItem(parent);
    manager.onKeydown(keydown('ArrowLeft'));
    expect(parent.collapse).toHaveBeenCalledTimes(1);
  });

  it('ArrowLeft：展开态收起，收起态聚焦父节点', () => {
    const expandedChild = item('child', {expanded: true});
    const parent = item('parent', {children: [expandedChild]});
    const manager = createManager([parent, expandedChild]);

    manager.focusItem(expandedChild);
    manager.onKeydown(keydown('ArrowLeft'));
    expect(expandedChild.collapse).toHaveBeenCalledTimes(1);

    // 收起后（通过 mock 让父节点呈收起态）再按 ArrowLeft 应聚焦父节点。
    const collapsedChild = item('collapsedChild', {parent});
    const manager2 = createManager([parent, collapsedChild]);
    manager2.focusItem(collapsedChild);
    manager2.onKeydown(keydown('ArrowLeft'));
    expect(manager2.getActiveItem()).toBe(parent);
  });

  it('RTL 模式下左右键语义互换', () => {
    const child = item('child');
    const parent = item('parent', {expanded: true, children: [child]});
    const manager = createManager([parent, child], {horizontalOrientation: 'rtl'});

    // RTL 下 ArrowLeft 等价于 LTR 的 ArrowRight：展开态聚焦第一个子节点。
    manager.onKeydown(keydown('ArrowLeft'));
    expect(manager.getActiveItem()).toBe(child);
  });

  it('* 展开当前条目所在层级的所有同级条目', () => {
    const parent = item('parent');
    const a = item('a', {parent});
    const b = item('b', {parent});
    parent.getChildren = () => [a, b];
    const manager = createManager([parent, a, b]);

    manager.focusItem(a);
    manager.onKeydown(keydown('*'));
    expect(a.expand).toHaveBeenCalledTimes(1);
    expect(b.expand).toHaveBeenCalledTimes(1);
    expect(parent.expand).not.toHaveBeenCalled();
  });

  it('* 对根级条目展开全部根节点', () => {
    const a = item('a');
    const b = item('b');
    const manager = createManager([a, b]);

    manager.onKeydown(keydown('*'));
    expect(a.expand).toHaveBeenCalledTimes(1);
    expect(b.expand).toHaveBeenCalledTimes(1);
  });

  it('typeahead 按键聚焦标签匹配的条目', () => {
    const apple = item('apple');
    const banana = item('banana');
    const cherry = item('cherry');
    const manager = createManager([apple, banana, cherry], {typeAheadDebounceInterval: true});

    manager.onKeydown(keydown('b'));
    vi.advanceTimersByTime(200);
    expect(manager.getActiveItem()).toBe(banana);

    manager.onKeydown(keydown('c'));
    vi.advanceTimersByTime(200);
    expect(manager.getActiveItem()).toBe(cherry);
  });

  it('skipPredicate 命中的条目在导航时被跳过', () => {
    const list = [item('a'), item('b'), item('c')];
    const manager = createManager(list, {skipPredicate: i => i.id === 'b'});

    manager.onKeydown(keydown('ArrowDown'));
    expect(manager.getActiveItem()).toBe(list[2]);
  });

  it('条目源为 Ref 时列表变化后重新初始聚焦', () => {
    const list = ref<TestItem[]>([item('a'), item('b')]);
    const manager = createManager(list);
    expect(manager.getActiveItem()).toBe(list.value[0]);

    list.value = [item('c'), item('d')];
    expect(manager.getActiveItem()).toBe(list.value[0]);
    expect(list.value[0].makeFocusable).toHaveBeenCalledTimes(1);
  });

  it('focusItem 支持 emitChangeEvent: false 静默聚焦', () => {
    const list = [item('a'), item('b')];
    const manager = createManager(list);
    const onChanged = vi.fn();
    manager.change.subscribe(onChanged);

    manager.focusItem(1, {emitChangeEvent: false});
    expect(manager.getActiveItem()).toBe(list[1]);
    expect(onChanged).not.toHaveBeenCalled();
  });

  it('子节点为 Emitter 时 ArrowRight 取首帧聚焦第一个子节点', () => {
    const child = item('child');
    const childrenEmitter = new Emitter<TreeKeyManagerItem[]>();
    const parent: TestItem = {
      ...item('parent', {expanded: true}),
      getChildren: () => childrenEmitter,
    };
    const manager = createManager([parent, child]);

    manager.onKeydown(keydown('ArrowRight'));
    childrenEmitter.next([child]);
    expect(manager.getActiveItem()).toBe(child);
  });

  it('destroy 后 change 不再派发', () => {
    const list = [item('a'), item('b')];
    const manager = createManager(list);
    const onChanged = vi.fn();
    manager.change.subscribe(onChanged);

    manager.destroy();
    manager.onKeydown(keydown('ArrowDown'));
    expect(onChanged).not.toHaveBeenCalled();
  });
});
