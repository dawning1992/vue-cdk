<script setup lang="ts">
import {computed} from 'vue';
import {
  createPlatform,
  getSupportedInputTypes,
  isTestEnvironment,
  usePlatform,
} from 'vue-cdk/platform';

// 组合式入口：优先取注入实例，未注入时回退全局单例。
const instance = usePlatform();

const flags = computed(() => [
  {name: 'isBrowser', value: instance.isBrowser},
  {name: 'EDGE', value: instance.EDGE},
  {name: 'TRIDENT', value: instance.TRIDENT},
  {name: 'BLINK', value: instance.BLINK},
  {name: 'WEBKIT', value: instance.WEBKIT},
  {name: 'IOS', value: instance.IOS},
  {name: 'FIREFOX', value: instance.FIREFOX},
  {name: 'ANDROID', value: instance.ANDROID},
  {name: 'SAFARI', value: instance.SAFARI},
]);

const inputTypes = Array.from(getSupportedInputTypes());
const testEnvironment = isTestEnvironment();

// 自定义 UA 注入示例：模拟 EdgeHTML 时代的 Edge，验证 createPlatform 可覆盖检测结果。
const customEdge = createPlatform({
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.79 Safari/537.36 Edge/14.14393',
});
</script>

<template>
  <div class="wrap">
    <div class="flags">
      <span v-for="flag in flags" :key="flag.name" class="flag">
        <i :class="flag.value ? 'on' : 'off'" />
        {{ flag.name }} = {{ flag.value }}
      </span>
    </div>

    <div class="section">
      <h4>支持的 input type（{{ inputTypes.length }} 项）</h4>
      <div class="chips">
        <code v-for="type in inputTypes" :key="type" class="chip">{{ type }}</code>
      </div>
    </div>

    <div class="section">
      <h4>测试环境与自定义 UA</h4>
      <div class="doc-output">
        isTestEnvironment() = {{ testEnvironment }}
        createPlatform(EdgeHTML UA) → EDGE = {{ customEdge.EDGE }}，WEBKIT = {{ customEdge.WEBKIT }}
      </div>
      <p class="hint">
        Platform 各标志为构造时快照；usePlatform 在组件链未 provide 时回退全局单例。
      </p>
    </div>
  </div>
</template>

<style scoped>
.wrap {
  width: 100%;
}

.flags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.flag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border: 1px solid var(--doc-border);
  border-radius: 999px;
  background: var(--doc-card);
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.flag i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.flag .on {
  background: #16a34a;
}

.flag .off {
  background: #cbd5e1;
}

.section {
  margin-top: 16px;
}

.section h4 {
  margin: 0 0 8px;
  font-size: 13px;
  color: var(--doc-muted);
  font-weight: 600;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  padding: 3px 8px;
  border: 1px solid var(--doc-border);
  border-radius: 6px;
  background: #f8fafc;
  font-size: 12px;
}

.hint {
  margin: 10px 0 0;
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
