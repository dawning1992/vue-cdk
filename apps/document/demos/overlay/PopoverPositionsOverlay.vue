<script setup lang="ts">
import {computed, ref} from 'vue';
import {VConnectedOverlay, VOverlayOrigin} from 'vue-cdk/overlay';
import {useLocale} from '../../composables/useLocale';

const supported =
  typeof document !== 'undefined' &&
  'showPopover' in document.body;

const open = ref<'global' | 'inline' | 'parent' | null>(null);
const parentElement = ref<HTMLElement | null>(null);
const {locale} = useLocale();

const globalLocation = computed(() => (open.value === 'global' ? ('global' as const) : null));
const inlineLocation = computed(() => (open.value === 'inline' ? ('inline' as const) : null));
const parentLocation = computed(() =>
  open.value === 'parent' && parentElement.value
    ? {type: 'parent' as const, element: parentElement.value}
    : null,
);
</script>

<template>
  <div class="wrap">
    <p class="hint">
      <code>use-popover</code> {{ locale === 'en-US' ? 'supports three DOM insertion locations: ' : '支持 ' }}<code>global</code>{{ locale === 'en-US' ? ' (container), ' : '（容器）、' }}<code>inline</code>
      {{ locale === 'en-US' ? ' (immediately after the trigger), and ' : '（紧随触发元素）、' }}<code>parent</code>{{ locale === 'en-US' ? ' (custom parent); unsupported Popover API falls back to container rendering.' : '（自定义父元素）三种 DOM 插入位置；浏览器不支持 Popover API 时自动降级为容器渲染。' }}
    </p>
    <p v-if="!supported" class="hint">{{ locale === 'en-US' ? 'This browser does not support the native Popover API; the demo falls back to container rendering.' : '当前浏览器不支持原生 Popover API，将演示降级为容器渲染。' }}</p>
    <div v-else class="row">
      <VOverlayOrigin>
        <button type="button" class="doc-btn" @click="open = open === 'global' ? null : 'global'">
          {{ locale === 'en-US' ? 'global location' : 'global 位置' }}
        </button>
        <VConnectedOverlay
          :open="open === 'global'"
          :use-popover="globalLocation"
          :positions="[{originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top'}]"
          @overlay-outside-click="open = null"
        >
          <div class="panel">{{ locale === 'en-US' ? 'Rendered in the global overlay container' : '渲染在全局 overlay 容器中' }}</div>
        </VConnectedOverlay>
      </VOverlayOrigin>

      <VOverlayOrigin>
        <button type="button" class="doc-btn" @click="open = open === 'inline' ? null : 'inline'">
          {{ locale === 'en-US' ? 'inline location' : 'inline 位置' }}
        </button>
        <VConnectedOverlay
          :open="open === 'inline'"
          :use-popover="inlineLocation"
          :positions="[{originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top'}]"
          @overlay-outside-click="open = null"
        >
          <div class="panel">{{ locale === 'en-US' ? 'DOM immediately follows the trigger' : 'DOM 紧随触发元素之后' }}</div>
        </VConnectedOverlay>
      </VOverlayOrigin>

      <div ref="parentElement" class="parent-stage">
        <VOverlayOrigin>
          <button type="button" class="doc-btn" @click="open = open === 'parent' ? null : 'parent'">
            {{ locale === 'en-US' ? 'parent location' : 'parent 位置' }}
          </button>
          <VConnectedOverlay
            :open="open === 'parent'"
            :use-popover="parentLocation"
            :positions="[{originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top'}]"
            @overlay-outside-click="open = null"
          >
            <div class="panel">{{ locale === 'en-US' ? 'Rendered inside the dashed custom parent on the right' : '渲染在右侧虚线框（自定义父元素）内' }}</div>
          </VConnectedOverlay>
        </VOverlayOrigin>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wrap {
  width: 100%;
}

.hint {
  margin: 0 0 12px;
  color: var(--doc-muted);
  font-size: 13px;
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 12px;
}

.parent-stage {
  flex: 1;
  min-width: 220px;
  min-height: 90px;
  display: flex;
  align-items: flex-start;
  padding: 12px;
  border: 1px dashed var(--doc-border);
  border-radius: 8px;
  background: #fafbfe;
}

.panel {
  padding: 12px 16px;
  min-width: 180px;
  background: #fff;
  border: 1px solid var(--doc-border);
  border-radius: 8px;
  box-shadow: var(--doc-shadow);
  font-size: 13px;
}
</style>
