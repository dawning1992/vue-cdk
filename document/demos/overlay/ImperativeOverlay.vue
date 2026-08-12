<script setup lang="ts">
import {h, ref} from 'vue';
import {useOverlay} from 'vue-cdk/overlay';

const overlay = useOverlay();
const log = ref('');

/** 命令式创建全局居中的浮层：h() 渲染内容，遮罩点击关闭。 */
function openCenter(): void {
  const overlayRef = overlay.create({
    hasBackdrop: true,
    positionStrategy: overlay.position().global().centerHorizontally().centerVertically(),
    scrollStrategy: overlay.scrollStrategies.block(),
  });

  // 命令式内容脱离组件模板渲染，样式以内联形式给出，保证在 body 中生效。
  const content = h(
    'div',
    {
      style: {
        padding: '22px 26px',
        minWidth: '300px',
        background: '#fff',
        border: '1px solid #e3e6ee',
        borderRadius: '10px',
        boxShadow: '0 6px 20px rgba(31, 36, 48, 0.12)',
      },
    },
    [
      h('h3', {style: {margin: '0 0 8px', fontSize: '16px'}}, '命令式浮层'),
      h(
        'p',
        {style: {margin: '0 0 18px', color: '#6b7280', fontSize: '13px'}},
        '由 useOverlay() 创建并全局居中；点击遮罩或下方按钮关闭。',
      ),
      h(
        'div',
        {style: {display: 'flex', justifyContent: 'flex-end'}},
        [
          h(
            'button',
            {
              class: 'doc-btn primary',
              onClick: () => {
                overlayRef.detach();
                log.value = '已关闭（detach）';
              },
            },
            '关闭',
          ),
        ],
      ),
    ],
  );

  overlayRef.attach(content);
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
