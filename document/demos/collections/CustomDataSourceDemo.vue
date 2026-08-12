<script setup lang="ts">
import {ref} from 'vue';
import {
  DataSource,
  isDataSource,
  type CollectionViewer,
  type ListRange,
} from 'vue-cdk/collections';
import {Emitter} from 'vue-cdk/emitter';

/** 模拟查看器：通过 viewChange 接收虚拟滚动等消费方的区间变化。 */
class DemoViewer implements CollectionViewer {
  readonly viewChange = new Emitter<ListRange>();
}

/** 自定义数据源：connect 返回 Emitter，并按查看器区间模拟分页加载。 */
class PagedDataSource extends DataSource<string> {
  private _data: string[] = [];
  private _stream = new Emitter<readonly string[]>();
  private _viewerUnsub: (() => void) | null = null;
  private _onRange?: (range: ListRange) => void;

  constructor(onRange?: (range: ListRange) => void) {
    super();
    this._onRange = onRange;
  }

  override connect(viewer?: CollectionViewer): Emitter<readonly string[]> {
    // 订阅查看器区间，模拟按需加载下一页。
    this._viewerUnsub = viewer
      ? viewer.viewChange.subscribe(range => {
          this._onRange?.(range);
          if (range.end >= this._data.length) {
            this.loadMore();
          }
        })
      : null;
    // 首帧延迟派发，保证同步订阅的消费方不漏数据。
    queueMicrotask(() => this._stream.next(this._data));
    return this._stream;
  }

  override disconnect(): void {
    this._viewerUnsub?.();
    this._viewerUnsub = null;
  }

  loadMore(): void {
    const start = this._data.length;
    this._data.push(...Array.from({length: 20}, (_, i) => `记录 ${start + i + 1}`));
    this._stream.next(this._data);
  }
}

const log = ref<string[]>([]);
const viewer = new DemoViewer();
const source = new PagedDataSource(range => {
  log.value.unshift(`viewChange：渲染区间 ${range.start}–${range.end}`);
  if (log.value.length > 5) {
    log.value.pop();
  }
});
let unsubscribe: (() => void) | null = null;
let viewerUnsub: (() => void) | null = null;

function connect(): void {
  if (unsubscribe) {
    log.value.unshift('已连接，无需重复 connect');
    return;
  }
  viewerUnsub = viewer.viewChange.subscribe(range => {
    log.value.unshift(`viewer.viewChange：${range.start}–${range.end}`);
    if (log.value.length > 5) {
      log.value.pop();
    }
  });
  unsubscribe = source.connect(viewer).subscribe(data => {
    log.value.unshift(`数据流派发：${data.length} 条`);
    if (log.value.length > 5) {
      log.value.pop();
    }
  });
  log.value.unshift('已 connect：首帧在微任务中派发');
}

function loadMore(): void {
  source.loadMore();
}

function disconnect(): void {
  unsubscribe?.();
  unsubscribe = null;
  viewerUnsub?.();
  viewerUnsub = null;
  log.value.unshift('已 disconnect：查看器订阅一并释放');
}

const structural = isDataSource(source);
const notDataSource = isDataSource({connect: 'not-a-function'});
</script>

<template>
  <div class="wrap">
    <div class="buttons">
      <button type="button" class="doc-btn primary" @click="connect">connect（带查看器）</button>
      <button type="button" class="doc-btn" @click="loadMore">loadMore</button>
      <button type="button" class="doc-btn" @click="disconnect">disconnect</button>
    </div>
    <div class="doc-output">
      {{ log.join('\n') || '点击「connect」开始；加载数据或触发区间变化观察事件。' }}
    </div>
    <p class="hint">
      isDataSource(自定义数据源) = {{ structural }}；
      isDataSource({connect: 'not-a-function'}) = {{ notDataSource }}（结构判定）
    </p>
  </div>
</template>

<style scoped>
.wrap {
  width: 100%;
}

.buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.hint {
  margin: 10px 0 0;
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
