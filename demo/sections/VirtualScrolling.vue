<script setup lang="ts">
/**
 * 虚拟滚动演示：覆盖固定尺寸纵向/横向、窗口滚动、自定义滚动容器、
 * appendOnly、动态数据、DataSource、scrollToIndex 与 RTL 横向。
 */

import {ref} from 'vue';
import {Emitter} from 'vue-cdk/emitter';
import {type CollectionViewer, DataSource} from 'vue-cdk/collections';
import {
  VVirtualFor,
  VVirtualScrollViewport,
  vVirtualScrollableElement,
} from 'vue-cdk/scrolling';

defineProps<{id?: string}>();

/** 固定尺寸纵向列表。 */
const verticalItems = ref(Array.from({length: 1000}, (_, i) => `条目 ${i + 1}`));

/** 横向列表：条目内容比高度更宽。 */
const horizontalItems = ref(
  Array.from({length: 200}, (_, i) => `H-${String(i + 1).padStart(3, '0')}`),
);

/** 追加模式示例（切换后滚动到底部观察已渲染项保留）。 */
const appendOnly = ref(false);
const appendOnlyItems = ref(Array.from({length: 500}, (_, i) => `A-${i + 1}`));

/** 动态数据：追加/移除。 */
const dynamicItems = ref(Array.from({length: 200}, (_, i) => `D-${i + 1}`));
let dynamicSeq = 201;

/** DataSource 示例。 */
class DemoSource extends DataSource<string> {
  private readonly _stream = new Emitter<readonly string[]>();
  private _data: string[];

  constructor(data: string[]) {
    super();
    this._data = data;
  }

  override connect(_viewer: CollectionViewer): Emitter<readonly string[]> {
    // 微任务补发首帧，保证订阅后立即收到数据。
    queueMicrotask(() => this._stream.next(this._data));
    return this._stream;
  }

  override disconnect(): void {
    // 示例数据源无需释放资源。
  }

  push(): void {
    this._data = [...this._data, `S-${this._data.length + 1}`];
    this._stream.next(this._data);
  }
}

const dataSource = new DemoSource(Array.from({length: 300}, (_, i) => `S-${i + 1}`));

/** scrollToIndex 跳转。 */
const targetIndex = ref(0);
const scrollTarget = ref<{scrollToIndex(index: number, behavior?: ScrollBehavior): void} | null>(
  null,
);

function jumpToIndex(): void {
  scrollTarget.value?.scrollToIndex(targetIndex.value, 'smooth');
}

/** 当前渲染区间展示。 */
const renderedRange = ref('0 - 0');
const renderedRangeRef = ref<{getRenderedRange(): {start: number; end: number}} | null>(null);

function updateRangeDisplay(): void {
  const range = renderedRangeRef.value?.getRenderedRange();
  if (range) {
    renderedRange.value = `${range.start} - ${range.end}`;
  }
}

/** 自定义滚动容器（带非虚拟化头部）。 */
const customItems = ref(Array.from({length: 600}, (_, i) => `C-${i + 1}`));
</script>

