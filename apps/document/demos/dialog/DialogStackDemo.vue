<script setup lang="ts">
import {computed, onBeforeUnmount, ref, shallowRef, type CSSProperties} from 'vue';
import {useDialog, type DialogRef} from 'vue-cdk/dialog';
import {TemplateRef, type TemplateRefHandle} from 'vue-cdk/portal';
import {overlayPositionBuilder} from 'vue-cdk/overlay';
import {useLocale} from '../../composables/useLocale';

// 浮层内容使用内联样式，保持不同容器模式下的演示外观一致。
const contentStyle = {padding: '20px 24px', minWidth: '320px'};
const headingStyle = {margin: '0 0 8px', fontSize: '16px'};
const descStyle = {margin: '0 0 14px', color: '#6b7280', fontSize: '13px'};
const readoutBoxStyle = {
  margin: '0 0 14px',
  padding: '10px 12px',
  borderRadius: '6px',
  background: '#0f172a',
  color: '#e2e8f0',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: '12px',
  lineHeight: '1.7',
};
const readoutLineStyle = {margin: '2px 0'};
const buttonRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  justifyContent: 'flex-end',
};

const dialog = useDialog();
const openDialogs = ref<readonly DialogRef[]>([]);
const log = ref<string[]>([]);
const queryResult = ref('');
const {locale} = useLocale();

type DialogId = 'dialog-a' | 'dialog-b' | 'dialog-c';

/** 各层对话框的展示信息；next 表示该对话框内可继续打开的下一层。 */
const dialogMeta = computed<Record<DialogId, {title: string; desc: string; next?: DialogId}>>(() => locale.value === 'en-US'
  ? {
      'dialog-a': {title: 'Dialog A', desc: 'Open B from this dialog and observe the shared backdrop between the two windows.', next: 'dialog-b'},
      'dialog-b': {title: 'Dialog B', desc: 'Open backdrop-free C and observe the shared backdrop below all dialogs while C floats above it.', next: 'dialog-c'},
      'dialog-c': {title: 'Dialog C (no backdrop)', desc: 'hasBackdrop=false: this dialog does not participate in the shared backdrop and floats above it.'},
    }
  : {
      'dialog-a': {title: '对话框 A', desc: '在对话框内继续打开 B，观察共享遮罩如何插在两层窗口之间并遮住下层。', next: 'dialog-b'},
      'dialog-b': {title: '对话框 B', desc: '再打开无遮罩的 C，观察共享遮罩沉到所有对话框之下、C 浮在遮罩之上。', next: 'dialog-c'},
      'dialog-c': {title: '对话框 C（无遮罩）', desc: 'hasBackdrop=false：自身不参与共享遮罩，直接浮在遮罩之上。'},
    });

/**
 * 各层对话框的打开位置：按打开顺序向右下阶梯错开，
 * 让多层窗口与共享遮罩的层级关系可见，而不是完全重叠。
 */
const dialogPositions: Record<
  DialogId,
  () => ReturnType<typeof overlayPositionBuilder.global>
> = {
  'dialog-a': () => overlayPositionBuilder.global().centerHorizontally().centerVertically(),
  'dialog-b': () =>
    overlayPositionBuilder.global().centerHorizontally('72px').centerVertically('56px'),
  'dialog-c': () =>
    overlayPositionBuilder.global().centerHorizontally('144px').centerVertically('112px'),
};

/** 单个对话框的层级信息，供对话框内实时读取。 */
interface DialogLayerInfo {
  id: string;
  zIndex: string;
  isTop: boolean;
  hasBackdrop: boolean;
}

/** 共享遮罩与层级数据快照。 */
interface StackInfo {
  backdropCount: number;
  backdropZIndex: string;
  renderMode: string;
  dialogs: DialogLayerInfo[];
}

const stackInfo = ref<StackInfo>({
  backdropCount: 0,
  backdropZIndex: '',
  renderMode: '',
  dialogs: [],
});

function push(message: string): void {
  log.value.unshift(`[${new Date().toLocaleTimeString()}] ${message}`);
  if (log.value.length > 6) {
    log.value.pop();
  }
}

/** 从真实 DOM 与打开栈收集共享遮罩数量、z-index 与渲染模式。 */
function collectStackInfo(): void {
  const backdrops = document.querySelectorAll('.vcdk-overlay-backdrop');
  const backdrop = backdrops[0] as HTMLElement | undefined;
  const openList = dialog.openDialogs;
  const top = openList[openList.length - 1];
  stackInfo.value = {
    backdropCount: backdrops.length,
    backdropZIndex: backdrop?.style.zIndex ?? '',
    renderMode: top?.overlayRef.getConfig().usePopover
      ? (locale.value === 'en-US' ? 'Native popover (top-layer stacking)' : '原生 popover（top-layer 顺序层叠）')
      : (locale.value === 'en-US' ? 'Container rendering (z-index insertion)' : '容器渲染（z-index 插层）'),
    dialogs: openList.map((ref, index) => ({
      id: ref.id,
      zIndex: ref.overlayRef.hostElement.style.zIndex,
      isTop: index === openList.length - 1,
      hasBackdrop: ref.config.hasBackdrop !== false,
    })),
  };
}

function refreshStack(): void {
  openDialogs.value = dialog.openDialogs;
  collectStackInfo();
}

const content = shallowRef<TemplateRefHandle | null>(null);

