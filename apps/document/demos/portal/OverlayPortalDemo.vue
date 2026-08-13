<script setup lang="ts">
import {h, onBeforeUnmount, ref} from 'vue';
import {TemplatePortal} from 'vue-cdk/portal';
import {useOverlay, type OverlayRef} from 'vue-cdk/overlay';

const overlay = useOverlay();
const clicks = ref(0);
const log = ref('');
let overlayRef: OverlayRef | null = null;

/** 模板 Portal 内容：渲染函数闭包读取响应式状态，挂载后仍会更新。 */
function buildCard(): TemplatePortal<unknown> {
  return new TemplatePortal(() =>
    h(
      'div',
      {
        style: {
          padding: '22px 26px',
          minWidth: '320px',
          background: '#fff',
          border: '1px solid #e3e6ee',
          borderRadius: '10px',
          boxShadow: '0 6px 20px rgba(31, 36, 48, 0.12)',
        },
      },
      [
        h('h3', {style: {margin: '0 0 8px', fontSize: '16px'}}, 'overlay + TemplatePortal'),
        h(
          'p',
          {style: {margin: '0 0 16px', color: '#6b7280', fontSize: '13px'}},
          `portal 内容内的响应式状态：点击次数 ${clicks.value}`,
        ),
        h(
          'div',
          {style: {display: 'flex', justifyContent: 'flex-end', gap: '10px'}},
          [
            h(
              'button',
              {class: 'doc-btn', onClick: () => clicks.value++},
              '记录一次点击',
            ),
            h(
              'button',
              {class: 'doc-btn primary', onClick: closePanel},
              '关闭',
            ),
          ],
        ),
      ],
    ),
  );
}

/** 以 portal 方式向 overlay 挂载内容，验证 overlay 分层构建在 portal 之上。 */
function openPanel(): void {
  if (overlayRef?.hasAttached()) {
    return;
  }
  overlayRef = overlay.create({
    hasBackdrop: true,
    positionStrategy: overlay.position().global().centerHorizontally().centerVertically(),
    scrollStrategy: overlay.scrollStrategies.block(),
  });
  overlayRef.attach(buildCard());
  overlayRef.backdropClick().subscribe(() => closePanel());
  log.value = '已打开：overlayRef.attach(TemplatePortal)';
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
