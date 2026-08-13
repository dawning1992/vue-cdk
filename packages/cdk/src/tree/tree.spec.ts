import {afterEach, describe, expect, it, vi} from 'vitest';
import {mount} from '@vue/test-utils';
import {defineComponent, h, nextTick, ref, toRaw, withDirectives, type PropType, type Ref} from 'vue';
import {Emitter} from '../emitter';
import {DataSource} from '../collections';
import {createKeyboardEvent} from '../../tests/helpers';
import {
  getMultipleTreeControlsError,
  getTreeControlMissingError,
  getTreeMissingMatchingNodeDefError,
  getTreeNoValidDataSourceError,
} from './tree-errors';
import {VTreeNode, type VTreeNodeContext} from './node';
import {VNestedTreeNode} from './nested-node';
import {vTreeNodePadding, type TreeNodePaddingValue} from './padding';
import {vTreeNodeToggle} from './toggle';
import {VTree, type VTreePublicApi} from './tree';

interface TestData {
  name: string;
  level: number;
  children: TestData[];
}

function node(name: string, level: number, children: TestData[] = []): TestData {
  return {name, level, children};
}

/** 扁平树数据：child1 既是 root1 的子节点信息，也作为扁平数组中的独立条目。 */
function flatData(): TestData[] {
  const child = node('child1', 1);
  return [node('root1', 0, [child]), child, node('root2', 0)];
}

function nestedData(): TestData[] {
  const grandchild = node('grandchild', 2);
  const child = node('child', 1, [grandchild]);
  return [node('root1', 0, [child]), node('root2', 0)];
}

let lastTreeApi: VTreePublicApi<TestData> | null = null;

/** VTree 模板 ref 捕获器：把组件暴露的 API 存到测试闭包。 */
function captureTreeRef(instance: unknown): void {
  lastTreeApi = instance as VTreePublicApi<TestData>;
}

function treeApi(): VTreePublicApi<TestData> {
  if (!lastTreeApi) {
    throw new Error('treeApi 尚未捕获到树实例，请先挂载测试组件。');
  }
  return lastTreeApi;
}

function treeNodes(wrapper: ReturnType<typeof mount>): HTMLElement[] {
  return wrapper
    .findAll('.vcdk-tree-node, .vcdk-nested-tree-node')
    .map(item => item.element as HTMLElement);
}

function nodeNames(wrapper: ReturnType<typeof mount>): string[] {
  return wrapper.findAll('.node-name').map(item => item.text()?.trim() ?? '');
}

function styleOf(element: Element): CSSStyleDeclaration {
  return (element as HTMLElement).style;
}

function keydownOn(treeElement: HTMLElement, key: string, keyCode = 0): void {
  treeElement.dispatchEvent(createKeyboardEvent('keydown', keyCode, {key}));
}

