<script setup lang="ts">
import {onBeforeUnmount, ref, shallowRef} from 'vue';
import {useLocale} from '../../composables/useLocale';
import {type OverlayRef, useOverlay} from 'vue-cdk/overlay';
import {ComponentPortal} from 'vue-cdk/portal';
import BackdropEventsContent from './BackdropEventsContent.vue';

const overlay = useOverlay();
const open = ref(false);
const overlayRef = shallowRef<OverlayRef | null>(null);
const log = ref<string[]>([]);
const wide = ref(false);
const {locale} = useLocale();

function push(message: string): void {
  log.value.unshift(`[${new Date().toLocaleTimeString()}] ${message}`);
  if (log.value.length > 6) {
    log.value.pop();
  }
}

function close(): void {
  overlayRef.value?.detach();
  open.value = false;
  push(locale.value === 'en-US' ? 'Closed (detach)' : '已关闭（detach）');
}

/** 打开带遮罩的浮层，并订阅全部事件流用于演示。 */
function openPanel(): void {
  if (open.value) {
    return;
  }
  const ref = overlay.create({
    hasBackdrop: true,
    backdropClass: 'doc-demo-backdrop',
    panelClass: 'doc-demo-events-panel',
    positionStrategy: overlay.position().global().centerHorizontally().centerVertically(),
  });
  overlayRef.value = ref;

  ref.backdropClick().subscribe(() => push(locale.value === 'en-US' ? 'backdropClick: backdrop clicked' : 'backdropClick：点击遮罩'));
  ref.keydownEvents().subscribe(event => push(locale.value === 'en-US' ? `keydownEvents: pressed ${event.key}` : `keydownEvents：按下 ${event.key}`));
  ref.outsidePointerEvents().subscribe(() => push(locale.value === 'en-US' ? 'outsidePointerEvents: clicked outside overlay' : 'outsidePointerEvents：点击浮层外部'));
  ref.attachments().subscribe(() => push(locale.value === 'en-US' ? 'attachments: content attached' : 'attachments：已挂载内容'));
  ref.detachments().subscribe(() => push(locale.value === 'en-US' ? 'detachments: content detached' : 'detachments：已卸载内容'));

  ref.attach(new ComponentPortal(BackdropEventsContent, {
    props: {overlayRef: ref, onClose: close, onPush: push, wide},
  }));
  open.value = true;
  push(locale.value === 'en-US' ? 'Opened (attach)' : '已打开（attach）');
}

onBeforeUnmount(() => {
  overlayRef.value?.dispose();
  overlayRef.value = null;
});
</script>

<template>
  <div class="wrap">
    <button type="button" class="doc-btn primary" @click="openPanel">{{ locale === 'en-US' ? 'Open overlay with backdrop' : '打开带遮罩浮层' }}</button>
    <div class="doc-output">{{ log.join('\n') || (locale === 'en-US' ? 'After opening, click the backdrop, press Escape, or click outside' : '打开浮层后尝试点击遮罩 / 按 ESC / 点击外部') }}</div>
    <p class="hint">{{ locale === 'en-US' ? 'backdropClass/panelClass accept custom classes; addPanelClass is shown by the highlighted border.' : 'backdropClass / panelClass 可传入自定义类；addPanelClass 高亮效果见浮层边框变化。' }}</p>
  </div>
</template>

<style scoped>
.wrap {
  width: 100%;
}
</style>

<!-- 浮层渲染进 body，自定义面板类需要全局样式才能生效。 -->
<style>
.doc-events-highlight {
  outline: 2px dashed #f59e0b;
  outline-offset: 4px;
}
</style>
