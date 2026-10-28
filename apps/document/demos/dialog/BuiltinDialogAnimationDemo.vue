<script setup lang="ts">
import {shallowRef} from 'vue';
import {useDialog, type DialogAnimationPreset} from 'vue-cdk/dialog';
import {useLocale} from '../../composables/useLocale';
import AnimatedConfirmDialog from './AnimatedConfirmDialog.vue';

const dialog = useDialog();
const {locale} = useLocale();
const preset = shallowRef<DialogAnimationPreset>('scale');
const disabled = shallowRef(false);

/** 配置窗口内置动画；close 与 closedPromise 的时序由 Dialog 统一协调。 */
function open(): void {
  dialog.open(AnimatedConfirmDialog, {
    panelClass: 'app-dialog-panel',
    width: 'min(420px, calc(100vw - 32px))',
    animation: {preset: preset.value, enterDuration: 200, leaveDuration: 200},
    disableAnimations: disabled.value,
    data: {
      title: locale.value === 'en-US' ? 'Built-in animation' : '内置动画',
      message: locale.value === 'en-US'
        ? 'The dialog and its backdrop begin leaving together. The close result waits for the actual animation to finish.'
        : '窗口与遮罩同步开始退场，关闭结果在窗口真实动画结束后回传。',
    },
  });
}
</script>

<template>
  <div class="demo">
    <select v-model="preset" class="doc-input" :aria-label="locale === 'en-US' ? 'Animation' : '动画效果'">
      <option value="fade">fade</option>
      <option value="scale">scale</option>
      <option value="slide-up">slide-up</option>
      <option value="slide-down">slide-down</option>
    </select>
    <label><input v-model="disabled" type="checkbox" /> {{ locale === 'en-US' ? 'Disable animations' : '禁用动画' }}</label>
    <button type="button" class="doc-btn primary" @click="open">{{ locale === 'en-US' ? 'Open dialog' : '打开弹窗' }}</button>
  </div>
</template>

<style scoped>
.demo { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
label { display: flex; gap: 6px; align-items: center; }
</style>
