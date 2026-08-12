<script setup lang="ts">
import DemoCard from '../components/DemoCard.vue';
import ModulePage from '../components/ModulePage.vue';
import {apiGroups} from '../apis/collections';
import CollectionsDemo from '../demos/collections/CollectionsDemo.vue';
import CollectionsDemoSource from '../demos/collections/CollectionsDemo.vue?raw';
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
  </ModulePage>
</template>
