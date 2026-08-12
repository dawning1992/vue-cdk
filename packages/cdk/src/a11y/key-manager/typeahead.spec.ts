import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {createKeyboardEvent} from '../../../tests/helpers';
import {Typeahead} from './typeahead';

interface TestItem {
  id: string;
  getLabel(): string;
}

function items(ids: string[]): TestItem[] {
  return ids.map(id => ({id, getLabel: () => id}));
}

describe('Typeahead', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('防抖到期后按已输入字母选择匹配条目', () => {
    const list = items(['apple', 'banana', 'cherry']);
    const typeahead = new Typeahead(list, {debounceInterval: 200});
    const onSelected = vi.fn();
    typeahead.selectedItem.subscribe(onSelected);

    typeahead.handleKey(createKeyboardEvent('keydown', 65, {key: 'a'}));
    typeahead.handleKey(createKeyboardEvent('keydown', 80, {key: 'p'}));

    expect(typeahead.isTyping()).toBe(true);
    expect(onSelected).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);
    expect(onSelected).toHaveBeenCalledWith(list[0]);
    expect(typeahead.isTyping()).toBe(false);
  });

  it('从当前选中项的下一个条目开始循环搜索', () => {
    const list = items(['apple', 'banana', 'cherry']);
    const typeahead = new Typeahead(list);
    const onSelected = vi.fn();
    typeahead.selectedItem.subscribe(onSelected);
    typeahead.setCurrentSelectedItemIndex(1);

    // 'a' 从 banana 之后搜索：cherry 不匹配，绕回 apple 命中。
    typeahead.handleKey(createKeyboardEvent('keydown', 65, {key: 'a'}));
    vi.advanceTimersByTime(200);
    expect(onSelected).toHaveBeenCalledWith(list[0]);
  });

  it('skipPredicate 命中的条目不参与匹配', () => {
    const list = items(['apple', 'banana']);
    const typeahead = new Typeahead(list, {
      skipPredicate: item => item.id === 'apple',
    });
    const onSelected = vi.fn();
    typeahead.selectedItem.subscribe(onSelected);

    typeahead.handleKey(createKeyboardEvent('keydown', 65, {key: 'a'}));
    vi.advanceTimersByTime(200);
    expect(onSelected).not.toHaveBeenCalled();
  });

  it('匹配忽略大小写与首尾空白', () => {
    const list = [{id: 'a', getLabel: () => '  Apple  '}];
    const typeahead = new Typeahead(list);
    const onSelected = vi.fn();
    typeahead.selectedItem.subscribe(onSelected);

    typeahead.handleKey(createKeyboardEvent('keydown', 65, {key: 'a'}));
    vi.advanceTimersByTime(200);
    expect(onSelected).toHaveBeenCalledWith(list[0]);
  });

  it('keyCode 分支在 event.key 缺失时仍能识别字母数字', () => {
    const list = items(['zebra']);
    const typeahead = new Typeahead(list);
    const onSelected = vi.fn();
    typeahead.selectedItem.subscribe(onSelected);

    typeahead.handleKey(createKeyboardEvent('keydown', 90)); // 'z'
    vi.advanceTimersByTime(200);
    expect(onSelected).toHaveBeenCalledWith(list[0]);
  });

  it('reset 清空输入缓冲区', () => {
    const typeahead = new Typeahead([]);
    typeahead.handleKey(createKeyboardEvent('keydown', 65, {key: 'a'}));
    expect(typeahead.isTyping()).toBe(true);

    typeahead.reset();
    expect(typeahead.isTyping()).toBe(false);
  });

  it('输入期间再次按键会重置防抖计时', () => {
    const list = items(['ab', 'ac']);
    const typeahead = new Typeahead(list, {debounceInterval: 200});
    const onSelected = vi.fn();
    typeahead.selectedItem.subscribe(onSelected);

    typeahead.handleKey(createKeyboardEvent('keydown', 65, {key: 'a'}));
    vi.advanceTimersByTime(150);
    typeahead.handleKey(createKeyboardEvent('keydown', 66, {key: 'b'}));
    vi.advanceTimersByTime(150);
    expect(onSelected).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(onSelected).toHaveBeenCalledWith(list[0]);
  });

  it('条目缺少 getLabel 时在开发模式抛错', () => {
    expect(() => new Typeahead([{id: 'x'} as unknown as TestItem])).toThrowError(/getLabel/);
  });

  it('destroy 后不再匹配并结束事件流', () => {
    const list = items(['apple']);
    const typeahead = new Typeahead(list);
    const onSelected = vi.fn();
    typeahead.selectedItem.subscribe(onSelected);
    typeahead.destroy();

    typeahead.handleKey(createKeyboardEvent('keydown', 65, {key: 'a'}));
    vi.advanceTimersByTime(500);
    expect(onSelected).not.toHaveBeenCalled();
    expect(typeahead.selectedItem.hasListeners).toBe(false);
  });
});
