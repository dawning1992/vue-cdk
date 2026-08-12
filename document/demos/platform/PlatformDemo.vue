<script setup lang="ts">
import {ref} from 'vue';
import {
  getEventTarget,
  hasModifierKey,
  isBrowser,
  supportsPopover,
  supportsShadowDom,
  supportsScrollBehavior,
} from 'vue-cdk/platform';

const output = ref('');
const keyResult = ref('请在下框内按键（试试 Shift / Ctrl / Alt / Meta）');

function detect(): void {
  output.value = [
    `isBrowser() = ${isBrowser()}`,
    `supportsPopover() = ${supportsPopover()}`,
    `supportsShadowDom() = ${supportsShadowDom()}`,
    `supportsScrollBehavior() = ${supportsScrollBehavior()}`,
  ].join('\n');
}

function onKeydown(event: KeyboardEvent): void {
  const target = getEventTarget(event);
  keyResult.value =
    `按键：${event.key}；target：${target?.tagName ?? 'null'}；` +
    `hasModifierKey() = ${hasModifierKey(event)}；` +
    `hasModifierKey(event, 'ctrlKey') = ${hasModifierKey(event, 'ctrlKey')}`;
}
</script>

<template>
  <div class="wrap">
    <button type="button" class="doc-btn primary" @click="detect">运行能力检测</button>
    <input
      class="doc-input key-input"
      placeholder="聚焦后按键，测试 hasModifierKey"
      @keydown="onKeydown"
    />
    <pre class="doc-output">{{ output || '点击按钮查看环境检测结果' }}</pre>
    <div class="doc-output">{{ keyResult }}</div>
  </div>
</template>

<style scoped>
.wrap {
  width: 100%;
}

.key-input {
  margin-left: 10px;
  min-width: 260px;
}
</style>
