<script setup lang="ts">
import {ref} from 'vue';
import {VConnectedOverlay, VOverlayOrigin} from 'vue-cdk/overlay';

defineProps<{id?: string}>();

const open = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;

function show() {
  clearTimeout(timer);
  timer = setTimeout(() => (open.value = true), 120);
}

function hide() {
  clearTimeout(timer);
  open.value = false;
}
</script>

<template>
  <section :id="id" class="section">
    <h2>Tooltip<span class="badge">transform-origin 动画</span></h2>
    <p class="desc">
      悬停显示，<code>transform-origin-selector</code> 让缩放动画从连接点方向展开；
      上下空间不足时自动翻转。
    </p>
    <div class="stage">
      <VOverlayOrigin>
        <button class="btn" @mouseenter="show" @mouseleave="hide">悬停查看提示</button>
        <VConnectedOverlay
          :open="open"
          transform-origin-selector=".tooltip-box"
          :positions="[
            {originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top'},
            {originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom'},
          ]"
        >
          <div class="tooltip-box">我是 tooltip，动画从连接点展开</div>
        </VConnectedOverlay>
      </VOverlayOrigin>
    </div>
  </section>
</template>
