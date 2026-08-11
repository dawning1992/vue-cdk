<script setup lang="ts">
import {ref} from 'vue';
import {STANDARD_DROPDOWN_BELOW_POSITIONS, VConnectedOverlay, VOverlayOrigin} from 'vue-cdk/overlay';

defineProps<{id?: string}>();

const rtl = ref(false);
const open = ref(false);
</script>

<template>
  <section :id="id" class="section">
    <h2>RTL 方向<span class="badge">start/end 镜像</span></h2>
    <p class="desc">
      切换文本方向：RTL 下 <code>start</code> 对齐右边缘，下拉菜单的连接点与
      transform-origin 全部镜像。
    </p>
    <div class="stage">
      <button class="btn" @click="rtl = !rtl">切换到 {{ rtl ? 'LTR' : 'RTL' }}</button>
      <VOverlayOrigin>
        <button class="btn primary" @click="open = !open">RTL 下拉菜单 ▾</button>
        <VConnectedOverlay
          :open="open"
          :direction="rtl ? 'rtl' : 'ltr'"
          :positions="STANDARD_DROPDOWN_BELOW_POSITIONS"
          @overlay-outside-click="open = false"
        >
          <div class="panel" style="direction: rtl">
            <div class="menu-item">首项（start 侧）</div>
            <div class="menu-item">中间项</div>
            <div class="menu-item">末项（end 侧）</div>
          </div>
        </VConnectedOverlay>
      </VOverlayOrigin>
    </div>
  </section>
</template>
