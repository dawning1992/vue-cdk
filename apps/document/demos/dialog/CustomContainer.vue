<script setup lang="ts">
import {computed} from 'vue';
import {
  normalizeDialogContent,
  useDialogContainerCore,
  type DialogConfig,
  type DialogContainerInstance,
  type DialogContent,
} from 'vue-cdk/dialog';
import type {DialogRef} from 'vue-cdk/dialog';

const props = defineProps<{
  config: DialogConfig;
  dialogRef: DialogRef;
  content: DialogContent;
  onContainerReady?: (instance: DialogContainerInstance) => void;
}>();

// 复用默认容器的焦点陷阱 / ARIA 状态 / 数据注入 / 焦点恢复行为。
const {containerEl} = useDialogContainerCore(props);
const contentVNode = computed(() =>
  normalizeDialogContent(props.content, props.config, props.dialogRef),
);

/** 把根元素绑定到容器的 containerEl ref（供焦点陷阱使用）。 */
function setContainerElement(el: unknown): void {
  containerEl.value = (el as HTMLElement | null) ?? null;
}
</script>

<template>
  <div :ref="setContainerElement" class="custom-container" tabindex="-1">
    <header class="custom-container-header">
      <span class="custom-container-title">自定义容器（复用 useDialogContainerCore）</span>
      <button class="custom-container-close" aria-label="关闭" @click="props.dialogRef.close()">
        ×
      </button>
    </header>
    <div class="custom-container-body">
      <component :is="contentVNode" />
    </div>
  </div>
</template>

<style scoped>
.custom-container {
  background: linear-gradient(160deg, #fdf6ff 0%, #ffffff 100%);
  border: 2px solid #d8b4fe;
  border-radius: 14px;
  width: 440px;
  max-width: 92vw;
  overflow: hidden;
  outline: none;
}

.custom-container-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #a855f7;
  color: #fff;
}

.custom-container-title {
  font-weight: 600;
  font-size: 14px;
}

.custom-container-close {
  appearance: none;
  border: none;
  background: transparent;
  color: #fff;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  padding: 0 4px;
}

.custom-container-body {
  padding: 16px;
}
</style>
