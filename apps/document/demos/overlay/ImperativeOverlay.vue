<script setup lang="ts">
import {ref} from 'vue';
import {useOverlay} from 'vue-cdk/overlay';
import {ComponentPortal} from 'vue-cdk/portal';
import ImperativeOverlayContent from './ImperativeOverlayContent.vue';

const overlay = useOverlay();
const log = ref('');

/** 命令式创建全局居中的浮层：ComponentPortal 挂载 SFC，遮罩点击关闭。 */
function openCenter(): void {
  const overlayRef = overlay.create({
    hasBackdrop: true,
    positionStrategy: overlay.position().global().centerHorizontally().centerVertically(),
    scrollStrategy: overlay.scrollStrategies.block(),
  });

  overlayRef.attach(new ComponentPortal(ImperativeOverlayContent, {
    props: {
      onClose: () => {
        overlayRef.detach();
        log.value = '已关闭（detach）';
      },
    },
  }));
  overlayRef.backdropClick().subscribe(() => overlayRef.detach());
  log.value = '已打开（attach）';
}
</script>

<template>
  <div class="wrap">
    <button type="button" class="doc-btn primary" @click="openCenter">
      打开全局居中浮层
    </button>
    <span class="log">{{ log || '—' }}</span>
  </div>
</template>

<style scoped>
.wrap {
  display: flex;
  align-items: center;
  gap: 14px;
}

.log {
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
