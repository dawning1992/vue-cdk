<script setup lang="ts">
import {useDialogData, useDialogRef} from 'vue-cdk/dialog';

const props = defineProps<{fromProps?: string}>();
const data = useDialogData<{label?: string}>();
const dialogRef = useDialogRef();
</script>

<template>
  <div class="data-dialog">
    <h3>数据双通道演示</h3>
    <p><b>props 通道</b>（contentProps）：{{ props.fromProps ?? '（未传）' }}</p>
    <p><b>inject 通道</b>（useDialogData）：{{ data?.label ?? '（未传）' }}</p>
    <div class="data-dialog-actions">
      <button class="btn" @click="dialogRef.close()">关闭</button>
    </div>
  </div>
</template>

<style scoped>
.data-dialog {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  min-width: 380px;
  max-width: 90vw;
  box-shadow: 0 16px 48px rgba(31, 36, 48, 0.18);
}

.data-dialog h3 {
  margin: 0 0 12px;
}

.data-dialog p {
  margin: 0 0 8px;
  font-size: 14px;
}

.data-dialog-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
