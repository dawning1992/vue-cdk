<script setup lang="ts">
import {defineComponent, h, ref} from 'vue';
import {useDialog, useDialogData, useDialogRef} from 'vue-cdk/dialog';

const dialog = useDialog();
const result = ref('');

/** VNode 内容里嵌套的组件：通过 useDialogData / useDialogRef 消费注入通道。 */
const VNodeContent = defineComponent({
  name: 'VNodeContent',
  setup() {
    const data = useDialogData<{name: string}>();
    const dialogRef = useDialogRef<string>();
    return () =>
      h('div', {style: {padding: '22px 26px', minWidth: '320px'}}, [
        h('h3', {style: {margin: '0 0 8px', fontSize: '16px'}}, 'VNode 内容'),
        h(
          'p',
          {style: {margin: '0 0 18px', color: '#6b7280', fontSize: '13px'}},
          `data 经 DIALOG_DATA 注入：${data?.name ?? '（无）'}`,
        ),
        h(
          'div',
          {style: {display: 'flex', justifyContent: 'flex-end'}},
          [
            h(
              'button',
              {class: 'doc-btn primary', onClick: () => dialogRef.close('VNode 已关闭')},
              '关闭并返回',
            ),
          ],
        ),
      ]);
  },
});

/** 组件内容：演示 contentProps 通道（Vue 特有 props 注入）。 */
const PropsContent = defineComponent({
  name: 'PropsContent',
  props: {
    viaProps: {type: String, default: ''},
  },
  setup(props) {
    const dialogRef = useDialogRef<string>();
    return () =>
      h('div', {style: {padding: '22px 26px', minWidth: '320px'}}, [
        h('h3', {style: {margin: '0 0 8px', fontSize: '16px'}}, 'contentProps 通道'),
        h(
          'p',
          {style: {margin: '0 0 18px', color: '#6b7280', fontSize: '13px'}},
          `contentProps.viaProps = ${props.viaProps}`,
        ),
        h(
          'div',
          {style: {display: 'flex', justifyContent: 'flex-end'}},
          [
            h(
              'button',
              {class: 'doc-btn primary', onClick: () => dialogRef.close('props 已关闭')},
              '关闭并返回',
            ),
          ],
        ),
      ]);
  },
});

function openVNode(): void {
  const dialogRef = dialog.open(h(VNodeContent), {
    data: {name: 'Vue CDK'},
    panelClass: 'doc-dialog-panel',
  });
  dialogRef.closed.subscribe(value => {
    result.value = String(value ?? '未返回结果');
  });
}

function openProps(): void {
  const dialogRef = dialog.open(PropsContent, {
    contentProps: {viaProps: '来自 contentProps 的字符串'},
    panelClass: 'doc-dialog-panel',
  });
  dialogRef.closed.subscribe(value => {
    result.value = String(value ?? '未返回结果');
  });
}

function openTemplateContext(): void {
  const dialogRef = dialog.open(
    (ctx: Record<string, unknown>) =>
      h('div', {style: {padding: '22px 26px', minWidth: '320px'}}, [
        h('h3', {style: {margin: '0 0 8px', fontSize: '16px'}}, 'templateContext'),
        h(
          'p',
          {style: {margin: '0 0 18px', color: '#6b7280', fontSize: '13px'}},
          `$implicit = ${JSON.stringify(ctx.$implicit)}；extra = ${ctx.extra as string}`,
        ),
        h(
          'div',
          {style: {display: 'flex', justifyContent: 'flex-end'}},
          [
            h(
              'button',
              {
                class: 'doc-btn primary',
                onClick: () => (ctx.dialogRef as {close(v: string): void}).close('ctx 已关闭'),
              },
              '关闭并返回',
            ),
          ],
        ),
      ]),
    {
      data: {from: 'data'},
      templateContext: {extra: '来自 templateContext'},
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
    <div class="buttons">
      <button type="button" class="doc-btn primary" @click="openVNode">VNode + useDialogData</button>
      <button type="button" class="doc-btn" @click="openProps">组件 + contentProps</button>
      <button type="button" class="doc-btn" @click="openTemplateContext">渲染函数 + templateContext</button>
    </div>
    <span class="result">最近结果：{{ result || '—' }}</span>
  </div>
</template>

<style scoped>
.wrap {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
}

.buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.result {
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
