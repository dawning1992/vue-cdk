<script setup lang="ts">
import {onBeforeUnmount, ref, shallowRef} from 'vue';
import {OverlayContainer, createOverlayRef, type OverlayRef, useOverlay} from 'vue-cdk/overlay';
import {ComponentPortal} from 'vue-cdk/portal';
import OverlayContainerContent from './OverlayContainerContent.vue';

const overlay = useOverlay();
const regionRef = ref<HTMLElement | null>(null);
const overlayRef = shallowRef<OverlayRef | null>(null);
const open = ref(false);
const status = ref('');
const log = ref('');

/** 模板中的自定义 div 作为容器宿主；实例延迟到首次打开时创建（setup 阶段 ref 尚未挂载）。 */
let container: OverlayContainer | null = null;

function getContainer(): OverlayContainer | null {
  if (!container && regionRef.value) {
    container = new OverlayContainer(regionRef.value);
  }
  return container;
}

/** 读取容器当前状态：容器元素即传入的 div，dispose 不会把它移出页面。 */
function refreshStatus(): void {
  const region = regionRef.value;
  if (!region) {
    return;
  }
  status.value =
    `容器元素：自定义 div（class="${region.className}"）` +
    `· 父节点：${region.parentElement?.tagName.toLowerCase() ?? '—'}` +
    `· 已挂载浮层：${overlayRef.value?.hasAttached() ? '是' : '否'}`;
}

function closeOverlay(): void {
  overlayRef.value?.detach();
  overlayRef.value = null;
  open.value = false;
  refreshStatus();
  log.value = '已关闭（detach）';
}

/** 打开浮层：container 选项传入自定义容器，浮层 host 挂载进区域而不是全局容器。 */
function openOverlay(): void {
  if (open.value) {
    return;
  }
  const container = getContainer();
  if (!container) {
    return;
  }
  const ref = createOverlayRef(
    {
      // 关闭原生 popover，让面板始终以普通 DOM 节点渲染，从而被限制在自定义区域内定位。
      usePopover: false,
      hasBackdrop: true,
      positionStrategy: overlay.position().global().centerHorizontally().centerVertically(),
    },
    // container 也可直接传 HTMLElement：{container: regionRef.value}，内部等价于 new OverlayContainer(元素)。
    {container},
  );
  overlayRef.value = ref;
  open.value = true;
  ref.backdropClick().subscribe(() => closeOverlay());

  ref.attach(new ComponentPortal(OverlayContainerContent, {props: {onClose: closeOverlay}}));
  refreshStatus();
  log.value = '已打开（attach）：浮层 host 挂载到自定义 div';
}

/** 释放容器：dispose 只解除引用，调用方提供的 div 保留在页面中，可再次打开复用。 */
function releaseContainer(): void {
  closeOverlay();
  container?.dispose();
  container = null;
  refreshStatus();
  log.value = '已释放容器（dispose）：自定义 div 仍保留在页面中';
}

onBeforeUnmount(() => {
  overlayRef.value?.detach();
  container?.dispose();
});
</script>

<template>
  <div class="wrap">
    <div class="actions">
      <button type="button" class="doc-btn primary" :disabled="open" @click="openOverlay">
        打开浮层
      </button>
      <button type="button" class="doc-btn" @click="releaseContainer">
        释放容器（dispose）
      </button>
    </div>
    <div ref="regionRef" class="overlay-region">
      <span class="region-tip">
        {{ open ? '浮层已挂载到本区域，点击区域遮罩或关闭按钮可关闭' : '自定义 div 容器区域：浮层将在这里打开' }}
      </span>
    </div>
    <p class="status">{{ status || '—' }}</p>
    <span class="log">{{ log || '—' }}</span>
  </div>
</template>

<style scoped>
.wrap {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 以更高特异性覆盖自动补齐的 .vcdk-overlay-container 固定定位样式，让容器成为页面内的相对定位区域。 */
.overlay-region {
  position: relative;
  height: 200px;
  border: 1px dashed var(--doc-border);
  border-radius: 8px;
  background: #fafbfe;
  display: flex;
  align-items: center;
  justify-content: center;
}

.region-tip {
  color: var(--doc-muted);
  font-size: 12px;
}

.status {
  margin: 0;
  color: var(--doc-text);
  font-size: 12px;
  font-family: var(--doc-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
}

.log {
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
