<script setup lang="ts">
import {ref} from 'vue';
import {coerceArray, coerceCssPixelValue, coerceElement} from 'vue-cdk/coercion';

const output = ref('');
const element = ref<HTMLElement | null>(null);

function runArray(): void {
  output.value = JSON.stringify(
    {
      单个值: coerceArray('a'),
      数组: coerceArray(['a', 'b']),
      空值: coerceArray(null),
    },
    null,
    2,
  );
}

function runPixel(): void {
  output.value = JSON.stringify(
    {
      数字: coerceCssPixelValue(12),
      字符串: coerceCssPixelValue('100%'),
      空值: coerceCssPixelValue(null),
    },
    null,
    2,
  );
}

function runElement(): void {
  try {
    const el = coerceElement(element);
    output.value = `coerceElement() 解析成功：<${el.tagName.toLowerCase()}>`;
  } catch (error) {
    output.value = `coerceElement() 抛出异常：${(error as Error).message}`;
  }
}

function runEmptyElement(): void {
  try {
    coerceElement(ref<HTMLElement | null>(null));
  } catch (error) {
    output.value = `未挂载元素抛错：${(error as Error).message}`;
  }
}
</script>

<template>
  <div class="wrap">
    <div class="buttons">
      <button type="button" class="doc-btn" @click="runArray">coerceArray</button>
      <button type="button" class="doc-btn" @click="runPixel">coerceCssPixelValue</button>
      <button type="button" class="doc-btn" @click="runElement">coerceElement（已挂载）</button>
      <button type="button" class="doc-btn" @click="runEmptyElement">coerceElement（空 ref）</button>
    </div>
    <div ref="element" class="target-element">ref 目标元素</div>
    <pre class="doc-output">{{ output || '点击上方按钮查看转换结果' }}</pre>
  </div>
</template>

<style scoped>
.wrap {
  width: 100%;
}

.buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.target-element {
  display: inline-block;
  margin-top: 12px;
  padding: 6px 12px;
  border: 1px dashed var(--doc-border);
  border-radius: 6px;
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
