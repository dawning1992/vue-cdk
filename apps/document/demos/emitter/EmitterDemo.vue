<script setup lang="ts">
import {ref} from 'vue';
import {Emitter} from 'vue-cdk/emitter';

const emitter = new Emitter<string>();
const log = ref<string[]>([]);
const hasListeners = ref(emitter.hasListeners);
let unsubscribe: (() => void) | null = null;
let sequence = 0;

function push(message: string): void {
  log.value.unshift(message);
  if (log.value.length > 6) {
    log.value.pop();
  }
}

function subscribe(): void {
  if (unsubscribe) {
    push('已订阅，无需重复订阅');
    return;
  }
  unsubscribe = emitter.subscribe(value => push(`收到：${value}`));
  hasListeners.value = emitter.hasListeners;
  push('已订阅');
}

function emitNext(): void {
  emitter.next(`事件 ${++sequence}`);
}

function unsubscribeNow(): void {
  unsubscribe?.();
  unsubscribe = null;
  hasListeners.value = emitter.hasListeners;
  push('已退订，后续 next 不再收到');
}

function complete(): void {
  emitter.complete();
  hasListeners.value = emitter.hasListeners;
  push('已 complete：监听器清空，再订阅返回空退订函数');
}
</script>

<template>
  <div class="wrap">
    <div class="buttons">
      <button type="button" class="doc-btn primary" @click="subscribe">订阅</button>
      <button type="button" class="doc-btn" @click="emitNext">发射事件</button>
      <button type="button" class="doc-btn" @click="unsubscribeNow">退订</button>
      <button type="button" class="doc-btn" @click="complete">complete</button>
    </div>
    <div class="doc-output">{{ log.join('\n') || '点击「订阅」开始' }}</div>
    <p class="hint">hasListeners = {{ hasListeners }}</p>
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
