<script setup lang="ts">
import {ref} from 'vue';
import {useDialogData, useDialogRef} from 'vue-cdk/dialog';

interface ConfirmData {
  title: string;
  message: string;
}

const data = useDialogData<ConfirmData>();
const dialogRef = useDialogRef<string>();
const busy = ref(false);

/** 模拟异步操作，完成后携带结果关闭对话框。 */
function confirm(): void {
  busy.value = true;
  setTimeout(() => dialogRef.close(`已确认：${data.title}`), 600);
}
</script>

<template>
  <div class="confirm-dialog">
    <h3>{{ data.title }}</h3>
    <p id="alert-desc">{{ data.message }}</p>
    <div class="confirm-dialog-actions">
      <button class="btn" @click="dialogRef.close('取消')">取消</button>
      <button class="btn primary" :disabled="busy" @click="confirm">
        {{ busy ? '处理中…' : '确定' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.confirm-dialog {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  min-width: 360px;
  max-width: 90vw;
  box-shadow: 0 16px 48px rgba(31, 36, 48, 0.18);
}

.confirm-dialog h3 {
  margin: 0 0 10px;
}

.confirm-dialog p {
  margin: 0 0 20px;
  color: #6b7280;
  font-size: 14px;
}

.confirm-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
