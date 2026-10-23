<script setup lang="ts">
import {ref, watch} from 'vue';
import {useLocale} from '../../composables/useLocale';
import {
  getEventTarget,
  hasModifierKey,
  isBrowser,
  supportsPopover,
  supportsShadowDom,
  supportsScrollBehavior,
} from 'vue-cdk/platform';

const output = ref('');
const {locale} = useLocale();
const keyResult = ref(locale.value === 'en-US' ? 'Press a key in the input below (try Shift / Ctrl / Alt / Meta)' : '请在下框内按键（试试 Shift / Ctrl / Alt / Meta）');
watch(locale, value => {
  keyResult.value = value === 'en-US'
    ? 'Press a key in the input below (try Shift / Ctrl / Alt / Meta)'
    : '请在下框内按键（试试 Shift / Ctrl / Alt / Meta）';
});

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
    `${locale.value === 'en-US' ? 'Key' : '按键'}: ${event.key}; target: ${target?.tagName ?? 'null'}; ` +
    `hasModifierKey() = ${hasModifierKey(event)}; ` +
    `hasModifierKey(event, 'ctrlKey') = ${hasModifierKey(event, 'ctrlKey')}`;
}
</script>

<template>
  <div class="wrap">
    <button type="button" class="doc-btn primary" @click="detect">{{ locale === 'en-US' ? 'Run capability checks' : '运行能力检测' }}</button>
    <input
      class="doc-input key-input"
      :placeholder="locale === 'en-US' ? 'Focus and press a key to test hasModifierKey' : '聚焦后按键，测试 hasModifierKey'"
      @keydown="onKeydown"
    />
    <pre class="doc-output">{{ output || (locale === 'en-US' ? 'Click the button to inspect environment checks' : '点击按钮查看环境检测结果') }}</pre>
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
