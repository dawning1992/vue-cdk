<script setup lang="ts">
import {ref} from 'vue';
import {coerceArray, coerceCssPixelValue, coerceElement} from 'vue-cdk/coercion';
import {useLocale} from '../../composables/useLocale';
const {locale} = useLocale();

const output = ref('');
const element = ref<HTMLElement | null>(null);

function runArray(): void {
  output.value = JSON.stringify(
    {
      [locale.value === 'en-US' ? 'Single value' : '单个值']: coerceArray('a'),
      [locale.value === 'en-US' ? 'Array' : '数组']: coerceArray(['a', 'b']),
      [locale.value === 'en-US' ? 'Null' : '空值']: coerceArray(null),
      undefined: coerceArray(undefined),
      [locale.value === 'en-US' ? 'Empty array' : '空数组']: coerceArray([]),
    },
    null,
    2,
  );
}

function runPixel(): void {
  output.value = JSON.stringify(
    {
      [locale.value === 'en-US' ? 'Number' : '数字']: coerceCssPixelValue(12),
      [locale.value === 'en-US' ? 'Zero' : '零']: coerceCssPixelValue(0),
      [locale.value === 'en-US' ? 'Negative number' : '负数']: coerceCssPixelValue(-12),
      [locale.value === 'en-US' ? 'String' : '字符串']: coerceCssPixelValue('100%'),
      auto: coerceCssPixelValue('auto'),
      [locale.value === 'en-US' ? 'Empty string' : '空字符串']: coerceCssPixelValue(''),
      [locale.value === 'en-US' ? 'Null' : '空值']: coerceCssPixelValue(null),
    },
    null,
    2,
  );
}

function runElement(): void {
  try {
    const el = coerceElement(element);
    output.value = locale.value === 'en-US' ? `coerceElement() resolved: <${el.tagName.toLowerCase()}>` : `coerceElement() 解析成功：<${el.tagName.toLowerCase()}>`;
  } catch (error) {
    output.value = locale.value === 'en-US' ? `coerceElement() threw: ${(error as Error).message}` : `coerceElement() 抛出异常：${(error as Error).message}`;
  }
}

function runEmptyElement(): void {
  try {
    coerceElement(ref<HTMLElement | null>(null));
  } catch (error) {
    output.value = locale.value === 'en-US' ? `Empty element error: ${(error as Error).message}` : `未挂载元素抛错：${(error as Error).message}`;
  }
}
</script>

<template>
  <div class="wrap">
    <div class="buttons">
      <button type="button" class="doc-btn" @click="runArray">coerceArray</button>
      <button type="button" class="doc-btn" @click="runPixel">coerceCssPixelValue</button>
      <button type="button" class="doc-btn" @click="runElement">{{ locale === 'en-US' ? 'coerceElement (mounted)' : 'coerceElement（已挂载）' }}</button>
      <button type="button" class="doc-btn" @click="runEmptyElement">{{ locale === 'en-US' ? 'coerceElement (empty ref)' : 'coerceElement（空 ref）' }}</button>
    </div>
    <div ref="element" class="target-element">{{ locale === 'en-US' ? 'ref target element' : 'ref 目标元素' }}</div>
    <pre class="doc-output">{{ output || (locale === 'en-US' ? 'Click a button above to view the result' : '点击上方按钮查看转换结果') }}</pre>
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
