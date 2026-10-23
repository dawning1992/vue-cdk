<script setup lang="ts">
import {onBeforeUnmount, ref} from 'vue';
import {DomPortal, DomPortalOutlet} from 'vue-cdk/portal';
import {useLocale} from '../../composables/useLocale';

const {locale} = useLocale();
const t = (zh: string, en: string) => locale.value === 'en-US' ? en : zh;

const sourceEl = ref<HTMLElement | null>(null);
const outletAEl = ref<HTMLElement | null>(null);
const outletBEl = ref<HTMLElement | null>(null);
const location = ref(t('原位置', 'Original location'));
let portal: DomPortal | null = null;
let outletA: DomPortalOutlet | null = null;
let outletB: DomPortalOutlet | null = null;

/** 惰性创建出口与 portal（首次移动时）。 */
function ensureReady(): boolean {
  if (!sourceEl.value || !outletAEl.value || !outletBEl.value) {
    return false;
  }
  outletA ??= new DomPortalOutlet(outletAEl.value);
  outletB ??= new DomPortalOutlet(outletBEl.value);
  portal ??= new DomPortal(sourceEl.value);
  return true;
}

/** 把 DOM 元素移动到指定出口；再次移动前先 detach 回原位置。 */
function moveTo(target: DomPortalOutlet | null, label: string): void {
  if (!ensureReady() || !portal) {
    return;
  }
  if (portal.isAttached) {
    portal.detach();
  }
  portal.attach(target!);
  location.value = label;
}

/** detach 后元素经注释锚点恢复到原位置。 */
function moveHome(): void {
  if (portal?.isAttached) {
    portal.detach();
  }
  location.value = t('原位置', 'Original location');
}

onBeforeUnmount(() => {
  outletA?.dispose();
  outletB?.dispose();
  outletA = null;
  outletB = null;
});
</script>

<template>
  <div class="wrap column">
    <div class="controls">
      <button type="button" class="doc-btn primary" @click="moveTo(outletA, t('出口 A', 'Outlet A'))">
        {{ t('移动到出口 A', 'Move to outlet A') }}
      </button>
      <button type="button" class="doc-btn" @click="moveTo(outletB, t('出口 B', 'Outlet B'))">
        {{ t('移动到出口 B', 'Move to outlet B') }}
      </button>
      <button type="button" class="doc-btn" @click="moveHome">{{ t('移回原位', 'Return to original location') }}</button>
    </div>
    <div class="stage">
      <div class="zone">
        <p class="zone-title">{{ t('原位置', 'Original location') }}</p>
        <div ref="sourceEl" class="dom-box">{{ t('可移动的 DOM 节点（保留事件与样式）', 'Movable DOM node (events and styles are preserved)') }}</div>
      </div>
      <div class="zone">
        <p class="zone-title">{{ t('出口 A', 'Outlet A') }}</p>
        <div ref="outletAEl" class="portal-outlet" />
      </div>
      <div class="zone">
        <p class="zone-title">{{ t('出口 B', 'Outlet B') }}</p>
        <div ref="outletBEl" class="portal-outlet" />
      </div>
    </div>
    <p class="result">{{ t('当前位置：', 'Current location: ') }}{{ location }}</p>
  </div>
</template>

<style scoped>
.wrap {
  gap: 14px;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.stage {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.zone {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.zone-title {
  margin: 0;
  color: var(--doc-muted);
  font-size: 12px;
}

.portal-outlet,
.dom-box {
  min-height: 64px;
  padding: 12px;
  border: 1px dashed var(--doc-border);
  border-radius: var(--doc-radius);
  background: var(--doc-card);
  font-size: 13px;
}

.dom-box {
  border-style: solid;
  border-color: #c7d2fe;
  background: #eef2ff;
  color: #3730a3;
}

.result {
  margin: 0;
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
