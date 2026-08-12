<script setup lang="ts">
import {onBeforeUnmount, ref} from 'vue';
import type {Emitter} from 'vue-cdk/emitter';

interface Payload {
  action: string;
  value: number;
}

const props = defineProps<{bus: Emitter<Payload>}>();
const received = ref<string[]>([]);

// 挂载时订阅、卸载时退订：事件总线最常用的生命周期绑定。
const unsubscribe = props.bus.subscribe(payload => {
  received.value.unshift(`${payload.action} +${payload.value}`);
  if (received.value.length > 4) {
    received.value.pop();
  }
});

onBeforeUnmount(() => unsubscribe());
</script>

<template>
  <div class="bus-child">
    <p class="label">子组件（接收父组件传入的 Emitter）</p>
    <div class="doc-output mini">{{ received.join('\n') || '等待父组件发射事件…' }}</div>
  </div>
</template>

<style scoped>
.bus-child {
  width: 100%;
}

.label {
  margin: 0 0 8px;
  font-size: 12px;
  color: var(--doc-muted);
}

.doc-output.mini {
  min-height: 80px;
  font-size: 12px;
}
</style>
