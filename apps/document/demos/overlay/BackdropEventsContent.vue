<script setup lang="ts">
import type {Ref} from 'vue';
import type {OverlayRef} from 'vue-cdk/overlay';

const props = defineProps<{
  overlayRef: OverlayRef;
  onClose: () => void;
  onPush: (message: string) => void;
  wide: Ref<boolean>;
}>();

function resize(): void {
  props.wide.value = !props.wide.value;
  props.overlayRef.updateSize({width: props.wide.value ? '460px' : '300px'});
  props.onPush(props.wide.value ? 'updateSize → 460px' : 'updateSize → 300px');
}
</script>

<template>
  <div class="events-panel">
    <h3>遮罩与事件流</h3>
    <p>点击遮罩、按 ESC 或点击浮层外部，事件流都会在下方输出；也可以动态操作面板。</p>
    <div class="actions">
      <button type="button" class="doc-btn" @click="resize">切换宽度</button>
      <button type="button" class="doc-btn" @click="props.overlayRef.updatePosition(); props.onPush('updatePosition：重新应用定位')">重新定位</button>
      <button type="button" class="doc-btn" @click="props.overlayRef.addPanelClass('doc-events-highlight'); props.onPush('addPanelClass：添加高亮类')">加面板类</button>
      <button type="button" class="doc-btn" @click="props.overlayRef.removePanelClass('doc-events-highlight'); props.onPush('removePanelClass：移除高亮类')">删面板类</button>
      <button type="button" class="doc-btn primary" @click="props.overlayRef.dispose(); props.onPush('dispose：销毁浮层')">dispose</button>
      <button type="button" class="doc-btn" @click="props.onClose">关闭（detach）</button>
    </div>
  </div>
</template>

<style scoped>
.events-panel { width: 300px; padding: 20px 24px; background: #fff; border: 1px solid #e3e6ee; border-radius: 10px; box-shadow: 0 6px 20px rgba(31, 36, 48, 0.12); transition: width 0.2s; }
.events-panel h3 { margin: 0 0 8px; font-size: 15px; }
.events-panel p { margin: 0 0 14px; color: #6b7280; font-size: 12px; }
.actions { display: flex; flex-wrap: wrap; gap: 8px; }
</style>
