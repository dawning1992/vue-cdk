<script setup lang="ts">
import DemoCard from '../components/DemoCard.vue';
import ModulePage from '../components/ModulePage.vue';
import {apiGroups} from '../apis/collections';
import CollectionsDemo from '../demos/collections/CollectionsDemo.vue';
import CollectionsDemoSource from '../demos/collections/CollectionsDemo.vue?raw';
import ArrayDataSourceModesDemo from '../demos/collections/ArrayDataSourceModesDemo.vue';
import ArrayDataSourceModesDemoSource from '../demos/collections/ArrayDataSourceModesDemo.vue?raw';
import CustomDataSourceDemo from '../demos/collections/CustomDataSourceDemo.vue';
import CustomDataSourceDemoSource from '../demos/collections/CustomDataSourceDemo.vue?raw';
</script>

<template>
  <ModulePage
    module-name="collections"
    zh-name="集合"
    intro="集合抽象：DataSource / ArrayDataSource 把数组、响应式数组或事件流包装为统一数据源，通过 CollectionViewer 与虚拟滚动等消费方解耦。"
    :api-groups="apiGroups"
  >
    <DemoCard
      title="ArrayDataSource 数据流"
      description="连接数据源后订阅数据流：追加数据触发 Ref 深层监听并重新派发，断开连接后停止。"
      :source="CollectionsDemoSource"
      filename="CollectionsDemo.vue"
    >
      <CollectionsDemo />
    </DemoCard>

    <DemoCard
      title="ArrayDataSource 三种输入形态"
      description="普通数组（一次性派发）、Ref（深层监听持续派发）与 Emitter（手动推流）三种数据源输入形态对比。"
      :source="ArrayDataSourceModesDemoSource"
      filename="ArrayDataSourceModesDemo.vue"
    >
      <ArrayDataSourceModesDemo />
    </DemoCard>

    <DemoCard
      title="自定义 DataSource"
      description="继承 DataSource 实现 connect / disconnect（内部 Emitter 分页推流）；实现 CollectionViewer 订阅 viewChange 接收 ListRange，并用 isDataSource 结构判定。"
      :source="CustomDataSourceDemoSource"
      filename="CustomDataSourceDemo.vue"
    >
      <CustomDataSourceDemo />
    </DemoCard>
  </ModulePage>
</template>
