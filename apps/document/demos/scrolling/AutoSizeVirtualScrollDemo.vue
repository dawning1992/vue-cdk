<script setup lang="ts">
import {ref, watch} from 'vue';
import {VVirtualFor, VVirtualScrollViewport} from 'vue-cdk/scrolling';
import {useLocale} from '../../composables/useLocale';

interface Message {
  id: number;
  text: string;
  expanded?: boolean;
}

let previousId = 0;
let nextId = 40;
const {locale} = useLocale();
const messages = ref<Message[]>(
  Array.from({length: 40}, (_, index) => ({
    id: index + 1,
    text: (locale.value === 'en-US' ? 'Item length is unknown in advance. ' : '内容长度在使用前未知。').repeat(index % 5 + 1),
  })),
);

watch(locale, value => {
  messages.value = messages.value.map((message, index) => ({
    ...message,
    text: value === 'en-US'
      ? (message.id < 0 ? `Earlier message ${Math.abs(message.id)}: dynamic text. ` : message.id > 40 ? `New message ${message.id}: asynchronous content. ` : 'Item length is unknown in advance. ').repeat(index % 5 + 1)
      : (message.id < 0 ? `更早的消息 ${Math.abs(message.id)}：动态文本 ` : message.id > 40 ? `新消息 ${message.id}：异步内容 ` : '内容长度在使用前未知。').repeat(index % 5 + 1),
  }));
});

/** 稳定身份是顶部追加后恢复滚动锚点的必要前置条件。 */
function trackBy(_index: number, message: unknown): number {
  return (message as Message).id;
}

/** 模拟向顶部加载更早的历史消息。 */
function prepend(): void {
  const older = Array.from({length: 5}, (_, index) => ({
    id: --previousId,
    text: locale.value === 'en-US' ? `Earlier message ${index + 1}: ${'dynamic text '.repeat(index + 1)}` : `更早的消息 ${index + 1}：${'动态文本 '.repeat(index + 1)}`,
  })).reverse();
  messages.value = [...older, ...messages.value];
}

/** 模拟向底部接收新消息；视口保持当前可见内容，是否吸底由业务层决定。 */
function append(): void {
  messages.value = [
    ...messages.value,
    ...Array.from({length: 5}, (_, index) => ({
      id: ++nextId,
      text: locale.value === 'en-US' ? `New message ${nextId}: ${'asynchronous content '.repeat(index + 2)}` : `新消息 ${nextId}：${'异步内容 '.repeat(index + 2)}`,
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
      <button type="button" class="doc-btn" @click="prepend">{{ locale === 'en-US' ? 'Prepend 5 items' : '向顶部追加 5 条' }}</button>
      <button type="button" class="doc-btn primary" @click="append">{{ locale === 'en-US' ? 'Append 5 items' : '向底部追加 5 条' }}</button>
      <span class="info">{{ locale === 'en-US' ? `${messages.length} items` : `共 ${messages.length} 条` }}</span>
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
            {{ item.expanded ? (locale === 'en-US' ? 'Collapse' : '收起') : (locale === 'en-US' ? 'Expand async content' : '展开异步区域') }}
          </button>
          <p v-if="item.expanded" class="details">
            {{ locale === 'en-US' ? 'An item can grow after rendering. The viewport remeasures it and compensates scroll position when the change is above the anchor.' : '条目渲染后仍可继续变高；视口会重新测量，并在变化位于锚点上方时补偿滚动位置。' }}
          </p>
        </article>
      </VVirtualFor>
    </VVirtualScrollViewport>
    <p class="hint">
      {{ locale === 'en-US' ? 'Appending away from the bottom preserves the visible content; prepending while already at the bottom keeps the viewport pinned there. Appending to the bottom does not auto-pin; call scrollToIndex for chat-style following. The initial autosize release supports vertical scrolling only. Prepending requires a stable, unique trackBy. Alternatively, call provideAutoSizeVirtualScrollStrategy(options) in the parent setup and omit the autosize prop.' : '普通位置追加会保持当前可见内容；若向顶部追加前已经位于最底部，则继续保持吸底。向底部追加不会自动吸底，如需聊天式跟随请显式调用 scrollToIndex。autosize 首版仅支持纵向，顶部追加必须提供稳定且唯一的 trackBy；也可在父组件 setup 中调用 provideAutoSizeVirtualScrollStrategy(options) 后省略 autosize 属性。' }}
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
