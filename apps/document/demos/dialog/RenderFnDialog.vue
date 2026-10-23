<script setup lang="ts">
import {h, ref} from 'vue';
import {useDialog, type DialogRef} from 'vue-cdk/dialog';
import {useLocale} from '../../composables/useLocale';

const dialog = useDialog();
const result = ref('');
const {locale} = useLocale();

/** 专门演示兼容的渲染函数 API，因此保留 h()；上下文含 $implicit 与 dialogRef。 */
function openRenderFn(): void {
  const dialogRef = dialog.open(
    (ctx: Record<string, unknown>) =>
      h(
        'div',
        {style: {padding: '22px 26px', minWidth: '320px'}},
        [
          h('h3', {style: {margin: '0 0 8px', fontSize: '16px'}}, locale.value === 'en-US' ? 'Render-function content' : '渲染函数内容'),
          h(
            'p',
            {style: {margin: '0 0 18px', color: '#6b7280', fontSize: '13px'}},
            `${locale.value === 'en-US' ? '$implicit (data): ' : '$implicit（data）：'}${(ctx.$implicit as {name: string}).name}`,
          ),
          h(
            'div',
            {style: {display: 'flex', justifyContent: 'flex-end'}},
            [
              h(
                'button',
                {
                  class: 'doc-btn primary',
                  onClick: () => (ctx.dialogRef as DialogRef).close(locale.value === 'en-US' ? 'Closed' : '已关闭'),
                },
                locale.value === 'en-US' ? 'Close and return' : '关闭并返回',
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
    result.value = String(value ?? (locale.value === 'en-US' ? 'No result' : '未返回结果'));
  });
}
</script>

<template>
  <div class="wrap">
    <button type="button" class="doc-btn primary" @click="openRenderFn">
      {{ locale === 'en-US' ? 'Open render-function dialog' : '打开渲染函数对话框' }}
    </button>
    <span class="result">{{ locale === 'en-US' ? 'Latest result: ' : '最近结果：' }}{{ result || '—' }}</span>
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
