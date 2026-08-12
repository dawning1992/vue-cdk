<script setup lang="ts">
import {defineComponent, h, ref} from 'vue';
import {useDialog, useDialogData, useDialogRef} from 'vue-cdk/dialog';
import CustomContainer from './CustomContainer.vue';

const dialog = useDialog();
const result = ref('');

/** 内容组件：通过 useDialogData / useDialogRef 消费自定义容器注入的数据与关闭能力。 */
const Content = defineComponent({
  name: 'CustomContainerContent',
  props: {
    fromProps: {type: String, default: ''},
  },
  setup(props) {
    const data = useDialogData<{label?: string}>();
    const dialogRef = useDialogRef<string>();
    return () =>
      h('div', {style: {padding: '8px 4px'}}, [
        h('h3', {style: {margin: '0 0 10px', fontSize: '16px'}}, '内容区（自定义容器内）'),
        h(
          'p',
          {style: {margin: '0 0 8px', color: '#6b7280', fontSize: '13px'}},
          `props 通道（contentProps）：${props.fromProps || '（未传）'}`,
        ),
        h(
          'p',
          {style: {margin: '0 0 18px', color: '#6b7280', fontSize: '13px'}},
          `inject 通道（useDialogData）：${data?.label ?? '（未传）'}`,
        ),
        h(
          'div',
          {style: {display: 'flex', justifyContent: 'flex-end'}},
          [
            h(
              'button',
              {class: 'doc-btn primary', onClick: () => dialogRef.close('自定义容器已关闭')},
              '关闭并返回',
            ),
          ],
        ),
      ]);
  },
});

/** 通过 config.container 传入自定义容器，数据仍走 contentProps / DIALOG_DATA 双通道。 */
function openWithCustomContainer(): void {
  const dialogRef = dialog.open(Content, {
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
