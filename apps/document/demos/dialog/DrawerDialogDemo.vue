<script setup lang="ts">
import {useDialog, type DialogCustomAnimation} from 'vue-cdk/dialog';
import {overlayPositionBuilder} from 'vue-cdk/overlay';
import {useLocale} from '../../composables/useLocale';
import DrawerDialogContent from './DrawerDialogContent.vue';

const dialog = useDialog();
const {locale} = useLocale();

/**
 * 创建侧滑抽屉动画配置，不访问 DOM，也不依赖 Vue 注入上下文。
 * @param side 物理侧边，left 表示左侧，right 表示右侧，不随文字方向改变。
 * @returns 独立的进退场钩子，可直接赋给 DialogConfig.animation。
 * 钩子执行时才播放动画；返回的 Animation 由 Dialog 等待和取消。
 * 不支持 WAAPI 时同步完成，禁用动画与减少动态效果由 Dialog 统一处理。
 */
function createDrawerAnimation(side: 'left' | 'right'): DialogCustomAnimation {
  const hidden = `translateX(${side === 'left' ? '-100%' : '100%'})`;

  /** 返回真实动画供 Dialog 等待与取消；退场读取钩子执行时的面板变换。 */
  function play(element: HTMLElement, leaving: boolean): Animation | void {
    if (typeof element.animate !== 'function') return;
    const current = element.ownerDocument.defaultView?.getComputedStyle(element).transform ?? 'none';
    return element.animate(
      leaving
        ? [{transform: current}, {transform: hidden}]
        : [{transform: hidden}, {transform: 'none'}],
      {duration: 280, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'both'},
    );
  }

  return {
    enter: ({element}) => play(element, false),
    leave: ({element}) => play(element, true),
  };
}

/** 打开指定物理侧边的全高抽屉，每次创建独立定位策略与动画配置。 */
function open(side: 'left' | 'right'): void {
  const position = overlayPositionBuilder.global().top('0');
  const title = locale.value === 'en-US'
    ? `${side === 'left' ? 'Left' : 'Right'} drawer`
    : `${side === 'left' ? '左' : '右'}侧抽屉`;

  dialog.open(DrawerDialogContent, {
    width: 'min(420px, 100vw)',
    height: '100dvh',
    positionStrategy: side === 'left' ? position.left('0') : position.right('0'),
    ariaLabel: title,
    data: {title},
    animation: createDrawerAnimation(side),
  });
}
</script>

<template>
  <div class="demo">
    <button type="button" class="doc-btn" @click="open('left')">
      {{ locale === 'en-US' ? 'Open left drawer' : '左侧展开' }}
    </button>
    <button type="button" class="doc-btn primary" @click="open('right')">
      {{ locale === 'en-US' ? 'Open right drawer' : '右侧展开' }}
    </button>
  </div>
</template>

<style scoped>
.demo { display: flex; flex-wrap: wrap; gap: 12px; }
</style>
