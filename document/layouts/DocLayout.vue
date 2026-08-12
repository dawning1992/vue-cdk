<script setup lang="ts">
import {useRoute} from 'vue-router';
import pkg from '../../package.json';
import {docModules, type DocModule} from '../config';

const route = useRoute();

/** 菜单激活判断：概览精确匹配根路径，模块页按路径前缀匹配。 */
function isActive(module: DocModule): boolean {
  return module.path === '/' ? route.path === '/' : route.path.startsWith(module.path);
}
</script>

<template>
  <div class="doc-shell">
    <header class="doc-header">
      <router-link to="/" class="brand">
        <span class="brand-name">Vue CDK</span>
        <span class="brand-tag">文档</span>
      </router-link>
      <span class="version">v{{ pkg.version }}</span>
      <span class="header-desc">Vue 3 组件开发工具包 · 按子路径模块化导入</span>
    </header>

    <div class="doc-body">
      <aside class="doc-sidebar">
        <nav aria-label="模块导航">
          <router-link
            v-for="module in docModules"
            :key="module.path"
            :to="module.path"
            class="menu-item"
            :class="{active: isActive(module)}"
          >
            <!-- 菜单两行显示：第一行英文模块名，第二行中文名。 -->
            <span class="menu-en">{{ module.name }}</span>
            <span class="menu-zh">{{ module.label }}</span>
          </router-link>
        </nav>
      </aside>

      <main class="doc-main">
        <router-view v-slot="{Component}">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<style scoped>
.doc-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.doc-header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 0 24px;
  height: 56px;
  background: #fff;
  border-bottom: 1px solid var(--doc-border);
}

.brand {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  text-decoration: none;
  color: var(--doc-text);
}

.brand-name {
  font-size: 20px;
  font-weight: 700;
}

.brand-tag {
  font-size: 13px;
  font-weight: 600;
  color: var(--doc-primary);
  background: var(--doc-primary-soft);
  border-radius: 6px;
  padding: 2px 8px;
}

.version {
  font-size: 13px;
  color: var(--doc-muted);
}

.header-desc {
  margin-left: auto;
  font-size: 13px;
  color: var(--doc-muted);
}

.doc-body {
  flex: 1;
  display: flex;
  min-height: 0;
}

.doc-sidebar {
  flex: 0 0 232px;
  border-right: 1px solid var(--doc-border);
  background: #fff;
  padding: 16px 10px;
  position: sticky;
  top: 56px;
  align-self: flex-start;
  height: calc(100vh - 56px);
  overflow-y: auto;
}

.menu-item {
  display: flex;
  flex-direction: column;
  padding: 8px 12px;
  border-radius: 8px;
  text-decoration: none;
  color: var(--doc-text);
  margin-bottom: 2px;
}

.menu-item:hover {
  background: var(--doc-primary-soft);
}

.menu-item.active {
  background: var(--doc-primary);
  color: #fff;
}

.menu-en {
  font-size: 14px;
  font-weight: 600;
}

.menu-zh {
  font-size: 12px;
  opacity: 0.75;
}

.doc-main {
  flex: 1;
  min-width: 0;
  padding: 28px 36px 80px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 860px) {
  .header-desc {
    display: none;
  }

  .doc-body {
    flex-direction: column;
  }

  .doc-sidebar {
    position: static;
    height: auto;
    flex-basis: auto;
    display: flex;
    overflow-x: auto;
    padding: 8px;
  }

  .menu-item {
    margin-bottom: 0;
  }

  .doc-main {
    padding: 20px 16px 64px;
  }
}
</style>
