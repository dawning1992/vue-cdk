<script setup lang="ts">
import {ref} from 'vue';
import {useDialog} from 'vue-cdk/dialog';
import {useLocale} from '../../composables/useLocale';
import ConfirmContent from './ConfirmContent.vue';

const dialog = useDialog();
const result = ref('');
const {locale} = useLocale();

/** 组件内容对话框：数据经 useDialogData 注入，关闭结果经 closed 流回传。 */
function openConfirm(): void {
  const dialogRef = dialog.open(ConfirmContent, {
    data: {
      title: locale.value === 'en-US' ? 'Delete confirmation' : '删除确认',
      message: locale.value === 'en-US' ? 'Delete this record? This action cannot be undone.' : '确定要删除这条记录吗？该操作不可撤销。',
    },
    panelClass: 'doc-dialog-panel',
  });
  dialogRef.closed.subscribe(value => {
    result.value = String(value ?? (locale.value === 'en-US' ? 'No result' : '未返回结果'));
  });
}
</script>

<template>
  <div class="wrap">
    <button type="button" class="doc-btn primary" @click="openConfirm">
      {{ locale === 'en-US' ? 'Open confirmation dialog' : '打开确认对话框' }}
    </button>
    <span class="result">{{ locale === 'en-US' ? 'Latest result: ' : '最近结果：' }}{{ result || '—' }}</span>
  </div>
</template>

<style scoped>
.wrap {
  display: flex;
  align-items: center;
  gap: 14px;
}

.result {
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
