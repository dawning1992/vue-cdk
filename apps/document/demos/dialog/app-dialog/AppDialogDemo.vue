<script setup lang="ts">
import {ref} from 'vue';
import {useLocale} from '../../../composables/useLocale';
import ConfirmDialog from './ConfirmDialog.vue';
import {useAppDialog} from './useAppDialog';

const dialog = useAppDialog();
const {locale} = useLocale();
const result = ref('');

/** 演示用单次 width 配置覆盖 useAppDialog() 的项目默认尺寸。 */
async function openConfirm(): Promise<void> {
  const title = locale.value === 'en-US' ? 'Delete confirmation' : '删除确认';
  const dialogRef = dialog.open<boolean, {title: string; message: string}>(ConfirmDialog, {
    data: {
      title,
      message:
        locale.value === 'en-US'
          ? 'Delete this record? This action cannot be undone.'
          : '确定要删除这条记录吗？该操作不可撤销。',
    },
    ariaLabel: title,
    width: 'min(480px, calc(100vw - 32px))',
  });

  const value = await dialogRef.closedPromise;
  result.value = value === undefined ? 'undefined' : String(value);
}
</script>

<template>
  <div class="app-dialog-demo">
    <button type="button" class="doc-btn primary" @click="openConfirm">
      {{ locale === 'en-US' ? 'Open AppDialog confirmation' : '打开 AppDialog 确认框' }}
    </button>
    <span class="result">
      {{ locale === 'en-US' ? 'Latest result: ' : '最近结果：' }}{{ result || '—' }}
    </span>
  </div>
</template>

<style scoped>
.app-dialog-demo {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
}

.result {
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
