<script setup lang="ts">
import {ref} from 'vue';
import {useDialog, type AutoFocusTarget} from 'vue-cdk/dialog';
import {useLocale} from '../../composables/useLocale';
import ConfigContent from './ConfigContent.vue';

const dialog = useDialog();
const result = ref('');
const {locale} = useLocale();

const disableClose = ref(false);
const blockCancel = ref(false);
const autoFocus = ref<AutoFocusTarget | 'false'>('first-tabbable');
const restoreFocus = ref<'true' | 'false' | 'target'>('true');
const role = ref<'dialog' | 'alertdialog'>('dialog');
const hasBackdrop = ref(true);
const ariaModal = ref(false);
const width = ref('');
const height = ref('');
const panelClass = ref('');

/** 根据面板选项组装 DialogConfig 并打开对话框。 */
function openWithConfig(): void {
  const dialogRef = dialog.open(ConfigContent, {
    data: {
      role: role.value,
      note: blockCancel.value
        ? (locale.value === 'en-US' ? 'closePredicate is enabled: Cancel is blocked and focus is recaptured by the dialog.' : 'closePredicate 已启用：点击「取消」会被阻止，焦点重新捕获回对话框。')
        : (locale.value === 'en-US' ? 'closePredicate is disabled; Escape, the backdrop, and buttons can close the dialog.' : 'closePredicate 未启用，ESC / 遮罩 / 按钮均可关闭。'),
    },
    disableClose: disableClose.value,
    closePredicate: blockCancel.value
      ? result => result !== (locale.value === 'en-US' ? 'Cancel' : '取消')
      : undefined,
    autoFocus: autoFocus.value === 'false' ? false : autoFocus.value,
    restoreFocus:
      restoreFocus.value === 'true'
        ? true
        : restoreFocus.value === 'false'
          ? false
          : '#doc-dialog-focus-target',
    role: role.value,
    hasBackdrop: hasBackdrop.value,
    ariaModal: ariaModal.value,
    width: width.value || undefined,
    height: height.value || undefined,
    panelClass: panelClass.value || 'doc-dialog-panel',
  });
  dialogRef.closed.subscribe(value => {
    result.value = String(value ?? (locale.value === 'en-US' ? 'No result' : '未返回结果'));
  });
}
</script>

<template>
  <div class="wrap">
    <div class="grid">
      <label class="check">
        <input v-model="disableClose" type="checkbox" />
        {{ locale === 'en-US' ? 'disableClose (blocks Escape/backdrop close)' : 'disableClose（禁止 ESC / 遮罩关闭）' }}
      </label>
      <label class="check">
        <input v-model="blockCancel" type="checkbox" />
        {{ locale === 'en-US' ? 'closePredicate (blocks Cancel)' : 'closePredicate（阻止「取消」）' }}
      </label>
      <label class="check">
        <input v-model="hasBackdrop" type="checkbox" />
        hasBackdrop
      </label>
      <label class="check">
        <input v-model="ariaModal" type="checkbox" />
        ariaModal
      </label>

      <label class="field">
        autoFocus
        <select v-model="autoFocus" class="doc-input">
          <option value="first-tabbable">first-tabbable</option>
          <option value="first-heading">first-heading</option>
          <option value="dialog">dialog</option>
          <option value="false">{{ locale === 'en-US' ? 'false (no automatic focus)' : 'false（不主动聚焦）' }}</option>
        </select>
      </label>
      <label class="field">
        restoreFocus
        <select v-model="restoreFocus" class="doc-input">
          <option value="true">{{ locale === 'en-US' ? 'true (restore previous focus)' : 'true（恢复原聚焦元素）' }}</option>
          <option value="false">{{ locale === 'en-US' ? 'false (do not restore)' : 'false（不恢复）' }}</option>
          <option value="target">{{ locale === 'en-US' ? 'Selector #doc-dialog-focus-target' : '选择器 #doc-dialog-focus-target' }}</option>
        </select>
      </label>
      <label class="field">
        role
        <select v-model="role" class="doc-input">
          <option value="dialog">dialog</option>
          <option value="alertdialog">alertdialog</option>
        </select>
      </label>
      <label class="field">
        {{ locale === 'en-US' ? 'width (px)' : 'width（px）' }}
        <input v-model="width" class="doc-input" :placeholder="locale === 'en-US' ? 'Empty = automatic' : '留空 = 自动'" />
      </label>
      <label class="field">
        {{ locale === 'en-US' ? 'height (px)' : 'height（px）' }}
        <input v-model="height" class="doc-input" :placeholder="locale === 'en-US' ? 'Empty = automatic' : '留空 = 自动'" />
      </label>
      <label class="field">
        panelClass
        <input v-model="panelClass" class="doc-input wide" placeholder="doc-dialog-panel" />
      </label>
    </div>

    <div class="bar">
      <input id="doc-dialog-focus-target" class="doc-input" :placeholder="locale === 'en-US' ? 'restoreFocus target' : 'restoreFocus 指定元素'" />
      <button type="button" class="doc-btn primary" @click="openWithConfig">{{ locale === 'en-US' ? 'Open with config' : '按配置打开' }}</button>
      <span class="result">{{ locale === 'en-US' ? 'Latest result: ' : '最近结果：' }}{{ result || '—' }}</span>
    </div>
    <p class="hint">{{ locale === 'en-US' ? 'Focus demo: focus the left input before opening; restoreFocus restores focus after closing.' : 'focus 目标演示：打开前聚焦左侧输入框，关闭后焦点按 restoreFocus 恢复。' }}</p>
  </div>
</template>

<style scoped>
.wrap {
  width: 100%;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 10px 18px;
  margin-bottom: 14px;
}

.check,
.field {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--doc-muted);
}

.field .doc-input {
  width: 150px;
  padding: 4px 8px;
}

.field .doc-input.wide {
  width: 200px;
}

.bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.result {
  color: var(--doc-muted);
  font-size: 12px;
}

.hint {
  margin: 10px 0 0;
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
