<script setup lang="ts">
import {ref} from 'vue';
import {Emitter} from 'vue-cdk/emitter';
import {useLocale} from '../../composables/useLocale';

const {locale} = useLocale();
const t = (zh: string, en: string) => locale.value === 'en-US' ? en : zh;

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
    push(t('已订阅，无需重复订阅', 'Already subscribed; no need to subscribe again'));
    return;
  }
  unsubscribe = emitter.subscribe(value => push(t(`收到：${value}`, `Received: ${value}`)));
  hasListeners.value = emitter.hasListeners;
  push(t('已订阅', 'Subscribed'));
}

function emitNext(): void {
  const id = ++sequence;
  emitter.next(t(`事件 ${id}`, `Event ${id}`));
}

function unsubscribeNow(): void {
  unsubscribe?.();
  unsubscribe = null;
  hasListeners.value = emitter.hasListeners;
  push(t('已退订，后续 next 不再收到', 'Unsubscribed; later next calls will not be received'));
}

function complete(): void {
  emitter.complete();
  hasListeners.value = emitter.hasListeners;
  push(t('已 complete：监听器清空，再订阅返回空退订函数', 'Completed: listeners cleared; later subscriptions return a no-op unsubscribe function'));
}
</script>

<template>
  <div class="wrap">
    <div class="buttons">
      <button type="button" class="doc-btn primary" @click="subscribe">{{ t('订阅', 'Subscribe') }}</button>
      <button type="button" class="doc-btn" @click="emitNext">{{ t('发射事件', 'Emit event') }}</button>
      <button type="button" class="doc-btn" @click="unsubscribeNow">{{ t('退订', 'Unsubscribe') }}</button>
      <button type="button" class="doc-btn" @click="complete">complete</button>
    </div>
    <div class="doc-output">{{ log.join('\n') || t('点击「订阅」开始', 'Click “Subscribe” to begin') }}</div>
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
