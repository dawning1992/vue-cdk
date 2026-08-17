import {afterEach, describe, expect, it, vi} from 'vitest';
import {ContentObserver, MutationObserverFactory, shouldIgnoreContentMutation} from './content-observer';

function createHarness() {
  const callbacks: MutationCallback[] = [];
  const nativeObservers: Array<{
    instance: MutationObserver;
    observe: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
  }> = [];
  const factory = new MutationObserverFactory();
  vi.spyOn(factory, 'create').mockImplementation(callback => {
    callbacks.push(callback);
    const observe = vi.fn();
    const disconnect = vi.fn();
    const observer = {
      observe,
      disconnect,
      takeRecords: vi.fn(() => []),
    } as unknown as MutationObserver;
    nativeObservers.push({instance: observer, observe, disconnect});
    return observer;
  });
  return {factory, callbacks, nativeObservers};
}

function mutation(overrides: Partial<MutationRecord> = {}): MutationRecord {
  return {
    type: 'childList',
    target: document.createElement('div'),
    addedNodes: [] as unknown as NodeList,
    removedNodes: [] as unknown as NodeList,
    previousSibling: null,
    nextSibling: null,
    attributeName: null,
    attributeNamespace: null,
    oldValue: null,
    ...overrides,
  };
}

afterEach(() => vi.restoreAllMocks());

describe('ContentObserver', () => {
  it('观察 characterData、childList 与 subtree', () => {
    const harness = createHarness();
    const service = new ContentObserver(harness.factory);
    const element = document.createElement('div');
    service.observe(element).subscribe(records => void records);

    expect(harness.nativeObservers[0].observe).toHaveBeenCalledWith(element, {
      characterData: true,
      childList: true,
      subtree: true,
    });
  });

  it('同一元素的多个订阅共享原生观察器并分别派发', () => {
    const harness = createHarness();
    const service = new ContentObserver(harness.factory);
    const element = document.createElement('div');
    const first = vi.fn();
    const second = vi.fn();
    service.observe(element).subscribe(records => first(records));
    service.observe(element).subscribe(records => second(records));

    const records = [mutation({addedNodes: [document.createTextNode('内容')] as unknown as NodeList})];
    harness.callbacks[0](records, harness.nativeObservers[0].instance);

    expect(harness.factory.create).toHaveBeenCalledTimes(1);
    expect(first).toHaveBeenCalledWith(records);
    expect(second).toHaveBeenCalledWith(records);
  });

  it('最后一个订阅取消时才断开并允许后续重新观察', () => {
    const harness = createHarness();
    const service = new ContentObserver(harness.factory);
    const element = document.createElement('div');
    const first = service.observe(element).subscribe(records => void records);
    const second = service.observe(element).subscribe(records => void records);

    first.unsubscribe();
    expect(harness.nativeObservers[0].disconnect).not.toHaveBeenCalled();
    second.unsubscribe();
    second.unsubscribe();
    expect(harness.nativeObservers[0].disconnect).toHaveBeenCalledTimes(1);

    service.observe(element).subscribe(records => void records);
    expect(harness.factory.create).toHaveBeenCalledTimes(2);
  });

  it('忽略注释文本变化及仅添加或移除注释的变化', () => {
    const comment = document.createComment('锚点');
    expect(shouldIgnoreContentMutation(mutation({type: 'characterData', target: comment}))).toBe(true);
    expect(shouldIgnoreContentMutation(mutation({addedNodes: [comment] as unknown as NodeList}))).toBe(true);
    expect(shouldIgnoreContentMutation(mutation({removedNodes: [comment] as unknown as NodeList}))).toBe(true);
  });

  it('保留文本、元素、属性及混合节点变化', () => {
    const text = document.createTextNode('内容');
    const comment = document.createComment('锚点');
    expect(shouldIgnoreContentMutation(mutation({type: 'characterData', target: text}))).toBe(false);
    expect(shouldIgnoreContentMutation(mutation({addedNodes: [text] as unknown as NodeList}))).toBe(false);
    expect(shouldIgnoreContentMutation(mutation({addedNodes: [comment, text] as unknown as NodeList}))).toBe(false);
    expect(shouldIgnoreContentMutation(mutation({type: 'attributes'}))).toBe(false);
  });

  it('过滤后没有有效记录时不派发', () => {
    const harness = createHarness();
    const service = new ContentObserver(harness.factory);
    const callback = vi.fn();
    service.observe(document.createElement('div')).subscribe(records => callback(records));
    harness.callbacks[0]([
      mutation({addedNodes: [document.createComment('锚点')] as unknown as NodeList}),
    ], harness.nativeObservers[0].instance);
    expect(callback).not.toHaveBeenCalled();
  });

  it('destroy 断开全部元素、完成活动流且幂等', () => {
    const harness = createHarness();
    const service = new ContentObserver(harness.factory);
    const complete = vi.fn();
    const subscription = service.observe(document.createElement('div')).subscribe({complete});
    service.observe(document.createElement('section')).subscribe(records => void records);

    service.destroy();
    service.ngOnDestroy();

    expect(harness.nativeObservers[0].disconnect).toHaveBeenCalledTimes(1);
    expect(harness.nativeObservers[1].disconnect).toHaveBeenCalledTimes(1);
    expect(complete).toHaveBeenCalledTimes(1);
    expect(subscription.closed).toBe(true);
  });

  it('销毁后的订阅立即完成且不创建原生观察器', () => {
    const harness = createHarness();
    const service = new ContentObserver(harness.factory);
    const complete = vi.fn();
    service.destroy();
    const subscription = service.observe(document.createElement('div')).subscribe({complete});

    expect(subscription.closed).toBe(true);
    expect(complete).toHaveBeenCalledTimes(1);
    expect(harness.factory.create).not.toHaveBeenCalled();
  });

  it('MutationObserver 不可用时允许安全订阅和取消', () => {
    const factory = new MutationObserverFactory();
    vi.spyOn(factory, 'create').mockReturnValue(null);
    const service = new ContentObserver(factory);
    const subscription = service.observe(document.createElement('div')).subscribe(records => void records);
    expect(() => subscription.unsubscribe()).not.toThrow();
  });
});