/** 打开指定 id 的对话框；内容由 TemplateRef 生成，关闭时返回自身 id。 */
function openDialog(id: DialogId): void {
  if (!content.value) return;
  const handle = content.value;
  const dialogRef = dialog.open(
    (ctx: Record<string, unknown>) => handle.render({...ctx, id}),
    {
      id,
      panelClass: 'doc-dialog-panel',
      positionStrategy: dialogPositions[id](),
      ...(id === 'dialog-c' ? {hasBackdrop: false} : {}),
    },
  );
  const unsubscribe = handle.subscribe(() => dialogRef.close());
  dialogRef.closed.subscribe(value => {
    unsubscribe();
    push(locale.value === 'en-US' ? `closed: ${String(value)}` : `closed：${String(value)}`);
    refreshStack();
  });
  refreshStack();
  push(locale.value === 'en-US' ? `opened: ${id}` : `opened：${id}`);
}

function closeAll(): void {
  dialog.closeAll();
  push(locale.value === 'en-US' ? 'closeAll: close in LIFO order' : 'closeAll：按 LIFO 依次关闭');
}

function queryById(): void {
  const ref = dialog.getDialogById('dialog-a');
  queryResult.value = ref
    ? (locale.value === 'en-US' ? `Found dialog-a (id=${ref.id})` : `找到 dialog-a（id=${ref.id}）`)
    : (locale.value === 'en-US' ? 'dialog-a is not open' : 'dialog-a 未打开');
}

// 订阅服务级事件流：afterOpened / afterAllClosed（注意 afterAllClosed 在无打开对话框时立即触发一次）。
const unsubscribeOpened = dialog.afterOpened.subscribe(ref => push(`afterOpened：${ref.id}`));
const unsubscribeAllClosed = dialog.afterAllClosed.subscribe(() => {
  push(locale.value === 'en-US' ? 'afterAllClosed: all dialogs closed' : 'afterAllClosed：全部对话框已关闭');
  refreshStack();
});

onBeforeUnmount(() => {
  unsubscribeOpened();
  unsubscribeAllClosed();
  dialog.closeAll();
});
</script>

<template>
  <TemplateRef ref="content" v-slot="{id, dialogRef}">
    <div :style="contentStyle">
      <h3 :style="headingStyle">{{ dialogMeta[id as DialogId].title }}</h3>
      <p :style="descStyle">{{ dialogMeta[id as DialogId].desc }}</p>
      <div :style="readoutBoxStyle">
        <div v-for="layer in stackInfo.dialogs" :key="layer.id" :style="readoutLineStyle">
          <span style="color: #f59e0b">{{ layer.id }}{{ layer.hasBackdrop ? '' : (locale === 'en-US' ? ' (no backdrop)' : '（无遮罩）') }}</span>
          z = {{ layer.zIndex }} {{ layer.isTop ? (locale === 'en-US' ? ' (top)' : '（顶层）') : (locale === 'en-US' ? ' (lower)' : '（下层）') }}
        </div>
        <div v-if="stackInfo.backdropCount" :style="readoutLineStyle">{{ locale === 'en-US' ? 'Shared backdrop z = ' : '共享遮罩 z = ' }}{{ stackInfo.backdropZIndex }}{{ locale === 'en-US' ? ` (only ${stackInfo.backdropCount} backdrop element site-wide)` : `（全站仅 ${stackInfo.backdropCount} 个遮罩元素）` }}</div>
        <div :style="readoutLineStyle">{{ locale === 'en-US' ? 'Render: ' : '渲染：' }}{{ stackInfo.renderMode }}</div>
      </div>
      <div :style="buttonRowStyle">
        <button v-if="dialogMeta[id as DialogId].next" class="doc-btn primary" @click="openDialog(dialogMeta[id as DialogId].next!)">{{ locale === 'en-US' ? 'Open ' : '打开 ' }}{{ dialogMeta[dialogMeta[id as DialogId].next!].title }}</button>
        <button class="doc-btn" @click="(dialogRef as DialogRef).close(id)">{{ locale === 'en-US' ? 'Close this layer' : '关闭本层' }}</button>
        <button class="doc-btn" @click="dialog.closeAll()">closeAll</button>
      </div>
    </div>
  </TemplateRef>

  <div class="wrap">
    <div class="buttons">
      <button type="button" class="doc-btn primary" @click="openDialog('dialog-a')">
        {{ locale === 'en-US' ? 'Open dialog A' : '打开对话框 A' }}
      </button>
      <button type="button" class="doc-btn" @click="closeAll">closeAll</button>
      <button type="button" class="doc-btn" @click="queryById">getDialogById('dialog-a')</button>
    </div>

    <div class="info">
      {{ locale === 'en-US' ? 'Open (latest first): ' : '当前打开（后进优先）：' }}{{ openDialogs.length ? openDialogs.map(d => d.id).join(' → ') : (locale === 'en-US' ? 'none' : '无') }}
    </div>

    <p class="hint">
      {{ locale === 'en-US'
        ? 'The three dialogs are offset for visibility. Open B from A and backdrop-free C from B; each dialog shows live layer information. Clicking the real backdrop outside a dialog closes only the top dialog. Page buttons being covered while a dialog is open is expected modal behavior.'
        : '三层对话框按阶梯错开排布、互不遮挡，便于观察层级；在 A 内继续打开 B、在 B 内打开无遮罩的 C，每层对话框内都有实时层级读条。点击对话框外的真实遮罩区域只关闭最上层对话框。对话框打开后页面按钮被遮罩盖住，属于正常模态行为。'
      }}
    </p>
    <div class="doc-output">{{ log.join('\n') || (locale === 'en-US' ? 'Open a dialog to observe service events and layer changes' : '打开对话框观察服务级事件流与层级变化') }}</div>
    <p class="hint">{{ queryResult || (locale === 'en-US' ? 'getDialogById can query any open dialog' : 'getDialogById 可查询任意已打开对话框') }}</p>
  </div>
</template>

<style scoped>
.wrap {
  width: 100%;
}

.buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.info {
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--doc-primary);
}

.hint {
  margin: 8px 0 0;
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
