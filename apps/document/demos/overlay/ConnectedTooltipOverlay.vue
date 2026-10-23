<script setup lang="ts">
import {onBeforeUnmount, ref, shallowRef} from 'vue';
import {useLocale} from '../../composables/useLocale';
import {
  type ConnectedPosition,
  type FlexibleConnectedPositionStrategy,
  type OverlayRef,
  useOverlay,
} from 'vue-cdk/overlay';
import {ComponentPortal} from 'vue-cdk/portal';
import ConnectedTooltipContent from './ConnectedTooltipContent.vue';

const overlay = useOverlay();
const anchor = ref<HTMLElement | null>(null);

const open = ref(false);
const lockPosition = ref(false);
const push = ref(false);
const flexibleDimensions = ref(false);
const growAfterOpen = ref(false);
const offsetX = ref(0);
const offsetY = ref(8);
const viewportMargin = ref(8);

const overlayRef = shallowRef<OverlayRef | null>(null);
const strategy = shallowRef<FlexibleConnectedPositionStrategy | null>(null);
const positionInfo = ref('');
const {locale} = useLocale();

/** 候选位置按优先级排列：下方展开 → 上方展开 → 右侧居中。 */
const positions: ConnectedPosition[] = [
  {originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top'},
  {originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom'},
  {originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center'},
];

/** 把当前面板上的开关/偏移应用到定位策略；面板打开时立即重算位置。 */
function applyOptions(): void {
  strategy.value
    ?.withPositions(positions)
    .withDefaultOffsetX(offsetX.value)
    .withDefaultOffsetY(offsetY.value)
    .withViewportMargin(viewportMargin.value)
    .withLockedPosition(lockPosition.value)
    .withPush(push.value)
    .withFlexibleDimensions(flexibleDimensions.value)
    .withGrowAfterOpen(growAfterOpen.value);
  overlayRef.value?.updatePosition();
}

function close(): void {
  overlayRef.value?.detach();
  open.value = false;
}

/** 命令式连接定位：策略绑定锚点元素，每次打开都按最新选项重建。 */
function togglePanel(): void {
  if (open.value) {
    close();
    return;
  }
  const el = anchor.value;
  if (!el) {
    return;
  }
  strategy.value = overlay.position().flexibleConnectedTo(el);
  applyOptions();

  const ref = overlay.create({positionStrategy: strategy.value});
  overlayRef.value = ref;

  // 位置变化事件载荷包含最终选中的连接组合，用于实时展示选优结果。
  strategy.value.positionChanges.subscribe(change => {
    const pair = change.connectionPair;
    positionInfo.value =
      `${locale.value === 'en-US' ? 'origin' : 'origin'} ${pair.originX}/${pair.originY} → overlay ${pair.overlayX}/${pair.overlayY}`;
  });

  ref.attach(new ComponentPortal(ConnectedTooltipContent, {props: {onClose: close}}));
  open.value = true;
}

onBeforeUnmount(() => {
  overlayRef.value?.dispose();
  overlayRef.value = null;
});
</script>

<template>
  <div class="wrap">
    <div class="options">
      <label class="check">
        <input v-model="lockPosition" type="checkbox" @change="applyOptions" />
        {{ locale === 'en-US' ? 'Lock position' : '锁定位置' }}
      </label>
      <label class="check">
        <input v-model="push" type="checkbox" @change="applyOptions" />
        {{ locale === 'en-US' ? 'Push into viewport' : 'push 回屏' }}
      </label>
      <label class="check">
        <input v-model="flexibleDimensions" type="checkbox" @change="applyOptions" />
        {{ locale === 'en-US' ? 'Flexible dimensions' : 'flexible 尺寸' }}
      </label>
      <label class="check">
        <input v-model="growAfterOpen" type="checkbox" @change="applyOptions" />
        growAfterOpen
      </label>
      <label class="field">
        offsetX
        <input v-model.number="offsetX" class="doc-input num" type="number" @change="applyOptions" />
      </label>
      <label class="field">
        offsetY
        <input v-model.number="offsetY" class="doc-input num" type="number" @change="applyOptions" />
      </label>
      <label class="field">
        viewportMargin
        <input
          v-model.number="viewportMargin"
          class="doc-input num"
          type="number"
          @change="applyOptions"
        />
      </label>
    </div>

    <div class="stage">
      <button ref="anchor" type="button" class="doc-btn primary" @click="togglePanel">
        {{ locale === 'en-US' ? 'Open connected panel' : '打开连接面板' }}
      </button>
    </div>

    <div class="doc-output">{{ positionInfo || (locale === 'en-US' ? 'Open the panel to inspect the selected position' : '打开面板后查看当前位置选择结果') }}</div>
    <p class="hint">{{ locale === 'en-US' ? 'Position is recalculated as options and offsets change; shrink the browser window to observe flipping.' : '调整开关与偏移后，面板会实时重算位置；把浏览器窗口缩小即可观察翻转。' }}</p>
  </div>
</template>

<style scoped>
.wrap {
  width: 100%;
}

.options {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.check {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--doc-muted);
}

.field {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--doc-muted);
}

.num {
  width: 70px;
  padding: 4px 8px;
}

.stage {
  min-height: 120px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 20px;
  border: 1px dashed var(--doc-border);
  border-radius: 8px;
  background: #fafbfe;
}

.hint {
  margin: 10px 0 0;
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
