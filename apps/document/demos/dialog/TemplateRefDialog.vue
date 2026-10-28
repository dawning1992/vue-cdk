<script setup lang="ts">
import {ref, shallowRef} from 'vue';
import {useDialog, type DialogRef} from 'vue-cdk/dialog';
import {TemplateRef, type TemplateRefHandle} from 'vue-cdk/portal';
import {useLocale} from '../../composables/useLocale';

/** 模板插槽接收的数据与关闭引用，由 dialog.open 注入。 */
interface TemplateContext {
  $implicit: string;
  dialogRef: DialogRef;
}

const {locale} = useLocale();
const dialog = useDialog();
const template = shallowRef<TemplateRefHandle<TemplateContext> | null>(null);
const count = ref(0);

/** 模板 ref 就绪后直接打开；来源卸载时服务自动销毁对应对话框。 */
function open(): void {
  if (!template.value) return;
  dialog.open(template.value, {
    data: locale.value === 'en-US' ? 'Template dialog' : '模板对话框',
    ariaLabel: locale.value === 'en-US' ? 'Template dialog' : '模板对话框',
  });
}
</script>

<template>
  <button type="button" class="doc-btn primary" @click="open">
    {{ locale === 'en-US' ? 'Open template dialog' : '打开模板对话框' }}
  </button>
  <TemplateRef ref="template" v-slot="{$implicit, dialogRef}">
    <section class="template-dialog">
      <h3>{{ $implicit }}</h3>
      <p>{{ locale === 'en-US' ? 'Count' : '计数' }}：{{ count }}</p>
      <button type="button" class="doc-btn" @click="count++">+1</button>
      <button type="button" class="doc-btn" @click="dialogRef.close()">
        {{ locale === 'en-US' ? 'Close' : '关闭' }}
      </button>
    </section>
  </TemplateRef>
</template>

<style scoped>
.template-dialog { padding: 24px; background: var(--doc-card); color: var(--doc-text); border-radius: 12px; }
.template-dialog h3 { margin: 0 0 16px; }
.template-dialog .doc-btn + .doc-btn { margin-left: 8px; }
</style>
