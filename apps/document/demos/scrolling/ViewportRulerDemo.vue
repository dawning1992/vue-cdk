<script setup lang="ts">
import {onBeforeUnmount, reactive, ref} from 'vue';
import {viewportRuler} from 'vue-cdk/scrolling';
import {useLocale} from '../../composables/useLocale';

const size = reactive({width: 0, height: 0});
const rect = reactive({top: 0, left: 0, width: 0, height: 0});
const scrollPos = reactive({left: 0, top: 0});
const resizeCount = ref(0);
const {locale} = useLocale();

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
    <button type="button" class="doc-btn primary" @click="refresh">{{ locale === 'en-US' ? 'Refresh now' : '立即刷新' }}</button>
    <div class="doc-output">
      {{ locale === 'en-US' ? 'Viewport size:' : 'viewport 尺寸：' }} {{ size.width }} × {{ size.height }}px
      rect：top={{ rect.top }} left={{ rect.left }} {{ rect.width }}×{{ rect.height }}px
      {{ locale === 'en-US' ? 'Scroll position:' : '滚动位置：' }} left={{ scrollPos.left }} top={{ scrollPos.top }}px
      {{ locale === 'en-US' ? 'Throttled resize events:' : '节流 resize 事件：' }} {{ resizeCount }} {{ locale === 'en-US' ? 'times' : '次' }}
    </div>
    <p class="hint">{{ locale === 'en-US' ? 'Resize the browser or scroll the page, then click “Refresh now” or wait for change(200) to update the measurements.' : '缩放浏览器窗口或滚动页面后点击「立即刷新」/ 等待 change(200) 自动更新读数。' }}</p>
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
