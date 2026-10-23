<script setup lang="ts">
import {onBeforeUnmount, ref, shallowRef} from 'vue';
import {TemplateRef, TemplatePortal, type TemplateRefHandle} from 'vue-cdk/portal';
import {useOverlay, type OverlayRef} from 'vue-cdk/overlay';
import {useLocale} from '../../composables/useLocale';

const {locale} = useLocale();
const t = (zh: string, en: string) => locale.value === 'en-US' ? en : zh;

const tpl = shallowRef<TemplateRefHandle<{label: string}> | null>(null);
const count = ref(0);
const overlay = useOverlay();
let panel: OverlayRef | null = null;

/** 打开由 TemplateRef 捕获的模板；调用方必须在模板 ref 就绪后再创建 Portal。 */
function open(): void {
  if (!tpl.value || panel?.hasAttached()) {
    return;
  }
  panel ??= overlay.create({hasBackdrop: true});
  panel.attach(new TemplatePortal(tpl.value, {label: t('计数', 'Count')}));
}

/** 关闭当前内容但保留出口，下一次打开会重新创建模板内容。 */
function close(): void {
  panel?.detach();
}

onBeforeUnmount(() => {
  panel?.dispose();
  panel = null;
});
</script>

<template>
  <TemplateRef ref="tpl" v-slot="{label}">
    <section class="dialog-card">
      <p class="dialog-title">{{ t('TemplateRef 内容', 'TemplateRef content') }}</p>
      <p class="dialog-count">{{ label }}：{{ count }}</p>
      <div class="controls">
        <button type="button" class="doc-btn primary" @click="count++">{{ t('增加', 'Increment') }}</button>
        <button type="button" class="doc-btn" @click="close">{{ t('关闭', 'Close') }}</button>
      </div>
    </section>
  </TemplateRef>

  <div class="wrap">
    <button type="button" class="doc-btn primary" @click="open">{{ t('打开 TemplateRef', 'Open TemplateRef') }}</button>
    <span class="result">{{ t('模板句柄由组件 ref 提供；关闭后再次打开会重新创建内容。', 'The template handle is exposed through a component ref; reopening after close creates new content.') }}</span>
  </div>
</template>

<style scoped>
.wrap {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.result {
  color: var(--doc-muted);
  font-size: 12px;
}

.dialog-card {
  min-width: 220px;
  padding: 20px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 12px 32px rgb(15 23 42 / 18%);
}

.dialog-title,
.dialog-count {
  margin: 0 0 12px;
}

.dialog-title {
  font-weight: 600;
}

.dialog-count {
  color: var(--doc-muted);
}

.controls {
  display: flex;
  gap: 8px;
}
</style>
