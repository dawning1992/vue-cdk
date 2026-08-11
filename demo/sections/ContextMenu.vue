<script setup lang="ts">
import {defineComponent, h, onBeforeUnmount, ref, type PropType} from 'vue';
import {ListKeyManager} from 'vue-cdk/a11y';
import {useOverlay, type OverlayRef} from 'vue-cdk/overlay';

defineProps<{id?: string}>();

/** 右键菜单条目：action 在点击或按 Enter 激活时执行。 */
interface MenuItem {
  label: string;
  getLabel(): string;
  action(): void;
}

const overlay = useOverlay();
const lastPosition = ref('—');
let overlayRef: OverlayRef | null = null;
let keydownUnsubscribe: (() => void) | undefined;

const items = ref<MenuItem[]>([
  {label: '复制', getLabel: () => '复制', action: () => alert('复制')},
  {label: '粘贴', getLabel: () => '粘贴', action: () => undefined},
  {label: '剪切', getLabel: () => '剪切', action: () => undefined},
  {label: '删除', getLabel: () => '删除', action: () => undefined},
]);

/** 菜单键盘管理器：换行 + Home/End；每次打开时复位高亮。 */
const manager = new ListKeyManager(items).withWrap().withHomeAndEnd();
manager.tabOut.subscribe(() => closeMenu());

/**
 * 菜单面板组件：overlay.attach 只渲染一次，必须借助组件渲染的响应式
 * （读取 manager.activeItemIndex）才能在键盘导航时更新高亮。
 */
const MenuPanel = defineComponent({
  name: 'ContextMenuPanel',
  props: {
    items: {type: Array as PropType<MenuItem[]>, required: true},
    manager: {type: Object as PropType<ListKeyManager<MenuItem>>, required: true},
    onChoose: {type: Function as PropType<(item: MenuItem) => void>, required: true},
  },
  setup(props) {
    return () =>
      h(
        'div',
        {class: 'panel context-menu'},
        props.items.map((item, index) =>
          h(
            'div',
            {
              class: ['menu-item', {active: index === props.manager.activeItemIndex}],
              onMouseenter: () => props.manager.setActiveItem(index),
              onClick: () => props.onChoose(item),
            },
            item.label,
          ),
        ),
      );
  },
});

/** 激活条目：执行动作后统一关闭菜单。 */
function activate(item: MenuItem) {
  item.action();
  closeMenu();
}

/**
 * 菜单键盘处理：方向键/Home/End 交给 manager，Enter 激活活动项，
 * ESC 关闭命令式菜单（命令式 overlay 没有内置 ESC 逻辑）。
 */
function onMenuKeydown(event: KeyboardEvent) {
  manager.onKeydown(event);

  if (event.key === 'Enter') {
    const item = manager.activeItem;
    if (item) {
      event.preventDefault();
      activate(item);
    }
  } else if (event.key === 'Escape') {
    event.preventDefault();
    closeMenu();
  }
}

function onContextMenu(event: MouseEvent) {
  event.preventDefault();
  closeMenu();
  manager.setActiveItem(-1);

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
  // 订阅后 overlay 键盘分发器才会把 body 上的 keydown 派发给本菜单。
  keydownUnsubscribe = overlayRef.keydownEvents().subscribe(onMenuKeydown);
  overlayRef.attach(() => h(MenuPanel, {items: items.value, manager, onChoose: activate}));
}

function closeMenu() {
  keydownUnsubscribe?.();
  keydownUnsubscribe = undefined;
  overlayRef?.dispose();
  overlayRef = null;
}

onBeforeUnmount(() => {
  closeMenu();
  manager.destroy();
});
</script>

<template>
  <section :id="id" class="section">
    <h2>右键菜单<span class="badge">命令式 · 坐标原点 · 键盘导航</span></h2>
    <p class="desc">
      以鼠标坐标（Point）为 origin 的上下文菜单：右键任意位置打开，
      贴近视口边缘时自动 push 回屏，点击外部、再次右键或 ESC 关闭；
      打开后 ↑/↓/Home/End 导航、Enter 激活。
    </p>
    <div class="stage" @contextmenu="onContextMenu">
      <div class="muted">
        在此区域右键打开菜单（macOS 触控板：双指点按，或 Control + 点击）
      </div>
      <span class="muted">上次打开位置：{{ lastPosition }}</span>
    </div>
  </section>
</template>
