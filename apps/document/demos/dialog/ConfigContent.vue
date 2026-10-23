<script setup lang="ts">
import {useDialogData, useDialogRef} from 'vue-cdk/dialog';
import {useLocale} from '../../composables/useLocale';

interface ConfigData {
  role: string;
  note: string;
}

const data = useDialogData<ConfigData>();
const dialogRef = useDialogRef<string>();
const {locale} = useLocale();
</script>

<template>
  <div class="config-content">
    <h3>{{ locale === 'en-US' ? 'Configuration dialog' : '配置项对话框' }}</h3>
    <p class="note">{{ data.note }}</p>
    <input class="doc-input" :placeholder="locale === 'en-US' ? 'First focusable input (autoFocus target)' : '第一个可聚焦输入框（autoFocus 目标）'" />
    <div class="actions">
      <button type="button" class="doc-btn" @click="dialogRef.close(locale === 'en-US' ? 'Cancel' : '取消')">{{ locale === 'en-US' ? 'Cancel' : '取消' }}</button>
      <button type="button" class="doc-btn primary" @click="dialogRef.close(locale === 'en-US' ? 'Confirm' : '确定')">
        {{ locale === 'en-US' ? 'Confirm' : '确定' }}
      </button>
    </div>
    <p class="meta">{{ locale === 'en-US' ? `role="${data.role}"; whether Cancel works depends on closePredicate.` : `role="${data.role}"；点击「取消」是否生效取决于 closePredicate。` }}</p>
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
