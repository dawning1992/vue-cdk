<script setup lang="ts">
import {ref} from 'vue';
import {VConnectedOverlay, VOverlayOrigin} from 'vue-cdk/overlay';

defineProps<{id?: string}>();

const first = ref(false);
const second = ref(false);
const log: string[] = [];

function addLog(message: string) {
  log.unshift(message);
  if (log.length > 5) {
    log.pop();
  }
}
</script>

<template>
  <section :id="id" class="section">
    <h2>多层堆叠<span class="badge">事件只派发给最上层</span></h2>
    <p class="desc">
      同时打开两层浮层，键盘事件只会命中栈顶的 overlay；点击面板外部时
      两个 overlay 都会收到 outsideClick（用于依次关闭）。
    </p>
    <div class="stage">
      <VOverlayOrigin>
        <button class="btn" @click="first = !first; addLog('切换 第一层')">第一层 {{ first ? '开' : '关' }}</button>
        <VConnectedOverlay
          :open="first"
          :positions="[{originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top'}]"
          @overlay-keydown="addLog('keydown → 第一层')"
          @overlay-outside-click="first = false; addLog('outside → 第一层关闭')"
        >
          <div class="panel" style="z-index: 1">第一层浮层<br /><span class="muted">按任意键看日志</span></div>
        </VConnectedOverlay>
      </VOverlayOrigin>

      <VOverlayOrigin>
        <button class="btn" @click="second = !second; addLog('切换 第二层')">第二层 {{ second ? '开' : '关' }}</button>
        <VConnectedOverlay
          :open="second"
          :positions="[{originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top'}]"
          @overlay-keydown="addLog('keydown → 第二层')"
          @overlay-outside-click="second = false; addLog('outside → 第二层关闭')"
        >
          <div class="panel">第二层浮层（栈顶）<br /><span class="muted">按任意键看日志</span></div>
        </VConnectedOverlay>
      </VOverlayOrigin>

      <div class="panel" style="flex: 1; min-width: 220px">
        <div class="muted" style="margin-bottom: 6px">事件日志</div>
        <div v-for="(entry, index) in log" :key="index" style="font-size: 13px">
          {{ entry }}
        </div>
        <div v-if="log.length === 0" class="muted">暂无事件</div>
      </div>
    </div>
  </section>
</template>
