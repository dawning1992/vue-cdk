import {describe, expect, it} from 'vitest';
import {Emitter} from '../../emitter';
import {NestedTreeControl} from './nested-tree-control';

interface TestNode {
  name: string;
  children: TestNode[];
}

function node(name: string, children: TestNode[] = []): TestNode {
  return {name, children};
}

describe('NestedTreeControl', () => {
  const grandchild = node('grandchild');
  const child = node('child', [grandchild]);
  const root = node('root', [child]);
  const data = [root];

  function createControl(options?: {isExpandable?: (n: TestNode) => boolean}) {
    const control = new NestedTreeControl<TestNode>(n => n.children, options);
    control.dataNodes = data;
    return control;
  }

  it('toggle / expand / collapse / isExpanded 基本语义', () => {
    const control = createControl();

    control.expand(root);
    expect(control.isExpanded(root)).toBe(true);
    control.collapse(root);
    expect(control.isExpanded(root)).toBe(false);
    control.toggle(root);
    expect(control.isExpanded(root)).toBe(true);
    control.toggle(root);
    expect(control.isExpanded(root)).toBe(false);
  });

  it('getDescendants 递归返回全部后代（不含自身）', () => {
    const control = createControl();

    expect(control.getDescendants(root)).toEqual([child, grandchild]);
    expect(control.getDescendants(child)).toEqual([grandchild]);
    expect(control.getDescendants(grandchild)).toEqual([]);
  });

  it('expandAll / collapseAll 作用于整棵树', () => {
    const control = createControl();

    control.expandAll();
    expect(control.isExpanded(root)).toBe(true);
    expect(control.isExpanded(child)).toBe(true);
    expect(control.isExpanded(grandchild)).toBe(true);

    control.collapseAll();
    expect(control.isExpanded(root)).toBe(false);
    expect(control.isExpanded(child)).toBe(false);
  });

  it('expandDescendants / collapseDescendants / toggleDescendants 作用于子树', () => {
    const control = createControl();

    control.expandDescendants(root);
    expect(control.isExpanded(child)).toBe(true);
    expect(control.isExpanded(grandchild)).toBe(true);

    control.collapseDescendants(root);
    expect(control.isExpanded(child)).toBe(false);
    expect(control.isExpanded(grandchild)).toBe(false);

    control.toggleDescendants(root);
    expect(control.isExpanded(child)).toBe(true);
    control.toggleDescendants(root);
    expect(control.isExpanded(child)).toBe(false);
  });

  it('isExpandable 配置覆盖默认推断', () => {
    const control = createControl({isExpandable: n => n.children.length > 0});

    expect(control.isExpandable(root)).toBe(true);
    expect(control.isExpandable(grandchild)).toBe(false);
  });

  it('Emitter 子节点流不参与同步后代收集（异步渲染由树组件响应式处理）', () => {
    const emitter = new Emitter<TestNode[]>();
    const asyncNode = node('async');
    const control = new NestedTreeControl<TestNode>(n => (n === asyncNode ? emitter : n.children));
    control.dataNodes = [asyncNode];

    expect(control.getDescendants(asyncNode)).toEqual([]);
    emitter.next([child]);
    expect(control.getDescendants(asyncNode)).toEqual([]);
  });

  it('trackBy 使用稳定标识保持展开状态', () => {
    const control = new NestedTreeControl<TestNode, string>(n => n.children, {
      trackBy: n => n.name,
    });
    control.dataNodes = data;

    control.expand(root);
    expect(control.isExpanded(node('root', [child]))).toBe(true);
  });
});
