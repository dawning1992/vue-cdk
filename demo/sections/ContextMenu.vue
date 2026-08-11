<script setup lang="ts">
import {h, onBeforeUnmount, ref} from 'vue';
import {useOverlay, type OverlayRef} from 'vue-cdk/overlay';

defineProps<{id?: string}>();

const overlay = useOverlay();
const lastPosition = ref('—');
let overlayRef: OverlayRef | null = null;

function onContextMenu(event: MouseEvent) {
  console.log('onContextMenu', event);
  event.preventDefault();
  closeMenu();

  const strategy = overlay
    .position()
    .flexibleConnectedTo({x: event.clientX, y: event.clientY})
    .withPositions([
      {originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'top'},
      {originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'top'},
      {originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'bottom'},
      {originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'bottom'},
    ])
    .withPush(true);

  overlayRef = overlay.create({
    positionStrategy: strategy,
    panelClass: 'context-menu-panel',
  });
  lastPosition.value = `(${event.clientX}, ${event.clientY})`;
  overlayRef.outsidePointerEvents().subscribe(() => closeMenu());
  overlayRef.attach(
    () =>
      h('div', {class: 'panel context-menu'}, [
        h('div', {class: 'menu-item', onClick: () => alert('复制')}, '复制'),
        h('div', {class: 'menu-item', onClick: () => closeMenu()}, '粘贴'),
        h('div', {class: 'menu-item', onClick: () => closeMenu()}, '剪切'),
        h('div', {class: 'menu-item', onClick: () => closeMenu()}, '删除'),
      ]),
  );
}

function closeMenu() {
  overlayRef?.dispose();
  overlayRef = null;
}

onBeforeUnmount(closeMenu);
</script>

<template>
  <section :id="id" class="section">
    <h2>右键菜单<span class="badge">命令式 · 坐标原点</span></h2>
    <p class="desc">
      以鼠标坐标（Point）为 origin 的上下文菜单：右键任意位置打开，
      贴近视口边缘时自动 push 回屏，点击外部或再次右键关闭。
    </p>
    <div class="stage" @contextmenu="onContextMenu">
      <div class="muted">
        在此区域右键打开菜单（macOS 触控板：双指点按，或 Control + 点击）
      </div>
      <span class="muted">上次打开位置：{{ lastPosition }}</span>
    </div>
  </section>
</template>
