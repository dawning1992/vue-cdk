<script setup lang="ts">
import {h, onBeforeUnmount, ref, shallowRef} from 'vue';
import {type OverlayRef, useOverlay} from 'vue-cdk/overlay';

const overlay = useOverlay();
const open = ref(false);
const overlayRef = shallowRef<OverlayRef | null>(null);
const log = ref<string[]>([]);
const wide = ref(false);

function push(message: string): void {
  log.value.unshift(`[${new Date().toLocaleTimeString()}] ${message}`);
  if (log.value.length > 6) {
    log.value.pop();
  }
}

function close(): void {
  overlayRef.value?.detach();
  open.value = false;
  push('已关闭（detach）');
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

  ref.backdropClick().subscribe(() => push('backdropClick：点击遮罩'));
  ref.keydownEvents().subscribe(event => push(`keydownEvents：按下 ${event.key}`));
  ref.outsidePointerEvents().subscribe(() => push('outsidePointerEvents：点击浮层外部'));
  ref.attachments().subscribe(() => push('attachments：已挂载内容'));
  ref.detachments().subscribe(() => push('detachments：已卸载内容'));

  ref.attach(() =>
    h(
      'div',
      {
        class: 'events-panel',
        style: {
          padding: '20px 24px',
          width: '300px',
          background: '#fff',
          border: '1px solid #e3e6ee',
          borderRadius: '10px',
          boxShadow: '0 6px 20px rgba(31, 36, 48, 0.12)',
          transition: 'width 0.2s',
        },
      },
      [
        h('h3', {style: {margin: '0 0 8px', fontSize: '15px'}}, '遮罩与事件流'),
        h(
          'p',
          {style: {margin: '0 0 14px', color: '#6b7280', fontSize: '12px'}},
          '点击遮罩、按 ESC 或点击浮层外部，事件流都会在下方输出；也可以动态操作面板。',
        ),
        h(
          'div',
          {style: {display: 'flex', flexWrap: 'wrap', gap: '8px'}},
          [
            h(
              'button',
              {
                class: 'doc-btn',
                onClick: () => {
                  wide.value = !wide.value;
                  ref.updateSize({width: wide.value ? '460px' : '300px'});
                  push(wide.value ? 'updateSize → 460px' : 'updateSize → 300px');
                },
              },
              '切换宽度',
            ),
            h(
              'button',
              {
                class: 'doc-btn',
                onClick: () => {
                  ref.updatePosition();
                  push('updatePosition：重新应用定位');
                },
              },
              '重新定位',
            ),
            h(
              'button',
              {
                class: 'doc-btn',
                onClick: () => {
                  ref.addPanelClass('doc-events-highlight');
                  push('addPanelClass：添加高亮类');
                },
              },
              '加面板类',
            ),
            h(
              'button',
              {
                class: 'doc-btn',
                onClick: () => {
                  ref.removePanelClass('doc-events-highlight');
                  push('removePanelClass：移除高亮类');
                },
              },
              '删面板类',
            ),
            h(
              'button',
              {
                class: 'doc-btn primary',
                onClick: () => {
                  ref.dispose();
                  open.value = false;
                  push('dispose：销毁浮层');
                },
              },
              'dispose',
            ),
            h(
              'button',
              {class: 'doc-btn', onClick: close},
              '关闭（detach）',
            ),
          ],
        ),
      ],
    ),
  );
  open.value = true;
  push('已打开（attach）');
}

onBeforeUnmount(() => {
  overlayRef.value?.dispose();
  overlayRef.value = null;
});
</script>

<template>
  <div class="wrap">
    <button type="button" class="doc-btn primary" @click="openPanel">打开带遮罩浮层</button>
    <div class="doc-output">{{ log.join('\n') || '打开浮层后尝试点击遮罩 / 按 ESC / 点击外部' }}</div>
    <p class="hint">backdropClass / panelClass 可传入自定义类；addPanelClass 高亮效果见浮层边框变化。</p>
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
