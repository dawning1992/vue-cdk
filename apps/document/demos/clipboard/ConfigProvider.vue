<script setup lang="ts">
import {provideCopyToClipboardConfig} from 'vue-cdk/clipboard';
import ConfigCopyButton from './ConfigCopyButton.vue';
import {useLocale} from '../../composables/useLocale';

defineProps<{text: string}>();

// 向本组件子树提供默认重试次数：后代指令绑定未显式传 attempts 时生效。
provideCopyToClipboardConfig({attempts: 3});
const {locale} = useLocale();
</script>

<template>
  <div class="config-provider">
    <ConfigCopyButton :text="text" />
    <p class="hint">
      {{ locale === 'en-US'
        ? 'This subtree receives attempts=3 from ConfigProvider through provideCopyToClipboardConfig; the app-level equivalent is app.provide(CDK_COPY_TO_CLIPBOARD_CONFIG, {attempts: 3}).'
        : '该区域由 ConfigProvider 通过 provideCopyToClipboardConfig 提供默认 attempts=3；App 级全局配置等价写法为 app.provide(CDK_COPY_TO_CLIPBOARD_CONFIG, {attempts: 3})。'
      }}
    </p>
  </div>
</template>

<style scoped>
.config-provider {
  border: 1px dashed var(--doc-border);
  border-radius: 8px;
  padding: 12px 14px;
  background: #fafbfe;
  display: grid;
  gap: 8px;
}

.hint {
  margin: 0;
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
