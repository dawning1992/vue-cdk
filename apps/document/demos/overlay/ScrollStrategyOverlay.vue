<script setup lang="ts">
import {h, onBeforeUnmount, ref, shallowRef} from 'vue';
import {
  isElementScrolledOutsideView,
  type OverlayRef,
  type ScrollStrategy,
  useOverlay,
} from 'vue-cdk/overlay';
import {scrollDispatcher, vScrollable} from 'vue-cdk/scrolling';

type StrategyName = 'close' | 'block' | 'reposition' | 'noop';

const overlay = useOverlay();
const anchor = ref<HTMLElement | null>(null);
const box = ref<HTMLElement | null>(null);
const strategyName = ref<StrategyName>('close');
const open = ref(false);
const overlayRef = shallowRef<OverlayRef | null>(null);
const notice = ref('打开面板后滚动列表内容或页面，观察当前策略的行为。');
let unsubscribeVisibility: (() => void) | undefined;
/** 面板是否因锚点滚出可视区域被自动关闭（滚回后可自动恢复）。 */
let autoClosed = false;

const strategyLabels: Record<StrategyName, string> = {
  close: 'close：任何滚动都立即关闭',
  block: 'block：锁定页面滚动',
  reposition: 'reposition：随滚动重新定位',
  noop: 'noop：不处理滚动',
};

/** 按选择创建对应的滚动策略实例。 */
function buildStrategy(name: StrategyName): ScrollStrategy {
  switch (name) {
    case 'close':
      return overlay.scrollStrategies.close();
    case 'block':
      return overlay.scrollStrategies.block();
    case 'reposition':
      return overlay.scrollStrategies.reposition();
    default:
      return overlay.scrollStrategies.noop();
  }
}

/** 卸载面板；可见性监听保持存活，以便锚点滚回时自动恢复。 */
function detachPanel(): void {
  overlayRef.value?.detach();
  open.value = false;
}

/** 用户手动关闭：后续不再自动恢复。 */
function close(): void {
  autoClosed = false;
  detachPanel();
  notice.value = '面板已关闭。';
}

/** 锚点滚出可视区域时关闭，并标记可在滚回后恢复。 */
function closeForVisibility(): void {
  detachPanel();
  autoClosed = true;
  notice.value = '锚点行已滚出列表可视区域，面板已关闭，滚回后将自动恢复。';
}

/**
 * 监听锚点与列表可视区域的几何关系：
 * - 锚点滚出列表 → 自动关闭面板（避免锚点不可见时面板仍悬空）；
 * - 锚点滚回列表 → 自动恢复面板，形成可反复演示的循环。
 */
function subscribeAnchorVisibility(): void {
  unsubscribeVisibility = scrollDispatcher.ancestorScrolled(anchor).subscribe(() => {
    const origin = anchor.value;
    const container = box.value;
    if (!origin || !container) {
      return;
    }
    const outside = isElementScrolledOutsideView(origin.getBoundingClientRect(), [
      container.getBoundingClientRect(),
    ]);
    if (outside) {
      if (open.value) {
        closeForVisibility();
      }
    } else if (autoClosed && !open.value) {
      openPanel();
      notice.value = '锚点行已回到列表可视区域，面板已恢复。';
    }
  });
}

/** 打开面板并挂载锚点可见性监听（close 策略本身会随滚动关闭，无需额外监听）。 */
function openPanel(): void {
  autoClosed = false;
  const el = anchor.value;
  if (!el) {
    return;
  }
  const ref = overlay.create({
    positionStrategy: overlay
      .position()
      .flexibleConnectedTo(el)
      // inline：宿主插入到锚点行之后（列表 DOM 内），与 global 容器放置形成对比。
      .withPopoverLocation('inline')
      .withPositions([
        {originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top'},
        {originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom'},
      ]),
    scrollStrategy: buildStrategy(strategyName.value),
  });
  overlayRef.value = ref;

  ref.attach(() =>
    h(
      'div',
      {
        class: 'strategy-panel',
        style: {
          padding: '14px 16px',
          minWidth: '200px',
          background: '#fff',
          border: '1px solid #e3e6ee',
          borderRadius: '10px',
          boxShadow: '0 6px 20px rgba(31, 36, 48, 0.12)',
        },
      },
      [
        h(
          'strong',
          {style: {display: 'block', marginBottom: '4px', fontSize: '13px'}},
          `当前策略：${strategyLabels[strategyName.value]}`,
        ),
        h(
          'p',
          {style: {margin: '0', color: '#6b7280', fontSize: '12px'}},
          '现在滚动列表内容（锚点行）或页面观察行为变化。',
        ),
      ],
    ),
  );
  open.value = true;
  if (strategyName.value !== 'close' && !unsubscribeVisibility) {
    subscribeAnchorVisibility();
  }
  notice.value = `已打开，策略「${strategyName.value}」生效：${strategyLabels[strategyName.value]}。`;
}

function togglePanel(): void {
  if (open.value) {
    close();
    return;
  }
  openPanel();
}

/** 面板打开时切换策略会先关闭面板，确保下次打开使用新策略。 */
function onStrategyChange(): void {
  if (open.value) {
    close();
    notice.value = '策略已切换，面板已关闭；重新打开即可应用新策略。';
  }
}

onBeforeUnmount(() => {
  unsubscribeVisibility?.();
  unsubscribeVisibility = undefined;
  overlayRef.value?.dispose();
  overlayRef.value = null;
});
</script>

<template>
  <div class="wrap">
    <div class="bar">
      <select v-model="strategyName" class="doc-input" @change="onStrategyChange">
        <option v-for="name in (['close', 'block', 'reposition', 'noop'] as const)" :key="name" :value="name">
          {{ strategyLabels[name] }}
        </option>
      </select>
      <button type="button" class="doc-btn primary" @click="togglePanel">
        {{ open ? '关闭面板' : '打开面板' }}
      </button>
    </div>

    <div ref="box" class="box" v-scrollable>
      <p class="line">可滚动列表行 1</p>
      <!-- 面板锚定在列表内容中的这一行：滚动列表时锚点行会随内容移动。 -->
      <p ref="anchor" class="line anchor-line">可滚动列表行 2（面板锚点）</p>
      <p v-for="n in 38" :key="n" class="line">可滚动列表行 {{ n + 2 }}</p>
    </div>

    <div class="doc-output">{{ notice }}</div>
    <p class="hint">
      面板以 inline popover 插入到锚点行之后（DOM 位于列表内），锚点行滚出列表可视区域后自动关闭面板。
      close：滚动列表或页面立即关闭；block：锁定页面滚动但列表仍可滚；reposition：面板随锚点行滚动重新定位；
      noop：面板停在原地。
    </p>
  </div>
</template>

<style scoped>
.wrap {
  width: 100%;
}

.bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.box {
  height: 150px;
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

.anchor-line {
  background: var(--doc-primary-soft);
  color: var(--doc-primary);
  font-weight: 600;
}

.hint {
  margin: 10px 0 0;
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
