<script setup lang="ts">
import {h, onBeforeUnmount, ref} from 'vue';
import {useDialog, type DialogRef} from 'vue-cdk/dialog';

const dialog = useDialog();
const openDialogs = ref<readonly DialogRef[]>([]);
const log = ref<string[]>([]);
const queryResult = ref('');

function push(message: string): void {
  log.value.unshift(`[${new Date().toLocaleTimeString()}] ${message}`);
  if (log.value.length > 6) {
    log.value.pop();
  }
}

function refreshStack(): void {
  openDialogs.value = dialog.openDialogs;
}

/** 打开指定 id 的对话框；内容为渲染函数，关闭时返回自身 id。 */
function openDialog(id: 'dialog-a' | 'dialog-b'): void {
  const dialogRef = dialog.open(
    (ctx: Record<string, unknown>) =>
      h('div', {style: {padding: '22px 26px', minWidth: '300px'}}, [
        h(
          'h3',
          {style: {margin: '0 0 8px', fontSize: '16px'}},
          id === 'dialog-a' ? '对话框 A' : '对话框 B',
        ),
        h(
          'p',
          {style: {margin: '0 0 18px', color: '#6b7280', fontSize: '13px'}},
          `id = ${id}；再打开一个对话框后，关闭顺序按 LIFO（后进先出）。`,
        ),
        h(
          'div',
          {style: {display: 'flex', justifyContent: 'flex-end'}},
          [
            h(
              'button',
              {
                class: 'doc-btn primary',
                onClick: () => (ctx.dialogRef as DialogRef).close(id),
              },
              '关闭',
            ),
          ],
        ),
      ]),
    {id, panelClass: 'doc-dialog-panel'},
  );
  dialogRef.closed.subscribe(value => {
    push(`closed：${String(value)}`);
    refreshStack();
  });
  refreshStack();
  push(`opened：${id}`);
}

function closeAll(): void {
  dialog.closeAll();
  push('closeAll：按 LIFO 依次关闭');
}

function queryById(): void {
  const ref = dialog.getDialogById('dialog-a');
  queryResult.value = ref ? `找到 dialog-a（id=${ref.id}）` : 'dialog-a 未打开';
}

// 订阅服务级事件流：afterOpened / afterAllClosed（注意 afterAllClosed 在无打开对话框时立即触发一次）。
const unsubscribeOpened = dialog.afterOpened.subscribe(ref => push(`afterOpened：${ref.id}`));
const unsubscribeAllClosed = dialog.afterAllClosed.subscribe(() => {
  push('afterAllClosed：全部对话框已关闭');
  refreshStack();
});

onBeforeUnmount(() => {
  unsubscribeOpened();
  unsubscribeAllClosed();
  dialog.closeAll();
});
</script>

<template>
  <div class="wrap">
    <div class="buttons">
      <button type="button" class="doc-btn primary" @click="openDialog('dialog-a')">
        打开对话框 A
      </button>
      <button type="button" class="doc-btn primary" @click="openDialog('dialog-b')">
        打开对话框 B
      </button>
      <button type="button" class="doc-btn" @click="closeAll">closeAll</button>
      <button type="button" class="doc-btn" @click="queryById">getDialogById('dialog-a')</button>
    </div>

    <div class="info">
      当前打开（后进优先）：{{ openDialogs.length ? openDialogs.map(d => d.id).join(' → ') : '无' }}
    </div>
    <div class="doc-output">{{ log.join('\n') || '打开对话框观察服务级事件流' }}</div>
    <p class="hint">{{ queryResult || 'getDialogById 可查询任意已打开对话框' }}</p>
  </div>
</template>

<style scoped>
.wrap {
  width: 100%;
}

.buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.info {
  margin-bottom: 10px;
  font-size: 12px;
  color: var(--doc-primary);
}

.hint {
  margin: 10px 0 0;
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
