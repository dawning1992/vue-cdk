<script setup lang="ts">
import {onBeforeUnmount, ref} from 'vue';
import {
  focusMonitor,
  inputModalityDetector,
  type FocusOrigin,
  type InputModality,
} from 'vue-cdk/a11y';

const log = ref<string[]>([]);
const inputA = ref<HTMLInputElement | null>(null);
const inputB = ref<HTMLInputElement | null>(null);
const modality = ref<InputModality>(inputModalityDetector.mostRecentModality);
const stopLog = ref('');

/** 记录最近一次焦点来源，并在页内展示。 */
function record(origin: FocusOrigin, label: string): void {
  log.value.unshift(`${label} 焦点来源：${origin ?? 'program'}`);
  if (log.value.length > 5) {
    log.value.pop();
  }
}

/** 编程聚焦：focusVia 显式指定来源，行为与真实交互一致。 */
function focusVia(origin: 'keyboard' | 'mouse' | 'touch' | 'program'): void {
  focusMonitor.focusVia(inputA, origin);
  record(origin, `focusVia(${origin})`);
}

/** 停止监视指定元素：之后聚焦不再派发来源事件。 */
function stopMonitoring(): void {
  focusMonitor.stopMonitoring(inputB);
  stopLog.value = '已 stopMonitoring(inputB)，其聚焦事件不再记录';
}

// 订阅输入方式检测器：键盘 / 鼠标 / 触摸切换实时展示。
const unsubscribeModality = inputModalityDetector.modalityChanged.subscribe(value => {
  modality.value = value;
});

onBeforeUnmount(() => unsubscribeModality());
</script>

<template>
  <div class="wrap">
    <div class="modality">最近输入方式：{{ modality ?? '（未知）' }}</div>
    <input
      v-focus-monitor="(origin: FocusOrigin) => record(origin, '输入框 A')"
      ref="inputA"
      class="doc-input"
      placeholder="输入框 A"
    />
    <input
      v-focus-monitor="(origin: FocusOrigin) => record(origin, '输入框 B')"
      ref="inputB"
      class="doc-input"
      placeholder="输入框 B"
    />
    <div class="buttons">
      <button type="button" class="doc-btn" @click="focusVia('keyboard')">focusVia keyboard</button>
      <button type="button" class="doc-btn" @click="focusVia('mouse')">focusVia mouse</button>
      <button type="button" class="doc-btn" @click="focusVia('touch')">focusVia touch</button>
      <button type="button" class="doc-btn" @click="focusVia('program')">focusVia program</button>
      <button type="button" class="doc-btn" @click="stopMonitoring">stopMonitoring(B)</button>
    </div>
    <!-- .subtree：子元素聚焦也算父元素聚焦。 -->
    <div
      v-focus-monitor.subtree="(origin: FocusOrigin) => record(origin, '区域')"
      class="zone"
    >
      <button type="button" class="doc-btn">区域内按钮</button>
    </div>
    <div class="doc-output">{{ log.join('\n') || '（聚焦任意输入框查看来源）' }}</div>
    <p class="hint">{{ stopLog || '聚焦元素会自动附带 vcdk-focused / vcdk-*-focused 标记类。' }}</p>
  </div>
</template>

<style scoped>
.wrap {
  width: 100%;
}

.modality {
  margin-bottom: 10px;
  font-size: 12px;
  color: var(--doc-primary);
}

.buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 10px 0;
}

.zone {
  padding: 14px;
  border: 1px dashed var(--doc-border);
  border-radius: 8px;
  background: #fff;
}

.hint {
  margin: 10px 0 0;
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
