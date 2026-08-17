<script setup lang="ts">
import {nextTick, ref} from 'vue';
import {useTextareaAutosize} from 'vue-cdk/text-field';

const textarea = ref<HTMLTextAreaElement | null>(null);
const content = ref('输入更多内容，textarea 会自动增高。');
const enabled = ref(true);
const minRows = ref(2);
const maxRows = ref(8);
const autosize = useTextareaAutosize(textarea, {enabled, minRows, maxRows});

async function fillLines() {
  content.value = Array.from({length: 12}, (_, index) => `第 ${index + 1} 行内容`).join('\n');
  await nextTick();
  autosize.resizeToFitContent(true);
}
</script>

<template>
  <div class="demo-stack">
    <textarea
      ref="textarea"
      v-model="content"
      class="demo-textarea"
      placeholder="请输入多行内容"
      aria-label="自动伸缩文本框"
    />
    <div class="controls">
      <label><input v-model="enabled" type="checkbox" /> 启用自动伸缩</label>
      <label>最小行数 <input v-model.number="minRows" type="number" min="1" max="6" /></label>
      <label>最大行数 <input v-model.number="maxRows" type="number" min="2" max="12" /></label>
    </div>
    <div class="controls">
      <button type="button" @click="fillLines">填入 12 行</button>
      <button type="button" @click="content = ''">清空</button>
      <button type="button" @click="autosize.resizeToFitContent(true)">强制重算</button>
      <button type="button" @click="autosize.reset()">恢复初始高度</button>
    </div>
  </div>
</template>

<style scoped>
.demo-stack { display: grid; gap: 12px; }
.demo-textarea { width: min(100%, 620px); padding: 10px 12px; font: inherit; line-height: 1.5; }
.controls { display: flex; flex-wrap: wrap; gap: 10px 16px; align-items: center; }
.controls input[type='number'] { width: 60px; }
</style>