<template>
  <section :id="id" class="section">
    <h2>虚拟滚动<span class="badge">VVirtualScrollViewport + VVirtualFor</span></h2>
    <p class="desc">
      只渲染视口内可见的条目，spacer 撑出完整数据量的滚动条。
      固定尺寸（itemSize）策略与 Angular CDK 的 FixedSizeVirtualScrollStrategy 一致。
    </p>

    <div class="vs-grid">
      <!-- 固定尺寸纵向 -->
      <div class="demo-card">
        <h3>固定尺寸纵向（1000 条）</h3>
        <VVirtualScrollViewport
          ref="renderedRangeRef"
          :item-size="40"
          class="vs-list"
          @scrolled-index-change="updateRangeDisplay"
        >
          <VVirtualFor :of="verticalItems" v-slot="{item, index, count, even}">
            <div class="vs-item" :class="{even}" :style="{height: '40px'}">
              <span class="vs-index">{{ index + 1 }} / {{ count }}</span>
              {{ item }}
            </div>
          </VVirtualFor>
        </VVirtualScrollViewport>
        <p class="hint">渲染区间：{{ renderedRange }}（仅渲染可见部分）</p>
      </div>

      <!-- 横向 -->
      <div class="demo-card">
        <h3>横向 orientation="horizontal"</h3>
        <VVirtualScrollViewport
          :item-size="160"
          orientation="horizontal"
          class="vs-list vs-list-horizontal"
        >
          <VVirtualFor :of="horizontalItems" v-slot="{item, index}">
            <div class="vs-item vs-item-horizontal" :style="{width: '160px'}">
              {{ index + 1 }}：{{ item }}
            </div>
          </VVirtualFor>
        </VVirtualScrollViewport>
      </div>

      <!-- RTL 横向 -->
      <div class="demo-card" dir="rtl">
        <h3>RTL 横向（dir="rtl"）</h3>
        <VVirtualScrollViewport
          :item-size="140"
          orientation="horizontal"
          class="vs-list vs-list-horizontal"
        >
          <VVirtualFor :of="horizontalItems" v-slot="{item, index}">
            <div class="vs-item vs-item-horizontal" :style="{width: '140px'}">
              {{ index + 1 }}：{{ item }}
            </div>
          </VVirtualFor>
        </VVirtualScrollViewport>
        <p class="hint">内容沿负 x 轴位移，start/end 语义自动翻转。</p>
      </div>

      <!-- appendOnly -->
      <div class="demo-card">
        <h3>appendOnly 追加模式</h3>
        <label class="switch">
          <input v-model="appendOnly" type="checkbox" />
          启用 appendOnly
        </label>
        <VVirtualScrollViewport
          :item-size="40"
          :append-only="appendOnly"
          class="vs-list"
        >
          <VVirtualFor :of="appendOnlyItems" v-slot="{item, index}">
            <div class="vs-item" :style="{height: '40px'}">{{ index + 1 }}：{{ item }}</div>
          </VVirtualFor>
        </VVirtualScrollViewport>
        <p class="hint">滚出视口的条目保留在 DOM 中，起点始终为 0。</p>
      </div>

      <!-- 动态数据 -->
      <div class="demo-card">
        <h3>动态数据（追加 / 移除）</h3>
        <div class="vs-actions">
          <button class="btn" @click="dynamicItems = [...dynamicItems, `D-${dynamicSeq++}`]">
            追加
          </button>
          <button class="btn" @click="dynamicItems = dynamicItems.slice(0, -1)">移除末尾</button>
        </div>
        <VVirtualScrollViewport :item-size="40" class="vs-list">
          <VVirtualFor :of="dynamicItems" v-slot="{item, index}">
            <div class="vs-item" :style="{height: '40px'}">{{ index + 1 }}：{{ item }}</div>
          </VVirtualFor>
        </VVirtualScrollViewport>
      </div>

      <!-- DataSource -->
      <div class="demo-card">
        <h3>DataSource 数据源</h3>
        <div class="vs-actions">
          <button class="btn" @click="dataSource.push()">推送新数据</button>
        </div>
        <VVirtualScrollViewport :item-size="40" class="vs-list">
          <VVirtualFor :of="dataSource" v-slot="{item, index}">
            <div class="vs-item" :style="{height: '40px'}">{{ index + 1 }}：{{ item }}</div>
          </VVirtualFor>
        </VVirtualScrollViewport>
      </div>
    </div>

    <!-- scrollToIndex -->
    <div class="demo-card" style="margin-top: 16px">
      <h3>scrollToIndex 跳转</h3>
      <div class="vs-actions">
        <input v-model.number="targetIndex" class="input" type="number" min="0" max="999" />
        <button class="btn primary" @click="jumpToIndex">跳到第 {{ targetIndex }} 项</button>
      </div>
      <VVirtualScrollViewport
        ref="scrollTarget"
        :item-size="40"
        class="vs-list"
        style="margin-top: 10px"
      >
        <VVirtualFor :of="verticalItems" v-slot="{item, index}">
          <div class="vs-item" :style="{height: '40px'}">{{ index + 1 }}：{{ item }}</div>
        </VVirtualFor>
      </VVirtualScrollViewport>
    </div>

    <!-- 自定义滚动容器 -->
    <div class="demo-card" style="margin-top: 16px">
      <h3>自定义滚动容器（父容器滚动 + 非虚拟化头部）</h3>
      <div v-virtual-scrollable-element class="vs-scroller">
        <div class="vs-header">固定头部（不随虚拟内容滚动）</div>
        <VVirtualScrollViewport :item-size="40">
          <VVirtualFor :of="customItems" v-slot="{item, index}">
            <div class="vs-item" :style="{height: '40px'}">{{ index + 1 }}：{{ item }}</div>
          </VVirtualFor>
        </VVirtualScrollViewport>
      </div>
    </div>

    <!-- scrollWindow -->
    <div class="demo-card" style="margin-top: 16px">
      <h3>窗口滚动 scrollWindow</h3>
      <p class="hint">下方列表直接跟随整页滚动，滚动条属于页面本身。</p>
      <VVirtualScrollViewport scroll-window :item-size="40" style="margin-top: 10px">
        <VVirtualFor :of="verticalItems" v-slot="{item, index}">
          <div class="vs-item" :style="{height: '40px'}">{{ index + 1 }}：{{ item }}</div>
        </VVirtualFor>
      </VVirtualScrollViewport>
    </div>
  </section>
</template>
