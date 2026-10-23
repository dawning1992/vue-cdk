<script setup lang="ts">
import {ref, type Ref} from 'vue';
import {ArrayDataSource} from 'vue-cdk/collections';
import {Emitter} from 'vue-cdk/emitter';
import {useLocale} from '../../composables/useLocale';

const {locale} = useLocale();
const t = (zh: string, en: string) => locale.value === 'en-US' ? en : zh;

function makeLog(target: Ref<string[]>): (message: string) => void {
  return (message: string) => {
    target.value.unshift(message);
    if (target.value.length > 4) {
      target.value.pop();
    }
  };
}

// 形态一：普通数组 —— connect 后仅派发一次首帧。
const plainSource = new ArrayDataSource(['alpha', 'beta', 'gamma']);
const plainLog = ref<string[]>([]);
const plainPush = makeLog(plainLog);
let plainUnsub: (() => void) | null = null;

function connectPlain(): void {
  plainUnsub?.();
  plainUnsub = plainSource.connect().subscribe(data => {
    plainPush(t(`收到：${data.join(', ')}`, `Received: ${data.join(', ')}`));
  });
  plainPush(t('已 connect（普通数组只派发一次）', 'Connected (plain arrays emit once)'));
}

// 形态二：Ref —— 深层监听响应式变化，持续派发。
const refItems = ref(['x', 'y']);
const refSource = new ArrayDataSource(refItems);
const refLog = ref<string[]>([]);
const refPush = makeLog(refLog);
let refUnsub: (() => void) | null = null;

function connectRef(): void {
  refUnsub?.();
  refUnsub = refSource.connect().subscribe(data => {
    refPush(t(`收到 ${data.length} 条：${data.join(', ')}`, `Received ${data.length}: ${data.join(', ')}`));
  });
  refPush(t('已 connect（Ref 深层监听）', 'Connected (Ref deep watch enabled)'));
}

function appendRef(): void {
  refItems.value = [...refItems.value, `z${refItems.value.length + 1}`];
}

// 形态三：Emitter —— 手动推流，完全由调用方控制派发时机。
const stream = new Emitter<readonly string[]>();
const streamSource = new ArrayDataSource(stream);
const streamLog = ref<string[]>([]);
const streamPush = makeLog(streamLog);
let streamUnsub: (() => void) | null = null;
let sequence = 0;

function connectStream(): void {
  streamUnsub?.();
  streamUnsub = streamSource.connect().subscribe(data => {
    streamPush(t(`收到：${data.join(', ')}`, `Received: ${data.join(', ')}`));
  });
  streamPush(t('已 connect（Emitter 手动推流）', 'Connected (Emitter pushes manually)'));
}

function pushStream(): void {
  const first = ++sequence;
  stream.next([t(`事件 ${first}`, `Event ${first}`), t(`事件 ${first + 1}`, `Event ${first + 1}`)]);
}

function disconnectAll(): void {
  plainUnsub?.();
  plainUnsub = null;
  refUnsub?.();
  refUnsub = null;
  streamUnsub?.();
  streamUnsub = null;
  plainPush(t('已全部断开：订阅退订后不再收到数据', 'All disconnected: unsubscribed listeners no longer receive data'));
}
</script>

<template>
  <div class="wrap">
    <div class="cols">
      <div class="col">
        <p class="label">{{ t('普通数组（一次性）', 'Plain array (one emission)') }}</p>
        <button type="button" class="doc-btn" @click="connectPlain">connect</button>
        <pre class="doc-output mini">{{ plainLog.join('\n') || '—' }}</pre>
      </div>
      <div class="col">
        <p class="label">{{ t('Ref（深层监听）', 'Ref (deep watch)') }}</p>
        <button type="button" class="doc-btn" @click="connectRef">connect</button>
        <button type="button" class="doc-btn" @click="appendRef">{{ t('追加数据', 'Append data') }}</button>
        <pre class="doc-output mini">{{ refLog.join('\n') || '—' }}</pre>
      </div>
      <div class="col">
        <p class="label">{{ t('Emitter（手动推流）', 'Emitter (manual push)') }}</p>
        <button type="button" class="doc-btn" @click="connectStream">connect</button>
        <button type="button" class="doc-btn" @click="pushStream">stream.next</button>
        <pre class="doc-output mini">{{ streamLog.join('\n') || '—' }}</pre>
      </div>
    </div>
    <button type="button" class="doc-btn" @click="disconnectAll">{{ t('全部断开', 'Disconnect all') }}</button>
  </div>
</template>

<style scoped>
.wrap {
  width: 100%;
}

.cols {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-bottom: 12px;
}

.col {
  flex: 1;
  min-width: 190px;
}

.label {
  margin: 0 0 8px;
  font-size: 12px;
  color: var(--doc-muted);
}

.col .doc-btn {
  margin: 0 8px 8px 0;
}

.doc-output.mini {
  min-height: 80px;
  font-size: 12px;
}
</style>
