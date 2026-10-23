<script setup lang="ts">
import {ref} from 'vue';
import {useDialog} from 'vue-cdk/dialog';
import CustomContainer from './CustomContainer.vue';
import CustomContainerContent from './CustomContainerContent.vue';

const dialog = useDialog();
const result = ref('');

/** 通过 config.container 传入自定义容器，数据仍走 contentProps / DIALOG_DATA 双通道。 */
function openWithCustomContainer(): void {
  const dialogRef = dialog.open(CustomContainerContent, {
    container: CustomContainer,
    data: {label: 'inject 通道：useDialogData()'},
    contentProps: {fromProps: 'props 通道：contentProps'},
  });
  dialogRef.closed.subscribe(value => {
    result.value = String(value ?? '未返回结果');
  });
}
</script>

<template>
  <div class="wrap">
    <button type="button" class="doc-btn primary" @click="openWithCustomContainer">
      打开自定义容器对话框
    </button>
    <span class="result">最近结果：{{ result || '—' }}</span>
    <p class="hint">
      自定义容器通过 config.container 传入并复用 useDialogContainerCore，
      获得焦点陷阱、ARIA 状态、数据注入与焦点恢复能力；内容与关闭结果通道不变。
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
