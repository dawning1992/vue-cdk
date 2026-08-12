<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref} from 'vue';
import {
  getRtlScrollAxisType,
  normalizePassiveListenerOptions,
  RtlScrollAxisType,
  supportsPassiveEventListeners,
  supportsScrollBehavior,
} from 'vue-cdk/platform';

const passiveSupported = ref(supportsPassiveEventListeners());
const scrollBehaviorSupported = ref(supportsScrollBehavior());
const rtlType = ref(getRtlScrollAxisType());
const pressCount = ref(0);
const box = ref<HTMLElement | null>(null);
const normalized = ref('');

let cleanup: (() => void) | null = null;

onMounted(() => {
  const el = box.value;
  if (!el) {
    return;
  }
  // normalizePassiveListenerOptions：不支持 passive 的浏览器退化为 capture 布尔值。
  const options = normalizePassiveListenerOptions({passive: true});
  normalized.value = JSON.stringify(options);
  const handler = () => {
    pressCount.value += 1;
  };
  el.addEventListener('pointerdown', handler, options);
  cleanup = () => el.removeEventListener('pointerdown', handler, options);
});

onBeforeUnmount(() => cleanup?.());
</script>

<template>
  <div class="wrap">
    <div class="doc-output">
      supportsPassiveEventListeners() = {{ passiveSupported }}
      supportsScrollBehavior() = {{ scrollBehaviorSupported }}
      getRtlScrollAxisType() = {{ rtlType }}（{{ RtlScrollAxisType[rtlType] }}）
      normalizePassiveListenerOptions({passive: true}) = {{ normalized || '—' }}
    </div>
    <button ref="box" type="button" class="doc-btn primary">
      点击 / 触摸测试被动监听（累计 {{ pressCount }} 次）
    </button>
    <p class="hint">RTL 滚动轴类型影响虚拟滚动与 scrollTo 的归一化方向，检测结果按进程缓存。</p>
  </div>
</template>

<style scoped>
.wrap {
  width: 100%;
}

.hint {
  margin: 10px 0 0;
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
