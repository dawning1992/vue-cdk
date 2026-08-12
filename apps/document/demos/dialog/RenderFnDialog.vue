<script setup lang="ts">
import {h, ref} from 'vue';
import {useDialog, type DialogRef} from 'vue-cdk/dialog';

const dialog = useDialog();
const result = ref('');

/** 渲染函数内容：等价 Angular 的 TemplateRef，上下文含 $implicit 与 dialogRef。 */
function openRenderFn(): void {
  const dialogRef = dialog.open(
    (ctx: Record<string, unknown>) =>
      h(
        'div',
        {style: {padding: '22px 26px', minWidth: '320px'}},
        [
          h('h3', {style: {margin: '0 0 8px', fontSize: '16px'}}, '渲染函数内容'),
          h(
            'p',
            {style: {margin: '0 0 18px', color: '#6b7280', fontSize: '13px'}},
            `$implicit（data）：${(ctx.$implicit as {name: string}).name}`,
          ),
          h(
            'div',
            {style: {display: 'flex', justifyContent: 'flex-end'}},
            [
              h(
                'button',
                {
                  class: 'doc-btn primary',
                  onClick: () => (ctx.dialogRef as DialogRef).close('已关闭'),
                },
                '关闭并返回',
              ),
            ],
          ),
        ],
      ),
    {
      data: {name: 'Vue CDK'},
      panelClass: 'doc-dialog-panel',
    },
  );
  dialogRef.closed.subscribe(value => {
    result.value = String(value ?? '未返回结果');
  });
}
</script>

<template>
  <div class="wrap">
    <button type="button" class="doc-btn primary" @click="openRenderFn">
      打开渲染函数对话框
    </button>
    <span class="result">最近结果：{{ result || '—' }}</span>
  </div>
</template>

<style scoped>
.wrap {
  display: flex;
  align-items: center;
  gap: 14px;
}

.result {
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
