import {describe, expect, it} from 'vitest';
import {nextTick, ref} from 'vue';
import {Emitter} from '../emitter';
import {ArrayDataSource} from './array-data-source';
import {isDataSource, DataSource} from './data-source';
import type {CollectionViewer} from './collection-viewer';

const viewer: CollectionViewer = {viewChange: new Emitter()};

describe('ArrayDataSource', () => {
  it('普通数组：connect 后派发一次数据', async () => {
    const source = new ArrayDataSource([1, 2, 3]);
    const values: number[][] = [];
    const unsubscribe = source.connect(viewer).subscribe(data => values.push([...data]));
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(values).toEqual([[1, 2, 3]]);
    unsubscribe();
  });

  it('Ref 数组：随响应式变化持续派发', async () => {
    const items = ref([1, 2]);
    const source = new ArrayDataSource(items);
    const values: number[][] = [];
    const unsubscribe = source.connect(viewer).subscribe(data => values.push([...data]));
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(values).toEqual([[1, 2]]);
    items.value.push(3);
    await nextTick();
    expect(values).toEqual([[1, 2], [1, 2, 3]]);
    unsubscribe();
  });

  it('Emitter 输入：直接透传事件流', () => {
    const stream = new Emitter<readonly number[]>();
    const source = new ArrayDataSource(stream);
    const values: number[][] = [];
    const unsubscribe = source.connect(viewer).subscribe(data => values.push([...data]));
    stream.next([7, 8]);
    expect(values).toEqual([[7, 8]]);
    unsubscribe();
  });

  it('disconnect 为空操作', () => {
    const source = new ArrayDataSource([1]);
    expect(() => source.disconnect(viewer)).not.toThrow();
  });
});

describe('isDataSource', () => {
  it('按 connect 方法做结构判定', () => {
    expect(isDataSource(new ArrayDataSource([1]))).toBe(true);
    expect(
      isDataSource({
        connect: () => new Emitter(),
        disconnect: () => undefined,
      }),
    ).toBe(true);
    expect(isDataSource([1, 2])).toBe(false);
    expect(isDataSource(null)).toBe(false);
    expect(isDataSource(undefined)).toBe(false);
  });

  it('抽象基类可被扩展并识别', () => {
    class CustomSource extends DataSource<number> {
      connect(): Emitter<readonly number[]> {
        return new Emitter();
      }
      disconnect(): void {}
    }
    expect(isDataSource(new CustomSource())).toBe(true);
  });
});
