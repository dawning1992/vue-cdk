import {createRouter, createWebHashHistory, type RouteRecordRaw} from 'vue-router';
import type {Component} from 'vue';
import {docModules} from '../config';

/** 视图组件懒加载映射：与 config.ts 中的 view 字段一一对应。 */
const viewLoaders: Record<string, () => Promise<{default: Component}>> = {
  Overview: () => import('../views/Overview.vue'),
  Overlay: () => import('../views/Overlay.vue'),
  Coercion: () => import('../views/Coercion.vue'),
  Platform: () => import('../views/Platform.vue'),
  Scrolling: () => import('../views/Scrolling.vue'),
  Collections: () => import('../views/Collections.vue'),
  Emitter: () => import('../views/Emitter.vue'),
  Portal: () => import('../views/Portal.vue'),
  A11y: () => import('../views/A11y.vue'),
  Dialog: () => import('../views/Dialog.vue'),
  DragDrop: () => import('../views/DragDrop.vue'),
  Tree: () => import('../views/Tree.vue'),
  VirtualTree: () => import('../views/VirtualTree.vue'),
  Clipboard: () => import('../views/Clipboard.vue'),
};

/**
 * 文档路由：所有页面通过动态 import() 实现路由懒加载，构建产物按页面拆分 chunk。
 *
 * 采用 hash 历史模式：配合 vite.document.config.ts 的相对 base，构建产物可放入
 * 任意子路径或直接从本地打开，无需服务端配置 SPA 回退。
 */
export const router = createRouter({
  history: createWebHashHistory(),
  routes: docModules.map<RouteRecordRaw>(module => ({
    path: module.path,
    name: module.view,
    component: viewLoaders[module.view],
  })),
  /**
   * 锚点滚动：API 文档深链接（#/tree#VTree）与跨模块提及链接跳转依赖此行为；
   * 元素不存在时回退顶部，避免无效 hash 误滚动。
   */
  scrollBehavior(to, _from, savedPosition) {
    if (to.hash) {
      // 锚点 id 均为小写 slug，先转小写再定位，兼容 #VTree 这类大写深链接。
      const id = to.hash.slice(1).toLowerCase();
      return document.getElementById(id)
        ? {el: `#${id}`, top: 76, behavior: 'smooth'}
        : {top: 0};
    }
    return savedPosition ?? {top: 0};
  },
});
