<script setup lang="ts">
import {shallowRef} from 'vue';
import {useDialog} from 'vue-cdk/dialog';
import {useLocale} from '../../composables/useLocale';
import ConfirmContent from './ConfirmContent.vue';

const dialog = useDialog();
const result = shallowRef('');
const dialogId = shallowRef('');
const waiting = shallowRef(false);
const {locale} = useLocale();

/** 打开确认对话框，并通过 DialogRef.closedPromise 等待一次性关闭结果。 */
async function openAndWait(): Promise<void> {
  waiting.value = true;
  result.value = locale.value === 'en-US' ? 'Waiting for close…' : '等待关闭…';

  const dialogRef = dialog.open<string>(ConfirmContent, {
    data: {
      title: locale.value === 'en-US' ? 'Promise close result' : 'Promise 关闭结果',
      message: locale.value === 'en-US' ? 'Choose an action; the opener will receive the result through await.' : '请选择一个操作，打开方会通过 await 获取结果。',
    },
    panelClass: 'doc-dialog-panel',
  });

  // open() 仍立即返回 DialogRef，可在等待关闭前访问 id 或调用实例方法。
  dialogId.value = dialogRef.id;
  const value = await dialogRef.closedPromise;

  result.value = String(value ?? (locale.value === 'en-US' ? 'No result' : '未返回结果'));
  waiting.value = false;
}
</script>

<template>
  <div class="wrap">
    <button type="button" class="doc-btn primary" :disabled="waiting" @click="openAndWait">
      {{ waiting ? (locale === 'en-US' ? 'Waiting for dialog to close' : '等待对话框关闭') : (locale === 'en-US' ? 'Open and await result' : '打开并等待结果') }}
    </button>
    <div class="status">
      <span>DialogRef ID: {{ dialogId || '—' }}</span>
      <span>{{ locale === 'en-US' ? 'Close result: ' : '关闭结果：' }}{{ result || '—' }}</span>
    </div>
  </div>
</template>

<style scoped>
.wrap {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
}

.status {
  display: grid;
  gap: 4px;
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
