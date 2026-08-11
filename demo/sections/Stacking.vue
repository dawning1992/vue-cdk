<script setup lang="ts">
import {Reactive, reactive, ref} from 'vue';
import {VConnectedOverlay, VOverlayOrigin} from 'vue-cdk/overlay';

defineProps<{id?: string}>();

const first = ref(false);
const second = ref(false);
const log:Reactive<string[]> = reactive([]);

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
      两个触发按钮共享同一个 origin，因此先打开第一层再点第二层不会误关第一层。
      键盘事件只会命中栈顶的 overlay；点击触发按钮以外的空白区域时，
      两个 overlay 都会收到 outsideClick 并各自关闭。
    </p>
    <div class="stage">
      <!-- 两个按钮必须共用同一 origin：VConnectedOverlay 会把“落在 origin 内部的点击”
           视为面板内点击而忽略，否则点第二层按钮会作为第一层的外部点击把它关闭。 -->
      <VOverlayOrigin>
        <button class="btn" @click="first = !first; addLog('切换 第一层')">第一层 {{ first ? '开' : '关' }}</button>
        <button class="btn" @click="second = !second; addLog('切换 第二层')">第二层 {{ second ? '开' : '关' }}</button>

        <!-- 第一层锚在 origin 左侧，第二层锚在右侧，两层同时打开时互不遮挡。 -->
        <VConnectedOverlay
          :open="first"
          :positions="[{originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top'}]"
          @overlay-keydown="addLog('keydown → 第一层')"
          @update:open="first = $event; addLog('ESC → 第一层关闭')"
          @overlay-outside-click="first = false; addLog('outside → 第一层关闭')"
        >
          <div class="panel">第一层浮层<br /><span class="muted">按任意键看日志</span></div>
        </VConnectedOverlay>

        <VConnectedOverlay
          :open="second"
          :positions="[{originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top'}]"
          @overlay-keydown="addLog('keydown → 第二层')"
          @update:open="second = $event; addLog('ESC → 第二层关闭')"
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
