<script setup lang="ts">
import {ref} from 'vue';
import {
  useOverlay,
  VConnectedOverlay,
  VOverlayOrigin,
  type ScrollStrategy,
} from 'vue-cdk/overlay';

defineProps<{id?: string}>();

const state = ref({
  close: false,
  block: false,
  reposition: false,
});

const overlay = useOverlay();
const closeStrategy: ScrollStrategy = overlay.scrollStrategies.close();
const blockStrategy: ScrollStrategy = overlay.scrollStrategies.block();
const repositionStrategy: ScrollStrategy = overlay.scrollStrategies.reposition();
</script>

<template>
  <section :id="id" class="section">
    <h2>滚动策略<span class="badge">close / block / reposition</span></h2>
    <p class="desc">
      在下方滚动区域内打开浮层，分别体验三种滚动行为：
      close 一滚即关、block 锁定页面滚动、reposition 跟随 origin 滚动并保持朝向。
    </p>
    <div class="scroll-area">
      <div class="scroll-content">
        <div v-for="n in 6" :key="n" class="scroll-tag">滚动占位内容 {{ n }}</div>
        <div class="stage" style="margin-top: 12px">
          <VOverlayOrigin>
            <button class="btn" @click="state.close = !state.close">close 策略</button>
            <VConnectedOverlay
              :open="state.close"
              :scroll-strategy="closeStrategy"
              :positions="[{originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top'}]"
              @overlay-outside-click="state.close = false"
            >
              <div class="panel">滚动页面/容器就会关闭我</div>
            </VConnectedOverlay>
          </VOverlayOrigin>

          <VOverlayOrigin>
            <button class="btn" @click="state.block = !state.block">block 策略</button>
            <VConnectedOverlay
              :open="state.block"
              :scroll-strategy="blockStrategy"
              :positions="[{originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top'}]"
              @overlay-outside-click="state.block = false"
            >
              <div class="panel">打开后整个页面无法滚动（试试滚轮）</div>
            </VConnectedOverlay>
          </VOverlayOrigin>

          <VOverlayOrigin>
            <button class="btn" @click="state.reposition = !state.reposition">reposition 策略</button>
            <VConnectedOverlay
              :open="state.reposition"
              :scroll-strategy="repositionStrategy"
              :positions="[{originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top'}]"
              @overlay-outside-click="state.reposition = false"
            >
              <div class="panel">我会跟着触发按钮一起滚动</div>
            </VConnectedOverlay>
          </VOverlayOrigin>
        </div>
        <div v-for="n in 6" :key="`b-${n}`" class="scroll-tag">更多滚动占位内容 {{ n }}</div>
      </div>
    </div>
  </section>
</template>
