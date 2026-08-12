<script setup lang="ts">
import {onBeforeUnmount, ref} from 'vue';
import {scrollDispatcher, vScrollable} from 'vue-cdk/scrolling';

const box = ref<HTMLElement | null>(null);
const count = ref(0);
const top = ref(0);

/** 订阅全局滚动流：v-scrollable 注册的容器滚动也会进入该流。 */
const unsubscribe = scrollDispatcher.scrolled(50).subscribe(() => {
  count.value += 1;
  top.value = Math.round(box.value?.scrollTop ?? 0);
});

onBeforeUnmount(() => unsubscribe());
</script>

<template>
  <div class="wrap">
    <div ref="box" v-scrollable class="box">
      <p v-for="n in 30" :key="n" class="line">滚动行 {{ n }}</p>
    </div>
    <div class="doc-output">
      滚动事件：{{ count }} 次；容器 scrollTop：{{ top }}px
    </div>
  </div>
</template>

<style scoped>
.wrap {
  width: 100%;
}

.box {
  height: 160px;
  overflow: auto;
  border: 1px solid var(--doc-border);
  border-radius: 8px;
  background: #fff;
}

.line {
  margin: 0;
  padding: 6px 14px;
  font-size: 13px;
  border-bottom: 1px solid #f0f2f7;
}
</style>
