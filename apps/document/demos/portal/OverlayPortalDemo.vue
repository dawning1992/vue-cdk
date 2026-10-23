<script setup lang="ts">
import {onBeforeUnmount, ref, shallowRef} from 'vue';
import {TemplateRef, TemplatePortal, type TemplateRefHandle} from 'vue-cdk/portal';
import {useOverlay, type OverlayRef} from 'vue-cdk/overlay';
import {useLocale} from '../../composables/useLocale';

const {locale} = useLocale();
const t = (zh: string, en: string) => locale.value === 'en-US' ? en : zh;

const overlay = useOverlay();
const tpl = shallowRef<TemplateRefHandle | null>(null);
const clicks = ref(0);
const log = ref('');
let overlayRef: OverlayRef | null = null;

/** 以模板 Portal 向 overlay 挂载插槽，验证 overlay 分层构建在 portal 之上。 */
function openPanel(): void {
  if (!tpl.value || overlayRef?.hasAttached()) {
    return;
  }
  overlayRef = overlay.create({
    hasBackdrop: true,
    positionStrategy: overlay.position().global().centerHorizontally().centerVertically(),
    scrollStrategy: overlay.scrollStrategies.block(),
  });
  overlayRef.attach(new TemplatePortal(tpl.value));
  overlayRef.backdropClick().subscribe(() => closePanel());
  log.value = t('已打开：overlayRef.attach(TemplatePortal)', 'Opened: overlayRef.attach(TemplatePortal)');
}

/** 销毁浮层资源；父级计数保留，下一次打开创建新的内容视图。 */
function closePanel(): void {
  overlayRef?.detach();
  overlayRef?.dispose();
  overlayRef = null;
  log.value = t('已关闭', 'Closed');
}

onBeforeUnmount(() => {
  overlayRef?.dispose();
  overlayRef = null;
});
</script>

<template>
  <TemplateRef ref="tpl">
    <section style="padding: 24px; background: white">
      <p>{{ t('点击次数：', 'Click count: ') }}{{ clicks }}</p>
      <button @click="clicks++">{{ t('增加', 'Increment') }}</button>
      <button @click="closePanel">{{ t('关闭', 'Close') }}</button>
    </section>
  </TemplateRef>
  <div class="wrap">
    <button type="button" class="doc-btn primary" @click="openPanel">
      {{ t('用 TemplatePortal 打开浮层', 'Open overlay with TemplatePortal') }}
    </button>
    <span class="result">{{ log || '—' }}</span>
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
