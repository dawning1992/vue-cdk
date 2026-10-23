<script setup lang="ts">
import type {Ref} from 'vue';
import type {OverlayRef} from 'vue-cdk/overlay';
import {useLocale} from '../../composables/useLocale';

const props = defineProps<{
  overlayRef: OverlayRef;
  onClose: () => void;
  onPush: (message: string) => void;
  wide: Ref<boolean>;
}>();
const {locale} = useLocale();

function resize(): void {
  props.wide.value = !props.wide.value;
  props.overlayRef.updateSize({width: props.wide.value ? '460px' : '300px'});
  props.onPush(locale.value === 'en-US' ? `updateSize → ${props.wide.value ? '460px' : '300px'}` : (props.wide.value ? 'updateSize → 460px' : 'updateSize → 300px'));
}
</script>

<template>
  <div class="events-panel">
    <h3>{{ locale === 'en-US' ? 'Backdrop and event streams' : '遮罩与事件流' }}</h3>
    <p>{{ locale === 'en-US' ? 'Click the backdrop, press Escape, or click outside the overlay to log event streams below; the panel can also be changed dynamically.' : '点击遮罩、按 ESC 或点击浮层外部，事件流都会在下方输出；也可以动态操作面板。' }}</p>
    <div class="actions">
      <button type="button" class="doc-btn" @click="resize">{{ locale === 'en-US' ? 'Toggle width' : '切换宽度' }}</button>
      <button type="button" class="doc-btn" @click="props.overlayRef.updatePosition(); props.onPush(locale === 'en-US' ? 'updatePosition: reapply position' : 'updatePosition：重新应用定位')">{{ locale === 'en-US' ? 'Reposition' : '重新定位' }}</button>
      <button type="button" class="doc-btn" @click="props.overlayRef.addPanelClass('doc-events-highlight'); props.onPush(locale === 'en-US' ? 'addPanelClass: add highlight class' : 'addPanelClass：添加高亮类')">{{ locale === 'en-US' ? 'Add panel class' : '加面板类' }}</button>
      <button type="button" class="doc-btn" @click="props.overlayRef.removePanelClass('doc-events-highlight'); props.onPush(locale === 'en-US' ? 'removePanelClass: remove highlight class' : 'removePanelClass：移除高亮类')">{{ locale === 'en-US' ? 'Remove panel class' : '删面板类' }}</button>
      <button type="button" class="doc-btn primary" @click="props.overlayRef.dispose(); props.onPush(locale === 'en-US' ? 'dispose: destroy overlay' : 'dispose：销毁浮层')">dispose</button>
      <button type="button" class="doc-btn" @click="props.onClose">{{ locale === 'en-US' ? 'Close (detach)' : '关闭（detach）' }}</button>
    </div>
  </div>
</template>

<style scoped>
.events-panel { width: 300px; padding: 20px 24px; background: #fff; border: 1px solid #e3e6ee; border-radius: 10px; box-shadow: 0 6px 20px rgba(31, 36, 48, 0.12); transition: width 0.2s; }
.events-panel h3 { margin: 0 0 8px; font-size: 15px; }
.events-panel p { margin: 0 0 14px; color: #6b7280; font-size: 12px; }
.actions { display: flex; flex-wrap: wrap; gap: 8px; }
</style>
