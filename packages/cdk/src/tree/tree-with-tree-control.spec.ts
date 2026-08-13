import {afterEach, describe, expect, it} from 'vitest';
import {mount} from '@vue/test-utils';
import {defineComponent, h, nextTick, type PropType} from 'vue';
import {FlatTreeControl} from './control/flat-tree-control';
import {NestedTreeControl} from './control/nested-tree-control';
import {VTreeNode, type VTreeNodeContext} from './node';
import {VNestedTreeNode} from './nested-node';
import {vTreeNodeToggle} from './toggle';
import {VTree, type VTreePublicApi} from './tree';
import {withDirectives} from 'vue';

interface TestData {
  name: string;
  level: number;
  children: TestData[];
}

function node(name: string, level: number, children: TestData[] = []): TestData {
  return {name, level, children};
}

let lastTreeApi: VTreePublicApi<TestData> | null = null;

function captureTreeRef(instance: unknown): void {
  lastTreeApi = instance as VTreePublicApi<TestData>;
}

function treeApi(): VTreePublicApi<TestData> {
  if (!lastTreeApi) {
    throw new Error('treeApi 尚未捕获到树实例。');
  }
  return lastTreeApi;
}

function nodeNames(wrapper: ReturnType<typeof mount>): string[] {
  return wrapper.findAll('.node-name').map(item => item.text()?.trim() ?? '');
}

afterEach(() => {
  lastTreeApi = null;
  document.body.innerHTML = '';
});

describe('VTree + FlatTreeControl', () => {
  const flatData = () => {
    const child = node('child1', 1);
    return [node('root1', 0, [child]), child, node('root2', 0)];
  };

  function mountFlatTreeControl() {
    const data = flatData();
    const control = new FlatTreeControl<TestData, string>(
      n => n.level,
      n => n.children.length > 0,
      {trackBy: n => n.name},
    );
    control.dataNodes = data;
    const wrapper = mount(
      defineComponent({
        props: {data: {type: Array as PropType<TestData[]>, default: () => []}},
        setup(props) {
          return () =>
            h(
              VTree,
              {ref: captureTreeRef, dataSource: props.data, treeControl: control},
              {
                node: (ctx: VTreeNodeContext<TestData>) =>
                  h(
                    VTreeNode,
                    {node: ctx.node},
                    {default: () => h('span', {class: 'node-name'}, ctx.node.name)},
                  ),
              },
            );
        },
      }),
      {props: {data}},
    );
    return {wrapper, control, data};
  }

  it('由 FlatTreeControl 推导 isExpandable 与展开状态', async () => {
    const {wrapper, control, data} = mountFlatTreeControl();
    await nextTick();

    const nodes = wrapper.findAll('.vcdk-tree-node');
    expect(nodes[0].attributes('aria-expanded')).toBe('false');
    expect(nodes[1].element.getAttribute('aria-expanded')).toBeNull();

    control.expand(data[0]);
    await nextTick();
    expect(nodes[0].attributes('aria-expanded')).toBe('true');
    expect(treeApi().isExpanded(data[0])).toBe(true);

    wrapper.unmount();
  });

  it('收起时隐藏子节点，展开后恢复渲染', async () => {
    const {wrapper, control, data} = mountFlatTreeControl();
    await nextTick();
    const names = () =>
      wrapper.findAll('.node-name').map(item => item.text()?.trim() ?? '');

    // 初始全部收起：扁平树只渲染根节点。
    expect(names()).toEqual(['root1', 'root2']);

    control.expand(data[0]);
    await nextTick();
    expect(names()).toEqual(['root1', 'child1', 'root2']);

    control.collapse(data[0]);
    await nextTick();
    expect(names()).toEqual(['root1', 'root2']);

    wrapper.unmount();
  });

  it('treeControl 的 expandAll / collapseAll 驱动渲染与全部节点状态', async () => {
    const {wrapper, control, data} = mountFlatTreeControl();
    await nextTick();
    const names = () =>
      wrapper.findAll('.node-name').map(item => item.text()?.trim() ?? '');

    control.expandAll();
    await nextTick();
    expect(data.every(n => treeApi().isExpanded(n))).toBe(true);
    expect(names()).toEqual(['root1', 'child1', 'root2']);

    control.collapseAll();
    await nextTick();
    expect(data.every(n => !treeApi().isExpanded(n))).toBe(true);
    expect(names()).toEqual(['root1', 'root2']);

    wrapper.unmount();
  });

  it('vTreeNodeToggle 通过 treeControl 切换展开状态', async () => {
    const data = flatData();
    const control = new FlatTreeControl<TestData, string>(
      n => n.level,
      n => n.children.length > 0,
      {trackBy: n => n.name},
    );
    control.dataNodes = data;
    const wrapper = mount(
      defineComponent({
        setup() {
          return () =>
            h(
              VTree,
              {ref: captureTreeRef, dataSource: data, treeControl: control},
              {
                node: (ctx: VTreeNodeContext<TestData>) =>
                  h(
                    VTreeNode,
                    {node: ctx.node},
                    {
                      default: () =>
                        withDirectives(
                          h('button', {class: 'toggle'}, 'toggle'),
                          [[vTreeNodeToggle, true]],
                        ),
                    },
                  ),
              },
            );
        },
      }),
    );
    await nextTick();

    await wrapper.findAll('button.toggle')[0].trigger('click');
    await nextTick();
    // 递归切换：root1 与 child1（其直接后代）均展开。
    expect(control.isExpanded(data[0])).toBe(true);
    expect(control.isExpanded(data[0].children[0])).toBe(true);

    wrapper.unmount();
  });
});

