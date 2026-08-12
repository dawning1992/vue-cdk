<script setup lang="ts">
import {ref} from 'vue';
import {useDialog} from 'vue-cdk/dialog';
import ConfirmContent from './ConfirmContent.vue';

const dialog = useDialog();
const result = ref('');

/** 组件内容对话框：数据经 useDialogData 注入，关闭结果经 closed 流回传。 */
function openConfirm(): void {
  const dialogRef = dialog.open(ConfirmContent, {
    data: {title: '删除确认', message: '确定要删除这条记录吗？该操作不可撤销。'},
    panelClass: 'doc-dialog-panel',
  });
  dialogRef.closed.subscribe(value => {
    result.value = String(value ?? '未返回结果');
  });
}
</script>

<template>
  <div class="wrap">
    <button type="button" class="doc-btn primary" @click="openConfirm">
      打开确认对话框
    </button>
    <span class="result">最近结果：{{ result || '—' }}</span>
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
