<script setup lang="ts">
import {useRoute} from 'vue-router';
// 页头展示 CDK 库版本：通过 workspace 符号链接读取 vue-cdk 包的真实版本。
import pkg from '../node_modules/vue-cdk/package.json';
import {docModules, type DocModule} from '../config';
import {useLocale} from '../composables/useLocale';

const route = useRoute();
const {locale, messages, setLocale} = useLocale();

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
      <span class="brand-tag">{{ messages.document }}</span>
      </router-link>
      <span class="version">v{{ pkg.version }}</span>
      <span class="header-desc">{{ messages.description }}</span>
      <div class="locale-switcher" role="group" :aria-label="messages.language">
        <button type="button" :class="{active: locale === 'zh-CN'}" @click="setLocale('zh-CN')">中文</button>
        <button type="button" :class="{active: locale === 'en-US'}" @click="setLocale('en-US')">English</button>
      </div>
    </header>

    <div class="doc-body">
      <aside class="doc-sidebar">
        <nav :aria-label="messages.navigation">
          <router-link
            v-for="module in docModules"
            :key="module.path"
            :to="module.path"
            class="menu-item"
            :class="{active: isActive(module)}"
          >
            <span class="menu-en">{{ locale === 'zh-CN' ? module.name : module.labelEn }}</span>
            <span class="menu-zh">{{ locale === 'zh-CN' ? module.label : module.name }}</span>
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
  align-items: center;
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

.locale-switcher {
  display: inline-flex;
  gap: 2px;
  padding: 2px;
  border: 1px solid var(--doc-border);
  border-radius: 7px;
  background: var(--doc-card);
}

.locale-switcher button {
  border: 0;
  border-radius: 5px;
  padding: 4px 8px;
  color: var(--doc-muted);
  background: transparent;
  cursor: pointer;
}

.locale-switcher button.active {
  color: var(--doc-primary);
  background: var(--doc-primary-soft);
  font-weight: 600;
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
