<script setup lang="ts">
import {computed, ref} from 'vue';
import {coerceArray, coerceCssPixelValue, coerceElement} from 'vue-cdk/coercion';

// 场景一：尺寸归一 —— number | string 统一为合法 CSS 值。
const widthMode = ref<'number' | 'percent' | 'empty'>('number');
const widthStyle = computed(() => ({
  width: coerceCssPixelValue(
    widthMode.value === 'number' ? 140 : widthMode.value === 'percent' ? '50%' : null,
  ),
}));

// 场景二：props 归一 —— string | string[] 统一为数组渲染标签。
const tagMode = ref<'single' | 'array'>('single');
const tags = computed(() =>
  coerceArray(tagMode.value === 'single' ? '单一标签' : ['标签一', '标签二', '标签三']),
);

// 场景三：元素归一 —— 模板 ref 交给组合式函数前先解析。
const box = ref<HTMLElement | null>(null);
const elementState = ref('尚未解析');
const elementError = ref('');

function parseElement(): void {
  elementError.value = '';
  try {
    const el = coerceElement(box);
    elementState.value = `已解析：<${el.tagName.toLowerCase()}>`;
  } catch (error) {
    elementState.value = '解析失败';
    elementError.value = (error as Error).message;
  }
}

function clearElement(): void {
  box.value = null;
  elementState.value = 'ref 已清空（指向 null）';
  elementError.value = '';
}

function parseEmpty(): void {
  try {
    coerceElement(box);
  } catch (error) {
    elementError.value = (error as Error).message;
  }
}
</script>

<template>
  <div class="wrap">
    <div class="row">
      <p class="label">coerceCssPixelValue：尺寸输入归一</p>
      <select v-model="widthMode" class="doc-input">
        <option value="number">数字 140</option>
        <option value="percent">字符串 '50%'</option>
        <option value="empty">null（清空样式）</option>
      </select>
      <div class="size-box" :style="widthStyle">宽度 {{ widthStyle.width || '（空）' }}</div>
    </div>

    <div class="row">
      <p class="label">coerceArray：string | string[] props 归一</p>
      <select v-model="tagMode" class="doc-input">
        <option value="single">传入字符串</option>
        <option value="array">传入数组</option>
      </select>
      <div class="tags">
        <span v-for="tag in tags" :key="tag" class="tag">{{ tag }}</span>
      </div>
    </div>

    <div class="row">
      <p class="label">coerceElement：模板 ref 归一</p>
      <div class="buttons">
        <button type="button" class="doc-btn" @click="parseElement">解析当前 ref</button>
        <button type="button" class="doc-btn" @click="clearElement">清空 ref</button>
        <button type="button" class="doc-btn" @click="parseEmpty">解析空 ref</button>
      </div>
      <div ref="box" class="target">ref 目标元素</div>
      <p class="state">{{ elementState }}</p>
      <p v-if="elementError" class="error">{{ elementError }}</p>
    </div>
  </div>
</template>

<style scoped>
.wrap {
  width: 100%;
}

.row {
  margin-bottom: 18px;
}

.label {
  margin: 0 0 8px;
  font-size: 12px;
  color: var(--doc-muted);
}

.size-box {
  margin-top: 8px;
  padding: 8px 10px;
  border: 1px solid var(--doc-primary);
  border-radius: 6px;
  background: var(--doc-primary-soft);
  font-size: 12px;
  text-align: center;
  transition: width 0.2s;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.tag {
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--doc-primary-soft);
  color: var(--doc-primary);
  font-size: 12px;
}

.buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.target {
  display: inline-block;
  margin-top: 10px;
  padding: 6px 12px;
  border: 1px dashed var(--doc-border);
  border-radius: 6px;
  color: var(--doc-muted);
  font-size: 12px;
}

.state {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--doc-primary);
}

.error {
  margin: 4px 0 0;
  font-size: 12px;
  color: #dc2626;
}
</style>
