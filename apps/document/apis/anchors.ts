import type {Router} from 'vue-router';
import type {ApiAnchorGroup, ApiGroup} from '../api';
import {docModules} from '../config';
import {apiGroups as a11yGroups} from './a11y';
import {apiGroups as accordionGroups} from './accordion';
import {apiGroups as clipboardGroups} from './clipboard';
import {apiGroups as coercionGroups} from './coercion';
import {apiGroups as collectionsGroups} from './collections';
import {apiGroups as dialogGroups} from './dialog';
import {apiGroups as dragDropGroups} from './drag-drop';
import {apiGroups as emitterGroups} from './emitter';
import {apiGroups as overlayGroups} from './overlay';
import {apiGroups as platformGroups} from './platform';
import {apiGroups as layoutGroups} from './layout';
import {apiGroups as portalGroups} from './portal';
import {apiGroups as scrollingGroups} from './scrolling';
import {apiGroups as treeGroups} from './tree';
import {apiGroups as virtualTreeGroups} from './virtual-tree';

/** 视图组件名 → 该模块 API 分组数据，对应 config.ts 中 DocModule.view 字段。 */
const viewApiGroups: Record<string, readonly ApiGroup[]> = {
  Overlay: overlayGroups,
  Coercion: coercionGroups,
  Platform: platformGroups,
  Layout: layoutGroups,
  Scrolling: scrollingGroups,
  Collections: collectionsGroups,
  Emitter: emitterGroups,
  Portal: portalGroups,
  A11y: a11yGroups,
  Dialog: dialogGroups,
  DragDrop: dragDropGroups,
  Tree: treeGroups,
  VirtualTree: virtualTreeGroups,
  Clipboard: clipboardGroups,
  Accordion: accordionGroups,
};

/** 按 docModules 顺序排列各模块 API 数据，Overview 无 API 分组被过滤。 */
const moduleApiGroups: readonly {path: string; groups: readonly ApiGroup[]}[] = docModules.flatMap(module => {
  const groups = viewApiGroups[module.view];
  return groups ? [{path: module.path, groups}] : [];
});

/** 提及链接的解析结果：path 缺省表示当前页内锚点，否则跳转其他模块页。 */
export interface AnchorTarget {
  path?: string;
  anchor: string;
}

/** 提及别名解析函数：返回同页或跨模块目标；无法解析时返回 null。 */
export type AnchorResolver = (alias: string) => AnchorTarget | null;

/** 单页锚点索引：分组导航数据 + 当前页「别名 → 行锚点」映射。 */
export interface AnchorIndex {
  groups: readonly ApiAnchorGroup[];
  aliases: ReadonlyMap<string, string>;
}

/** 锚点 id 生成：去泛型参数，非字母数字（含中文）片段折叠为连字符并转小写。 */
function slugify(value: string): string {
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

/** 生成页内唯一锚点：与已有锚点冲突时追加 -2、-3… 序号。 */
function uniqueAnchor(base: string, taken: Set<string>): string {
  const safe = base || 'api';
  if (!taken.has(safe)) {
    taken.add(safe);
    return safe;
  }
  let index = 2;
  while (taken.has(`${safe}-${index}`)) index += 1;
  const id = `${safe}-${index}`;
  taken.add(id);
  return id;
}

/** 提取名称的可提及别名：按「 / 」拆分并去掉泛型参数，供提及链接匹配。 */
function aliasesOf(name: string): string[] {
  const aliases = name
    .split(/\s*\/\s*/)
    .map(part => part.replace(/<[^>]*>/g, '').trim())
    .filter(Boolean);
  return [...new Set(aliases)];
}

/** 构建单页锚点索引：分组标题与行名自动生成锚点，并汇总当前页别名映射。 */
export function buildAnchorIndex(groups: readonly ApiGroup[]): AnchorIndex {
  const taken = new Set<string>();
  const anchorGroups: ApiAnchorGroup[] = groups.map(group => ({
    title: group.title,
    anchor: uniqueAnchor(slugify(group.title), taken),
    items: group.rows.map(row => ({
      label: row.name,
      anchor: uniqueAnchor(slugify(row.name), taken),
      row,
    })),
  }));
  const aliases = new Map<string, string>();
  for (const group of anchorGroups) {
    for (const item of group.items) {
      for (const alias of aliasesOf(item.label)) {
        // 同名多次出现（如 portal 映射分组）时，提及链接指向首次出现的行。
        if (!aliases.has(alias)) aliases.set(alias, item.anchor);
      }
    }
  }
  return {groups: anchorGroups, aliases};
}

/** 跨模块全局索引：别名 → 模块路径 + 锚点，按 docModules 顺序先到者生效。 */
export function buildGlobalAnchorMap(): ReadonlyMap<string, {path: string; anchor: string}> {
  const map = new Map<string, {path: string; anchor: string}>();
  for (const module of moduleApiGroups) {
    const index = buildAnchorIndex(module.groups);
    for (const group of index.groups) {
      for (const item of group.items) {
        for (const alias of aliasesOf(item.label)) {
          if (!map.has(alias)) map.set(alias, {path: module.path, anchor: item.anchor});
        }
      }
    }
  }
  return map;
}

/** 模块级全局索引实例，页面加载后用于跨模块提及链接解析。 */
export const globalAnchorMap = buildGlobalAnchorMap();

/** 全部提及别名，按长度降序保证「最长优先」匹配（先消费更长名称避免子串误链）。 */
const allAliases = [...globalAnchorMap.keys()].sort((a, b) => b.length - a.length);

/** HTML 转义：v-html 渲染前必须先转义，再注入受控的链接标签。 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 标识符边界：命中别名的前后字符不能是 ASCII 标识符字符，避免链接局部单词。 */
function hasIdentifierBoundary(text: string, start: number, length: number): boolean {
  const before = start > 0 ? text[start - 1] : '';
  const after = start + length < text.length ? text[start + length] : '';
  return !/[A-Za-z0-9_$]/.test(before) && !/[A-Za-z0-9_$]/.test(after);
}

/**
 * 把文本中提及的 API 名称替换为锚点链接：先整体转义再按最长优先匹配别名，
 * 每个命中别名交给 resolve 决定同页滚动还是跨模块跳转。
 */
export function linkify(text: string, resolve: AnchorResolver): string {
  const escaped = escapeHtml(text);
  let output = '';
  let cursor = 0;
  while (cursor < escaped.length) {
    const alias = allAliases.find(candidate => {
      if (!escaped.startsWith(candidate, cursor)) return false;
      return hasIdentifierBoundary(escaped, cursor, candidate.length);
    });
    if (!alias) {
      output += escaped[cursor];
      cursor += 1;
      continue;
    }
    const target = resolve(alias);
    const label = escaped.slice(cursor, cursor + alias.length);
    if (target) {
      const pathAttr = target.path ? ` data-path="${target.path}"` : '';
      output += `<a href="#" class="api-mention" data-anchor="${target.anchor}"${pathAttr}>${label}</a>`;
    } else {
      output += label;
    }
    cursor += alias.length;
  }
  return output;
}

/** 同页平滑滚动到锚点，并 best-effort 同步 URL hash；重复导航错误直接忽略。 */
export function scrollToAnchor(id: string, router: Router): void {
  document.getElementById(id)?.scrollIntoView({behavior: 'smooth', block: 'start'});
  if (router.currentRoute.value.hash !== `#${id}`) {
    router.replace({hash: `#${id}`}).catch(() => undefined);
  }
}
