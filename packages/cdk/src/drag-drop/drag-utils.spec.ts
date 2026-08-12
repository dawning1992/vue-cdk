import {describe, expect, it} from 'vitest';
import {copyArrayItem, moveItemInArray, transferArrayItem} from './drag-utils';

describe('moveItemInArray', () => {
  it('将条目从低索引移动到高索引', () => {
    const array = [0, 1, 2, 3];
    moveItemInArray(array, 0, 2);
    expect(array).toEqual([1, 2, 0, 3]);
  });

  it('将条目从高索引移动到低索引', () => {
    const array = [0, 1, 2, 3];
    moveItemInArray(array, 3, 1);
    expect(array).toEqual([0, 3, 1, 2]);
  });

  it('索引相同或越界时安全处理', () => {
    const array = [0, 1, 2];
    moveItemInArray(array, 1, 1);
    expect(array).toEqual([0, 1, 2]);

    moveItemInArray(array, -1, 2);
    expect(array).toEqual([1, 2, 0]);

    moveItemInArray(array, 0, 99);
    expect(array).toEqual([2, 0, 1]);
  });
});

describe('transferArrayItem', () => {
  it('从源数组移除条目并插入目标数组指定索引', () => {
    const source: (number | string)[] = [0, 1, 2, 3];
    const target: (number | string)[] = ['a', 'b'];
    transferArrayItem(source, target, 1, 1);
    expect(source).toEqual([0, 2, 3]);
    expect(target).toEqual(['a', 1, 'b']);
  });

  it('源数组为空时不写入目标数组', () => {
    const source: (number | string)[] = [];
    const target: (number | string)[] = ['a'];
    transferArrayItem(source, target, 0, 0);
    expect(target).toEqual(['a']);
  });
});

describe('copyArrayItem', () => {
  it('复制条目到目标数组且不改变源数组', () => {
    const source: (number | string)[] = [0, 1, 2];
    const target: (number | string)[] = ['a'];
    copyArrayItem(source, target, 1, 0);
    expect(source).toEqual([0, 1, 2]);
    expect(target).toEqual([1, 'a']);
  });
});
