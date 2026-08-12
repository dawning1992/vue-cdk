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
  A11y: () => import('../views/A11y.vue'),
  Dialog: () => import('../views/Dialog.vue'),
  DragDrop: () => import('../views/DragDrop.vue'),
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
});
