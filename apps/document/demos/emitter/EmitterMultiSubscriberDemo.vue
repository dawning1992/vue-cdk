<script setup lang="ts">
import {onBeforeUnmount, ref} from 'vue';
import {Emitter} from 'vue-cdk/emitter';
import {useLocale} from '../../composables/useLocale';

const {locale} = useLocale();
const t = (zh: string, en: string) => locale.value === 'en-US' ? en : zh;

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
    push(t('甲已订阅，无需重复', 'Subscriber A is already subscribed'));
    return;
  }
  subA = emitter.subscribe(value => push(t(`甲收到：${value}`, `A received: ${value}`)));
  hasListeners.value = emitter.hasListeners;
  push(t('甲已订阅', 'Subscriber A subscribed'));
}

function subscribeB(): void {
  if (subB) {
    push(t('乙已订阅，无需重复', 'Subscriber B is already subscribed'));
    return;
  }
  subB = emitter.subscribe(value => {
    push(t(`乙收到：${value}`, `B received: ${value}`));
    // 回调中自行退订：next 遍历的是订阅快照，当前派发仍会送达。
    if (value === t('快照演示', 'Snapshot demo')) {
      subB?.();
      subB = null;
      push(t('乙在回调中退订（当前派发仍收到，后续不再派发）', 'B unsubscribed in its callback (receives this emission, but no later ones)'));
    }
  });
  hasListeners.value = emitter.hasListeners;
  push(t('乙已订阅', 'Subscriber B subscribed'));
}

function emitNext(): void {
  const id = ++sequence;
  emitter.next(t(`事件 ${id}`, `Event ${id}`));
}

function emitSnapshotDemo(): void {
  emitter.next(t('快照演示', 'Snapshot demo'));
}

function unsubscribeNow(): void {
  const unsubscribe = subA;
  subA = null;
  unsubscribe?.();
  hasListeners.value = emitter.hasListeners;
  unsubscribe?.(); // 重复退订无副作用
  push(t('甲已退订；重复调用退订函数无副作用', 'A unsubscribed; calling the unsubscribe function again has no effect'));
}

function complete(): void {
  emitter.complete();
  hasListeners.value = emitter.hasListeners;
  push(t('complete：监听器清空；新订阅返回空退订函数，next 不再派发', 'complete: listeners cleared; new subscriptions get a no-op unsubscribe function, and next emits nothing'));
}

onBeforeUnmount(() => {
  subA?.();
  subB?.();
});
</script>

<template>
  <div class="wrap">
    <div class="buttons">
      <button type="button" class="doc-btn primary" @click="subscribeA">{{ t('甲订阅', 'Subscribe A') }}</button>
      <button type="button" class="doc-btn primary" @click="subscribeB">{{ t('乙订阅', 'Subscribe B') }}</button>
      <button type="button" class="doc-btn" @click="emitNext">{{ t('发射事件', 'Emit event') }}</button>
      <button type="button" class="doc-btn" @click="emitSnapshotDemo">{{ t('快照演示', 'Snapshot demo') }}</button>
      <button type="button" class="doc-btn" @click="unsubscribeNow">{{ t('甲退订', 'Unsubscribe A') }}</button>
      <button type="button" class="doc-btn" @click="complete">complete</button>
    </div>
    <div class="doc-output">{{ log.join('\n') || t('点击「甲订阅」「乙订阅」后发射事件', 'Subscribe A and B, then emit an event') }}</div>
    <p class="hint">hasListeners = {{ hasListeners }}{{ t('；next 遍历订阅快照，回调中退订安全。', '; next iterates a subscriber snapshot, so unsubscribing inside a callback is safe.') }}</p>
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
