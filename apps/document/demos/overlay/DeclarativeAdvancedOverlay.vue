<script setup lang="ts">
import {ref} from 'vue';
import {
  type ConnectedOverlayPositionChange,
  type ConnectedPosition,
  VConnectedOverlay,
} from 'vue-cdk/overlay';

const anchorEl = ref<HTMLElement | null>(null);
const openRef = ref(false);
const matchWidth = ref(false);
const popoverMode = ref<'global' | 'inline' | 'none'>('global');
const events = ref<string[]>([]);

const pointOpen = ref(false);
const point = ref<{x: number; y: number} | null>(null);

const positions: ConnectedPosition[] = [
  {originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top'},
  {originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom'},
];

function log(event: string): void {
  events.value.unshift(event);
  if (events.value.length > 4) {
    events.value.pop();
  }
}

function onPositionChange(change: unknown): void {
  const changeInfo = change as ConnectedOverlayPositionChange;
  log(
    `positionChange：${changeInfo.connectionPair.originX}/${changeInfo.connectionPair.originY} → ${changeInfo.connectionPair.overlayX}/${changeInfo.connectionPair.overlayY}`,
  );
}

/** 点击舞台时以视口坐标作为 origin 打开浮层，展示坐标点定位。 */
function openAtPoint(event: MouseEvent): void {
  point.value = {x: event.clientX, y: event.clientY};
  pointOpen.value = true;
  log(`坐标点定位：(${point.value.x}, ${point.value.y})`);
}
</script>

<template>
  <div class="wrap">
    <div class="controls">
      <label class="check">
        <input v-model="matchWidth" type="checkbox" />
        matchWidth（面板宽度跟随锚点）
      </label>
      <label class="field">
        usePopover
        <select v-model="popoverMode" class="doc-input">
          <option value="global">global（全局容器）</option>
          <option value="inline">inline（锚点旁插入）</option>
          <option value="none">禁用 Popover</option>
        </select>
      </label>
    </div>

    <div class="stage">
      <button ref="anchorEl" type="button" class="doc-btn primary" @click="openRef = !openRef">
        元素 ref 作为 origin
      </button>
      <VConnectedOverlay
        :open="openRef"
        :origin="anchorEl"
        :positions="positions"
        :match-width="matchWidth"
        :use-popover="popoverMode === 'none' ? null : popoverMode"
        transform-origin-selector=".adv-panel-title"
        @position-change="onPositionChange"
        @attach="log('attach 事件')"
        @detach="log('detach 事件')"
        @update:open="openRef = $event"
      >
        <div class="adv-panel">
          <p class="adv-panel-title">标题带 transform-origin 锚点</p>
          <p class="adv-panel-body">origin 直接传入元素 ref；matchWidth 让面板与按钮等宽。</p>
        </div>
      </VConnectedOverlay>
    </div>

    <div class="stage clickable" @click="openAtPoint">
      <p class="stage-tip">点击此区域任意位置：以点击坐标作为 origin 打开浮层</p>
      <VConnectedOverlay
        :open="pointOpen"
        :origin="point"
        :positions="positions"
        use-popover="inline"
        @update:open="pointOpen = $event"
      >
        <div class="adv-panel small">
          <p class="adv-panel-title">坐标点 origin</p>
          <p class="adv-panel-body">Point 使用视口坐标；usePopover="inline" 时插入到锚点旁。</p>
        </div>
      </VConnectedOverlay>
    </div>

    <div class="doc-output">{{ events.join('\n') || '交互后查看 positionChange / attach / detach 事件' }}</div>
  </div>
</template>

<style scoped>
.wrap {
  width: 100%;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
  margin-bottom: 12px;
}

.check,
.field {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--doc-muted);
}

.stage {
  position: relative;
  min-height: 90px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 24px;
  border: 1px dashed var(--doc-border);
  border-radius: 8px;
  background: #fafbfe;
  margin-bottom: 12px;
}

.stage.clickable {
  cursor: crosshair;
  min-height: 110px;
}

.stage-tip {
  margin: 0;
  color: var(--doc-muted);
  font-size: 12px;
}

.adv-panel {
  padding: 14px 16px;
  min-width: 200px;
  background: #fff;
  border: 1px solid #e3e6ee;
  border-radius: 10px;
  box-shadow: 0 6px 20px rgba(31, 36, 48, 0.12);
}

.adv-panel.small {
  min-width: 170px;
}

.adv-panel-title {
  margin: 0 0 6px;
  font-size: 13px;
  font-weight: 600;
}

.adv-panel-body {
  margin: 0;
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
