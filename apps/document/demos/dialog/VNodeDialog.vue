<script setup lang="ts">
// 本例专门展示 VNode 输入和动态组件构造，因此保留 h()。
import {defineComponent, h, ref} from 'vue';
import {useDialog, useDialogData, useDialogRef} from 'vue-cdk/dialog';
import {useLocale} from '../../composables/useLocale';

const dialog = useDialog();
const result = ref('');
const {locale} = useLocale();

/** VNode 内容里嵌套的组件：通过 useDialogData / useDialogRef 消费注入通道。 */
const VNodeContent = defineComponent({
  name: 'VNodeContent',
  setup() {
    const data = useDialogData<{name: string}>();
    const dialogRef = useDialogRef<string>();
    return () =>
      h('div', {style: {padding: '22px 26px', minWidth: '320px'}}, [
        h('h3', {style: {margin: '0 0 8px', fontSize: '16px'}}, locale.value === 'en-US' ? 'VNode content' : 'VNode 内容'),
        h(
          'p',
          {style: {margin: '0 0 18px', color: '#6b7280', fontSize: '13px'}},
          `${locale.value === 'en-US' ? 'data injected through DIALOG_DATA: ' : 'data 经 DIALOG_DATA 注入：'}${data?.name ?? (locale.value === 'en-US' ? '(none)' : '（无）')}`,
        ),
        h(
          'div',
          {style: {display: 'flex', justifyContent: 'flex-end'}},
          [
            h(
              'button',
              {class: 'doc-btn primary', onClick: () => dialogRef.close(locale.value === 'en-US' ? 'VNode closed' : 'VNode 已关闭')},
              locale.value === 'en-US' ? 'Close and return' : '关闭并返回',
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
        h('h3', {style: {margin: '0 0 8px', fontSize: '16px'}}, locale.value === 'en-US' ? 'contentProps channel' : 'contentProps 通道'),
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
              {class: 'doc-btn primary', onClick: () => dialogRef.close(locale.value === 'en-US' ? 'Props closed' : 'props 已关闭')},
              locale.value === 'en-US' ? 'Close and return' : '关闭并返回',
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
    result.value = String(value ?? (locale.value === 'en-US' ? 'No result' : '未返回结果'));
  });
}

function openProps(): void {
  const dialogRef = dialog.open(PropsContent, {
    contentProps: {viaProps: locale.value === 'en-US' ? 'A string from contentProps' : '来自 contentProps 的字符串'},
    panelClass: 'doc-dialog-panel',
  });
  dialogRef.closed.subscribe(value => {
    result.value = String(value ?? (locale.value === 'en-US' ? 'No result' : '未返回结果'));
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
          `$implicit = ${JSON.stringify(ctx.$implicit)}${locale.value === 'en-US' ? '; extra = ' : '；extra = '}${ctx.extra as string}`,
        ),
        h(
          'div',
          {style: {display: 'flex', justifyContent: 'flex-end'}},
          [
            h(
              'button',
              {
                class: 'doc-btn primary',
                onClick: () => (ctx.dialogRef as {close(v: string): void}).close(locale.value === 'en-US' ? 'Context closed' : 'ctx 已关闭'),
              },
              locale.value === 'en-US' ? 'Close and return' : '关闭并返回',
            ),
          ],
        ),
      ]),
    {
      data: {from: 'data'},
      templateContext: {extra: locale.value === 'en-US' ? 'from templateContext' : '来自 templateContext'},
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
    <div class="buttons">
      <button type="button" class="doc-btn primary" @click="openVNode">{{ locale === 'en-US' ? 'VNode + useDialogData' : 'VNode + useDialogData' }}</button>
      <button type="button" class="doc-btn" @click="openProps">{{ locale === 'en-US' ? 'Component + contentProps' : '组件 + contentProps' }}</button>
      <button type="button" class="doc-btn" @click="openTemplateContext">{{ locale === 'en-US' ? 'Render function + templateContext' : '渲染函数 + templateContext' }}</button>
    </div>
    <span class="result">{{ locale === 'en-US' ? 'Latest result: ' : '最近结果：' }}{{ result || '—' }}</span>
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
