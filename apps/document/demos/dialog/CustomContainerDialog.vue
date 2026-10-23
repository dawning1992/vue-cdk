<script setup lang="ts">
import {ref} from 'vue';
import {useDialog} from 'vue-cdk/dialog';
import {useLocale} from '../../composables/useLocale';
import CustomContainer from './CustomContainer.vue';
import CustomContainerContent from './CustomContainerContent.vue';

const dialog = useDialog();
const result = ref('');
const {locale} = useLocale();

/** 通过 config.container 传入自定义容器，数据仍走 contentProps / DIALOG_DATA 双通道。 */
function openWithCustomContainer(): void {
  const dialogRef = dialog.open(CustomContainerContent, {
    container: CustomContainer,
    data: {label: locale.value === 'en-US' ? 'inject channel: useDialogData()' : 'inject 通道：useDialogData()'},
    contentProps: {fromProps: locale.value === 'en-US' ? 'props channel: contentProps' : 'props 通道：contentProps'},
  });
  dialogRef.closed.subscribe(value => {
    result.value = String(value ?? (locale.value === 'en-US' ? 'No result' : '未返回结果'));
  });
}
</script>

<template>
  <div class="wrap">
    <button type="button" class="doc-btn primary" @click="openWithCustomContainer">
      {{ locale === 'en-US' ? 'Open custom-container dialog' : '打开自定义容器对话框' }}
    </button>
    <span class="result">{{ locale === 'en-US' ? 'Latest result: ' : '最近结果：' }}{{ result || '—' }}</span>
    <p class="hint">
      {{ locale === 'en-US'
        ? 'The custom container is passed through config.container and reuses useDialogContainerCore for focus trapping, ARIA state, data injection, and focus restoration; content and close-result channels stay unchanged.'
        : '自定义容器通过 config.container 传入并复用 useDialogContainerCore，获得焦点陷阱、ARIA 状态、数据注入与焦点恢复能力；内容与关闭结果通道不变。'
      }}
    </p>
  </div>
</template>

<style scoped>
.wrap {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
}

.result {
  color: var(--doc-muted);
  font-size: 12px;
}

.hint {
  width: 100%;
  margin: 0;
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
