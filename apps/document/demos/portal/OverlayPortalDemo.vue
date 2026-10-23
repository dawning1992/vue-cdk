<script setup lang="ts">
import {getCurrentInstance, onBeforeUnmount, ref} from 'vue';
import {ComponentPortal} from 'vue-cdk/portal';
import {useOverlay, type OverlayRef} from 'vue-cdk/overlay';
import OverlayPortalContent from '../overlay/OverlayPortalContent.vue';

const overlay = useOverlay();
const appContext = getCurrentInstance()!.appContext;
const clicks = ref(0);
const log = ref('');
let overlayRef: OverlayRef | null = null;

/** 以组件 Portal 向 overlay 挂载 SFC，验证 overlay 分层构建在 portal 之上。 */
function openPanel(): void {
  if (overlayRef?.hasAttached()) {
    return;
  }
  overlayRef = overlay.create({
    hasBackdrop: true,
    positionStrategy: overlay.position().global().centerHorizontally().centerVertically(),
    scrollStrategy: overlay.scrollStrategies.block(),
  });
  overlayRef.attach(new ComponentPortal(OverlayPortalContent, {
    appContext,
    props: {
      clicks,
      onClose: closePanel,
      onClick: () => clicks.value++,
    },
  }));
  overlayRef.backdropClick().subscribe(() => closePanel());
  log.value = '已打开：overlayRef.attach(ComponentPortal)';
}

function closePanel(): void {
  overlayRef?.detach();
  overlayRef?.dispose();
  overlayRef = null;
  log.value = '已关闭';
}

onBeforeUnmount(() => {
  overlayRef?.dispose();
  overlayRef = null;
});
</script>

<template>
  <div class="wrap">
    <button type="button" class="doc-btn primary" @click="openPanel">
      用 TemplatePortal 打开浮层
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
