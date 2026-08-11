<script setup lang="ts">
import {computed, getCurrentInstance, type Component} from 'vue';
import {dialogService, useDialogRef} from 'vue-cdk/dialog';

const props = defineProps<{level?: number}>();
const dialogRef = useDialogRef<string>();
const level = computed(() => props.level ?? 1);

// 通过当前组件实例的类型实现自引用（script setup 中组件名不可直接自引用）。
const selfComponent = getCurrentInstance()?.type as Component | undefined;

/** 在对话框内再打开一层对话框，演示堆叠与 ESC 只关最上层。 */
function openChild(): void {
  if (!selfComponent) {
    return;
  }
  dialogService.open(selfComponent, {
    data: {level: level.value + 1},
    width: level.value >= 2 ? '300px' : '360px',
    panelClass: 'demo-dialog-panel',
  });
}
</script>

<template>
  <div class="nested-dialog">
    <h3>第 {{ level }} 层对话框</h3>
    <p>从对话框内再打开对话框（堆叠）。按 ESC 只会关闭最上层。</p>
    <div class="nested-dialog-actions">
      <button class="btn" @click="dialogRef.close(`第 ${level} 层已关闭`)">关闭本层</button>
      <button v-if="level < 3" class="btn primary" @click="openChild">打开下一层</button>
    </div>
  </div>
</template>

<style scoped>
.nested-dialog {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  min-width: 340px;
  max-width: 90vw;
  box-shadow: 0 16px 48px rgba(31, 36, 48, 0.18);
}

.nested-dialog h3 {
  margin: 0 0 8px;
}

.nested-dialog p {
  margin: 0 0 18px;
  color: #6b7280;
  font-size: 14px;
}

.nested-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
