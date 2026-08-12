<script setup lang="ts">
import {onBeforeUnmount, ref, reactive} from 'vue';
import {scrollDispatcher, useScrollable, vScrollable} from 'vue-cdk/scrolling';

const box2 = ref<HTMLElement | null>(null);
const count = ref(0);
const offsets = reactive({top: 0, left: 0, start: 0, end: 0, right: 0, bottom: 0});

// 组合式注册：返回 Scrollable 实例，提供 scrollTo / measureScrollOffset。
const scrollable2 = useScrollable(box2);

/** 订阅全局滚动流：v-scrollable 与 useScrollable 注册的容器滚动都会进入该流。 */
const unsubscribe = scrollDispatcher.scrolled(50).subscribe(() => {
  count.value += 1;
  measure();
});

function measure(): void {
  offsets.top = scrollable2.measureScrollOffset('top');
  offsets.bottom = scrollable2.measureScrollOffset('bottom');
  offsets.left = scrollable2.measureScrollOffset('left');
  offsets.right = scrollable2.measureScrollOffset('right');
  offsets.start = scrollable2.measureScrollOffset('start');
  offsets.end = scrollable2.measureScrollOffset('end');
}

function scrollTo(options: Parameters<typeof scrollable2.scrollTo>[0]): void {
  scrollable2.scrollTo(options);
  measure();
}

onBeforeUnmount(() => unsubscribe());
</script>

<template>
  <div class="wrap">
    <div class="cols">
      <div class="col">
        <p class="label">v-scrollable（注册到全局分发）</p>
        <div v-scrollable class="box">
          <p v-for="n in 30" :key="n" class="line">滚动行 {{ n }}</p>
        </div>
      </div>
      <div class="col">
        <p class="label">useScrollable（scrollTo / measureScrollOffset）</p>
        <div ref="box2" class="box">
          <div class="wide">
            <p v-for="n in 30" :key="n" class="line">横向内容行 {{ n }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="buttons">
      <button type="button" class="doc-btn" @click="scrollTo({top: 0})">scrollTo top</button>
      <button type="button" class="doc-btn" @click="scrollTo({bottom: 0})">scrollTo bottom</button>
      <button type="button" class="doc-btn" @click="scrollTo({left: 0})">scrollTo left</button>
      <button type="button" class="doc-btn" @click="scrollTo({right: 0})">scrollTo right</button>
      <button type="button" class="doc-btn" @click="scrollTo({start: 0})">scrollTo start</button>
      <button type="button" class="doc-btn" @click="scrollTo({end: 0})">scrollTo end</button>
      <button type="button" class="doc-btn primary" @click="scrollTo({top: 120, behavior: 'smooth'})">
        scrollTo 120px
      </button>
    </div>

    <div class="doc-output">
      滚动事件：{{ count }} 次
      top={{ offsets.top }} bottom={{ offsets.bottom }} left={{ offsets.left }}
      right={{ offsets.right }} start={{ offsets.start }} end={{ offsets.end }}
    </div>
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
  min-width: 220px;
}

.label {
  margin: 0 0 6px;
  font-size: 12px;
  color: var(--doc-muted);
}

.box {
  height: 150px;
  overflow: auto;
  border: 1px solid var(--doc-border);
  border-radius: 8px;
  background: #fff;
}

.wide {
  width: 560px;
}

.line {
  margin: 0;
  padding: 6px 14px;
  font-size: 13px;
  border-bottom: 1px solid #f0f2f7;
  white-space: nowrap;
}

.buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
</style>
