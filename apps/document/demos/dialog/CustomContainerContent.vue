<script setup lang="ts">
import {useDialogData, useDialogRef} from 'vue-cdk/dialog';
import {useLocale} from '../../composables/useLocale';

defineProps<{fromProps?: string}>();
const data = useDialogData<{label?: string}>();
const dialogRef = useDialogRef<string>();
const {locale} = useLocale();
</script>

<template>
  <div class="content">
    <h3>{{ locale === 'en-US' ? 'Content area (inside custom container)' : '内容区（自定义容器内）' }}</h3>
    <p>{{ locale === 'en-US' ? 'props channel (contentProps): ' : 'props 通道（contentProps）：' }}{{ fromProps || (locale === 'en-US' ? '(not provided)' : '（未传）') }}</p>
    <p>{{ locale === 'en-US' ? 'inject channel (useDialogData): ' : 'inject 通道（useDialogData）：' }}{{ data?.label ?? (locale === 'en-US' ? '(not provided)' : '（未传）') }}</p>
    <div class="actions">
      <button type="button" class="doc-btn primary" @click="dialogRef.close(locale === 'en-US' ? 'Custom container closed' : '自定义容器已关闭')">
        {{ locale === 'en-US' ? 'Close and return' : '关闭并返回' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.content { padding: 8px 4px; }
.content h3 { margin: 0 0 10px; font-size: 16px; }
.content p { margin: 0 0 8px; color: #6b7280; font-size: 13px; }
.content p:nth-of-type(2) { margin-bottom: 18px; }
.actions { display: flex; justify-content: flex-end; }
</style>
