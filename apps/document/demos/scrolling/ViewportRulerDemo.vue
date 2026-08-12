<script setup lang="ts">
import {onBeforeUnmount, reactive, ref} from 'vue';
import {viewportRuler} from 'vue-cdk/scrolling';

const size = reactive({width: 0, height: 0});
const rect = reactive({top: 0, left: 0, width: 0, height: 0});
const scrollPos = reactive({left: 0, top: 0});
const resizeCount = ref(0);

/** 读取视口三项测量：尺寸、矩形与滚动位置。 */
function refresh(): void {
  const nextSize = viewportRuler.getViewportSize();
  size.width = nextSize.width;
  size.height = nextSize.height;

  const nextRect = viewportRuler.getViewportRect();
  rect.top = Math.round(nextRect.top);
  rect.left = Math.round(nextRect.left);
  rect.width = Math.round(nextRect.width);
  rect.height = Math.round(nextRect.height);

  const nextPos = viewportRuler.getViewportScrollPosition();
  scrollPos.left = Math.round(nextPos.left);
  scrollPos.top = Math.round(nextPos.top);
}

// change(200)：resize / orientationchange 事件节流 200ms 后派发。
const unsubscribe = viewportRuler.change(200).subscribe(() => {
  resizeCount.value += 1;
  refresh();
});

refresh();
onBeforeUnmount(() => unsubscribe());
</script>

<template>
  <div class="wrap">
    <button type="button" class="doc-btn primary" @click="refresh">立即刷新</button>
    <div class="doc-output">
      viewport 尺寸：{{ size.width }} × {{ size.height }}px
      rect：top={{ rect.top }} left={{ rect.left }} {{ rect.width }}×{{ rect.height }}px
      滚动位置：left={{ scrollPos.left }} top={{ scrollPos.top }}px
      节流 resize 事件：{{ resizeCount }} 次
    </div>
    <p class="hint">缩放浏览器窗口或滚动页面后点击「立即刷新」/ 等待 change(200) 自动更新读数。</p>
  </div>
</template>

<style scoped>
.wrap {
  width: 100%;
}

.hint {
  margin: 10px 0 0;
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
