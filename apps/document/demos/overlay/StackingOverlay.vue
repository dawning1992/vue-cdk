<script setup lang="ts">
import {reactive, ref} from 'vue';
import {VConnectedOverlay, VOverlayOrigin} from 'vue-cdk/overlay';
import {useLocale} from '../../composables/useLocale';

const first = ref(false);
const second = ref(false);
const log = reactive<string[]>([]);
const {locale} = useLocale();

function addLog(message: string): void {
  log.unshift(message);
  if (log.length > 6) {
    log.pop();
  }
}
</script>

<template>
  <div class="wrap">
    <p class="hint">
      {{ locale === 'en-US' ? 'The two buttons share one origin: opening the first layer before the second does not close the first; keyboard events target only the top overlay, while clicking outside the buttons sends outsideClick to both overlays and closes each.' : '两个按钮共用同一 origin：先打开第一层再点第二层不会误关第一层；键盘事件只命中栈顶的 overlay；点击按钮以外的空白区域时，两个 overlay 都收到 outsideClick 并各自关闭。' }}
    </p>
    <div class="row">
      <!-- 两个按钮必须共用同一 origin：VConnectedOverlay 会把“落在 origin 内部的点击”
           视为面板内点击而忽略，否则点第二层按钮会作为第一层的外部点击把它关闭。 -->
      <VOverlayOrigin>
        <button type="button" class="doc-btn" @click="first = !first; addLog(locale === 'en-US' ? 'Toggle layer 1' : '切换 第一层')">
          {{ locale === 'en-US' ? 'Layer 1' : '第一层' }} {{ first ? (locale === 'en-US' ? 'on' : '开') : (locale === 'en-US' ? 'off' : '关') }}
        </button>
        <button type="button" class="doc-btn" @click="second = !second; addLog(locale === 'en-US' ? 'Toggle layer 2' : '切换 第二层')">
          {{ locale === 'en-US' ? 'Layer 2' : '第二层' }} {{ second ? (locale === 'en-US' ? 'on' : '开') : (locale === 'en-US' ? 'off' : '关') }}
        </button>

        <!-- 第一层锚在 origin 左侧，第二层锚在右侧，两层同时打开时互不遮挡。 -->
        <VConnectedOverlay
          :open="first"
          :positions="[{originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top'}]"
          @overlay-keydown="addLog(locale === 'en-US' ? 'keydown → layer 1' : 'keydown → 第一层')"
          @update:open="first = $event; addLog(locale === 'en-US' ? 'Escape → layer 1 closed' : 'ESC → 第一层关闭')"
          @overlay-outside-click="first = false; addLog(locale === 'en-US' ? 'outside → layer 1 closed' : 'outside → 第一层关闭')"
        >
          <div class="panel">
            {{ locale === 'en-US' ? 'Layer 1 overlay' : '第一层浮层' }}<br />
            <span class="panel-hint">{{ locale === 'en-US' ? 'Press any key to see the log' : '按任意键看日志' }}</span>
          </div>
        </VConnectedOverlay>

        <VConnectedOverlay
          :open="second"
          :positions="[{originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top'}]"
          @overlay-keydown="addLog(locale === 'en-US' ? 'keydown → layer 2' : 'keydown → 第二层')"
          @update:open="second = $event; addLog(locale === 'en-US' ? 'Escape → layer 2 closed' : 'ESC → 第二层关闭')"
          @overlay-outside-click="second = false; addLog(locale === 'en-US' ? 'outside → layer 2 closed' : 'outside → 第二层关闭')"
        >
          <div class="panel">
            {{ locale === 'en-US' ? 'Layer 2 overlay (top)' : '第二层浮层（栈顶）' }}<br />
            <span class="panel-hint">{{ locale === 'en-US' ? 'Press any key to see the log' : '按任意键看日志' }}</span>
          </div>
        </VConnectedOverlay>
      </VOverlayOrigin>

      <div class="log-panel">
        <div class="log-title">{{ locale === 'en-US' ? 'Event log' : '事件日志' }}</div>
        <div v-if="log.length === 0" class="log-empty">{{ locale === 'en-US' ? 'No events yet' : '暂无事件' }}</div>
        <div v-for="(entry, index) in log" :key="index" class="log-entry">{{ entry }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wrap {
  width: 100%;
}

.hint {
  margin: 0 0 12px;
  color: var(--doc-muted);
  font-size: 13px;
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 12px;
}

.panel {
  padding: 14px 18px;
  min-width: 150px;
  background: #fff;
  border: 1px solid var(--doc-border);
  border-radius: 8px;
  box-shadow: var(--doc-shadow);
  font-size: 13px;
}

.panel-hint {
  color: var(--doc-muted);
  font-size: 12px;
}

.log-panel {
  flex: 1;
  min-width: 220px;
  padding: 12px 14px;
  border: 1px dashed var(--doc-border);
  border-radius: 8px;
  background: #fafbfe;
}

.log-title {
  margin-bottom: 6px;
  color: var(--doc-muted);
  font-size: 12px;
}

.log-empty {
  color: var(--doc-muted);
  font-size: 13px;
}

.log-entry {
  font-size: 13px;
}
</style>
