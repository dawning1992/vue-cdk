<script setup lang="ts">
import {ref} from 'vue';
import type {FocusOrigin} from 'vue-cdk/a11y';

const log = ref<string[]>([]);

/** 记录最近一次焦点来源，并在页内展示。 */
function record(origin: FocusOrigin, label: string): void {
  log.value.unshift(`${label} 焦点来源：${origin ?? 'program'}`);
  if (log.value.length > 5) {
    log.value.pop();
  }
}
</script>

<template>
  <div class="wrap">
    <input
      v-focus-monitor="(origin: FocusOrigin) => record(origin, '输入框 A')"
      class="doc-input"
      placeholder="输入框 A"
    />
    <input
      v-focus-monitor="(origin: FocusOrigin) => record(origin, '输入框 B')"
      class="doc-input"
      placeholder="输入框 B"
    />
    <!-- .subtree：子元素聚焦也算父元素聚焦。 -->
    <div
      v-focus-monitor.subtree="(origin: FocusOrigin) => record(origin, '区域')"
      class="zone"
    >
      <button type="button" class="doc-btn">区域内按钮</button>
    </div>
    <div class="doc-output">{{ log.join('\n') || '（聚焦任意输入框查看来源）' }}</div>
    <p class="hint">聚焦元素会自动附带 vcdk-focused / vcdk-*-focused 标记类。</p>
  </div>
</template>

<style scoped>
.wrap {
  width: 100%;
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
