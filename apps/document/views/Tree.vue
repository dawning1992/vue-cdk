<script setup lang="ts">
import DemoCard from '../components/DemoCard.vue';
import ModulePage from '../components/ModulePage.vue';
import {apiGroups} from '../apis/tree';
import FlatTreeDemo from '../demos/tree/FlatTreeDemo.vue';
import FlatTreeDemoSource from '../demos/tree/FlatTreeDemo.vue?raw';
import NestedTreeDemo from '../demos/tree/NestedTreeDemo.vue';
import NestedTreeDemoSource from '../demos/tree/NestedTreeDemo.vue?raw';
import TreeControlDemo from '../demos/tree/TreeControlDemo.vue';
import TreeControlDemoSource from '../demos/tree/TreeControlDemo.vue?raw';
import DataSourceDemo from '../demos/tree/DataSourceDemo.vue';
import DataSourceDemoSource from '../demos/tree/DataSourceDemo.vue?raw';
import KeyboardA11yDemo from '../demos/tree/KeyboardA11yDemo.vue';
import KeyboardA11yDemoSource from '../demos/tree/KeyboardA11yDemo.vue?raw';
</script>

<template>
  <ModulePage
    module-name="tree"
    zh-name="树"
    intro="树形结构渲染：VTree 连接数据源并扁平化/递归渲染，VTreeNode 与 VNestedTreeNode 承担 ARIA 与焦点，TreeControl / levelAccessor / childrenAccessor 三种层级来源对齐 Angular CDK tree。"
    intro-en="Render tree structures with VTree connected to a data source, VTreeNode and VNestedTreeNode handling ARIA and focus, and three hierarchy sources: TreeControl, levelAccessor, or childrenAccessor. The API follows Angular CDK tree."
    :api-groups="apiGroups"
  >
    <DemoCard
      title="扁平树（levelAccessor）"
      title-en="Flat tree (levelAccessor)"
      description="数据源提供全部扁平节点，levelAccessor 返回层级；v-tree-node-padding 按层级缩进，v-tree-node-toggle 切换展开状态，expandedChange 上报状态变化。"
      description-en="The data source provides all flat nodes and levelAccessor returns each node's level. v-tree-node-padding indents by level, v-tree-node-toggle changes expansion, and expandedChange reports updates."
      :source="FlatTreeDemoSource"
      filename="FlatTreeDemo.vue"
    >
      <FlatTreeDemo />
    </DemoCard>

    <DemoCard
      title="嵌套树（childrenAccessor）"
      title-en="Nested tree (childrenAccessor)"
      description="数据源只提供根节点，childrenAccessor 返回每个节点的子节点；VNestedTreeNode 展开后自动递归渲染子节点，收起时从 DOM 移除。"
      description-en="The data source provides root nodes and childrenAccessor returns each node's children. VNestedTreeNode recursively renders children when expanded and removes them from the DOM when collapsed."
      :source="NestedTreeDemoSource"
      filename="NestedTreeDemo.vue"
    >
      <NestedTreeDemo />
    </DemoCard>

    <DemoCard
      title="TreeControl 命令式控制"
      title-en="Imperative TreeControl"
      description="FlatTreeControl 在树外维护展开模型：expandAll / collapseAll 一键展开/收起，isExpanded 查询状态；也支持键盘左右键操作。"
      description-en="FlatTreeControl keeps the expansion model outside the tree. Use expandAll and collapseAll for bulk changes, isExpanded to query state, or the left and right arrow keys."
      :source="TreeControlDemoSource"
      filename="TreeControlDemo.vue"
    >
      <TreeControlDemo />
    </DemoCard>

    <DemoCard
      title="三种数据源形态"
      title-en="Three data source types"
      description="Ref（深层监听，push 自动更新）、Emitter（手动推流）与自定义 DataSource（connect / disconnect 生命周期）均可作为 VTree 数据源。"
      description-en="VTree accepts a Ref (deeply watched and updated on push), an Emitter (manually streamed), or a custom DataSource with connect/disconnect lifecycle methods."
      :source="DataSourceDemoSource"
      filename="DataSourceDemo.vue"
    >
      <DataSourceDemo />
    </DemoCard>

    <DemoCard
      title="键盘导航与无障碍"
      title-en="Keyboard navigation and accessibility"
      description="内置 TreeKeyManager：方向键、左右键展开/收起、Home/End、Enter/Space 激活、typeahead 与 * 同级展开；disabled 节点不参与初始聚焦与导航。"
      description-en="TreeKeyManager supports arrow navigation, left/right expansion, Home/End, Enter/Space activation, typeahead, and * to expand siblings. Disabled nodes are skipped during initial focus and navigation."
      :source="KeyboardA11yDemoSource"
      filename="KeyboardA11yDemo.vue"
    >
      <KeyboardA11yDemo />
    </DemoCard>
  </ModulePage>
</template>
