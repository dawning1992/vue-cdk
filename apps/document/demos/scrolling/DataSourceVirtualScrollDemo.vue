<script setup lang="ts">
import {ref} from 'vue';
import {ArrayDataSource, DataSource} from 'vue-cdk/collections';
import {Emitter} from 'vue-cdk/emitter';
import {
  VVirtualFor,
  VVirtualScrollViewport,
} from 'vue-cdk/scrolling';

/** 自定义分页数据源：connect 返回 Emitter，由 loadMore 手动推流。 */
class PagedDataSource extends DataSource<number> {
  private _data: number[] = [];
  private _stream = new Emitter<readonly number[]>();

  connect(): Emitter<readonly number[]> {
    return this._stream;
  }

  disconnect(): void {
    // 数据源无连接期资源，无需清理。
  }

  loadMore(): void {
    const start = this._data.length;
    this._data.push(...Array.from({length: 100}, (_, i) => start + i + 1));
    this._stream.next(this._data);
  }
}

const arrayItems = ref(Array.from({length: 300}, (_, i) => `数组条目 ${i + 1}`));
const arraySource = new ArrayDataSource(arrayItems);
const pagedSource = new PagedDataSource();
pagedSource.loadMore();

function appendArray(): void {
  const start = arrayItems.value.length;
  arrayItems.value = [
    ...arrayItems.value,
    ...Array.from({length: 50}, (_, i) => `数组条目 ${start + i + 1}`),
  ];
}
</script>

<template>
  <div class="wrap">
    <div class="cols">
      <div class="col">
        <p class="label">ArrayDataSource(ref)：追加数据自动派发</p>
        <button type="button" class="doc-btn" @click="appendArray">追加 50 条</button>
        <VVirtualScrollViewport :item-size="40" style="height: 180px; border: 1px solid var(--doc-border); border-radius: 8px">
          <VVirtualFor :of="arraySource" v-slot="{item, index}">
            <div class="row">{{ index + 1 }}. {{ item }}</div>
          </VVirtualFor>
        </VVirtualScrollViewport>
      </div>
      <div class="col">
        <p class="label">自定义 DataSource（Emitter 推流）</p>
        <button type="button" class="doc-btn" @click="pagedSource.loadMore">加载下一页（+100）</button>
        <VVirtualScrollViewport :item-size="40" style="height: 180px; border: 1px solid var(--doc-border); border-radius: 8px">
          <VVirtualFor :of="pagedSource" v-slot="{item, index}">
            <div class="row">{{ index + 1 }}. 第 {{ item }} 条</div>
          </VVirtualFor>
        </VVirtualScrollViewport>
      </div>
    </div>
    <p class="hint">VVirtualFor :of 同时接受数组、响应式数组与 DataSource；数据变化仅重渲染增量区间。</p>
  </div>
</template>

<style scoped>
.wrap {
  width: 100%;
}

.cols {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

.col {
  flex: 1;
  min-width: 260px;
}

.label {
  margin: 0 0 8px;
  font-size: 12px;
  color: var(--doc-muted);
}

.col .doc-btn {
  margin-bottom: 8px;
}

.row {
  height: 40px;
  display: flex;
  align-items: center;
  padding: 0 14px;
  font-size: 13px;
  border-bottom: 1px solid #f0f2f7;
}

.hint {
  margin: 10px 0 0;
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
