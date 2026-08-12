<script setup lang="ts">
import DemoCard from '../components/DemoCard.vue';
import ModulePage from '../components/ModulePage.vue';
import {apiGroups} from '../apis/emitter';
import EmitterDemo from '../demos/emitter/EmitterDemo.vue';
import EmitterDemoSource from '../demos/emitter/EmitterDemo.vue?raw';
import EmitterMultiSubscriberDemo from '../demos/emitter/EmitterMultiSubscriberDemo.vue';
import EmitterMultiSubscriberDemoSource from '../demos/emitter/EmitterMultiSubscriberDemo.vue?raw';
import EmitterComponentBusDemo from '../demos/emitter/EmitterComponentBusDemo.vue';
import EmitterComponentBusDemoSource from '../demos/emitter/EmitterComponentBusDemo.vue?raw';
import BusChildSource from '../demos/emitter/BusChild.vue?raw';
</script>

<template>
  <ModulePage
    module-name="emitter"
    zh-name="事件发射器"
    intro="零依赖的类型化事件发射器：subscribe 返回幂等退订函数、next 派发事件、complete 结束事件流；语义对齐 RxJS Subject，是各模块内部事件流的底座。"
    :api-groups="apiGroups"
  >
    <DemoCard
      title="Emitter 生命周期演示"
      description="依次体验订阅、发射、退订与 complete：退订后不再收到事件，complete 后监听器清空。"
      :source="EmitterDemoSource"
      filename="EmitterDemo.vue"
    >
      <EmitterDemo />
    </DemoCard>

    <DemoCard
      title="多订阅者与快照语义"
      description="多个订阅者互不影响；next 遍历订阅快照，回调中退订安全；重复退订幂等；complete 后拒绝新订阅。"
      :source="EmitterMultiSubscriberDemoSource"
      filename="EmitterMultiSubscriberDemo.vue"
    >
      <EmitterMultiSubscriberDemo />
    </DemoCard>

    <DemoCard
      title="组件间类型化事件"
      description="父组件持有 Emitter&lt;Payload&gt; 经 props 传给子组件，子组件挂载订阅、卸载退订，演示事件总线的典型业务模式。"
      :source="EmitterComponentBusDemoSource"
      filename="EmitterComponentBusDemo.vue"
      :extra-sources="[{filename: 'BusChild.vue', code: BusChildSource}]"
    >
      <EmitterComponentBusDemo />
    </DemoCard>
  </ModulePage>
</template>
