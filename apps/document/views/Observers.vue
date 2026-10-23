<script setup lang="ts">
import DemoCard from '../components/DemoCard.vue';
import ModulePage from '../components/ModulePage.vue';
import {apiGroups} from '../apis/observers';
import CdkObserveContentDemo from '../demos/observers/CdkObserveContentDemo.vue';
import CdkObserveContentDemoSource from '../demos/observers/CdkObserveContentDemo.vue?raw';
import UseObserveContentDemo from '../demos/observers/UseObserveContentDemo.vue';
import UseObserveContentDemoSource from '../demos/observers/UseObserveContentDemo.vue?raw';
</script>

<template>
  <ModulePage
    module-name="observers"
    zh-name="内容观察"
    intro="参考 Angular CDK observers：同一元素共享底层 MutationObserver，过滤框架注释锚点变化；同时提供 cdkObserveContent 指令和适配 Vue 3 的 useObserveContent。"
    intro-en="Inspired by Angular CDK observers: subscriptions for the same element share a MutationObserver, and framework comment-anchor changes are filtered out. The module provides the cdkObserveContent directive and a Vue 3–adapted useObserveContent composable."
    :api-groups="apiGroups"
  >
    <DemoCard
      title="cdkObserveContent 内容变化指令"
      title-en="cdkObserveContent content-change directive"
      description="v-cdk-observe-content 对应 Angular cdkObserveContent。示例使用 100ms 防抖，并可通过 disabled 真正断开和恢复底层观察器。"
      description-en="v-cdk-observe-content corresponds to Angular cdkObserveContent. This demo uses a 100 ms debounce; disabled disconnects and restores the underlying observer."
      :source="CdkObserveContentDemoSource"
      filename="CdkObserveContentDemo.vue"
    >
      <CdkObserveContentDemo />
    </DemoCard>

    <DemoCard
      title="useObserveContent Composition API"
      title-en="useObserveContent Composition API"
      description="传入模板元素 Ref；元素就绪后自动订阅，组件卸载时自动清理，无需手动保存 Subscription。"
      description-en="Pass a template element Ref. The composable subscribes when the element is ready and cleans up on component unmount, so no Subscription needs to be managed manually."
      :source="UseObserveContentDemoSource"
      filename="UseObserveContentDemo.vue"
    >
      <UseObserveContentDemo />
    </DemoCard>
  </ModulePage>
</template>
