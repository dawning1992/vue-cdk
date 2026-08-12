<script setup lang="ts">
import {ref, type Ref} from 'vue';
import {ArrayDataSource} from 'vue-cdk/collections';
import {Emitter} from 'vue-cdk/emitter';

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
    plainPush(`收到：${data.join(', ')}`);
  });
  plainPush('已 connect（普通数组只派发一次）');
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
    refPush(`收到 ${data.length} 条：${data.join(', ')}`);
  });
  refPush('已 connect（Ref 深层监听）');
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
    streamPush(`收到：${data.join(', ')}`);
  });
  streamPush('已 connect（Emitter 手动推流）');
}

function pushStream(): void {
  stream.next([`事件 ${++sequence}`, `事件 ${sequence + 1}`]);
}

function disconnectAll(): void {
  plainUnsub?.();
  plainUnsub = null;
  refUnsub?.();
  refUnsub = null;
  streamUnsub?.();
  streamUnsub = null;
  plainPush('已全部断开：订阅退订后不再收到数据');
}
</script>

<template>
  <div class="wrap">
    <div class="cols">
      <div class="col">
        <p class="label">普通数组（一次性）</p>
        <button type="button" class="doc-btn" @click="connectPlain">connect</button>
        <pre class="doc-output mini">{{ plainLog.join('\n') || '—' }}</pre>
      </div>
      <div class="col">
        <p class="label">Ref（深层监听）</p>
        <button type="button" class="doc-btn" @click="connectRef">connect</button>
        <button type="button" class="doc-btn" @click="appendRef">追加数据</button>
        <pre class="doc-output mini">{{ refLog.join('\n') || '—' }}</pre>
      </div>
      <div class="col">
        <p class="label">Emitter（手动推流）</p>
        <button type="button" class="doc-btn" @click="connectStream">connect</button>
        <button type="button" class="doc-btn" @click="pushStream">stream.next</button>
        <pre class="doc-output mini">{{ streamLog.join('\n') || '—' }}</pre>
      </div>
    </div>
    <button type="button" class="doc-btn" @click="disconnectAll">全部断开</button>
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
