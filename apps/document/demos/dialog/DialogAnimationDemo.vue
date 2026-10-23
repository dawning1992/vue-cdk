<script setup lang="ts">
import {ref} from 'vue';
import {useLocale} from '../../composables/useLocale';
import {useAnimatedAppDialog, type DialogOrigin} from './useAnimatedAppDialog';
import AnimatedConfirmDialog from './AnimatedConfirmDialog.vue';

const dialog = useAnimatedAppDialog();
const {locale} = useLocale();
const result = ref('');

/** 把触发按钮事件交给项目封装，动画实现细节留在封装内。 */
async function openFromEvent(event: MouseEvent): Promise<void> {
  const title = locale.value === 'en-US' ? 'Animated confirmation' : '动画确认框';
  const dialogRef = dialog.open<boolean, {title: string; message: string}>(
    AnimatedConfirmDialog,
    {
      data: {
        title,
        message:
          locale.value === 'en-US'
            ? 'The dialog expands from the point where you clicked.'
            : '弹窗会从点击位置展开，关闭时回到这个位置。',
      },
      ariaLabel: title,
    },
    event,
  );

  const value = await dialogRef.closedPromise;
  result.value = value === undefined ? 'undefined' : String(value);
}

/** 也可传入视口坐标；适合菜单项、画布或自定义触发器。 */
async function openFromPoint(origin: DialogOrigin): Promise<void> {
  const dialogRef = dialog.open<boolean, {title: string; message: string}>(AnimatedConfirmDialog, {
    data: {
      title: locale.value === 'en-US' ? 'Point-origin dialog' : '指定位置弹窗',
      message:
        locale.value === 'en-US'
          ? 'This dialog uses an explicit viewport point as its animation origin.'
          : '此弹窗使用明确指定的视口坐标作为动画起点。',
    },
    ariaLabel: locale.value === 'en-US' ? 'Point-origin dialog' : '指定位置弹窗',
  }, origin);

  const value = await dialogRef.closedPromise;
  result.value = value === undefined ? 'undefined' : String(value);
}

async function openAtCenter(): Promise<void> {
  await openFromPoint({x: window.innerWidth / 2, y: window.innerHeight / 2});
}
</script>

<template>
  <div class="demo">
    <button type="button" class="doc-btn primary" @click="openFromEvent">
      {{ locale === 'en-US' ? 'Open from click' : '从点击位置打开' }}
    </button>
    <button type="button" class="doc-btn" @click="openAtCenter">
      {{ locale === 'en-US' ? 'Open from explicit point' : '从指定坐标打开' }}
    </button>
    <span class="result">{{ locale === 'en-US' ? 'Latest result: ' : '最近结果：' }}{{ result || '—' }}</span>
  </div>
</template>

<style scoped>
.demo {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.result {
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