describe('VTree + NestedTreeControl', () => {
  const nestedData = () => {
    const grandchild = node('grandchild', 2);
    const child = node('child', 1, [grandchild]);
    return [node('root1', 0, [child]), node('root2', 0)];
  };

  function mountNestedTreeControl() {
    const data = nestedData();
    const control = new NestedTreeControl<TestData, string>(n => n.children, {
      trackBy: n => n.name,
    });
    control.dataNodes = data;
    const wrapper = mount(
      defineComponent({
        props: {data: {type: Array as PropType<TestData[]>, default: () => []}},
        setup(props) {
          return () =>
            h(
              VTree,
              {ref: captureTreeRef, dataSource: props.data, treeControl: control},
              {
                node: (ctx: VTreeNodeContext<TestData>) =>
                  h(
                    VNestedTreeNode,
                    {node: ctx.node},
                    {default: () => h('span', {class: 'node-name'}, ctx.node.name)},
                  ),
              },
            );
        },
      }),
      {props: {data}},
    );
    return {wrapper, control, data};
  }

  it('NestedTreeControl 驱动嵌套渲染，收起时隐藏子节点', async () => {
    const {wrapper, control, data} = mountNestedTreeControl();
    await nextTick();
    expect(nodeNames(wrapper)).toEqual(['root1', 'root2']);

    control.expand(data[0]);
    await nextTick();
    expect(nodeNames(wrapper)).toEqual(['root1', 'child', 'root2']);

    control.collapse(data[0]);
    await nextTick();
    expect(nodeNames(wrapper)).toEqual(['root1', 'root2']);

    wrapper.unmount();
  });

  it('treeControl.expandAll 递归展开整棵树', async () => {
    const {wrapper, control, data} = mountNestedTreeControl();
    await nextTick();

    control.expandAll();
    await nextTick();
    expect(nodeNames(wrapper)).toEqual(['root1', 'child', 'grandchild', 'root2']);
    expect(treeApi().isExpanded(data[0])).toBe(true);
    expect(treeApi().isExpanded(data[0].children[0])).toBe(true);

    wrapper.unmount();
  });

  it('toggleDescendants 经控制递归展开/收起', async () => {
    const {wrapper, control, data} = mountNestedTreeControl();
    await nextTick();

    control.toggleDescendants(data[0]);
    await nextTick();
    expect(nodeNames(wrapper)).toEqual(['root1', 'child', 'grandchild', 'root2']);

    control.toggleDescendants(data[0]);
    await nextTick();
    expect(nodeNames(wrapper)).toEqual(['root1', 'root2']);

    wrapper.unmount();
  });
});
