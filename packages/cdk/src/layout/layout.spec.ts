import {effectScope, nextTick} from 'vue';
import {describe, expect, it, vi} from 'vitest';
import {BreakpointObserver, splitQueries} from './breakpoint-observer';
import {Breakpoints} from './breakpoints';
import {MediaMatcher} from './media-matcher';
import {useBreakpoints} from './use-breakpoints';

class FakeMediaQueryList implements MediaQueryList {
  onchange: ((this: MediaQueryList, ev: MediaQueryListEvent) => unknown) | null = null;
  private readonly listeners = new Set<(event: MediaQueryListEvent) => void>();

  constructor(public matches: boolean, public readonly media: string) {}

  setMatches(matches: boolean): void {
    this.matches = matches;
    const event = this as unknown as MediaQueryListEvent;
    for (const listener of [...this.listeners]) listener(event);
  }

  addListener(listener: (event: MediaQueryListEvent) => void): void {
    this.listeners.add(listener);
  }

  removeListener(listener: (event: MediaQueryListEvent) => void): void {
    this.listeners.delete(listener);
  }

  addEventListener(_type: string, listener: EventListenerOrEventListenerObject | null): void {
    if (typeof listener === 'function') {
      this.listeners.add(listener as (event: MediaQueryListEvent) => void);
    }
  }

  removeEventListener(_type: string, listener: EventListenerOrEventListenerObject | null): void {
    if (typeof listener === 'function') {
      this.listeners.delete(listener as (event: MediaQueryListEvent) => void);
    }
  }

  dispatchEvent(): boolean {
    return false;
  }

  get listenerCount(): number {
    return this.listeners.size;
  }
}

function createHarness(initial = false) {
  const queries = new Map<string, FakeMediaQueryList>();
  const matchMedia = vi.fn((query: string) => {
    let result = queries.get(query);
    if (!result) {
      result = new FakeMediaQueryList(initial, query);
      queries.set(query, result);
    }
    return result;
  });
  const matcher = new MediaMatcher({matchMedia});
  return {queries, matchMedia, observer: new BreakpointObserver(matcher)};
}

describe('layout', () => {
  it('Breakpoints 与 Angular CDK 的边界值一致', () => {
    expect(Breakpoints.XSmall).toBe('(max-width: 599.98px)');
    expect(Breakpoints.XLarge).toBe('(min-width: 1920px)');
    expect(Breakpoints.Handset).toContain('orientation: portrait');
  });

  it('MediaMatcher 在 SSR 平台使用安全的空实现', () => {
    const matcher = new MediaMatcher({
      platform: {
        isBrowser: false,
        WEBKIT: false,
        BLINK: false,
      } as never,
    });
    expect(matcher.matchMedia('all').matches).toBe(true);
    expect(matcher.matchMedia('(min-width: 1px)').matches).toBe(false);
  });

  it('拆分逗号查询、去除空白并去重', () => {
    expect(splitQueries([' a, b ', 'a'])).toEqual(['a', 'b']);
  });

  it('isMatched 支持字符串和数组，任一匹配即为 true', () => {
    const {observer, queries} = createHarness(false);
    observer.isMatched(['one', 'two']);
    queries.get('two')!.matches = true;
    expect(observer.isMatched(['one', 'two'])).toBe(true);
  });

  it('同一查询复用 MediaQueryList 和原生监听器', () => {
    const {observer, matchMedia, queries} = createHarness();
    const first = observer.observe('query').subscribe(() => undefined);
    const second = observer.observe('query').subscribe(() => undefined);
    expect(matchMedia).toHaveBeenCalledTimes(1);
    expect(queries.get('query')!.listenerCount).toBe(1);
    first.unsubscribe();
    second.unsubscribe();
  });

  it('首次同步派发完整状态，后续同一任务的变更合并派发', async () => {
    const {observer, queries} = createHarness(true);
    const states: Array<{matches: boolean; breakpoints: Record<string, boolean>}> = [];
    observer.observe('one, two').subscribe(state => states.push(state));
    expect(states).toEqual([{matches: true, breakpoints: {one: true, two: true}}]);

    queries.get('one')!.setMatches(false);
    queries.get('two')!.setMatches(false);
    expect(states).toHaveLength(1);
    await Promise.resolve();
    expect(states).toEqual([
      {matches: true, breakpoints: {one: true, two: true}},
      {matches: false, breakpoints: {one: false, two: false}},
    ]);
  });

  it('退订幂等且仅停止当前订阅', async () => {
    const {observer, queries} = createHarness();
    const first = vi.fn();
    const second = vi.fn();
    const subscription = observer.observe('query').subscribe(first);
    observer.observe('query').subscribe(second);
    subscription.unsubscribe();
    subscription.unsubscribe();
    queries.get('query')!.setMatches(true);
    await Promise.resolve();
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(2);
    expect(subscription.closed).toBe(true);
  });

  it('destroy 移除原生监听并完成活动事件流', () => {
    const {observer, queries} = createHarness();
    const complete = vi.fn();
    const subscription = observer.observe('query').subscribe({complete});
    observer.ngOnDestroy();
    expect(complete).toHaveBeenCalledOnce();
    expect(subscription.closed).toBe(true);
    expect(queries.get('query')!.listenerCount).toBe(0);
  });

  it('useBreakpoints 暴露响应式状态并随 effectScope 清理', async () => {
    const {observer, queries} = createHarness();
    const scope = effectScope();
    const result = scope.run(() => useBreakpoints('query', observer))!;
    expect(result.matches.value).toBe(false);
    queries.get('query')!.setMatches(true);
    await Promise.resolve();
    await nextTick();
    expect(result.matches.value).toBe(true);
    expect(result.breakpoints.value).toEqual({query: true});

    scope.stop();
    queries.get('query')!.setMatches(false);
    await Promise.resolve();
    expect(result.matches.value).toBe(true);
  });
});
