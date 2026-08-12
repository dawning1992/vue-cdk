<script setup lang="ts">
import {ref} from 'vue';
import {Emitter} from 'vue-cdk/emitter';
import BusChild from './BusChild.vue';

interface Payload {
  action: string;
  value: number;
}

/** 父组件持有类型化事件总线，经 prop 传给子组件订阅。 */
const bus = new Emitter<Payload>();
const childMounted = ref(true);
const hasListeners = ref(false);
const log = ref<string[]>([]);
let sequence = 0;

function emit(action: string): void {
  const payload = {action, value: ++sequence};
  bus.next(payload);
  hasListeners.value = bus.hasListeners;
  log.value.unshift(`父组件发射：${payload.action} +${payload.value}`);
  if (log.value.length > 4) {
    log.value.pop();
  }
}

function toggleChild(): void {
  childMounted.value = !childMounted.value;
  hasListeners.value = bus.hasListeners;
  log.value.unshift(childMounted.value ? '子组件已挂载（重新订阅）' : '子组件已卸载（自动退订）');
}
</script>

<template>
  <div class="wrap">
    <div class="buttons">
      <button type="button" class="doc-btn primary" @click="emit('新增')">发射「新增」</button>
      <button type="button" class="doc-btn primary" @click="emit('删除')">发射「删除」</button>
      <button type="button" class="doc-btn" @click="toggleChild">
        {{ childMounted ? '卸载子组件' : '重新挂载子组件' }}
      </button>
    </div>
    <div class="stage">
      <BusChild v-if="childMounted" :bus="bus" />
    </div>
    <div class="doc-output">{{ log.join('\n') || '发射事件观察父子通信' }}</div>
    <p class="hint">bus.hasListeners = {{ hasListeners }}：子组件卸载时退订，父组件发射变为空操作。</p>
  </div>
</template>

<style scoped>
.wrap {
  width: 100%;
}

.buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.stage {
  padding: 12px;
  border: 1px dashed var(--doc-border);
  border-radius: 8px;
  background: #fafbfe;
  margin-bottom: 10px;
}

.hint {
  margin: 10px 0 0;
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
