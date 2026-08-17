<script setup lang="ts">
import {ref} from 'vue';
import {VVirtualFor, VVirtualScrollViewport} from 'vue-cdk/scrolling';

interface Message {
  id: number;
  text: string;
  expanded?: boolean;
}

let previousId = 0;
let nextId = 40;
const messages = ref<Message[]>(
  Array.from({length: 40}, (_, index) => ({
    id: index + 1,
    text: '内容长度在使用前未知。'.repeat(index % 5 + 1),
  })),
);

/** 稳定身份是顶部追加后恢复滚动锚点的必要前置条件。 */
function trackBy(_index: number, message: unknown): number {
  return (message as Message).id;
}

/** 模拟向顶部加载更早的历史消息。 */
function prepend(): void {
  const older = Array.from({length: 5}, (_, index) => ({
    id: --previousId,
    text: `更早的消息 ${index + 1}：${'动态文本 '.repeat(index + 1)}`,
  })).reverse();
  messages.value = [...older, ...messages.value];
}

/** 模拟向底部接收新消息；视口保持当前可见内容，是否吸底由业务层决定。 */
function append(): void {
  messages.value = [
    ...messages.value,
    ...Array.from({length: 5}, (_, index) => ({
      id: ++nextId,
      text: `新消息 ${nextId}：${'异步内容 '.repeat(index + 2)}`,
    })),
  ];
}

/** 展开条目会触发 ResizeObserver，策略自动修正尺寸和锚点。 */
function toggle(message: Message): void {
  message.expanded = !message.expanded;
}
</script>

<template>
  <div class="wrap">
    <div class="toolbar">
      <button type="button" class="doc-btn" @click="prepend">向顶部追加 5 条</button>
      <button type="button" class="doc-btn primary" @click="append">向底部追加 5 条</button>
      <span class="info">共 {{ messages.length }} 条</span>
    </div>
    <VVirtualScrollViewport
      autosize
      :estimated-item-size="64"
      style="height: 300px; border: 1px solid var(--doc-border); border-radius: 8px"
    >
      <VVirtualFor :of="messages" :track-by="trackBy" v-slot="{item}">
        <article class="message">
          <strong>id:{{ item.id }}</strong>
          <span>{{ item.text }}</span>
          <button type="button" class="expand" @click="toggle(item)">
            {{ item.expanded ? '收起' : '展开异步区域' }}
          </button>
          <p v-if="item.expanded" class="details">
            条目渲染后仍可继续变高；视口会重新测量，并在变化位于锚点上方时补偿滚动位置。
          </p>
        </article>
      </VVirtualFor>
    </VVirtualScrollViewport>
    <p class="hint">
      普通位置追加会保持当前可见内容；若向顶部追加前已经位于最底部，则继续保持吸底。
      向底部追加不会自动吸底，如需聊天式跟随请显式调用 scrollToIndex。
      autosize 首版仅支持纵向，顶部追加必须提供稳定且唯一的 trackBy；也可在父组件 setup 中调用
      provideAutoSizeVirtualScrollStrategy(options) 后省略 autosize 属性。
    </p>
  </div>
</template>

<style scoped>
.toolbar { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.info, .hint { color: var(--doc-muted); font-size: 12px; }
.message { box-sizing: border-box; padding: 10px 14px; border-bottom: 1px solid #edf0f6; line-height: 1.6; }
.message strong { margin-right: 8px; }
.expand { margin-left: 8px; border: 0; background: transparent; color: var(--doc-primary); cursor: pointer; }
.details { margin: 8px 0 0; padding: 10px; border-radius: 6px; background: #f3f6fc; }
.hint { margin: 10px 0 0; }
</style>
