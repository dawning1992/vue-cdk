<script setup lang="ts">
import {useDialogData, useDialogRef} from 'vue-cdk/dialog';
import {useLocale} from '../../composables/useLocale';

/** 打开方提供的抽屉标题，同时用于窗口的无障碍名称。 */
interface DrawerData {
  /** 打开时按当前语言生成的标题。 */
  title: string;
}

const data = useDialogData<DrawerData>();
const dialogRef = useDialogRef();
const {locale} = useLocale();
</script>

<template>
  <section class="drawer">
    <header class="drawer-header">
      <h2>{{ data.title }}</h2>
      <button type="button" class="doc-btn" @click="dialogRef.close()">
        {{ locale === 'en-US' ? 'Close' : '关闭' }}
      </button>
    </header>
    <div class="drawer-body" tabindex="0" :aria-label="locale === 'en-US' ? 'Drawer content' : '抽屉内容'">
      <p>{{ locale === 'en-US'
        ? 'Combine global positioning and custom dialog animations to slide a full-height drawer in from either side.'
        : '组合全局定位和自定义弹窗动画，让全高抽屉从左右两侧滑入，关闭时沿原方向滑出。' }}</p>
      <p>{{ locale === 'en-US'
        ? 'Close with the button, Escape, or the backdrop. Focus returns to the opening button after the exit animation.'
        : '点击关闭按钮、按 ESC 或点击遮罩均可关闭；退场结束后，焦点恢复到打开抽屉的按钮。' }}</p>
      <section v-for="index in 8" :key="index" class="drawer-section">
        <h3>{{ locale === 'en-US' ? `Content section ${index}` : `内容区块 ${index}` }}</h3>
        <p>{{ locale === 'en-US'
          ? 'Long content scrolls independently inside the drawer while its header and close button remain visible. The page behind the backdrop stays locked.'
          : '长内容在抽屉正文中独立滚动，标题和关闭按钮始终可见。遮罩后方的页面保持滚动锁定。' }}</p>
      </section>
    </div>
  </section>
</template>

<style scoped>
/* 默认 Dialog 容器铺满面板；正文必须允许收缩，才能在固定高度内独立滚动。 */
.drawer { display: flex; flex-direction: column; height: 100%; min-height: 0; background: var(--doc-card); color: var(--doc-text); box-shadow: 0 12px 40px rgb(31 36 48 / 18%); }
.drawer-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 20px 24px; border-bottom: 1px solid var(--doc-border); }
h2 { margin: 0; font-size: 20px; }
.drawer-body { flex: 1; min-height: 0; overflow-y: auto; overflow-wrap: anywhere; overscroll-behavior: contain; padding: 24px; }
p { margin: 0 0 16px; line-height: 1.7; }
.drawer-section { padding-top: 16px; border-top: 1px solid var(--doc-border); }
h3 { margin: 0 0 12px; font-size: 16px; }
</style>
