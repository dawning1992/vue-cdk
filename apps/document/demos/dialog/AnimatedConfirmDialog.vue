<script setup lang="ts">
import {useDialogData, useDialogRef} from 'vue-cdk/dialog';
import {useLocale} from '../../composables/useLocale';
import AppDialogActions from './app-dialog/AppDialogActions.vue';
import AppDialogContent from './app-dialog/AppDialogContent.vue';
import AppDialogTitle from './app-dialog/AppDialogTitle.vue';

interface DialogData {
  title: string;
  message: string;
}

const data = useDialogData<DialogData>();
const dialogRef = useDialogRef<boolean>();
const {locale} = useLocale();
</script>

<template>
  <div>
    <AppDialogTitle>{{ data.title }}</AppDialogTitle>
    <AppDialogContent><p>{{ data.message }}</p></AppDialogContent>
    <AppDialogActions>
      <button type="button" class="doc-btn" @click="dialogRef.close(false)">
        {{ locale === 'en-US' ? 'Cancel' : '取消' }}
      </button>
      <button type="button" class="doc-btn primary" @click="dialogRef.close(true)">
        {{ locale === 'en-US' ? 'Confirm' : '确认' }}
      </button>
    </AppDialogActions>
  </div>
</template>
