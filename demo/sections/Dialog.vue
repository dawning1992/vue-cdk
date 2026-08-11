<script setup lang="ts">
import {h, onBeforeUnmount, ref} from 'vue';
import {useOverlay, type OverlayRef} from 'vue-cdk/overlay';
import DialogContent from './DialogContent.vue';

defineProps<{id?: string}>();

const overlay = useOverlay();
const open = ref(false);
let overlayRef: OverlayRef | null = null;
let unsubscribeKeydown: (() => void) | undefined;

function openDialog() {
  if (overlayRef && overlayRef.hasAttached()) {
    return;
  }
  overlayRef = overlay.create({
    positionStrategy: overlay.position().global().centerHorizontally().centerVertically(),
    hasBackdrop: true,
    panelClass: 'dialog-panel',
    scrollStrategy: overlay.scrollStrategies.block(),
    disposeOnNavigation: true,
  });
  unsubscribeKeydown = overlayRef.keydownEvents().subscribe(event => {
    if (event.key === 'Escape') {
      closeDialog();
    }
  });
  overlayRef.attach(() => h(DialogContent, {onClose: closeDialog}));
  open.value = true;
}

function closeDialog() {
  overlayRef?.detach();
  unsubscribeKeydown?.();
  unsubscribeKeydown = undefined;
  open.value = false;
}

onBeforeUnmount(() => {
  unsubscribeKeydown?.();
  overlayRef?.dispose();
});
</script>

<template>
  <section :id="id" class="section">
    <h2>模态对话框<span class="badge">命令式 · Global 定位</span></h2>
    <p class="desc">
      使用 <code>useOverlay().create()</code> 命令式创建：全局居中、深色 backdrop、
      block 滚动策略（打开期间页面不可滚动）、ESC 关闭、路由导航自动销毁。
    </p>
    <div class="stage">
      <button class="btn primary" @click="openDialog">打开对话框</button>
      <span v-if="open" class="muted">已打开（试试按 ESC 或滚动页面）</span>
    </div>
  </section>
</template>
