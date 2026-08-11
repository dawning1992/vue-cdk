<script setup lang="ts">
/**
 * 对话框内容：演示命令式 overlay 可以弹出完整的 .vue 单文件组件。
 * 模板、脚本与（作用域）样式全部封装在本文件内。
 */
defineProps<{
  /** 由宿主传入的关闭回调。 */
  onClose: () => void;
}>();
</script>

<template>
  <div class="dialog-overlay">
    <h3>确认操作</h3>
    <p>
      这是一个真正的 <code>.vue</code> 单文件组件（template + style + script），
      由 <code>useOverlay().attach(() =&gt; h(DialogContent, ...))</code> 命令式弹出。
    </p>
    <div class="dialog-actions">
      <button class="btn" @click="onClose">取消</button>
      <button class="btn primary" @click="onClose">确定</button>
    </div>
  </div>
</template>

<style scoped>
.dialog-overlay {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
  padding: 24px;
  width: 380px;
  max-width: 90vw;
}

.dialog-overlay h3 {
  margin: 0 0 12px;
}

.dialog-overlay p {
  margin: 0 0 16px;
  color: #6b7280;
  font-size: 14px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
