<script setup lang="ts">
import DemoCard from '../components/DemoCard.vue';
import ModulePage from '../components/ModulePage.vue';
import {apiGroups} from '../apis/emitter';
import EmitterDemo from '../demos/emitter/EmitterDemo.vue';
import EmitterDemoSource from '../demos/emitter/EmitterDemo.vue?raw';
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
  </ModulePage>
</template>
