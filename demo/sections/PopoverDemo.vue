<script setup lang="ts">
import {computed, ref} from 'vue';
import {VConnectedOverlay, VOverlayOrigin} from 'vue-cdk/overlay';

defineProps<{id?: string}>();

const supported =
  typeof document !== 'undefined' &&
  'showPopover' in document.body;

const open = ref<'global' | 'inline' | 'parent' | null>(null);
const parentElement = ref<HTMLElement | null>(null);

const globalLocation = computed(() => (open.value === 'global' ? ('global' as const) : null));
const inlineLocation = computed(() => (open.value === 'inline' ? ('inline' as const) : null));
const parentLocation = computed(() =>
  open.value === 'parent' && parentElement.value
    ? {type: 'parent' as const, element: parentElement.value}
    : null,
);
</script>

<template>
  <section :id="id" class="section">
    <h2>Popover 位置<span class="badge">原生 Popover API</span></h2>
    <p class="desc">
      <code>use-popover</code> 支持 <code>global</code>（容器）、<code>inline</code>
      （紧随触发元素）、<code>parent</code>（自定义父元素）三种 DOM 插入位置；
      浏览器不支持 Popover API 时自动降级为容器渲染。
    </p>
    <div v-if="!supported" class="stage">
      <span class="muted">当前浏览器不支持原生 Popover API，将演示降级为容器渲染。</span>
    </div>
    <div v-else class="stage">
      <VOverlayOrigin>
        <button class="btn" @click="open = open === 'global' ? null : 'global'">global 位置</button>
        <VConnectedOverlay
          :open="open === 'global'"
          :use-popover="globalLocation"
          :positions="[{originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top'}]"
          @overlay-outside-click="open = null"
        >
          <div class="panel">渲染在全局 overlay 容器中</div>
        </VConnectedOverlay>
      </VOverlayOrigin>

      <VOverlayOrigin>
        <button class="btn" @click="open = open === 'inline' ? null : 'inline'">inline 位置</button>
        <VConnectedOverlay
          :open="open === 'inline'"
          :use-popover="inlineLocation"
          :positions="[{originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top'}]"
          @overlay-outside-click="open = null"
        >
          <div class="panel">DOM 紧随触发元素之后</div>
        </VConnectedOverlay>
      </VOverlayOrigin>

      <div ref="parentElement" class="stage" style="min-height: 80px; flex: 1">
        <VOverlayOrigin>
          <button class="btn" @click="open = open === 'parent' ? null : 'parent'">parent 位置</button>
          <VConnectedOverlay
            :open="open === 'parent'"
            :use-popover="parentLocation"
            :positions="[{originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top'}]"
            @overlay-outside-click="open = null"
          >
            <div class="panel">渲染在右侧虚线框（自定义父元素）内</div>
          </VConnectedOverlay>
        </VOverlayOrigin>
      </div>
    </div>
  </section>
</template>
