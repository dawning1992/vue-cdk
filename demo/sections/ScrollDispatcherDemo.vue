<script setup lang="ts">
/**
 * 滚动分发演示：vScrollable / useScrollable 注册滚动容器，
 * ScrollDispatcher 全局分发与 ancestorScrolled 祖先监听。
 */

import {onBeforeUnmount, onMounted, ref} from 'vue';
import {scrollDispatcher, useScrollable, vScrollable} from 'vue-cdk/scrolling';

defineProps<{id?: string}>();

/** 全局滚动事件日志（100ms 节流）。 */
const logs = ref<string[]>([]);
const log = (message: string): void => {
  logs.value.unshift(message);
  if (logs.value.length > 8) {
    logs.value.pop();
  }
};

let globalUnsubscribe: (() => void) | undefined;
onMounted(() => {
  globalUnsubscribe = scrollDispatcher.scrolled(100).subscribe(source => {
    if (!source) {
      log('窗口/文档滚动（void）');
    } else {
      const label = source.getElementRef().nativeElement.getAttribute('data-label') ?? 'unknown';
      log(`注册容器滚动：${label}`);
    }
  });
});
onBeforeUnmount(() => globalUnsubscribe?.());

/** ancestorScrolled：只监听内部元素的滚动祖先。 */
const innerElement = ref<HTMLElement | null>(null);
const ancestorLogs = ref<string[]>([]);
let ancestorUnsubscribe: (() => void) | undefined;

onMounted(() => {
  ancestorUnsubscribe = scrollDispatcher.ancestorScrolled(innerElement, 0).subscribe(source => {
    ancestorLogs.value.unshift(source ? '命中祖先容器' : '页面滚动');
    if (ancestorLogs.value.length > 5) {
      ancestorLogs.value.pop();
    }
  });
});
onBeforeUnmount(() => ancestorUnsubscribe?.());

/** useScrollable 组合式注册。 */
const programmaticElement = ref<HTMLElement | null>(null);
useScrollable(programmaticElement);
const registeredCount = ref(0);

onMounted(() => {
  registeredCount.value = scrollDispatcher.scrollContainers.size;
});
</script>

<template>
  <section :id="id" class="section">
    <h2>滚动分发<span class="badge">ScrollDispatcher / vScrollable / useScrollable</span></h2>
    <p class="desc">
      通过 vScrollable 指令或 useScrollable 组合式把元素注册为滚动容器，
      ScrollDispatcher 统一分发窗口滚动（void）与注册容器滚动（目标）。
    </p>

    <div class="vs-grid">
      <div class="demo-card">
        <h3>vScrollable 注册 + 全局订阅（100ms 节流）</h3>
        <div class="sd-scroll-area" data-label="外层容器" v-scrollable>
          <div class="sd-block">外层 v-scrollable（滚动我）</div>
          <div class="sd-scroll-area sd-inner" data-label="内层容器" v-scrollable>
            <div class="sd-block">内层 v-scrollable（滚动我）</div>
          </div>
        </div>
        <ul class="sd-logs">
          <li v-for="(entry, i) in logs" :key="i">{{ entry }}</li>
          <li v-if="!logs.length" class="muted">还没有滚动事件，滚动上方容器或页面试试。</li>
        </ul>
      </div>

      <div class="demo-card">
        <h3>ancestorScrolled：只响应滚动祖先</h3>
        <div class="sd-scroll-area sd-ancestor" v-scrollable>
          <div class="sd-block">祖先滚动容器</div>
          <div ref="innerElement" class="sd-block">内部元素（监听其祖先滚动）</div>
        </div>
        <ul class="sd-logs">
          <li v-for="(entry, i) in ancestorLogs" :key="i">{{ entry }}</li>
          <li v-if="!ancestorLogs.length" class="muted">
            滚动上方容器或页面，只有祖先容器与页面滚动会显示。
          </li>
        </ul>
      </div>

      <div class="demo-card">
        <h3>useScrollable 组合式注册</h3>
        <div ref="programmaticElement" class="sd-block">通过 useScrollable(ref) 注册的容器</div>
        <p class="hint">当前已注册滚动容器数：{{ registeredCount }}。</p>
      </div>
    </div>
  </section>
</template>
