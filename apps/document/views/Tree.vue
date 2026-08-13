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
    :api-groups="apiGroups"
  >
    <DemoCard
      title="扁平树（levelAccessor）"
      description="数据源提供全部扁平节点，levelAccessor 返回层级；v-tree-node-padding 按层级缩进，v-tree-node-toggle 切换展开状态，expandedChange 上报状态变化。"
      :source="FlatTreeDemoSource"
      filename="FlatTreeDemo.vue"
    >
      <FlatTreeDemo />
    </DemoCard>

    <DemoCard
      title="嵌套树（childrenAccessor）"
      description="数据源只提供根节点，childrenAccessor 返回每个节点的子节点；VNestedTreeNode 展开后自动递归渲染子节点，收起时从 DOM 移除。"
      :source="NestedTreeDemoSource"
      filename="NestedTreeDemo.vue"
    >
      <NestedTreeDemo />
    </DemoCard>

    <DemoCard
      title="TreeControl 命令式控制"
      description="FlatTreeControl 在树外维护展开模型：expandAll / collapseAll 一键展开/收起，isExpanded 查询状态；也支持键盘左右键操作。"
      :source="TreeControlDemoSource"
      filename="TreeControlDemo.vue"
    >
      <TreeControlDemo />
    </DemoCard>

    <DemoCard
      title="三种数据源形态"
      description="Ref（深层监听，push 自动更新）、Emitter（手动推流）与自定义 DataSource（connect / disconnect 生命周期）均可作为 VTree 数据源。"
      :source="DataSourceDemoSource"
      filename="DataSourceDemo.vue"
    >
      <DataSourceDemo />
    </DemoCard>

    <DemoCard
      title="键盘导航与无障碍"
      description="内置 TreeKeyManager：方向键、左右键展开/收起、Home/End、Enter/Space 激活、typeahead 与 * 同级展开；disabled 节点不参与初始聚焦与导航。"
      :source="KeyboardA11yDemoSource"
      filename="KeyboardA11yDemo.vue"
    >
      <KeyboardA11yDemo />
    </DemoCard>
  </ModulePage>
</template>
