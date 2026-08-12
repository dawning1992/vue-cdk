<script setup lang="ts">
import {onBeforeUnmount, ref} from 'vue';
import {Emitter} from 'vue-cdk/emitter';

const emitter = new Emitter<string>();
const log = ref<string[]>([]);
const hasListeners = ref(emitter.hasListeners);
let sequence = 0;
let subA: (() => void) | null = null;
let subB: (() => void) | null = null;

function push(message: string): void {
  log.value.unshift(message);
  if (log.value.length > 6) {
    log.value.pop();
  }
}

function subscribeA(): void {
  if (subA) {
    push('甲已订阅，无需重复');
    return;
  }
  subA = emitter.subscribe(value => push(`甲收到：${value}`));
  hasListeners.value = emitter.hasListeners;
  push('甲已订阅');
}

function subscribeB(): void {
  if (subB) {
    push('乙已订阅，无需重复');
    return;
  }
  subB = emitter.subscribe(value => {
    push(`乙收到：${value}`);
    // 回调中自行退订：next 遍历的是订阅快照，当前派发仍会送达。
    if (value === '快照演示') {
      subB?.();
      subB = null;
      push('乙在回调中退订（当前派发仍收到，后续不再派发）');
    }
  });
  hasListeners.value = emitter.hasListeners;
  push('乙已订阅');
}

function emitNext(): void {
  emitter.next(`事件 ${++sequence}`);
}

function emitSnapshotDemo(): void {
  emitter.next('快照演示');
}

function unsubscribeNow(): void {
  const unsubscribe = subA;
  subA = null;
  unsubscribe?.();
  hasListeners.value = emitter.hasListeners;
  unsubscribe?.(); // 重复退订无副作用
  push('甲已退订；重复调用退订函数无副作用');
}

function complete(): void {
  emitter.complete();
  hasListeners.value = emitter.hasListeners;
  push('complete：监听器清空；新订阅返回空退订函数，next 不再派发');
}

onBeforeUnmount(() => {
  subA?.();
  subB?.();
});
</script>

<template>
  <div class="wrap">
    <div class="buttons">
      <button type="button" class="doc-btn primary" @click="subscribeA">甲订阅</button>
      <button type="button" class="doc-btn primary" @click="subscribeB">乙订阅</button>
      <button type="button" class="doc-btn" @click="emitNext">发射事件</button>
      <button type="button" class="doc-btn" @click="emitSnapshotDemo">快照演示</button>
      <button type="button" class="doc-btn" @click="unsubscribeNow">甲退订</button>
      <button type="button" class="doc-btn" @click="complete">complete</button>
    </div>
    <div class="doc-output">{{ log.join('\n') || '点击「甲订阅」「乙订阅」后发射事件' }}</div>
    <p class="hint">hasListeners = {{ hasListeners }}；next 遍历订阅快照，回调中退订安全。</p>
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
}

.hint {
  margin: 10px 0 0;
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
