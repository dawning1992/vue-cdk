<script setup lang="ts">
import {useDialogData, useDialogRef} from 'vue-cdk/dialog';

interface ConfigData {
  role: string;
  note: string;
}

const data = useDialogData<ConfigData>();
const dialogRef = useDialogRef<string>();
</script>

<template>
  <div class="config-content">
    <h3>配置项对话框</h3>
    <p class="note">{{ data.note }}</p>
    <input class="doc-input" placeholder="第一个可聚焦输入框（autoFocus 目标）" />
    <div class="actions">
      <button type="button" class="doc-btn" @click="dialogRef.close('取消')">取消</button>
      <button type="button" class="doc-btn primary" @click="dialogRef.close('确定')">
        确定
      </button>
    </div>
    <p class="meta">role="{{ data.role }}"；点击「取消」是否生效取决于 closePredicate。</p>
  </div>
</template>

<style scoped>
.config-content {
  padding: 22px 26px;
  min-width: 340px;
}

.config-content h3 {
  margin: 0 0 8px;
  font-size: 16px;
}

.note {
  margin: 0 0 14px;
  color: var(--doc-muted);
  font-size: 13px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
}

.meta {
  margin: 12px 0 0;
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
