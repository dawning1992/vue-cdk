<script setup lang="ts">
import {ref} from 'vue';
import CodeBlock from './CodeBlock.vue';

withDefaults(
  defineProps<{
    /** 示例标题。 */
    title: string;
    /** 示例说明，描述演示能力与关键 API。 */
    description: string;
    /** 主演示文件源码（?raw 读取），展开后展示。 */
    source: string;
    /** 主演示文件名。 */
    filename?: string;
    /** 主演示文件语言，默认 vue。 */
    lang?: string;
    /** 附带源码（如被演示引用的子组件），与主源码一起展开。 */
    extraSources?: readonly {filename: string; code: string}[];
  }>(),
  {filename: '', lang: 'vue', extraSources: () => []},
);

const showSource = ref(false);
</script>

<template>
  <section class="demo-card">
    <header class="demo-head">
      <h3>{{ title }}</h3>
      <p>{{ description }}</p>
    </header>
    <div class="demo-stage">
      <slot />
    </div>
    <button
      type="button"
      class="source-toggle"
      @click="showSource = !showSource"
    >
      {{ showSource ? '收起源码' : '查看源码' }}
    </button>
    <template v-if="showSource">
      <CodeBlock :code="source" :lang="lang" :filename="filename" />
      <CodeBlock
        v-for="extra in extraSources"
        :key="extra.filename"
        :code="extra.code"
        lang="vue"
        :filename="extra.filename"
      />
    </template>
  </section>
</template>

<style scoped>
.demo-card {
  background: var(--doc-card);
  border: 1px solid var(--doc-border);
  border-radius: var(--doc-radius);
  box-shadow: var(--doc-shadow);
  padding: 20px 22px 22px;
  margin-bottom: 20px;
}

.demo-head h3 {
  margin: 0 0 4px;
  font-size: 16px;
}

.demo-head p {
  margin: 0 0 14px;
  color: var(--doc-muted);
  font-size: 13px;
}

.demo-stage {
  min-height: 90px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 1px dashed var(--doc-border);
  border-radius: 8px;
  background: #fafbfe;
}

.source-toggle {
  appearance: none;
  border: none;
  background: var(--doc-primary-soft);
  color: var(--doc-primary);
  font-size: 13px;
  border-radius: 6px;
  padding: 5px 12px;
  margin-top: 12px;
  cursor: pointer;
}

.source-toggle:hover {
  filter: brightness(0.97);
}
</style>
