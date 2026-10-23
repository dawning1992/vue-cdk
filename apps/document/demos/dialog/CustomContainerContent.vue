<script setup lang="ts">
import {useDialogData, useDialogRef} from 'vue-cdk/dialog';

defineProps<{fromProps?: string}>();
const data = useDialogData<{label?: string}>();
const dialogRef = useDialogRef<string>();
</script>

<template>
  <div class="content">
    <h3>内容区（自定义容器内）</h3>
    <p>props 通道（contentProps）：{{ fromProps || '（未传）' }}</p>
    <p>inject 通道（useDialogData）：{{ data?.label ?? '（未传）' }}</p>
    <div class="actions">
      <button type="button" class="doc-btn primary" @click="dialogRef.close('自定义容器已关闭')">
        关闭并返回
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
