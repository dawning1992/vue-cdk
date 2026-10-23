<script setup lang="ts">
import {useDialogData, useDialogRef} from 'vue-cdk/dialog';
import {useLocale} from '../../composables/useLocale';

interface ConfirmData {
  title: string;
  message: string;
}

const data = useDialogData<ConfirmData>();
const dialogRef = useDialogRef<string>();
const {locale} = useLocale();
</script>

<template>
  <div class="confirm">
    <h3>{{ data.title }}</h3>
    <p>{{ data.message }}</p>
    <div class="actions">
      <button type="button" class="doc-btn" @click="dialogRef.close(locale === 'en-US' ? 'Cancel' : '取消')">{{ locale === 'en-US' ? 'Cancel' : '取消' }}</button>
      <button type="button" class="doc-btn primary" @click="dialogRef.close(locale === 'en-US' ? 'Confirm' : '确定')">
        {{ locale === 'en-US' ? 'Confirm' : '确定' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.confirm {
  padding: 22px 26px;
  min-width: 320px;
}

.confirm h3 {
  margin: 0 0 8px;
  font-size: 16px;
}

.confirm p {
  margin: 0 0 18px;
  color: var(--doc-muted);
  font-size: 13px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
