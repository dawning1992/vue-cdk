import {describe, expect, it, vi} from 'vitest';
import {
  SelectionModel,
  getMultipleValuesInSingleSelectionError,
  type SelectionChange,
} from './selection-model';

describe('SelectionModel', () => {
  it('多选模式 select 后 selected 返回选中值，isSelected 命中', () => {
    const model = new SelectionModel<string>(true);

    expect(model.select('a', 'b')).toBe(true);
    expect(model.selected).toEqual(['a', 'b']);
    expect(model.isSelected('a')).toBe(true);
    expect(model.isSelected('c')).toBe(false);
    expect(model.hasValue()).toBe(true);
  });

  it('重复 select 相同值不产生变化且不重复入列', () => {
    const model = new SelectionModel<string>(true);
    const onChanged = vi.fn();
    model.changed.subscribe(onChanged);

    model.select('a');
    expect(model.select('a')).toBe(false);
    expect(model.selected).toEqual(['a']);
    expect(onChanged).toHaveBeenCalledTimes(1);
  });

  it('deselect / toggle / clear 语义正确', () => {
    const model = new SelectionModel<string>(true, ['a', 'b']);

    expect(model.deselect('b')).toBe(true);
    expect(model.selected).toEqual(['a']);
    expect(model.toggle('a')).toBe(true);
    expect(model.isSelected('a')).toBe(false);
    expect(model.toggle('a')).toBe(true);
    expect(model.isSelected('a')).toBe(true);
    expect(model.clear()).toBe(true);
    expect(model.isEmpty()).toBe(true);
    expect(model.clear()).toBe(false);
  });

  it('changed 事件携带 added / removed 载荷', () => {
    const model = new SelectionModel<string>(true);
    const changes: SelectionChange<string>[] = [];
    model.changed.subscribe(change => changes.push(change));

    model.select('a', 'b');
    model.deselect('a');

    expect(changes).toHaveLength(2);
    expect(changes[0].added).toEqual(['a', 'b']);
    expect(changes[0].removed).toEqual([]);
    expect(changes[0].source).toBe(model);
    expect(changes[1].added).toEqual([]);
    expect(changes[1].removed).toEqual(['a']);
  });

  it('单选模式：select 多个值抛错，再次 select 会替换旧值', () => {
    const model = new SelectionModel<string>(false);

    model.select('a');
    model.select('b');
    expect(model.selected).toEqual(['b']);
    expect(model.isMultipleSelection()).toBe(false);
    expect(() => model.select('a', 'b')).toThrow(getMultipleValuesInSingleSelectionError());
  });

  it('initiallySelectedValues 预选值不派发变化事件', () => {
    const onChanged = vi.fn();
    const model = new SelectionModel<string>(true, ['a', 'b']);
    model.changed.subscribe(onChanged);

    expect(model.selected).toEqual(['a', 'b']);
    expect(onChanged).not.toHaveBeenCalled();
  });

  it('compareWith 使用等价代表值去重', () => {
    const byId = (a: {id: number}, b: {id: number}) => a.id === b.id;
    const model = new SelectionModel<{id: number}>(true, [], true, byId);
    const first = {id: 1};
    const second = {id: 1};

    model.select(first);
    expect(model.select(second)).toBe(false);
    expect(model.selected).toEqual([first]);
    expect(model.isSelected(second)).toBe(true);
  });

  it('bulk 批量接口与 setSelection 行为一致', () => {
    const model = new SelectionModel<string>(true, ['a', 'b']);

    expect(model.bulk.select(['c'])).toBe(true);
    expect(model.bulk.setSelection(['a', 'c'])).toBe(true);
    expect(model.selected).toEqual(['a', 'c']);
    expect(model.bulk.deselect(['a'])).toBe(true);
    expect(model.selected).toEqual(['c']);
  });

  it('clear(false) 不立即派发事件，但选中状态与响应式快照已更新', () => {
    const model = new SelectionModel<string>(true, ['a']);
    const onChanged = vi.fn();
    model.changed.subscribe(onChanged);

    expect(model.clear(false)).toBe(true);
    expect(model.isEmpty()).toBe(true);
    expect(onChanged).not.toHaveBeenCalled();
    // 后续操作派发事件时携带之前累积的变化。
    model.select('b');
    expect(onChanged).toHaveBeenCalledTimes(1);
    const payload = onChanged.mock.calls[0][0] as SelectionChange<string>;
    expect(payload.added).toEqual(['b']);
    expect(payload.removed).toEqual(['a']);
  });

  it('sort 调整多选模式的选中顺序', () => {
    const model = new SelectionModel<number>(true, [3, 1, 2]);
    model.sort((a, b) => a - b);
    expect(model.selected).toEqual([1, 2, 3]);
  });
});
