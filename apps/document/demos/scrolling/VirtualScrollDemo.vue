<script setup lang="ts">
import {ref} from 'vue';
import {VVirtualFor, VVirtualScrollViewport} from 'vue-cdk/scrolling';

const items = ref(Array.from({length: 1000}, (_, i) => `条目 ${i + 1}`));
const firstVisible = ref(0);
const appendOnly = ref(false);
const offset = ref(0);
const scrollTarget = ref<{
  scrollToIndex(index: number, behavior?: ScrollBehavior): void;
  scrollToOffset(offset: number, behavior?: ScrollBehavior): void;
} | null>(null);

/** trackBy 以条目文本作为稳定身份，复用已渲染实例。 */
function trackBy(_index: number, item: unknown): unknown {
  return String(item);
}

/** 随机跳转到任意条目：走视口暴露的 scrollToIndex API。 */
function jumpToRandom(): void {
  const index = Math.floor(Math.random() * items.value.length);
  scrollTarget.value?.scrollToIndex(index, 'smooth');
}

/** 按像素偏移滚动：演示 scrollToOffset API。 */
function scrollToOffset(): void {
  scrollTarget.value?.scrollToOffset(offset.value, 'smooth');
}
</script>

<template>
  <div class="wrap">
    <div class="toolbar">
      <button type="button" class="doc-btn primary" @click="jumpToRandom">随机跳转索引</button>
      <label class="field">
        scrollToOffset
        <input v-model.number="offset" class="doc-input" type="number" placeholder="px" />
        <button type="button" class="doc-btn" @click="scrollToOffset">滚动</button>
      </label>
      <label class="check">
        <input v-model="appendOnly" type="checkbox" />
        appendOnly（只增不减）
      </label>
      <span class="info">首个可见项：#{{ firstVisible + 1 }}（共 {{ items.length }} 条）</span>
    </div>
    <VVirtualScrollViewport
      ref="scrollTarget"
      :item-size="40"
      :append-only="appendOnly"
      style="height: 240px; border: 1px solid var(--doc-border); border-radius: 8px"
      @scrolled-index-change="firstVisible = $event"
    >
      <VVirtualFor :of="items" :track-by="trackBy" v-slot="{item, index}">
        <div class="row" :class="{even: index % 2 === 0}">{{ index + 1 }}. {{ item }}</div>
      </VVirtualFor>
    </VVirtualScrollViewport>
    <p class="hint">1000 条数据仅渲染视口附近的条目；随机跳转演示 scrollToIndex，像素偏移演示 scrollToOffset。</p>
  </div>
</template>

<style scoped>
.wrap {
  width: 100%;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
  margin-bottom: 12px;
}

.field,
.check {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--doc-muted);
}

.field .doc-input {
  width: 90px;
  padding: 4px 8px;
}

.info {
  color: var(--doc-muted);
  font-size: 12px;
}

.row {
  height: 40px;
  display: flex;
  align-items: center;
  padding: 0 14px;
  font-size: 13px;
  border-bottom: 1px solid #f0f2f7;
}

.row.even {
  background: #fafbfe;
}

.hint {
  margin: 10px 0 0;
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
