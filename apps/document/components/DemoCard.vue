<script setup lang="ts">
import {computed, ref, watch} from 'vue';
import CodeBlock from './CodeBlock.vue';
import {useLocale} from '../composables/useLocale';

const {locale, messages} = useLocale();

const props = withDefaults(
  defineProps<{
    /** 示例标题。 */
    title: string;
    /** 英文示例标题；英文缺省时回退中文标题。 */
    titleEn?: string;
    /** 示例说明，描述演示能力与关键 API。 */
    description: string;
    /** 英文示例说明；英文缺省时回退中文说明。 */
    descriptionEn?: string;
    /** 主演示文件源码（?raw 读取），展开后展示。 */
    source: string;
    /** 主演示文件名。 */
    filename?: string;
    /** 主演示文件语言，默认 vue。 */
    lang?: string;
    /** 附带源码（如被演示引用的子组件），与主源码一起展开。 */
    extraSources?: readonly {filename: string; code: string; lang?: string}[];
  }>(),
  {filename: '', lang: 'vue', extraSources: () => []},
);

const showSource = ref(false);
const activeSourceIndex = ref(0);
/**
 * 将示例源码中的文档语言条件折叠为当前语言，并移除仅供演示界面本地化的
 * useLocale 样板。演示组件本身仍使用原始源码运行，只有源码查看器使用折叠结果。
 */
function localizeSource(source: string): string {
  const english = locale.value === 'en-US';
  let result = source
    .replace(/^import\s+\{\s*useLocale\s*\}\s+from\s+['"][^'"\n]+['"];?\s*\n/gm, '')
    .replace(/^const\s+\{\s*locale\s*\}\s*=\s*useLocale\(\);?\s*\n/gm, '');
  const condition = /locale(?:\.value)?\s*===\s*(['"])en-US\1\s*\?/g;

  /** 在字符串、注释和嵌套条件中找到当前三元表达式对应的冒号。 */
  function matchingColon(questionIndex: number): number {
    let nested = 0;
    let quote = '';
    let escaped = false;
    let lineComment = false;
    let blockComment = false;
    const stack: string[] = [];

    for (let index = questionIndex + 1; index < result.length; index += 1) {
      const char = result[index];
      const next = result[index + 1];
      if (lineComment) {
        if (char === '\n') lineComment = false;
        continue;
      }
      if (blockComment) {
        if (char === '*' && next === '/') { blockComment = false; index += 1; }
        continue;
      }
      if (quote) {
        if (escaped) escaped = false;
        else if (char === '\\') escaped = true;
        else if (char === quote) quote = '';
        continue;
      }
      if (char === '/' && next === '/') { lineComment = true; index += 1; continue; }
      if (char === '/' && next === '*') { blockComment = true; index += 1; continue; }
      if (char === "'" || char === '"' || char === '`') { quote = char; continue; }
      if (char === '(' || char === '[' || char === '{') { stack.push(char); continue; }
      if (char === ')' || char === ']' || char === '}') { stack.pop(); continue; }
      if (stack.length) continue;
      if (char === '?') nested += 1;
      else if (char === ':') {
        if (nested === 0) return index;
        nested -= 1;
      }
    }
    return -1;
  }

  let match: RegExpExecArray | null;
  while ((match = condition.exec(result))) {
    const questionIndex = condition.lastIndex - 1;
    const colonIndex = matchingColon(questionIndex);
    if (colonIndex < 0) continue;
    const endIndex = expressionEnd(result, colonIndex + 1);
    if (endIndex <= colonIndex + 1) continue;
    const selected = english
      ? result.slice(questionIndex + 1, colonIndex).trim()
      : result.slice(colonIndex + 1, endIndex).trim();
    result = `${result.slice(0, match.index)}${selected}${result.slice(endIndex)}`;
    condition.lastIndex = match.index + selected.length;
  }
  return result;
}

/** 找出三元表达式分支的结束位置，边界由模板标记或外层运算符决定。 */
function expressionEnd(source: string, start: number): number {
  let quote = '';
  let escaped = false;
  const stack: string[] = [];
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === "'" || char === '"' || char === '`') { quote = char; continue; }
    if (char === '(' || char === '[' || char === '{') { stack.push(char); continue; }
    if (char === ')' || char === ']' || char === '}') {
      if (stack.length === 0) return index;
      stack.pop();
      continue;
    }
    if (stack.length === 0 && (char === '\n' || char === ';' || char === ',' || char === '>' || char === '}' )) return index;
  }
  return source.length;
}

const sourceFiles = computed(() => [
  {filename: props.filename || '源码', code: localizeSource(props.source), lang: props.lang},
  ...props.extraSources.map(file => ({
    ...file,
    code: localizeSource(file.code),
    lang: file.lang ?? 'vue',
  })),
]);

watch(sourceFiles, files => {
  if (activeSourceIndex.value >= files.length) activeSourceIndex.value = 0;
});
</script>

<template>
  <section class="demo-card">
    <header class="demo-head">
      <h3>{{ locale === 'en-US' ? props.titleEn ?? messages.missingEnglishDemoTitle : props.title }}</h3>
      <p>{{ locale === 'en-US' ? props.descriptionEn ?? messages.missingEnglishDescription : props.description }}</p>
    </header>
    <div class="demo-stage">
      <slot />
    </div>
    <button
      type="button"
      class="source-toggle"
      @click="showSource = !showSource"
    >
      {{ showSource ? messages.hideSource : messages.viewSource }}
    </button>
    <div v-if="showSource" class="source-viewer">
      <div v-if="sourceFiles.length > 1" class="source-tabs" role="tablist" aria-label="源码文件">
        <button
          v-for="(file, index) in sourceFiles"
          :key="file.filename"
          type="button"
          class="source-tab"
          :class="{'is-active': activeSourceIndex === index}"
          role="tab"
          :aria-selected="activeSourceIndex === index"
          @click="activeSourceIndex = index"
        >
          {{ file.filename }}
        </button>
      </div>
      <CodeBlock
        :key="sourceFiles[activeSourceIndex]?.filename"
        :code="sourceFiles[activeSourceIndex]?.code ?? ''"
        :lang="sourceFiles[activeSourceIndex]?.lang"
        :filename="sourceFiles.length > 1 ? '' : sourceFiles[activeSourceIndex]?.filename"
        :show-filename="sourceFiles.length <= 1"
      />
    </div>
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

.source-viewer {
  margin-top: 14px;
}

.source-tabs {
  display: flex;
  gap: 2px;
  overflow-x: auto;
  border-bottom: 1px solid var(--doc-border);
}

.source-tab {
  flex: 0 0 auto;
  appearance: none;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--doc-muted);
  padding: 8px 12px;
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}

.source-tab:hover,
.source-tab.is-active {
  color: var(--doc-primary);
}

.source-tab.is-active {
  border-bottom-color: var(--doc-primary);
}
</style>
