<script setup lang="ts">
import {ref} from 'vue';
import {VVirtualFor, VVirtualScrollViewport} from 'vue-cdk/scrolling';
import {useLocale} from '../../composables/useLocale';

const items = ref(Array.from({length: 200}, (_, i) => `Card ${i + 1}`));
const dir = ref<'ltr' | 'rtl'>('ltr');
const {locale} = useLocale();
if (locale.value !== 'en-US') {
  items.value = items.value.map((_, index) => `卡片 ${index + 1}`);
}
const firstVisible = ref(0);
const scrollTarget = ref<{
  scrollToIndex(index: number, behavior?: ScrollBehavior): void;
} | null>(null);

function jump(): void {
  scrollTarget.value?.scrollToIndex(Math.floor(Math.random() * items.value.length), 'smooth');
}
</script>

<template>
  <div class="wrap">
    <div class="toolbar">
      <label class="field">
        {{ locale === 'en-US' ? 'Direction' : '方向' }}
        <select v-model="dir" class="doc-input">
          <option value="ltr">LTR</option>
          <option value="rtl">RTL</option>
        </select>
      </label>
      <button type="button" class="doc-btn primary" @click="jump">{{ locale === 'en-US' ? 'Jump to random index' : '随机跳转索引' }}</button>
      <span class="info">{{ locale === 'en-US' ? 'First visible item:' : '首个可见项：' }} #{{ firstVisible + 1 }}</span>
    </div>
    <!-- 方向由最近的 dir 属性动态解析，切换后即时生效。 -->
    <div :dir="dir">
      <VVirtualScrollViewport
        ref="scrollTarget"
        orientation="horizontal"
        :item-size="140"
        style="height: 120px; border: 1px solid var(--doc-border); border-radius: 8px"
        @scrolled-index-change="firstVisible = $event"
      >
        <VVirtualFor :of="items" v-slot="{index}">
          <div class="card" :class="{even: index % 2 === 0}">{{ locale === 'en-US' ? 'Card' : '卡片' }} {{ index + 1 }}</div>
        </VVirtualFor>
      </VVirtualScrollViewport>
    </div>
    <p class="hint">{{ locale === 'en-US' ? 'With orientation="horizontal", item width defines itemSize. The horizontal scroll axis reverses automatically in RTL.' : 'orientation="horizontal" 以宽度为 itemSize；RTL 下横向滚动轴方向自动反转。' }}</p>
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

.field {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--doc-muted);
}

.info {
  color: var(--doc-muted);
  font-size: 12px;
}

/*
 * 虚拟滚动组件只负责按渲染区间位移内容与撑出 spacer，
 * 不负责子元素的排版；横向 demo 需要自行让内容包裹层按行排布。
 * 高度设为 100% 以匹配视口高度（120px），卡片再以 100% 高度撑满。
 */
.wrap :deep(.vcdk-virtual-scroll-content-wrapper) {
  display: flex;
  height: 100%;
}

.card {
  width: 140px;
  flex: 0 0 140px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  border-right: 1px solid #f0f2f7;
}

.card.even {
  background: #fafbfe;
}

.hint {
  margin: 10px 0 0;
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
