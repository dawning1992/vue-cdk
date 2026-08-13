import {describe, expect, it} from 'vitest';
import {FlatTreeControl} from './flat-tree-control';

interface TestNode {
  name: string;
  level: number;
  expandable: boolean;
}

function node(name: string, level: number, expandable = false): TestNode {
  return {name, level, expandable};
}

describe('FlatTreeControl', () => {
  const data: TestNode[] = [
    node('root1', 0, true),
    node('child1', 1, true),
    node('grandchild1', 2, false),
    node('root2', 0, false),
  ];

  function createControl(trackBy?: (dataNode: TestNode) => string) {
    const control = new FlatTreeControl<TestNode, string>(
      n => n.level,
      n => n.expandable,
      trackBy ? {trackBy} : undefined,
    );
    control.dataNodes = data;
    return control;
  }

  it('toggle / expand / collapse / isExpanded 基本语义', () => {
    const control = createControl();

    expect(control.isExpanded(data[0])).toBe(false);
    control.expand(data[0]);
    expect(control.isExpanded(data[0])).toBe(true);
    control.collapse(data[0]);
    expect(control.isExpanded(data[0])).toBe(false);
    control.toggle(data[0]);
    expect(control.isExpanded(data[0])).toBe(true);
    control.toggle(data[0]);
    expect(control.isExpanded(data[0])).toBe(false);
  });

  it('getDescendants 按层级扫描返回全部后代', () => {
    const control = createControl();

    expect(control.getDescendants(data[0])).toEqual([data[1], data[2]]);
    expect(control.getDescendants(data[1])).toEqual([data[2]]);
    expect(control.getDescendants(data[3])).toEqual([]);
  });

  it('expandAll / collapseAll 作用于全部扁平节点', () => {
    const control = createControl();

    control.expandAll();
    expect(data.every(n => control.isExpanded(n))).toBe(true);

    control.collapseAll();
    expect(data.every(n => !control.isExpanded(n))).toBe(true);
  });

  it('expandDescendants / collapseDescendants / toggleDescendants 作用于子树', () => {
    const control = createControl();

    control.expandDescendants(data[0]);
    expect(control.isExpanded(data[0])).toBe(true);
    expect(control.isExpanded(data[1])).toBe(true);
    expect(control.isExpanded(data[2])).toBe(true);
    expect(control.isExpanded(data[3])).toBe(false);

    control.collapseDescendants(data[0]);
    expect(data.every(n => !control.isExpanded(n))).toBe(true);

    control.toggleDescendants(data[0]);
    expect(control.isExpanded(data[1])).toBe(true);
    control.toggleDescendants(data[0]);
    expect(control.isExpanded(data[1])).toBe(false);
  });

  it('trackBy 使用稳定标识保持展开状态', () => {
    const control = createControl(n => n.name);

    control.expand(data[0]);
    const copy = {...data[0]};
    expect(control.isExpanded(copy)).toBe(true);
  });

  it('isExpandable / getLevel 直接暴露配置函数', () => {
    const control = createControl();

    expect(control.getLevel(data[1])).toBe(1);
    expect(control.isExpandable(data[0])).toBe(true);
    expect(control.isExpandable(data[3])).toBe(false);
  });
});