afterEach(() => {
  lastTreeApi = null;
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('dir');
  document.documentElement.style.cssText = '';
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('VTree 扁平树', () => {
  const FlatHarness = defineComponent({
    props: {
      data: {type: Array as PropType<TestData[] | Ref<TestData[]>>, default: () => []},
      trackBy: {
        type: Function as PropType<(index: number, item: TestData) => unknown>,
        default: null,
      },
    },
    setup(props) {
      return () =>
        h(
          VTree,
          {
            ref: captureTreeRef,
            dataSource: props.data,
            levelAccessor: (item: TestData) => item.level,
            trackBy: props.trackBy ?? undefined,
          },
          {
            node: (ctx: VTreeNodeContext<TestData>) =>
              h(
                VTreeNode,
                {node: ctx.node, isExpandable: ctx.node.children.length > 0},
                {default: () => ctx.node.name},
              ),
          },
        );
    },
  });

  it('渲染节点、树根角色与节点 ARIA 属性', async () => {
    const data = flatData();
    const wrapper = mount(FlatHarness, {props: {data}});
    await nextTick();
    treeApi().expand(data[0]);
    await nextTick();

    const nodes = treeNodes(wrapper);
    expect(nodes.map(el => el.textContent?.trim())).toEqual(['root1', 'child1', 'root2']);
    expect(wrapper.find('.vcdk-tree').attributes('role')).toBe('tree');
    expect(nodes.every(el => el.getAttribute('role') === 'treeitem')).toBe(true);
    expect(nodes.map(el => el.getAttribute('aria-level'))).toEqual(['1', '2', '1']);
    expect(nodes.map(el => el.getAttribute('aria-posinset'))).toEqual(['1', '1', '2']);
    expect(nodes.map(el => el.getAttribute('aria-setsize'))).toEqual(['2', '1', '2']);
    // 展开的根节点 aria-expanded=true，叶子节点不设置。
    expect(nodes[0].getAttribute('aria-expanded')).toBe('true');
    expect(nodes[1].getAttribute('aria-expanded')).toBeNull();
    expect(nodes[2].getAttribute('aria-expanded')).toBeNull();

    wrapper.unmount();
  });

  it('expand / collapse 更新 aria-expanded 并派发 expandedChange', async () => {
    const expandedChanges: {name: string; value: boolean}[] = [];
    const data = flatData();
    const wrapper = mount(
      defineComponent({
        setup() {
          return () =>
            h(
              VTree,
              {
                ref: captureTreeRef,
                dataSource: data,
                levelAccessor: (item: TestData) => item.level,
              },
              {
                node: (ctx: VTreeNodeContext<TestData>) =>
                  h(
                    VTreeNode,
                    {
                      node: ctx.node,
                      isExpandable: ctx.node.children.length > 0,
                      onExpandedChange: (value: boolean) =>
                        expandedChanges.push({name: ctx.node.name, value}),
                    },
                    {default: () => ctx.node.name},
                  ),
              },
            );
        },
      }),
    );
    await nextTick();

    const tree = treeApi();
    tree.expand(data[0]);
    await nextTick();
    expect(treeNodes(wrapper)[0].getAttribute('aria-expanded')).toBe('true');
    expect(expandedChanges).toContainEqual({name: 'root1', value: true});

    tree.collapse(data[0]);
    await nextTick();
    expect(treeNodes(wrapper)[0].getAttribute('aria-expanded')).toBe('false');
    expect(expandedChanges).toContainEqual({name: 'root1', value: false});

    wrapper.unmount();
  });

  it('收起时隐藏子节点，展开后恢复渲染', async () => {
    const data = flatData();
    const wrapper = mount(FlatHarness, {props: {data}});
    await nextTick();
    const tree = treeApi();
    const names = () => treeNodes(wrapper).map(el => el.textContent?.trim());

    // 初始全部收起：扁平树只渲染根节点。
    expect(names()).toEqual(['root1', 'root2']);

    tree.expand(data[0]);
    await nextTick();
    expect(names()).toEqual(['root1', 'child1', 'root2']);

    tree.collapse(data[0]);
    await nextTick();
    expect(names()).toEqual(['root1', 'root2']);

    wrapper.unmount();
  });

  it('vTreeNodePadding 按层级缩进，支持单位字符串与层级覆盖', async () => {
    const PaddingHarness = defineComponent({
      props: {
        data: {type: Array as PropType<TestData[]>, default: () => []},
        indent: {
          type: [Number, String, Object] as PropType<TreeNodePaddingValue | undefined>,
          default: undefined,
        },
      },
      setup(props) {
        return () =>
          h(
            VTree,
            {ref: captureTreeRef, dataSource: props.data, levelAccessor: (item: TestData) => item.level},
            {
              node: (ctx: VTreeNodeContext<TestData>) =>
                h(
                  VTreeNode,
                  {node: ctx.node, isExpandable: ctx.node.children.length > 0},
                  {
                    default: () =>
                      withDirectives(
                        h('div', {class: 'node-content'}, ctx.node.name),
                        [[vTreeNodePadding, props.indent as unknown as TreeNodePaddingValue]],
                      ),
                  },
                ),
            },
          );
      },
    });

    const data = flatData();
    const wrapper = mount(PaddingHarness, {props: {data}});
    await nextTick();
    treeApi().expand(data[0]);
    await nextTick();
    await nextTick();
    let contents = wrapper.findAll('.node-content');
    expect(styleOf(contents[0].element).paddingLeft).toBe('0px');
    expect(styleOf(contents[1].element).paddingLeft).toBe('40px');
    wrapper.unmount();

    const remWrapper = mount(PaddingHarness, {props: {data, indent: '15rem'}});
    await nextTick();
    treeApi().expand(data[0]);
    await nextTick();
    await nextTick();
    contents = remWrapper.findAll('.node-content');
    expect(styleOf(contents[0].element).paddingLeft).toBe('0rem');
    expect(styleOf(contents[1].element).paddingLeft).toBe('15rem');
    remWrapper.unmount();

    const overrideWrapper = mount(PaddingHarness, {props: {data, indent: 2}});
    await nextTick();
    treeApi().expand(data[0]);
    await nextTick();
    await nextTick();
    contents = overrideWrapper.findAll('.node-content');
    expect(styleOf(contents[0].element).paddingLeft).toBe('80px');
    overrideWrapper.unmount();
  });

  it('RTL 布局下缩进作用于 paddingRight', async () => {
    document.documentElement.setAttribute('dir', 'rtl');
    const data = flatData();
    const wrapper = mount(
      defineComponent({
        setup() {
          return () =>
            h(
              VTree,
              {
                ref: captureTreeRef,
                dataSource: data,
                levelAccessor: (item: TestData) => item.level,
              },
              {
                node: (ctx: VTreeNodeContext<TestData>) =>
                  h(
                    VTreeNode,
                    {node: ctx.node, isExpandable: ctx.node.children.length > 0},
                    {
                      default: () =>
                        withDirectives(
                          h('div', {class: 'node-content'}, ctx.node.name),
                          [[vTreeNodePadding]],
                        ),
                    },
                  ),
              },
            );
        },
      }),
    );
    await nextTick();
    treeApi().expand(data[0]);
    await nextTick();
    await nextTick();

    const contents = wrapper.findAll('.node-content');
    expect(styleOf(contents[1].element).paddingRight).toBe('40px');
    expect(styleOf(contents[1].element).paddingLeft).toBe('');

    wrapper.unmount();
  });

  it('vTreeNodeToggle 点击切换展开状态并聚焦节点', async () => {
    const wrapper = mount(
      defineComponent({
        setup() {
          return () =>
            h(
              VTree,
              {dataSource: flatData(), levelAccessor: (item: TestData) => item.level},
              {
                node: (ctx: VTreeNodeContext<TestData>) =>
                  h(
                    VTreeNode,
                    {node: ctx.node, isExpandable: ctx.node.children.length > 0},
                    {
                      default: () =>
                        withDirectives(
                          h('button', {class: 'toggle'}, 'toggle'),
                          [[vTreeNodeToggle, false]],
                        ),
                    },
                  ),
              },
            );
        },
      }),
    );
    await nextTick();

    const buttons = wrapper.findAll('button.toggle');
    await buttons[0].trigger('click');
    await nextTick();
    expect(wrapper.findAll('.vcdk-tree-node')[0].attributes('aria-expanded')).toBe('true');
    expect(wrapper.findAll('.vcdk-tree-node')[0].attributes('tabindex')).toBe('0');

    await buttons[0].trigger('click');
    await nextTick();
    expect(wrapper.findAll('.vcdk-tree-node')[0].attributes('aria-expanded')).toBe('false');

    wrapper.unmount();
  });

  it('vTreeNodeToggle 递归开关切换子树', async () => {
    const data = flatData();
    const wrapper = mount(
      defineComponent({
        setup() {
          return () =>
            h(
              VTree,
              {
                ref: captureTreeRef,
                dataSource: data,
                levelAccessor: (item: TestData) => item.level,
              },
              {
                node: (ctx: VTreeNodeContext<TestData>) =>
                  h(
                    VTreeNode,
                    {node: ctx.node, isExpandable: ctx.node.children.length > 0},
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
    const tree = treeApi();

    await wrapper.findAll('button.toggle')[0].trigger('click');
    await nextTick();
    expect(tree.isExpanded(data[0])).toBe(true);
    expect(tree.isExpanded(data[0].children[0])).toBe(true);

    wrapper.unmount();
  });

  it('条件模板：插槽内 v-if 选择节点内容', async () => {
    const data = flatData();
    const wrapper = mount(
      defineComponent({
        setup() {
          return () =>
            h(
              VTree,
              {
                ref: captureTreeRef,
                dataSource: data,
                levelAccessor: (item: TestData) => item.level,
              },
              {
                node: (ctx: VTreeNodeContext<TestData>) =>
                  h(
                    VTreeNode,
                    {node: ctx.node, isExpandable: ctx.node.children.length > 0},
                    {
                      default: () =>
                        ctx.node.name === 'root2'
                          ? `[special:${ctx.node.name}]`
                          : ctx.node.name,
                    },
                  ),
              },
            );
        },
      }),
    );
    await nextTick();
    treeApi().expand(data[0]);
    await nextTick();

    const texts = treeNodes(wrapper).map(el => el.textContent?.trim());
    expect(texts).toEqual(['root1', 'child1', '[special:root2]']);

    wrapper.unmount();
  });

  it('Ref 数据源深层监听持续更新', async () => {
    const data = ref<TestData[]>(flatData());
    const wrapper = mount(FlatHarness, {props: {data}});
    await nextTick();
    // 初始全部收起：仅根节点可见。
    expect(treeNodes(wrapper)).toHaveLength(2);

    // 使用原始节点标识展开，避免响应式代理对象与内部 rawData 不一致。
    treeApi().expand(toRaw(data.value)[0]);
    await nextTick();
    expect(treeNodes(wrapper)).toHaveLength(3);

    data.value.push(node('root3', 0));
    await nextTick();
    expect(treeNodes(wrapper)).toHaveLength(4);
    expect(treeNodes(wrapper)[3].textContent?.trim()).toBe('root3');

    wrapper.unmount();
  });

  it('Emitter 数据源订阅更新', async () => {
    const emitter = new Emitter<readonly unknown[]>();
    const data = flatData();
    const wrapper = mount(
      defineComponent({
        setup() {
          return () =>
            h(
              VTree,
              {
                ref: captureTreeRef,
                dataSource: emitter,
                levelAccessor: (item: TestData) => item.level,
              },
              {
                node: (ctx: VTreeNodeContext<TestData>) =>
                  h(
                    VTreeNode,
                    {node: ctx.node, isExpandable: ctx.node.children.length > 0},
                    {default: () => ctx.node.name},
                  ),
              },
            );
        },
      }),
    );
    await nextTick();
    expect(treeNodes(wrapper)).toHaveLength(0);

    emitter.next(data);
    await nextTick();
    // 初始全部收起：仅根节点可见。
    expect(treeNodes(wrapper)).toHaveLength(2);

    treeApi().expand(data[0]);
    await nextTick();
    expect(treeNodes(wrapper)).toHaveLength(3);

    emitter.next(data.slice(0, 1));
    await nextTick();
    expect(treeNodes(wrapper)).toHaveLength(1);

    wrapper.unmount();
  });

  it('自定义 DataSource：connect 驱动渲染，卸载时 disconnect', async () => {
    class FakeDataSource extends DataSource<TestData> {
      readonly stream = new Emitter<readonly TestData[]>();
      disconnected = false;
      override connect(): Emitter<readonly TestData[]> {
        return this.stream;
      }
      override disconnect(): void {
        this.disconnected = true;
      }
    }
    const source = new FakeDataSource();
    const data = flatData();
    const wrapper = mount(
      defineComponent({
        setup() {
          return () =>
            h(
              VTree,
              {
                ref: captureTreeRef,
                dataSource: source,
                levelAccessor: (item: TestData) => item.level,
              },
              {
                node: (ctx: VTreeNodeContext<TestData>) =>
                  h(
                    VTreeNode,
                    {node: ctx.node, isExpandable: ctx.node.children.length > 0},
                    {default: () => ctx.node.name},
                  ),
              },
            );
        },
      }),
    );
    await nextTick();

    source.stream.next(data);
    await nextTick();
    // 初始全部收起：仅根节点可见。
    expect(treeNodes(wrapper)).toHaveLength(2);

    treeApi().expand(data[0]);
    await nextTick();
    expect(treeNodes(wrapper)).toHaveLength(3);

    wrapper.unmount();
    expect(source.disconnected).toBe(true);
  });

  it('trackBy 属性模式：新增/删除/移动按 key 保持节点身份', async () => {
    const data = ref<TestData[]>(flatData());
    const wrapper = mount(FlatHarness, {
      props: {data, trackBy: (_index: number, item: TestData) => item.name},
    });
    await nextTick();
    const names = () => treeNodes(wrapper).map(el => el.textContent?.trim());
    expect(names()).toEqual(['root1', 'root2']);

    treeApi().expand(toRaw(data.value)[0]);
    await nextTick();
    expect(names()).toEqual(['root1', 'child1', 'root2']);

    const child = node('child1', 1);
    data.value = [node('root2', 0), node('root1', 0, [child]), child];
    await nextTick();
    // 新 root1 对象尚未展开，子节点隐藏。
    expect(names()).toEqual(['root2', 'root1']);

    treeApi().expand(toRaw(data.value)[1]);
    await nextTick();
    expect(names()).toEqual(['root2', 'root1', 'child1']);

    // 同 key 对象更新：文本反映新对象。
    const renamedChild = node('child1-renamed', 1);
    data.value = [node('root2', 0), node('root1', 0, [renamedChild]), renamedChild];
    await nextTick();
    expect(names()).toEqual(['root2', 'root1']);

    treeApi().expand(toRaw(data.value)[1]);
    await nextTick();
    expect(names()).toEqual(['root2', 'root1', 'child1-renamed']);

    wrapper.unmount();
  });

  it('trackBy 索引模式：按索引复用节点', async () => {
    const data = ref<TestData[]>(flatData());
    const wrapper = mount(FlatHarness, {props: {data, trackBy: (index: number) => index}});
    await nextTick();

    data.value = [node('root2', 0)];
    await nextTick();
    expect(treeNodes(wrapper).map(el => el.textContent?.trim())).toEqual(['root2']);

    wrapper.unmount();
  });
});

describe('VTree 嵌套树', () => {
  const NestedHarness = defineComponent({
    props: {
      data: {type: Array as PropType<TestData[]>, default: () => []},
    },
    setup(props) {
      return () =>
        h(
          VTree,
          {
            ref: captureTreeRef,
            dataSource: props.data,
            childrenAccessor: (item: TestData) => item.children,
          },
          {
            node: (ctx: VTreeNodeContext<TestData>) =>
              h(
                VNestedTreeNode,
                {node: ctx.node, isExpandable: ctx.node.children.length > 0},
                {default: () => h('span', {class: 'node-name'}, ctx.node.name)},
              ),
          },
        );
    },
  });

  it('初始只渲染根节点，展开后渲染子节点并带正确 ARIA', async () => {
    const data = nestedData();
    const wrapper = mount(NestedHarness, {props: {data}});
    await nextTick();
    const tree = treeApi();

    expect(nodeNames(wrapper)).toEqual(['root1', 'root2']);
    expect(treeNodes(wrapper)[0].getAttribute('aria-expanded')).toBe('false');

    tree.expand(data[0]);
    await nextTick();
    expect(nodeNames(wrapper)).toEqual(['root1', 'child', 'root2']);
    expect(treeNodes(wrapper)[1].getAttribute('aria-level')).toBe('2');
    expect(treeNodes(wrapper)[1].getAttribute('aria-posinset')).toBe('1');

    tree.expand(data[0].children[0]);
    await nextTick();
    expect(nodeNames(wrapper)).toEqual(['root1', 'child', 'grandchild', 'root2']);
    expect(treeNodes(wrapper)[2].getAttribute('aria-level')).toBe('3');

    tree.collapse(data[0]);
    await nextTick();
    expect(nodeNames(wrapper)).toEqual(['root1', 'root2']);

    wrapper.unmount();
  });

  it('toggleDescendants 递归展开/收起，expandAll/collapseAll 作用于整棵树', async () => {
    const data = nestedData();
    const wrapper = mount(NestedHarness, {props: {data}});
    await nextTick();
    const tree = treeApi();

    tree.toggleDescendants(data[0]);
    await nextTick();
    expect(nodeNames(wrapper)).toEqual(['root1', 'child', 'grandchild', 'root2']);

    tree.toggleDescendants(data[0]);
    await nextTick();
    expect(treeNodes(wrapper)).toHaveLength(2);

    tree.expandAll();
    await nextTick();
    expect(nodeNames(wrapper)).toHaveLength(4);

    tree.collapseAll();
    await nextTick();
    expect(nodeNames(wrapper)).toHaveLength(2);

    wrapper.unmount();
  });

  it('childrenAccessor 返回 Emitter 时异步渲染子节点', async () => {
    const emitters = new WeakMap<TestData, Emitter<TestData[]>>();
    const data = [node('root', 0)];
    const emitter = new Emitter<TestData[]>();
    emitters.set(data[0], emitter);
    const wrapper = mount(
      defineComponent({
        setup() {
          return () =>
            h(
              VTree,
              {
                ref: captureTreeRef,
                dataSource: data,
                childrenAccessor: (item: TestData) => emitters.get(item) ?? item.children,
              },
              {
                node: (ctx: VTreeNodeContext<TestData>) =>
                  h(
                    VNestedTreeNode,
                    {node: ctx.node, isExpandable: true},
                    {default: () => h('span', {class: 'node-name'}, ctx.node.name)},
                  ),
              },
            );
        },
      }),
    );
    await nextTick();
    const tree = treeApi();
    expect(nodeNames(wrapper)).toHaveLength(1);

    tree.expand(data[0]);
    await nextTick();
    // Emitter 尚未派发，子节点为空。
    expect(nodeNames(wrapper)).toHaveLength(1);

    emitter.next([node('async-child', 1)]);
    await nextTick();
    expect(nodeNames(wrapper)).toEqual(['root', 'async-child']);

    wrapper.unmount();
  });

  it('childrenAccessor + 扁平节点：展开后子节点平铺渲染', async () => {
    const data = [node('root', 0, [node('child', 1)])];
    const wrapper = mount(
      defineComponent({
        setup() {
          return () =>
            h(
              VTree,
              {
                ref: captureTreeRef,
                dataSource: data,
                childrenAccessor: (item: TestData) => item.children,
              },
              {
                node: (ctx: VTreeNodeContext<TestData>) =>
                  h(
                    VTreeNode,
                    {node: ctx.node, isExpandable: ctx.node.children.length > 0},
                    {default: () => ctx.node.name},
                  ),
              },
            );
        },
      }),
    );
    await nextTick();
    const tree = treeApi();
    expect(treeNodes(wrapper).map(el => el.textContent?.trim())).toEqual(['root']);

    tree.expand(data[0]);
    await nextTick();
    expect(treeNodes(wrapper).map(el => el.textContent?.trim())).toEqual(['root', 'child']);
    expect(treeNodes(wrapper)[1].getAttribute('aria-level')).toBe('2');

    wrapper.unmount();
  });

  it('levelAccessor + 嵌套节点：子节点从扁平数组按层级筛选', async () => {
    // levelAccessor 数据源必须提供全部扁平节点，children 仅用于判断可展开性。
    const child = node('child', 1);
    const grandchild = node('grandchild', 2);
    child.children.push(grandchild);
    const data = [node('root1', 0, [child]), child, grandchild, node('root2', 0)];
    const wrapper = mount(
      defineComponent({
        setup() {
          return () =>
            h(
              VTree,
              {
                ref: captureTreeRef,
                dataSource: data,
                levelAccessor: (item: TestData) => item.level,
              },
              {
                node: (ctx: VTreeNodeContext<TestData>) =>
                  h(
                    VNestedTreeNode,
                    {node: ctx.node, isExpandable: ctx.node.children.length > 0},
                    {default: () => h('span', {class: 'node-name'}, ctx.node.name)},
                  ),
              },
            );
        },
      }),
    );
    await nextTick();
    const tree = treeApi();
    expect(nodeNames(wrapper)).toEqual(['root1', 'root2']);

    tree.expand(data[0]);
    await nextTick();
    expect(nodeNames(wrapper)).toEqual(['root1', 'child', 'root2']);

    tree.expand(child);
    await nextTick();
    expect(nodeNames(wrapper)).toEqual(['root1', 'child', 'grandchild', 'root2']);

    wrapper.unmount();
  });

  it('is-expanded + is-expandable 初始展开', async () => {
    const data = [node('parent', 0, [node('child', 1)])];
    const wrapper = mount(
      defineComponent({
        setup() {
          return () =>
            h(
              VTree,
              {dataSource: data, childrenAccessor: (item: TestData) => item.children},
              {
                node: (ctx: VTreeNodeContext<TestData>) =>
                  h(
                    VTreeNode,
                    {node: ctx.node, isExpandable: true, isExpanded: true},
                    {default: () => ctx.node.name},
                  ),
              },
            );
        },
      }),
    );
    await nextTick();

    expect(treeNodes(wrapper)[0].getAttribute('aria-expanded')).toBe('true');
    expect(treeNodes(wrapper).map(el => el.textContent?.trim())).toEqual(['parent', 'child']);

    wrapper.unmount();
  });
});

describe('VTree 校验与数据源错误', () => {
  it('缺少层级来源时抛 getTreeControlMissingError', () => {
    expect(() =>
      mount(VTree, {
        props: {dataSource: []},
        slots: {node: (_: unknown) => h('span')},
      }),
    ).toThrow(getTreeControlMissingError());
  });

  it('同时提供多个层级来源时抛 getMultipleTreeControlsError', () => {
    expect(() =>
      mount(VTree, {
        props: {
          dataSource: [],
          levelAccessor: () => 0,
          childrenAccessor: () => [],
        },
        slots: {node: (_: unknown) => h('span')},
      }),
    ).toThrow(getMultipleTreeControlsError());
  });

  it('非法数据源抛 getTreeNoValidDataSourceError', () => {
    expect(() =>
      mount(VTree, {
        props: {dataSource: 42 as unknown as never, levelAccessor: () => 0},
        slots: {node: (_: unknown) => h('span')},
      }),
    ).toThrow(getTreeNoValidDataSourceError());
  });

  it('缺少 #node 插槽抛 getTreeMissingMatchingNodeDefError', () => {
    expect(() =>
      mount(VTree, {
        props: {dataSource: [], levelAccessor: () => 0},
      }),
    ).toThrow(getTreeMissingMatchingNodeDefError());
  });

  it('混用扁平与嵌套节点类型时 console.warn', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const wrapper = mount(
      defineComponent({
        setup() {
          return () =>
            h(
              VTree,
              {dataSource: nestedData(), childrenAccessor: (item: TestData) => item.children},
              {
                node: (ctx: VTreeNodeContext<TestData>) =>
                  ctx.node.name === 'root1'
                    ? h(
                        VNestedTreeNode,
                        {node: ctx.node, isExpandable: true},
                        {default: () => ctx.node.name},
                      )
                    : h(
                        VTreeNode,
                        {node: ctx.node, isExpandable: true},
                        {default: () => ctx.node.name},
                      ),
              },
            );
        },
      }),
    );
    await nextTick();

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('conflicting node types'));

    wrapper.unmount();
  });
});

describe('VTree 键盘导航', () => {
  function mountFlatTree(): {wrapper: ReturnType<typeof mount>; data: TestData[]} {
    const data = flatData();
    const wrapper = mount(
      defineComponent({
        setup() {
          return () =>
            h(
              VTree,
              {
                ref: captureTreeRef,
                dataSource: data,
                levelAccessor: (item: TestData) => item.level,
                trackBy: (_index: number, item: TestData) => item.name,
              },
              {
                node: (ctx: VTreeNodeContext<TestData>) =>
                  h(
                    VTreeNode,
                    {node: ctx.node, isExpandable: ctx.node.children.length > 0},
                    {default: () => ctx.node.name},
                  ),
              },
            );
        },
      }),
    );
    return {wrapper, data};
  }

  it('roving tabindex：首节点可聚焦，方向键移动焦点', async () => {
    const {wrapper, data} = mountFlatTree();
    await nextTick();
    treeApi().expand(data[0]);
    await nextTick();
    const treeEl = wrapper.find('.vcdk-tree').element as HTMLElement;
    const tabindexes = () => treeNodes(wrapper).map(el => el.getAttribute('tabindex'));

    expect(tabindexes()).toEqual(['0', '-1', '-1']);

    keydownOn(treeEl, 'ArrowDown');
    await nextTick();
    expect(tabindexes()).toEqual(['-1', '0', '-1']);

    keydownOn(treeEl, 'ArrowDown');
    await nextTick();
    expect(tabindexes()).toEqual(['-1', '-1', '0']);

    // 到达边界不再移动。
    keydownOn(treeEl, 'ArrowDown');
    await nextTick();
    expect(tabindexes()).toEqual(['-1', '-1', '0']);

    keydownOn(treeEl, 'ArrowUp');
    await nextTick();
    expect(tabindexes()).toEqual(['-1', '0', '-1']);

    keydownOn(treeEl, 'Home');
    await nextTick();
    expect(tabindexes()).toEqual(['0', '-1', '-1']);

    keydownOn(treeEl, 'End');
    await nextTick();
    expect(tabindexes()).toEqual(['-1', '-1', '0']);

    wrapper.unmount();
  });

  it('左右键：展开/收起与聚焦子节点/父节点', async () => {
    const data = flatData();
    const wrapper = mount(
      defineComponent({
        setup() {
          return () =>
            h(
              VTree,
              {
                ref: captureTreeRef,
                dataSource: data,
                levelAccessor: (item: TestData) => item.level,
                trackBy: (_index: number, item: TestData) => item.name,
              },
              {
                node: (ctx: VTreeNodeContext<TestData>) =>
                  h(
                    VTreeNode,
                    {node: ctx.node, isExpandable: ctx.node.children.length > 0},
                    {default: () => ctx.node.name},
                  ),
              },
            );
        },
      }),
    );
    await nextTick();
    const treeEl = wrapper.find('.vcdk-tree').element as HTMLElement;
    const tree = treeApi();
    const tabindexes = () => treeNodes(wrapper).map(el => el.getAttribute('tabindex'));

    // 初始聚焦 root1；ArrowRight 展开它。
    keydownOn(treeEl, 'ArrowRight');
    await nextTick();
    expect(tree.isExpanded(data[0])).toBe(true);
    // 再次 ArrowRight 聚焦第一个子节点。
    keydownOn(treeEl, 'ArrowRight');
    await nextTick();
    expect(tabindexes()).toEqual(['-1', '0', '-1']);
    // 子节点上的 ArrowLeft：不可展开 → 聚焦父节点。
    keydownOn(treeEl, 'ArrowLeft');
    await nextTick();
    expect(tabindexes()).toEqual(['0', '-1', '-1']);
    // 父节点上的 ArrowLeft：已展开 → 收起。
    keydownOn(treeEl, 'ArrowLeft');
    await nextTick();
    expect(tree.isExpanded(data[0])).toBe(false);

    wrapper.unmount();
  });

  it('Enter / Space 激活节点并派发 activation', async () => {
    const activated: string[] = [];
    const data = flatData();
    const wrapper = mount(
      defineComponent({
        setup() {
          return () =>
            h(
              VTree,
              {dataSource: data, levelAccessor: (item: TestData) => item.level},
              {
                node: (ctx: VTreeNodeContext<TestData>) =>
                  h(
                    VTreeNode,
                    {
                      node: ctx.node,
                      isExpandable: ctx.node.children.length > 0,
                      onActivation: (data: TestData) => activated.push(data.name),
                    },
                    {default: () => ctx.node.name},
                  ),
              },
            );
        },
      }),
    );
    await nextTick();
    const treeEl = wrapper.find('.vcdk-tree').element as HTMLElement;

    keydownOn(treeEl, 'Enter');
    expect(activated).toEqual(['root1']);

    // 展开 root1 后其子节点进入导航序列。
    keydownOn(treeEl, 'ArrowRight');
    await nextTick();
    keydownOn(treeEl, 'ArrowDown');
    await nextTick();
    keydownOn(treeEl, ' ');
    expect(activated).toEqual(['root1', 'child1']);

    wrapper.unmount();
  });

  it('typeahead 按键聚焦标签匹配的节点', async () => {
    vi.useFakeTimers();
    const data = [node('apple', 0), node('banana', 0), node('cherry', 0)];
    const wrapper = mount(
      defineComponent({
        setup() {
          return () =>
            h(
              VTree,
              {dataSource: data, levelAccessor: (item: TestData) => item.level},
              {
                node: (ctx: VTreeNodeContext<TestData>) =>
                  h(
                    VTreeNode,
                    {node: ctx.node, isExpandable: false},
                    {default: () => ctx.node.name},
                  ),
              },
            );
        },
      }),
    );
    await nextTick();
    const treeEl = wrapper.find('.vcdk-tree').element as HTMLElement;

    keydownOn(treeEl, 'b');
    vi.advanceTimersByTime(200);
    await nextTick();
    expect(treeNodes(wrapper)[1].getAttribute('tabindex')).toBe('0');

    wrapper.unmount();
  });

  it('* 展开当前层级全部节点', async () => {
    const data = flatData();
    const wrapper = mount(
      defineComponent({
        setup() {
          return () =>
            h(
              VTree,
              {
                ref: captureTreeRef,
                dataSource: data,
                levelAccessor: (item: TestData) => item.level,
              },
              {
                node: (ctx: VTreeNodeContext<TestData>) =>
                  h(
                    VTreeNode,
                    {node: ctx.node, isExpandable: ctx.node.children.length > 0},
                    {default: () => ctx.node.name},
                  ),
              },
            );
        },
      }),
    );
    await nextTick();
    const treeEl = wrapper.find('.vcdk-tree').element as HTMLElement;
    const tree = treeApi();

    keydownOn(treeEl, '*');
    expect(tree.isExpanded(data[0])).toBe(true);
    expect(tree.isExpanded(data[1])).toBe(false);

    wrapper.unmount();
  });

  it('disabled 节点被初始聚焦与导航跳过', async () => {
    const data = [node('disabled-root', 0), node('root2', 0), node('root3', 0)];
    const wrapper = mount(
      defineComponent({
        setup() {
          return () =>
            h(
              VTree,
              {dataSource: data, levelAccessor: (item: TestData) => item.level},
              {
                node: (ctx: VTreeNodeContext<TestData>) =>
                  h(
                    VTreeNode,
                    {
                      node: ctx.node,
                      isExpandable: false,
                      isDisabled: ctx.node.name === 'disabled-root',
                    },
                    {default: () => ctx.node.name},
                  ),
              },
            );
        },
      }),
    );
    await nextTick();
    const treeEl = wrapper.find('.vcdk-tree').element as HTMLElement;
    const tabindexes = () => treeNodes(wrapper).map(el => el.getAttribute('tabindex'));

    expect(tabindexes()).toEqual(['-1', '0', '-1']);
    keydownOn(treeEl, 'ArrowDown');
    await nextTick();
    expect(tabindexes()).toEqual(['-1', '-1', '0']);

    wrapper.unmount();
  });

  it('RTL 布局左右键语义互换', async () => {
    document.documentElement.setAttribute('dir', 'rtl');
    const data = flatData();
    const wrapper = mount(
      defineComponent({
        setup() {
          return () =>
            h(
              VTree,
              {
                ref: captureTreeRef,
                dataSource: data,
                levelAccessor: (item: TestData) => item.level,
              },
              {
                node: (ctx: VTreeNodeContext<TestData>) =>
                  h(
                    VTreeNode,
                    {node: ctx.node, isExpandable: ctx.node.children.length > 0},
                    {default: () => ctx.node.name},
                  ),
              },
            );
        },
      }),
    );
    await nextTick();
    const treeEl = wrapper.find('.vcdk-tree').element as HTMLElement;
    const tree = treeApi();

    // RTL 下 ArrowLeft 等价于 LTR 的 ArrowRight：展开。
    keydownOn(treeEl, 'ArrowLeft');
    expect(tree.isExpanded(data[0])).toBe(true);

    wrapper.unmount();
  });
});
