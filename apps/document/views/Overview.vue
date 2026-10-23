<script setup lang="ts">
import CodeBlock from '../components/CodeBlock.vue';
import {docModules} from '../config';
import {useLocale} from '../composables/useLocale';

const {locale, messages} = useLocale();

const installCode = `npm install vue-cdk`;

const quickStartCode = `<script setup lang="ts">
import {ref} from 'vue';
import {
  STANDARD_DROPDOWN_BELOW_POSITIONS,
  VConnectedOverlay,
  VOverlayOrigin,
} from 'vue-cdk/overlay';

const open = ref(false);
<\/script>

<template>
  <VOverlayOrigin>
    <button @click="open = !open">打开菜单</button>
    <VConnectedOverlay
      :open="open"
      :positions="STANDARD_DROPDOWN_BELOW_POSITIONS"
      @overlay-outside-click="open = false"
    >
      <div class="menu">
        <div class="menu-item">菜单项 1</div>
        <div class="menu-item">菜单项 2</div>
      </div>
    </VConnectedOverlay>
  </VOverlayOrigin>
</template>`;

const subpathCode = `import {useOverlay} from 'vue-cdk/overlay';
import {useDialog} from 'vue-cdk/dialog';
import {VPortalOutlet} from 'vue-cdk/portal';
import {ListKeyManager} from 'vue-cdk/a11y';
import {VVirtualScrollViewport} from 'vue-cdk/scrolling';
import {ArrayDataSource} from 'vue-cdk/collections';
import {coerceArray} from 'vue-cdk/coercion';
import {isBrowser} from 'vue-cdk/platform';
import {Emitter} from 'vue-cdk/emitter';`;
</script>

<template>
  <div class="overview">
    <header class="head">
      <h2>{{ locale === 'zh-CN' ? 'Vue CDK 概览' : 'Vue CDK overview' }}</h2>
      <p>
        {{ locale === 'zh-CN' ? 'Vue 3 组件开发工具包（Component Dev Kit），设计模式借鉴 Angular CDK' : 'Vue 3 Component Development Kit inspired by Angular CDK patterns.' }}
      </p>
    </header>

    <section class="cards">
      <router-link
        v-for="module in docModules"
        :key="module.path"
        :to="module.path"
        class="card"
      >
        <span class="card-en">{{ module.name }}</span>
        <span class="card-zh">{{ locale === 'zh-CN' ? module.label : module.name }}</span>
        <p>{{ locale === 'zh-CN' ? module.summary : module.summaryEn }}</p>
      </router-link>
    </section>

    <section class="block">
      <h3>{{ messages.install }}</h3>
      <CodeBlock :code="installCode" lang="bash" :filename="messages.terminal" />
      <p class="note">{{ messages.vueRequirement }}</p>
    </section>

    <section class="block">
      <h3>{{ messages.subpath }}</h3>
      <p>{{ messages.subpathDescription }}</p>
      <CodeBlock :code="subpathCode" lang="ts" filename="imports.ts" />
    </section>

    <section class="block">
      <h3>{{ messages.quickStart }}</h3>
      <CodeBlock :code="quickStartCode" lang="vue" filename="Dropdown.vue" />
    </section>
  </div>
</template>

<style scoped>
.head h2 {
  margin: 0 0 8px;
  font-size: 24px;
}

.head p {
  margin: 0;
  color: var(--doc-muted);
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
  margin: 22px 0 8px;
}

.card {
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: var(--doc-card);
  border: 1px solid var(--doc-border);
  border-radius: var(--doc-radius);
  box-shadow: var(--doc-shadow);
  text-decoration: none;
  color: var(--doc-text);
  transition:
    border-color 0.15s ease,
    transform 0.15s ease;
}

.card:hover {
  border-color: var(--doc-primary);
  transform: translateY(-2px);
}

.card-en {
  font-size: 15px;
  font-weight: 700;
}

.card-zh {
  font-size: 12px;
  color: var(--doc-muted);
  margin-top: 2px;
}

.card p {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--doc-muted);
  line-height: 1.6;
}

.block {
  margin-top: 26px;
}

.block h3 {
  margin: 0 0 10px;
  font-size: 16px;
}

.block p.note {
  margin: 8px 0 0;
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
