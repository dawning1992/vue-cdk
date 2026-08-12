<script setup lang="ts">
import {onMounted, ref} from 'vue';
import type {HighlighterCore} from 'shiki/core';

const props = withDefaults(
  defineProps<{
    /** 待高亮的源代码文本。 */
    code: string;
    /** shiki 语言标识，默认 vue。 */
    lang?: string;
    /** 展示在代码块顶部的文件名，如 DeclarativeOverlay.vue。 */
    filename?: string;
  }>(),
  {lang: 'vue', filename: ''},
);

const highlighted = ref('');
const copied = ref(false);
const highlightFailed = ref(false);

let highlighterPromise: Promise<HighlighterCore> | null = null;

/** 已渲染的 HTML 缓存：同一段代码只高亮一次，切回示例 tab 时直接复用。 */
const htmlCache = new Map<string, string>();

/**
 * 获取单例高亮器。shiki 相关依赖全部动态导入，使高亮引擎 chunk 按需加载、
 * 不阻塞首屏渲染；仅注册文档需要的语言与主题（JavaScript 正则引擎，无需 WASM）。
 */
function getHighlighter(): Promise<HighlighterCore> {
  highlighterPromise ??= Promise.all([
    import('shiki/core'),
    import('shiki/engine/javascript'),
    import('@shikijs/langs/vue'),
    import('@shikijs/langs/ts'),
    import('@shikijs/langs/html'),
    import('@shikijs/langs/css'),
    import('@shikijs/langs/json'),
    import('@shikijs/langs/bash'),
    import('@shikijs/themes/github-dark'),
  ]).then(
    ([
      {createHighlighterCore: createCore},
      {createJavaScriptRegexEngine},
      vueLangs,
      tsLangs,
      htmlLangs,
      cssLangs,
      jsonLangs,
      bashLangs,
      githubDark,
    ]) =>
      createCore({
        langs: [
          vueLangs.default,
          tsLangs.default,
          htmlLangs.default,
          cssLangs.default,
          jsonLangs.default,
          bashLangs.default,
        ].flat(),
        themes: [githubDark.default],
        engine: createJavaScriptRegexEngine(),
      }),
  );
  return highlighterPromise;
}

async function renderCode(): Promise<void> {
  const cacheKey = `${props.lang}\u0000${props.code}`;
  const cached = htmlCache.get(cacheKey);
  if (cached) {
    highlighted.value = cached;
    return;
  }
  try {
    const highlighter = await getHighlighter();
    const html = highlighter.codeToHtml(props.code, {lang: props.lang, theme: 'github-dark'});
    htmlCache.set(cacheKey, html);
    highlighted.value = html;
  } catch (error) {
    // 高亮失败时退化为纯文本展示，不阻塞文档阅读。
    console.warn('代码高亮失败，已退化为纯文本', error);
    highlightFailed.value = true;
  }
}

/** 复制源码；无剪贴板权限（如 file:// 场景）时退化为选中文本复制。 */
async function copyCode(): Promise<void> {
  try {
    await navigator.clipboard.writeText(props.code);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = props.code;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  }
  copied.value = true;
  window.setTimeout(() => {
    copied.value = false;
  }, 1500);
}

onMounted(() => {
  void renderCode();
});
</script>

<template>
  <div class="code-block">
    <div class="code-head">
      <span class="filename">{{ filename || '源码' }}</span>
      <button class="copy-btn" type="button" @click="copyCode">
        {{ copied ? '已复制' : '复制' }}
      </button>
    </div>
    <div class="code-body">
      <div v-if="highlighted" class="code-content" v-html="highlighted" />
      <pre v-else-if="highlightFailed || !highlighted" class="plain-pre">{{ code }}</pre>
    </div>
  </div>
</template>

<style scoped>
.code-block {
  border: 1px solid var(--doc-border);
  border-radius: var(--doc-radius);
  overflow: hidden;
  margin-top: 14px;
}

.code-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: var(--doc-code-bg);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.filename {
  color: #9db1c7;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
}

.copy-btn {
  appearance: none;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #d7dee8;
  font-size: 12px;
  border-radius: 6px;
  padding: 3px 10px;
  cursor: pointer;
}

.copy-btn:hover {
  background: rgba(255, 255, 255, 0.18);
}

.code-body {
  background: var(--doc-code-bg);
}

.plain-pre {
  margin: 0;
  padding: 14px 16px;
  overflow: auto;
  color: #d7dee8;
  font-size: 13px;
  line-height: 1.7;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
</style>
