<script setup lang="ts">
import {ref} from 'vue';
import {
  VVirtualFor,
  VVirtualScrollViewport,
  vVirtualScrollableElement,
} from 'vue-cdk/scrolling';

const items = ref(Array.from({length: 300}, (_, i) => `条目 ${i + 1}`));
const windowFirst = ref(0);
const outerFirst = ref(0);
const appendOnly = ref(false);
</script>

<template>
  <div class="wrap">
    <p class="label">scrollWindow：以整页窗口作为滚动容器</p>
    <VVirtualScrollViewport
      :item-size="40"
      scroll-window
      @scrolled-index-change="windowFirst = $event"
    >
      <VVirtualFor :of="items" v-slot="{item, index}">
        <div class="row">{{ index + 1 }}. {{ item }}</div>
      </VVirtualFor>
    </VVirtualScrollViewport>
    <p class="hint">当前首个可见项：#{{ windowFirst + 1 }}；滚动页面时列表跟随窗口滚动。</p>

    <p class="label">v-virtual-scrollable-element：外部容器负责滚动，视口只渲染</p>
    <label class="check">
      <input v-model="appendOnly" type="checkbox" />
      appendOnly
    </label>
    <div v-virtual-scrollable-element class="outer">
      <VVirtualScrollViewport
        :item-size="40"
        :append-only="appendOnly"
        style="height: 100%"
        @scrolled-index-change="outerFirst = $event"
      >
        <VVirtualFor :of="items" v-slot="{item, index}">
          <div class="row">{{ index + 1 }}. {{ item }}</div>
        </VVirtualFor>
      </VVirtualScrollViewport>
    </div>
    <p class="hint">当前首个可见项：#{{ outerFirst + 1 }}；滚动的是外层元素，视口测量/渲染随之外移。</p>
  </div>
</template>

<style scoped>
.wrap {
  width: 100%;
}

.label {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 600;
}

.row {
  height: 40px;
  display: flex;
  align-items: center;
  padding: 0 14px;
  font-size: 13px;
  border-bottom: 1px solid #f0f2f7;
}

.outer {
  height: 200px;
  overflow: auto;
  border: 1px solid var(--doc-border);
  border-radius: 8px;
  background: #fff;
}

.check {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--doc-muted);
}

.hint {
  margin: 10px 0 16px;
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
